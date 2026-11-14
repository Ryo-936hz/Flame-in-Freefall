// Curated P2/P3 source cases. This adapter checks approved inputs; it does not fit or simulate physics.
import type { Models, RankingRequest, ResearchRequest, ResearchResponse } from "../../lib/client";
import { sameRequest } from "./comparisonState";

export type BassCaseId = "bass_6" | "bass_5" | "lunar";
export type BassQuantitativeCase = "bass_6" | "bass_5";
export type BassCases = Record<BassCaseId, ResearchRequest>;
export interface BassCopy { bass_comparison: string; lunar_insufficient: string; m8_notice: string }
export const BASS_STUDY = "psi:PSI-25";
export const BASS_DATASET = "psi:nasa-local-corpus-v1";
export const BASS_METRIC = "flame_spread_rate_mm_s";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a case object.");
  return Object.fromEntries(Object.entries(value));
}

function keys(value: Record<string, unknown>, expected: string[]) {
  if (Object.keys(value).sort().join("|") !== [...expected].sort().join("|")) throw new Error("The approved case fields changed.");
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Expected an array of strings.");
  return value.map((item: unknown) => {
    if (typeof item !== "string") throw new Error("Expected an array of strings.");
    return item;
  });
}

/** Narrow imported JSON into generated wire types without unsafe contract casts. */
export function parseBassCases(raw: unknown): BassCases {
  const source = record(raw);
  keys(source, ["bass_6", "bass_5", "lunar"]);
  const read = (id: BassCaseId): ResearchRequest => {
    const item = record(source[id]);
    keys(item, ["question", "metric", "include_hypotheses", "ranking"]);
    if (typeof item.question !== "string" || item.question.length < 3 || item.question.length > 4000
      || item.metric !== BASS_METRIC || item.include_hypotheses !== false) throw new Error("The approved research inputs changed.");
    const ranking = record(item.ranking);
    keys(ranking, ["study_ids", "condition_scope", "target", "required_match", "allow_synthetic", "limit"]);
    if (strings(ranking.study_ids).join("|") !== BASS_STUDY || ranking.condition_scope !== "segment"
      || ranking.allow_synthetic !== false || ranking.limit !== 20) throw new Error("The approved study, segment scope or limits changed.");
    const target = record(ranking.target);
    const required = strings(ranking.required_match);
    let typedTarget: NonNullable<RankingRequest["target"]>;
    let typedRequired: NonNullable<RankingRequest["required_match"]>;
    if (id === "lunar") {
      keys(target, ["gravity_regime"]);
      if (target.gravity_regime !== "lunar" || required.join("|") !== "gravity_regime") throw new Error("The approved lunar case has no flow restriction.");
      typedTarget = { gravity_regime: target.gravity_regime };
      typedRequired = ["gravity_regime"];
    } else {
      keys(target, ["gravity_regime", "flow_velocity_cm_s"]);
      const flow = id === "bass_6" ? 6 : 5;
      if (target.gravity_regime !== "microgravity" || target.flow_velocity_cm_s !== flow
        || required.join("|") !== "gravity_regime|flow_velocity_cm_s") throw new Error("The approved flow case changed.");
      typedTarget = { gravity_regime: target.gravity_regime, flow_velocity_cm_s: flow };
      typedRequired = ["gravity_regime", "flow_velocity_cm_s"];
    }
    return {
      question: item.question, metric: item.metric, include_hypotheses: item.include_hypotheses,
      ranking: { study_ids: [BASS_STUDY], condition_scope: ranking.condition_scope, target: typedTarget,
        required_match: typedRequired, allow_synthetic: ranking.allow_synthetic, limit: ranking.limit }
    };
  };
  return { bass_6: read("bass_6"), bass_5: read("bass_5"), lunar: read("lunar") };
}

export function parseBassCopy(raw: unknown): BassCopy {
  const source = record(raw);
  keys(source, ["bass_comparison", "lunar_insufficient", "m8_notice"]);
  const { bass_comparison, lunar_insufficient, m8_notice } = source;
  if (typeof bass_comparison !== "string" || !bass_comparison.trim() || typeof lunar_insufficient !== "string"
    || !lunar_insufficient.trim() || typeof m8_notice !== "string" || !m8_notice.trim()) throw new Error("Approved copy must contain three nonempty strings.");
  return { bass_comparison, lunar_insufficient, m8_notice };
}

export function bassScenarioRequest(cases: BassCases): Models["ScenarioComparisonRequest"] {
  return { name_a: "BASS-II · 6 cm/s", name_b: "BASS-II · 5 cm/s", metric: BASS_METRIC,
    scenario_a: structuredClone(cases.bass_6.ranking ?? {}), scenario_b: structuredClone(cases.bass_5.ranking ?? {}) };
}

interface ReferencePoint { trial: string; segment: string; observation: string; sample: string; evidence: string; x: number; y: number }
function point(test: string, stage: number, sample: string, x: number, y: number): ReferencePoint {
  const trial = `${BASS_STUDY}:${test}`;
  const segment = `${trial}:stage:${stage}`;
  return { trial, segment, observation: `${segment}:spread`, sample: `${BASS_STUDY}:sample:${sample}`, evidence: `${segment}:table51`, x, y };
}

// Identity/value reference transcribed from docs/handoffs/P3_BASS_II_DECISION_DEMO.md.
// Used only to gate its approved narrative; displayed measurements always come from the API.
export const BASS_REFERENCE: Readonly<Record<BassQuantitativeCase, readonly ReferencePoint[]>> = {
  bass_6: [point("M7", 2, "177m", 6, 0.099), point("M8", 2, "178m", 6, 0.056),
    point("M13", 1, "169m", 6, 0.047), point("M19", 2, "170m", 6, 0.0159)],
  bass_5: [point("M4", 1, "171m", 5, 0.045), point("M7", 3, "177m", 5, 0.083),
    point("M8", 3, "178m", 5, 0.04), point("M13", 2, "169m", 5, 0.035),
    point("M16", 1, "164m", 5, 0.144), point("M17", 1, "166m", 5, 0.053)]
};

function sameIds(actual: string[], expected: string[]) {
  return actual.length === expected.length && new Set(actual).size === actual.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

/** Study metadata alone is insufficient: require the actual published trial cohort. */
export function hasBassCohort(trials: Models["Trial"][]): boolean {
  const required = [...new Set([...BASS_REFERENCE.bass_6, ...BASS_REFERENCE.bass_5].map((row) => row.trial))];
  return required.every((id) => trials.some((trial) => trial.id === id && trial.study_id === BASS_STUDY && trial.provenance === "published"));
}

export interface BassAssessment { confirmed: boolean; notes: string[] }

function rankingMatches(ranking: Models["RankingResponse"], id: BassQuantitativeCase): boolean {
  const rows = BASS_REFERENCE[id];
  return ranking.dataset_id === BASS_DATASET && sameIds(ranking.items.map((item) => item.trial_id), rows.map((row) => row.trial))
    && rows.every((row) => ranking.items.some((item) => item.trial_id === row.trial && item.provenance === "published"
      && item.eligibility === "eligible" && item.scored_segment_id === row.segment
      && sameIds(item.eligible_segment_ids ?? [], [row.segment])));
}

export function assessBassRun(id: BassCaseId, run: ResearchResponse, request: ResearchRequest, cohortPresent: boolean, copy: BassCopy): BassAssessment {
  const notes: string[] = [];
  if (!cohortPresent || run.ranking.dataset_id !== BASS_DATASET) notes.push("The approved BASS-II trial cohort is not available in the active corpus. Load the P2 demo 1.1.1 package to reproduce these cases.");
  if (run.question !== request.question || run.hypotheses.length || !run.plan || run.plan.blocked
    || run.plan.metric !== BASS_METRIC || !sameRequest(run.plan.ranking, request.ranking ?? {})) {
    notes.push("The returned research does not match the approved explicit inputs and hypothesis setting.");
  }
  if (id === "lunar") {
    if (run.status !== "insufficient_evidence" || run.ranking.items.length || run.comparison !== null) notes.push("The API did not return the approved empty lunar case. Its observed result is shown without the prepared lunar statement.");
    const required = [...new Set([...BASS_REFERENCE.bass_6, ...BASS_REFERENCE.bass_5].map((row) => row.trial))];
    if (!required.every((id) => run.ranking.excluded.some((item) => item.trial_id === id && item.provenance === "published"
      && item.reasons.some((reason) => reason.includes("required_condition_mismatch:gravity_regime"))))) {
      notes.push("The lunar response itself does not establish the published BASS-II cohort under the requested gravity restriction.");
    }
  } else {
    const comparison = run.comparison;
    const rows = BASS_REFERENCE[id];
    if (run.status !== "completed" || !rankingMatches(run.ranking, id) || !comparison
      || comparison.metric !== BASS_METRIC || comparison.unit !== "mm/s" || comparison.x_condition !== "flow_velocity_cm_s" || comparison.x_unit !== "cm/s"
      || !sameIds(comparison.points.map((item) => item.observation_id), rows.map((row) => row.observation))) {
      notes.push("The returned selection, metric, units or observation identities differ from the approved source case.");
    }
    if (comparison && !rows.every((row) => comparison.points.some((item) => item.observation_id === row.observation
      && item.trial_id === row.trial && item.segment_id === row.segment && item.independent_unit_id === row.sample
      && item.independent_unit_status === "identified" && item.provenance === "published" && item.x === row.x && item.y === row.y
      && (item.original_value == null || Number(item.original_value) === row.y)
      && (item.original_unit == null || item.original_unit === "mm/s")
      && item.evidence_ids.includes(row.evidence)))) notes.push("The returned segment, sample, value or citation differs from the approved source case.");
    if (!rows.every((row) => run.evidence.some((evidence) => evidence.id === row.evidence && evidence.study_id === BASS_STUDY && evidence.provenance === "published"))) {
      notes.push("An approved observation source is missing from the saved research evidence.");
    }
    const m8 = rows.find((row) => row.trial === `${BASS_STUDY}:M8`);
    if (m8 && !run.evidence.some((evidence) => evidence.id === m8.evidence && evidence.text.includes(copy.m8_notice))) {
      notes.push("The saved M8 source does not contain the approved table/figure discrepancy notice. Its text is shown as returned by the API.");
    }
  }
  return { confirmed: notes.length === 0, notes };
}

export function assessBassComparison(a: ResearchResponse, b: ResearchResponse, comparison: Models["ScenarioComparisonResponse"], cases: BassCases,
  cohortPresent: boolean, copy: BassCopy): BassAssessment {
  const first = assessBassRun("bass_6", a, cases.bass_6, cohortPresent, copy);
  const second = assessBassRun("bass_5", b, cases.bass_5, cohortPresent, copy);
  const notes = [...new Set([...first.notes, ...second.notes])];
  if (comparison.metric !== BASS_METRIC || !rankingMatches(comparison.ranking_a, "bass_6") || !rankingMatches(comparison.ranking_b, "bass_5")) {
    notes.push("The A/B response does not select the same approved trials and segments as the two saved research cases.");
  }
  return { confirmed: notes.length === 0, notes };
}
