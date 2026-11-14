import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type { Models, ResearchResponse } from "../src/lib/client.ts";
import { assessBassComparison, assessBassRun, bassScenarioRequest, BASS_DATASET, BASS_METRIC, BASS_REFERENCE,
  BASS_STUDY, hasBassCohort, parseBassCases, parseBassCopy, type BassCaseId, type BassQuantitativeCase } from "../src/features/mission-lab/bassCases.ts";

const sourceCases: unknown = JSON.parse(readFileSync(new URL("../../../data/catalog/p2-demo-cases-v1.1.0.json", import.meta.url), "utf8"));
const sourceCopy: unknown = JSON.parse(readFileSync(new URL("../../../data/catalog/p2-demo-copy-v1.1.1.json", import.meta.url), "utf8"));
const cases = parseBassCases(sourceCases);
const copy = parseBassCopy(sourceCopy);

// Contract-shaped mocks based on the approved identity/value reference. These test UI gates;
// they are not a new source extraction or scientific validation. The opt-in browser suite uses the real bundle.
function ranked(id: BassQuantitativeCase): Models["RankingResponse"] {
  return { schema_version: "1.0", dataset_id: BASS_DATASET, items: BASS_REFERENCE[id].map((row) => ({
    trial_id: row.trial, scored_segment_id: row.segment, eligible_segment_ids: [row.segment], similarity: 1,
    coverage: 1, eligibility: "eligible", reasons: [], contributions: [], evidence_ids: [row.evidence], provenance: "published"
  })), excluded: [], warnings: [] };
}

function run(id: BassCaseId): ResearchResponse {
  const request = cases[id];
  const quantitative = id !== "lunar";
  const rows = quantitative ? BASS_REFERENCE[id] : [];
  const result: ResearchResponse = {
    id: `research:${id}`, schema_version: "1.0", created_at: "2026-11-14T00:00:00Z", provider: "demo",
    status: quantitative ? "completed" : "insufficient_evidence", question: request.question, summary: "API summary", claims: [], hypotheses: [], panels: [], events: [], warnings: [],
    plan: { planning_mode: "explicit", intent: "explicit_filters", ranking: request.ranking ?? {}, metric: BASS_METRIC,
      x_condition: "flow_velocity_cm_s", message: "Approved explicit inputs", blocked: false, limits: [] },
    ranking: quantitative ? ranked(id) : { schema_version: "1.0", dataset_id: BASS_DATASET, items: [], excluded: [], warnings: [] },
    comparison: quantitative ? { metric: BASS_METRIC, unit: "mm/s", x_condition: "flow_velocity_cm_s", x_unit: "cm/s", groups: [], warnings: [],
      points: rows.map((row) => ({ trial_id: row.trial, segment_id: row.segment, observation_id: row.observation,
        independent_unit_id: row.sample, independent_unit_status: "identified", x: row.x, y: row.y, group_id: "group:mock",
        evidence_ids: [row.evidence], provenance: "published" })) } : null,
    evidence: rows.map((row) => ({ id: row.evidence, study_id: BASS_STUDY, title: "Approved table reference",
      text: row.trial.endsWith(":M8") ? `Source text. ${copy.m8_notice}` : "Source text.", locator: "Table 5.1", provenance: "published", reviewed: false }))
  };
  if (!quantitative) {
    result.ranking.excluded = [...new Set([...BASS_REFERENCE.bass_6, ...BASS_REFERENCE.bass_5].map((row) => row.trial))].map((trial_id) => ({
      trial_id, similarity: null, coverage: 1, eligibility: "excluded", reasons: ["required_condition_mismatch:gravity_regime"], contributions: [], evidence_ids: [], provenance: "published"
    }));
  }
  return result;
}

function assess(id: BassCaseId, result: ResearchResponse, present = true) {
  return assessBassRun(id, result, cases[id], present, copy);
}

test("curated request bodies and copy exactly preserve the versioned inputs", () => {
  assert.deepEqual(cases, sourceCases);
  assert.deepEqual(copy, sourceCopy);
  for (const id of ["bass_6", "bass_5", "lunar"] as const) {
    assert.equal(cases[id].include_hypotheses, false);
    assert.equal(cases[id].metric, BASS_METRIC);
    assert.equal(cases[id].ranking?.condition_scope, "segment");
    assert.deepEqual(cases[id].ranking?.study_ids, [BASS_STUDY]);
    assert.equal(cases[id].ranking?.allow_synthetic, false);
  }
  assert.deepEqual(cases.lunar.ranking?.target, { gravity_regime: "lunar" });
  const ab = bassScenarioRequest(cases);
  assert.equal(ab.metric, BASS_METRIC);
  assert.deepEqual(ab.scenario_a, cases.bass_6.ranking);
  assert.deepEqual(ab.scenario_b, cases.bass_5.ranking);
  ab.scenario_a.limit = 1;
  assert.equal(cases.bass_6.ranking?.limit, 20);
});

test("unapproved source-case edits are rejected instead of silently dropped", () => {
  const flowRestrictedMoon = structuredClone(cases);
  flowRestrictedMoon.lunar.ranking = { ...flowRestrictedMoon.lunar.ranking, target: { gravity_regime: "lunar", flow_velocity_cm_s: 6 } };
  assert.throws(() => parseBassCases(flowRestrictedMoon));
  const changed = structuredClone(cases);
  changed.bass_6.include_hypotheses = true;
  assert.throws(() => parseBassCases(changed));
  const wrongScope = structuredClone(cases);
  wrongScope.bass_5.ranking = { ...wrongScope.bass_5.ranking, condition_scope: "trial" };
  assert.throws(() => parseBassCases(wrongScope));
});

test("metadata-only and synthetic corpora never establish the BASS cohort", () => {
  assert.equal(hasBassCohort([]), false);
  const trials: Models["Trial"][] = [...new Set([...BASS_REFERENCE.bass_6, ...BASS_REFERENCE.bass_5].map((row) => row.trial))].map((id) => ({
    id, study_id: BASS_STUDY, sample_id: `sample:${id}`, independent_unit_id: `sample:${id}`, label: "Reference trial", provenance: "published", conditions: {}, evidence_ids: []
  }));
  assert.equal(hasBassCohort(trials), true);
  assert.equal(hasBassCohort(trials.slice(1)), false);
  assert.equal(hasBassCohort(trials.map((trial) => ({ ...trial, provenance: "synthetic" }))), false);
  assert.equal(assess("lunar", run("lunar"), false).confirmed, false);
  const changedCorpus = run("lunar"); changedCorpus.ranking.excluded = [];
  assert.equal(assess("lunar", changedCorpus, true).confirmed, false, "a prior cohort lookup cannot authorize an unrelated empty response");
});

test("approved quantitative gates require exact identities, units, values and saved M8 notice", () => {
  for (const id of ["bass_6", "bass_5"] as const) assert.equal(assess(id, run(id)).confirmed, true);
  const mutate: Array<(result: ResearchResponse) => void> = [
    (result) => { result.ranking.dataset_id = "synthetic:demo"; },
    (result) => { result.ranking.items[0]!.scored_segment_id = "psi:PSI-25:M7:stage:1"; },
    (result) => { result.comparison!.points[0]!.y += 0.001; },
    (result) => { result.comparison!.points[0]!.x = 5; },
    (result) => { result.comparison!.points[0]!.segment_id = "psi:PSI-25:M7:stage:1"; },
    (result) => { result.comparison!.points[0]!.observation_id = "psi:PSI-25:M7:stage:1:spread"; },
    (result) => { result.comparison!.points[0]!.independent_unit_id = "psi:PSI-25:sample:other"; },
    (result) => { result.comparison!.points[0]!.independent_unit_status = "unresolved"; },
    (result) => { result.comparison!.points[0]!.provenance = "synthetic"; },
    (result) => { result.comparison!.unit = "cm/s"; },
    (result) => { result.comparison!.points[0]!.original_value = "999"; },
    (result) => { result.comparison!.points[0]!.original_unit = "cm/s"; },
    (result) => { result.comparison!.points[0]!.evidence_ids = []; },
    (result) => { result.evidence = result.evidence.filter((source) => !source.id.includes(":M8:")); },
    (result) => { result.evidence.find((source) => source.id.includes(":M8:"))!.text = "Table data without the source discrepancy"; },
  ];
  for (const edit of mutate) {
    const result = run("bass_6"); edit(result);
    assert.equal(assess("bass_6", result).confirmed, false, String(edit));
  }
});

test("prepared A/B interpretation is withheld for changed cohorts or values, even with the same counts", () => {
  const a = run("bass_6"); const b = run("bass_5");
  const response: Models["ScenarioComparisonResponse"] = { metric: BASS_METRIC, name_a: "6", name_b: "5", ranking_a: a.ranking,
    ranking_b: b.ranking, warnings: [], label: "evidence_comparison_not_physical_simulation" };
  assert.equal(assessBassComparison(a, b, response, cases, true, copy).confirmed, true);
  const wrongB = structuredClone(b); wrongB.comparison!.points[0]!.y = 999;
  assert.equal(assessBassComparison(a, wrongB, response, cases, true, copy).confirmed, false);
  const changedRanking = structuredClone(response); changedRanking.ranking_b.items[0]!.eligible_segment_ids = [];
  assert.equal(assessBassComparison(a, b, changedRanking, cases, true, copy).confirmed, false);
  assert.equal(assessBassComparison(a, b, { ...response, metric: null }, cases, true, copy).confirmed, false);
});

test("lunar approved statement requires its exact empty API result and actual source cohort", () => {
  assert.equal(assess("lunar", run("lunar")).confirmed, true);
  const completed = run("lunar"); completed.status = "completed";
  assert.equal(assess("lunar", completed).confirmed, false);
  const otherInputs = run("lunar"); otherInputs.plan!.ranking = cases.bass_6.ranking ?? {};
  assert.equal(assess("lunar", otherInputs).confirmed, false);
});
