import test from "node:test";
import assert from "node:assert/strict";
import { demoRanking, type RankingRequest } from "../src/lib/client.ts";
import {
  buildScenarioRequest, describeScenarioChanges, diffScenarioRankings, hypothesisLabelText, scenarioPresets,
  type RankedTrial, type ScenarioComparison
} from "../src/features/mission-lab/scenarios.ts";

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
      const request = buildScenarioRequest(base, preset.id);
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
  const { scenario_b: b } = buildScenarioRequest(base, "gravity_lunar");
  assert.equal(b.target?.gravity_regime, "lunar");
  assert.deepEqual(b.required_match, ["gravity_regime"]);
  assert.deepEqual(b.vary, ["flow_velocity_cm_s"]);
  assert.equal(b.allow_synthetic, base.allow_synthetic);
  const fromDemo = buildScenarioRequest(demoRanking, "gravity_lunar").scenario_b;
  assert.deepEqual(fromDemo.required_match, ["gravity_regime"]);
});

test("exclude_synthetic only switches allow_synthetic off", () => {
  const { scenario_b: b } = buildScenarioRequest(demoRanking, "exclude_synthetic");
  assert.equal(b.allow_synthetic, false);
  assert.deepEqual(b.target, demoRanking.target);
  assert.deepEqual(b.required_match, demoRanking.required_match);
});

test("unknown presets fail with a clear error", () => {
  assert.throws(() => buildScenarioRequest(demoRanking, "mars_magic"), /Unknown scenario: "mars_magic"/);
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
  const { scenario_b: b } = buildScenarioRequest(demoRanking, "flow_scored_2");
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
    "flow_velocity_cm_s target set to 2",
    "flow_velocity_cm_s removed from varied conditions",
    "flow_velocity_cm_s weight unset (default 1) → 1"
  ]);
});

test("flow_scored_2 drops a flow prerequisite instead of requiring it", () => {
  const snapshot = structuredClone(flowRequired);
  const { scenario_b: b } = buildScenarioRequest(flowRequired, "flow_scored_2");
  assert.deepEqual(b.required_match, ["gravity_regime"]);
  assert.ok(!(b.vary ?? []).includes("flow_velocity_cm_s"));
  assert.equal(b.target?.flow_velocity_cm_s, 2);
  assert.ok((b.weights?.flow_velocity_cm_s ?? 0) > 0);
  assert.deepEqual(flowRequired, snapshot);
  const changes = describeScenarioChanges(flowRequired, b);
  assert.ok(changes.includes("flow_velocity_cm_s removed from required matches"));
  assert.ok(changes.includes("flow_velocity_cm_s target 5 → 2"));
});

test("flow_scored_2 turns a zero weight into a positive one and keeps positive weights", () => {
  const snapshot = structuredClone(flowZeroWeight);
  const { scenario_b: b } = buildScenarioRequest(flowZeroWeight, "flow_scored_2");
  assert.equal(b.weights?.flow_velocity_cm_s, 1);
  assert.deepEqual(flowZeroWeight, snapshot);
  assert.deepEqual(describeScenarioChanges(flowZeroWeight, b), [
    "flow_velocity_cm_s target 5 → 2",
    "flow_velocity_cm_s weight 0 → 1"
  ]);
  const weighted: RankingRequest = { ...flowZeroWeight, weights: { flow_velocity_cm_s: 2.5 } };
  const kept = buildScenarioRequest(weighted, "flow_scored_2").scenario_b;
  assert.equal(kept.weights?.flow_velocity_cm_s, 2.5);
  assert.ok(!describeScenarioChanges(weighted, kept).some((line) => line.includes("weight")));
});

test("flow_scored_2 leaves the other constraints untouched", () => {
  const base: RankingRequest = {
    target: { gravity_regime: "microgravity", oxygen_pct: 21, flow_velocity_cm_s: 5 },
    required_match: ["gravity_regime", "flow_velocity_cm_s"], vary: ["pressure_kpa"],
    weights: { oxygen_pct: 3 }, study_ids: ["synthetic:study-a"], allow_synthetic: true, minimum_coverage: 0.8, limit: 5
  };
  const { scenario_b: b } = buildScenarioRequest(base, "flow_scored_2");
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
  assert.deepEqual(describeScenarioChanges(demoRanking, buildScenarioRequest(demoRanking, "gravity_lunar").scenario_b),
    ["gravity_regime target microgravity → lunar"]);
  assert.deepEqual(describeScenarioChanges(demoRanking, buildScenarioRequest(demoRanking, "exclude_synthetic").scenario_b),
    ["Synthetic fixtures allowed → not allowed"]);
  assert.deepEqual(describeScenarioChanges(demoRanking, { ...demoRanking, minimum_coverage: 0.8, limit: 5, study_ids: ["synthetic:study-a"] }),
    ["Minimum coverage 0.6 → 0.8", "Limit 3 → 5", "synthetic:study-a added to selected studies"]);
});

test("preset texts are in English and describe fixtures as synthetic, not NASA data", () => {
  for (const preset of scenarioPresets) {
    for (const text of [preset.title, preset.change, preset.expectation]) {
      assert.doesNotMatch(text, /[áéíóúñ¿¡]|ensayo|gravedad|filtros/i, `${preset.id} must be English`);
    }
    assert.doesNotMatch(preset.expectation, /(?<!not )NASA measurement/);
  }
  const flow = scenarioPresets.find((preset) => preset.id === "flow_scored_2");
  assert.match(flow?.change ?? "", /leaves required matches and varied conditions/);
  assert.match(flow?.expectation ?? "", /synthetic demo fixtures \(not NASA measurements\)/);
});
