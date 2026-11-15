import test from "node:test";
import assert from "node:assert/strict";
import { demoRanking, type RankingRequest } from "../src/lib/client.ts";
import {
  buildScenarioRequest, describeSegments, describeScenarioChanges, diffScenarioRankings, hypothesisLabelText, scenarioPresets,
  type RankedTrial, type ScenarioComparison
} from "../src/features/mission-lab/scenarios.ts";

const METRIC = "flame_spread_rate_mm_s" as const;
const buildDemoScenario = (base: RankingRequest, id: string) => buildScenarioRequest(base, id, METRIC);

// Datos sintéticos de prueba: no son mediciones NASA.
function trial(id: string, similarity: number | null, reasons: string[] = ["explicit_requirements_satisfied"]): RankedTrial {
  return {
    trial_id: id, similarity, coverage: 1, eligibility: similarity === null ? "indeterminate" : "eligible",
    reasons, contributions: [], evidence_ids: [], provenance: "synthetic"
  };
}

function response(parts: {
  itemsA?: RankedTrial[]; itemsB?: RankedTrial[]; excludedA?: RankedTrial[]; excludedB?: RankedTrial[];
  warnings?: string[]; warningsA?: string[]; warningsB?: string[];
}): ScenarioComparison {
  return {
    name_a: "A · current filters", name_b: "B · test",
    ranking_a: { schema_version: "1.0", dataset_id: "synthetic:demo", method: "compatibility_then_weighted_gower_v1", items: parts.itemsA ?? [], excluded: parts.excludedA ?? [], warnings: parts.warningsA ?? [] },
    ranking_b: { schema_version: "1.0", dataset_id: "synthetic:demo", method: "compatibility_then_weighted_gower_v1", items: parts.itemsB ?? [], excluded: parts.excludedB ?? [], warnings: parts.warningsB ?? [] },
    warnings: parts.warnings ?? [], label: "evidence_comparison_not_physical_simulation"
  };
}

function assertPolicy(request: RankingRequest) {
  const target = Object.keys(request.target ?? {});
  for (const key of request.required_match ?? []) assert.ok(target.includes(key), `required_match ${key} ⊆ target`);
  for (const key of request.vary ?? []) assert.ok(!(request.required_match ?? []).includes(key), `${key} no puede estar en required_match y vary`);
  for (const key of Object.keys(request.weights ?? {})) assert.ok(target.includes(key), `weights ${key} ⊆ target`);
}

test("every preset builds a policy-valid B without mutating A", () => {
  const ids = scenarioPresets.map((preset) => preset.id);
  assert.ok(ids.length >= 3 && ids.length <= 4);
  assert.equal(new Set(ids).size, ids.length);
  const bases: RankingRequest[] = [
    demoRanking,
    { target: { gravity_regime: "microgravity", oxygen_pct: 21 }, required_match: ["gravity_regime"], vary: ["flow_velocity_cm_s", "oxygen_pct"], weights: { oxygen_pct: 2 }, allow_synthetic: true },
    { target: { flow_velocity_cm_s: 5 }, vary: ["gravity_regime"] }
  ];
  for (const base of bases) {
    const snapshot = structuredClone(base);
    for (const preset of scenarioPresets) {
      const request = buildDemoScenario(base, preset.id);
      assert.equal(request.scenario_a, base);
      assert.notEqual(request.scenario_b, base);
      assert.equal(request.name_a, "A · current filters");
      assert.equal(request.name_b, `B · ${preset.title}`);
      assertPolicy(request.scenario_a);
      assertPolicy(request.scenario_b);
      assert.ok(preset.expectation.length > 0 && preset.change.length > 0);
    }
    assert.deepEqual(base, snapshot);
  }
});

test("gravity_lunar reproduces the harness A/B: lunar gravity required, removed from vary", () => {
  const base: RankingRequest = { ...demoRanking, vary: ["flow_velocity_cm_s", "gravity_regime"], required_match: [] };
  const { scenario_b: b } = buildDemoScenario(base, "gravity_lunar");
  assert.equal(b.target?.gravity_regime, "lunar");
  assert.deepEqual(b.required_match, ["gravity_regime"]);
  assert.deepEqual(b.vary, ["flow_velocity_cm_s"]);
  assert.equal(b.allow_synthetic, base.allow_synthetic);
  const fromDemo = buildDemoScenario(demoRanking, "gravity_lunar").scenario_b;
  assert.deepEqual(fromDemo.required_match, ["gravity_regime"]);
});

test("exclude_synthetic only switches allow_synthetic off", () => {
  const { scenario_b: b } = buildDemoScenario(demoRanking, "exclude_synthetic");
  assert.equal(b.allow_synthetic, false);
  assert.deepEqual(b.target, demoRanking.target);
  assert.deepEqual(b.required_match, demoRanking.required_match);
});

test("unknown presets fail with a clear error", () => {
  assert.throws(() => buildDemoScenario(demoRanking, "mars_magic"), /Unknown scenario: "mars_magic"/);
});

test("trials are classified as kept, entered or left with B exclusion reasons", () => {
  const diff = diffScenarioRankings(response({
    itemsA: [trial("synthetic:trial-3", 0.9), trial("synthetic:trial-1", 1)],
    itemsB: [trial("synthetic:trial-4", 1), trial("synthetic:trial-1", 0.95)],
    excludedB: [trial("synthetic:trial-3", null, ["required_condition_mismatch:gravity_regime"])]
  }));
  assert.deepEqual(diff.kept.map((item) => item.trial_id), ["synthetic:trial-1"]);
  assert.deepEqual(diff.entered.map((item) => [item.trial_id, item.a, item.b?.similarity]), [["synthetic:trial-4", null, 1]]);
  assert.deepEqual(diff.left.map((item) => [item.trial_id, item.reasonsB]), [["synthetic:trial-3", ["required_condition_mismatch:gravity_regime"]]]);
  assert.equal(diff.left[0]?.b, null);
  assert.ok(Math.abs((diff.kept[0]?.similarityDelta ?? NaN) + 0.05) < 1e-9);
  assert.equal(diff.selectedA, 2);
  assert.equal(diff.selectedB, 2);
  assert.equal(diff.excludedB, 1);
  assert.equal(diff.noEvidenceA, false);
  assert.equal(diff.noEvidenceB, false);
  assert.ok(diff.summary.some((line) => line.includes("Entered in B: synthetic:trial-4")));
  assert.ok(diff.summary.some((line) => line.includes("synthetic:trial-3") && line.includes("required_condition_mismatch:gravity_regime")));
});

test("similarity delta stays null when a value is missing and zero stays zero", () => {
  const diff = diffScenarioRankings(response({
    itemsA: [trial("synthetic:a", null), trial("synthetic:b", 0), trial("synthetic:c", 0.5)],
    itemsB: [trial("synthetic:a", 0.5), trial("synthetic:b", 0), trial("synthetic:c", null)]
  }));
  const deltas = Object.fromEntries(diff.kept.map((item) => [item.trial_id, item.similarityDelta]));
  assert.equal(deltas["synthetic:a"], null);
  assert.equal(deltas["synthetic:b"], 0);
  assert.equal(deltas["synthetic:c"], null);
});

test("an empty B is reported as missing applicable evidence", () => {
  const diff = diffScenarioRankings(response({
    itemsA: [trial("synthetic:trial-1", 1)],
    excludedB: [trial("synthetic:trial-1", null, ["synthetic_not_allowed"])],
    warningsB: ["No eligible evidence for the explicit filters and coverage requirement."]
  }));
  assert.equal(diff.noEvidenceA, false);
  assert.equal(diff.noEvidenceB, true);
  assert.equal(diff.selectedB, 0);
  assert.deepEqual(diff.left[0]?.reasonsB, ["synthetic_not_allowed"]);
  assert.ok(diff.summary.some((line) => line.includes("has no applicable evidence")));
});

test("warnings are deduplicated across the response and both rankings in a stable order", () => {
  const diff = diffScenarioRankings(response({
    warnings: ["general", "shared"], warningsA: ["shared", "a-only"], warningsB: ["a-only", "b-only", "general"]
  }));
  assert.deepEqual(diff.warnings, ["general", "shared", "a-only", "b-only"]);
  assert.equal(diff.noEvidenceA, true);
  assert.equal(diff.noEvidenceB, true);
});

test("hypothesis labels are never presented as validated physics", () => {
  assert.match(hypothesisLabelText("prepared_demo_hypothesis"), /Prepared demo hypothesis.*not a discovery or validated physics/);
  assert.match(hypothesisLabelText("ai_hypothesis"), /AI-generated hypothesis.*requires verification/);
  for (const label of ["prepared_demo_hypothesis", "ai_hypothesis"] as const) {
    assert.doesNotMatch(hypothesisLabelText(label), /validated(?! physics)|confirmed|proven/i);
  }
});

// Bases sintéticas para el preset de flujo puntuado (no son mediciones NASA).
const flowRequired: RankingRequest = {
  ...demoRanking,
  target: { gravity_regime: "microgravity", flow_velocity_cm_s: 5 },
  required_match: ["gravity_regime", "flow_velocity_cm_s"], vary: []
};
const flowZeroWeight: RankingRequest = {
  ...demoRanking,
  target: { gravity_regime: "microgravity", flow_velocity_cm_s: 5 },
  vary: [], weights: { flow_velocity_cm_s: 0 }
};

test("flow_scored_2 on the default filters scores flow instead of varying it", () => {
  const snapshot = structuredClone(demoRanking);
  const { scenario_b: b } = buildDemoScenario(demoRanking, "flow_scored_2");
  assert.equal(b.target?.flow_velocity_cm_s, 2);
  assert.equal(b.target?.gravity_regime, "microgravity");
  assert.deepEqual(b.required_match, ["gravity_regime"]);
  assert.deepEqual(b.vary, []);
  assert.equal(b.weights?.flow_velocity_cm_s, 1);
  assert.equal(b.allow_synthetic, demoRanking.allow_synthetic);
  assert.equal(b.minimum_coverage, demoRanking.minimum_coverage);
  assert.equal(b.limit, demoRanking.limit);
  assert.deepEqual(demoRanking, snapshot);
  assert.deepEqual(describeScenarioChanges(demoRanking, b), [
    "Flow velocity target set to 2 cm/s",
    "Flow velocity removed from varied conditions",
    "Flow velocity weight unset (default 1) → 1"
  ]);
});

test("flow_scored_2 drops a flow prerequisite instead of requiring it", () => {
  const snapshot = structuredClone(flowRequired);
  const { scenario_b: b } = buildDemoScenario(flowRequired, "flow_scored_2");
  assert.deepEqual(b.required_match, ["gravity_regime"]);
  assert.ok(!(b.vary ?? []).includes("flow_velocity_cm_s"));
  assert.equal(b.target?.flow_velocity_cm_s, 2);
  assert.ok((b.weights?.flow_velocity_cm_s ?? 0) > 0);
  assert.deepEqual(flowRequired, snapshot);
  const changes = describeScenarioChanges(flowRequired, b);
  assert.ok(changes.includes("Flow velocity removed from required matches"));
  assert.ok(changes.includes("Flow velocity · 5 cm/s → 2 cm/s"));
});

test("flow_scored_2 turns a zero weight into a positive one and keeps positive weights", () => {
  const snapshot = structuredClone(flowZeroWeight);
  const { scenario_b: b } = buildDemoScenario(flowZeroWeight, "flow_scored_2");
  assert.equal(b.weights?.flow_velocity_cm_s, 1);
  assert.deepEqual(flowZeroWeight, snapshot);
  assert.deepEqual(describeScenarioChanges(flowZeroWeight, b), [
    "Flow velocity · 5 cm/s → 2 cm/s",
    "Flow velocity weight 0 → 1"
  ]);
  const weighted: RankingRequest = { ...flowZeroWeight, weights: { flow_velocity_cm_s: 2.5 } };
  const kept = buildDemoScenario(weighted, "flow_scored_2").scenario_b;
  assert.equal(kept.weights?.flow_velocity_cm_s, 2.5);
  assert.ok(!describeScenarioChanges(weighted, kept).some((line) => line.includes("weight")));
});

test("flow_scored_2 leaves the other constraints untouched", () => {
  const base: RankingRequest = {
    target: { gravity_regime: "microgravity", oxygen_pct: 21, flow_velocity_cm_s: 5 },
    required_match: ["gravity_regime", "flow_velocity_cm_s"], vary: ["pressure_kpa"],
    weights: { oxygen_pct: 3 }, study_ids: ["synthetic:study-a"], allow_synthetic: true, minimum_coverage: 0.8, limit: 5
  };
  const { scenario_b: b } = buildDemoScenario(base, "flow_scored_2");
  assert.deepEqual(b.required_match, ["gravity_regime"]);
  assert.deepEqual(b.vary, ["pressure_kpa"]);
  assert.deepEqual(b.weights, { oxygen_pct: 3, flow_velocity_cm_s: 1 });
  assert.equal(b.target?.oxygen_pct, 21);
  assert.deepEqual(b.study_ids, ["synthetic:study-a"]);
  assert.equal(b.minimum_coverage, 0.8);
  assert.equal(b.limit, 5);
});

test("describeScenarioChanges reports nothing for equivalent requests and lists other edits", () => {
  assert.deepEqual(describeScenarioChanges(demoRanking, structuredClone(demoRanking)), []);
  const explicitDefaults: RankingRequest = { ...demoRanking, weights: {}, study_ids: [], condition_scope: "trial" };
  assert.deepEqual(describeScenarioChanges(demoRanking, explicitDefaults), []);
  assert.deepEqual(describeScenarioChanges(demoRanking, buildDemoScenario(demoRanking, "gravity_lunar").scenario_b),
    ["Gravity regime · Microgravity → Lunar gravity"]);
  assert.deepEqual(describeScenarioChanges(demoRanking, buildDemoScenario(demoRanking, "exclude_synthetic").scenario_b),
    ["Synthetic fixtures allowed → not allowed"]);
  assert.deepEqual(describeScenarioChanges(demoRanking, { ...demoRanking, minimum_coverage: 0.8, limit: 5, study_ids: ["synthetic:study-a"] }),
    ["Minimum coverage 60% → 80%", "Limit 3 → 5", "synthetic:study-a added to selected studies"]);
});

test("preset texts are in English and describe fixtures as synthetic, not NASA data", () => {
  for (const preset of scenarioPresets) {
    for (const text of [preset.title, preset.change, preset.expectation]) {
      assert.doesNotMatch(text, /[áéíóúñ¿¡]|ensayo|gravedad|filtros/i, `${preset.id} must be English`);
    }
    assert.doesNotMatch(preset.expectation, /(?<!not )NASA measurement/);
  }
  const flow = scenarioPresets.find((preset) => preset.id === "flow_scored_2");
  assert.match(flow?.change ?? "", /similarity to a flow of 2 cm\/s/);
  assert.match(flow?.expectation ?? "", /synthetic demo fixtures/);
});


test("scenario requests retain the selected metric for both rankings", () => {
  for (const metric of ["flame_spread_rate_mm_s", "heat_release_w", "other"] as const) {
    const request = buildScenarioRequest(demoRanking, "gravity_earth", metric);
    assert.equal(request.metric, metric);
    assert.deepEqual(request.scenario_a, demoRanking);
    assert.equal(request.scenario_b.target?.gravity_regime, "earth");
  }
});

test("leaving a limited selection does not invent an exclusion", () => {
  const diff = diffScenarioRankings(response({
    itemsA: [trial("synthetic:top-a", 1)],
    itemsB: [trial("synthetic:top-b", 1)]
  }));
  assert.equal(diff.excludedB, 0);
  assert.deepEqual(diff.left[0]?.reasonsB, []);
  assert.match(diff.left[0]?.selectionNote ?? "", /limit can omit eligible trials/);
  assert.ok(diff.summary.some((line) => line.includes("Excluded counts do not include eligible trials")));
  assert.ok(!diff.summary.some((line) => line.includes("outside the selection (excluded")));
  const excluded = diffScenarioRankings(response({
    itemsA: [trial("synthetic:top-a", 1)],
    excludedB: [trial("synthetic:top-a", null, ["requested_metric_unavailable"])]
  }));
  assert.equal(excluded.left[0]?.selectionNote, null);
  assert.deepEqual(excluded.left[0]?.reasonsB, ["requested_metric_unavailable"]);
});

test("different scored segments remain one kept trial with both contexts available", () => {
  const a = { ...trial("synthetic:trial", 1), scored_segment_id: "synthetic:segment-a", eligible_segment_ids: ["synthetic:segment-a"] };
  const b = { ...trial("synthetic:trial", 0.9), scored_segment_id: "synthetic:segment-b", eligible_segment_ids: ["synthetic:segment-b", "synthetic:segment-c"] };
  const diff = diffScenarioRankings(response({ itemsA: [a], itemsB: [b] }));
  assert.equal(diff.kept.length, 1);
  assert.equal(diff.selectedA, 1);
  assert.equal(diff.selectedB, 1);
  assert.match(describeSegments(diff.kept[0]?.a ?? null), /Scored segment: synthetic:segment-a/);
  assert.match(describeSegments(diff.kept[0]?.b ?? null), /Eligible segments: synthetic:segment-b, synthetic:segment-c/);
  assert.match(describeSegments(b), /Eligible segments/);
  assert.match(describeSegments(trial("synthetic:no-segments", 0)), /Trial-level ranking/);
  assert.equal(describeSegments(null), "Trial not selected in this scenario.");
});


test("empty selection explanations distinguish metric-aware and conditions-only responses", () => {
  const metricAware = diffScenarioRankings({ ...response({}), metric: "heat_release_w" });
  assert.ok(metricAware.summary.some((line) => line.includes("available measurements of Heat release")));
  const legacy = diffScenarioRankings(response({}));
  assert.ok(legacy.summary.some((line) => line.includes("metric availability was not requested")));
});
