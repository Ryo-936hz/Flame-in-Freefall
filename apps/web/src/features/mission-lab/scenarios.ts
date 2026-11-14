// Mission Lab (P6) · lógica pura de escenarios A/B.
// Compara aplicabilidad de evidencia entre dos RankingRequest; no simula física.
// INTERFAZ ACORDADA: las firmas y tipos exportados son estables para MissionLab.tsx.
import type { Models, RankingRequest } from "../../lib/client";
import type { MissionMetric } from "./slot";
import { canonicalRequest, formatValue } from "./comparisonState";

export type RankedTrial = Models["RankedTrial"];
export type ScenarioComparisonRequest = Models["ScenarioComparisonRequest"];
export type ScenarioComparison = Models["ScenarioComparisonResponse"];
export type Hypothesis = Models["Hypothesis"];

export interface ScenarioPreset {
  id: string;
  /** Nombre corto visible del escenario B. */
  title: string;
  /** Qué filtro explícito cambia respecto de A. */
  change: string;
  /** Qué debe observarse con los fixtures sintéticos (sin afirmar física). */
  expectation: string;
  /** Construye B a partir de A sin mutar A; el resultado debe cumplir la política de RankingRequest. */
  build(base: RankingRequest): RankingRequest;
}

export type TrialChangeStatus = "kept" | "entered" | "left";

export interface TrialChange {
  trial_id: string;
  status: TrialChangeStatus;
  a: RankedTrial | null;
  b: RankedTrial | null;
  /** b.similarity - a.similarity si ambos son números; null si alguno falta. Nunca sustituye null por 0. */
  similarityDelta: number | null;
  /** Motivos de exclusión/indeterminación en B cuando sale de la selección (de ranking_b.excluded). */
  reasonsB: string[];
  /** Una ausencia de la lista truncada no permite inventar un motivo de exclusión. */
  selectionNote: string | null;
}

export interface ScenarioDiff {
  nameA: string;
  nameB: string;
  selectedA: number;
  selectedB: number;
  excludedA: number;
  excludedB: number;
  kept: TrialChange[];
  entered: TrialChange[];
  left: TrialChange[];
  /** true si el escenario no tiene candidatos elegibles: evidencia aplicable insuficiente. */
  noEvidenceA: boolean;
  noEvidenceB: boolean;
  /** Frases explicativas visibles (inglés) derivadas solo de los datos de la respuesta. */
  summary: string[];
  /** Advertencias únicas de la respuesta y de ambos rankings. */
  warnings: string[];
}

type ConditionKey = NonNullable<RankingRequest["vary"]>[number];

/** Copia profunda de los campos mutables de RankingRequest; la base nunca se modifica. */
function cloneRequest(base: RankingRequest): RankingRequest {
  return {
    ...base,
    target: { ...(base.target ?? {}) },
    required_match: [...(base.required_match ?? [])],
    vary: [...(base.vary ?? [])],
    weights: { ...(base.weights ?? {}) },
    study_ids: [...(base.study_ids ?? [])]
  };
}

/** Fija un valor objetivo como requisito explícito: entra en target y required_match y sale de vary. */
function requireCondition(base: RankingRequest, key: ConditionKey, value: string | number): RankingRequest {
  const next = cloneRequest(base);
  next.target = { ...next.target, [key]: value };
  next.required_match = [...new Set([...(next.required_match ?? []), key])];
  next.vary = (next.vary ?? []).filter((item) => item !== key);
  return next;
}

/**
 * Puntúa una condición por distancia de Gower sin exigir coincidencia: entra en target, sale de
 * required_match y de vary, y recibe peso positivo (1) si no tenía peso o era 0; un peso positivo se conserva.
 */
function scoreCondition(base: RankingRequest, key: ConditionKey, value: string | number): RankingRequest {
  const next = cloneRequest(base);
  next.target = { ...next.target, [key]: value };
  next.required_match = (next.required_match ?? []).filter((item) => item !== key);
  next.vary = (next.vary ?? []).filter((item) => item !== key);
  const weight = next.weights?.[key];
  if (!(typeof weight === "number" && weight > 0)) next.weights = { ...next.weights, [key]: 1 };
  return next;
}

// Las expectativas describen lo observado contra el backend real (POST /api/v1/scenarios/compare y
// POST /api/v1/rankings) con los fixtures sintéticos sembrados por FLAMELAB_SEED_DEMO, partiendo de
// demoRanking salvo que se indique otra base. Textos visibles en inglés. No afirman física.
export const scenarioPresets: readonly ScenarioPreset[] = [
  {
    id: "gravity_lunar",
    title: "lunar gravity",
    change: "gravity_regime = lunar, required in required matches and removed from varied conditions.",
    expectation: "Observed with the synthetic demo fixtures (not NASA measurements) and the default synthetic filters: B has no eligible trials because no fixture declares lunar gravity. The three trials selected in A leave with required_condition_mismatch:gravity_regime and the API warns that there is no eligible evidence.",
    build: (base) => requireCondition(base, "gravity_regime", "lunar")
  },
  {
    id: "gravity_earth",
    title: "Earth gravity",
    change: "gravity_regime = earth, required in required matches and removed from varied conditions.",
    expectation: "Observed with the synthetic demo fixtures (not NASA measurements) and the default synthetic filters: the selection changes completely. The three microgravity fixtures leave and synthetic:trial-4, the only fixture declared in Earth gravity, enters.",
    build: (base) => requireCondition(base, "gravity_regime", "earth")
  },
  {
    id: "flow_scored_2",
    title: "flow 2 cm/s scored",
    change: "flow_velocity_cm_s = 2 is scored by Gower distance instead of being required: it enters the target, leaves required matches and varied conditions, and gets weight 1 if its weight was unset or 0 (a positive weight is kept).",
    expectation: "Observed with the synthetic demo fixtures (not NASA measurements). From the default synthetic filters (flow varied) the same three microgravity trials stay selected, but similarity now includes flow: synthetic:trial-1 (2 cm/s) keeps 1, synthetic:trial-2 drops to 0.985 and synthetic:trial-3 to 0.96 (flow distances 0.03 and 0.08 on the fixed v1 scale). If A required flow = 5 cm/s, only synthetic:trial-2 was selected and synthetic:trial-1 and synthetic:trial-3 enter in B. If A gave flow weight 0, its contribution goes from not scored to scored with the same values. Order is similarity under explicit filters, not a physical outcome.",
    build: (base) => scoreCondition(base, "flow_velocity_cm_s", 2)
  },
  {
    id: "exclude_synthetic",
    title: "no synthetic fixtures",
    change: "allow_synthetic = false; every other filter stays the same.",
    expectation: "With the synthetic demo dataset, B has no applicable evidence: every trial is a synthetic fixture and leaves with synthetic_not_allowed. It shows that fixtures are never passed off as real evidence.",
    build: (base) => ({ ...cloneRequest(base), allow_synthetic: false })
  }
];

export function buildScenarioRequest(base: RankingRequest, presetId: string, metric: MissionMetric): ScenarioComparisonRequest {
  const preset = scenarioPresets.find((item) => item.id === presetId);
  if (!preset) {
    const known = scenarioPresets.map((item) => item.id).join(", ");
    throw new Error(`Unknown scenario: "${presetId}". Available: ${known}.`);
  }
  return {
    metric,
    name_a: "A · current filters",
    name_b: `B · ${preset.title}`,
    scenario_a: base,
    scenario_b: preset.build(base)
  };
}

function delta(a: RankedTrial | null, b: RankedTrial | null): number | null {
  const left = a?.similarity;
  const right = b?.similarity;
  if (typeof left !== "number" || typeof right !== "number") return null;
  return right - left;
}

function byTrial(items: RankedTrial[]): Map<string, RankedTrial> {
  const map = new Map<string, RankedTrial>();
  for (const item of items) if (!map.has(item.trial_id)) map.set(item.trial_id, item);
  return map;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function diffScenarioRankings(response: ScenarioComparison): ScenarioDiff {
  const a = response.ranking_a;
  const b = response.ranking_b;
  const selectedA = byTrial(a.items);
  const selectedB = byTrial(b.items);
  const excludedB = byTrial(b.excluded);
  const kept: TrialChange[] = [];
  const entered: TrialChange[] = [];
  const left: TrialChange[] = [];

  for (const [trialId, itemA] of selectedA) {
    const itemB = selectedB.get(trialId) ?? null;
    if (itemB) {
      kept.push({ trial_id: trialId, status: "kept", a: itemA, b: itemB, similarityDelta: delta(itemA, itemB), reasonsB: [], selectionNote: null });
    } else {
      left.push({
        trial_id: trialId, status: "left", a: itemA, b: null, similarityDelta: null,
        reasonsB: [...(excludedB.get(trialId)?.reasons ?? [])],
        selectionNote: excludedB.has(trialId) ? null
          : "Not returned among B's selected or excluded candidates. The result limit can omit eligible trials; no exclusion reason was returned."
      });
    }
  }
  for (const [trialId, itemB] of selectedB) {
    if (!selectedA.has(trialId)) {
      entered.push({ trial_id: trialId, status: "entered", a: null, b: itemB, similarityDelta: null, reasonsB: [], selectionNote: null });
    }
  }
  const order = (x: TrialChange, y: TrialChange) => x.trial_id < y.trial_id ? -1 : x.trial_id > y.trial_id ? 1 : 0;
  kept.sort(order); entered.sort(order); left.sort(order);

  const noEvidenceA = a.items.length === 0;
  const noEvidenceB = b.items.length === 0;
  const nameA = response.name_a;
  const nameB = response.name_b;
  const summary: string[] = [
    `${nameA}: ${countLabel(selectedA.size, "selected trial", "selected trials")} and ${a.excluded.length} returned as excluded or indeterminate.`,
    `${nameB}: ${countLabel(selectedB.size, "selected trial", "selected trials")} and ${b.excluded.length} returned as excluded or indeterminate.`
  ];
  summary.push("Selected lists are limited by the request. Excluded counts do not include eligible trials omitted by that limit.");
  const scope = response.metric
    ? `explicit filters, minimum coverage and available measurements of ${response.metric}`
    : "explicit filters and minimum coverage (metric availability was not requested)";
  if (noEvidenceA) summary.push(`${nameA} has no applicable evidence with its ${scope}.`);
  if (noEvidenceB) summary.push(`${nameB} has no applicable evidence with its ${scope}.`);
  if (kept.length) summary.push(`Kept in both: ${kept.map((item) => item.trial_id).join(", ")}.`);
  if (entered.length) summary.push(`Entered in B: ${entered.map((item) => item.trial_id).join(", ")}.`);
  if (left.length) {
    const reasons = [...new Set(left.flatMap((item) => item.reasonsB))];
    summary.push(`Left in B: ${left.map((item) => item.trial_id).join(", ")}` +
      (reasons.length ? ` (reasons in B: ${reasons.join(", ")}).` : "."));
  }
  for (const item of left) if (item.selectionNote) summary.push(`${item.trial_id}: ${item.selectionNote}`);
  const unknownDelta = kept.filter((item) => item.similarityDelta === null).length;
  if (unknownDelta) summary.push(`${countLabel(unknownDelta, "kept trial lacks", "kept trials lack")} a similarity in one of the scenarios; its change is not calculated.`);
  if (!kept.length && !entered.length && !left.length && !noEvidenceA) summary.push("The selection does not change between A and B.");

  const warnings = [...new Set([...response.warnings, ...a.warnings, ...b.warnings])];
  return {
    nameA, nameB,
    selectedA: a.items.length, selectedB: b.items.length,
    excludedA: a.excluded.length, excludedB: b.excluded.length,
    kept, entered, left, noEvidenceA, noEvidenceB, summary, warnings
  };
}

/** Contexto de segmento reportado por el API: no crea ensayos ni réplicas nuevas. */
export function describeSegments(item: RankedTrial | null): string {
  if (!item) return "Trial not selected in this scenario.";
  const scored = item.scored_segment_id;
  const eligible = item.eligible_segment_ids ?? [];
  if (!scored && !eligible.length) return "Trial-level ranking; no segment selected for scoring.";
  return `Scored segment: ${scored ?? "not assigned"}. Eligible segments: ${eligible.length ? eligible.join(", ") : "none"}. Segments remain parts of the same trial, not independent replicates.`;
}

/** Texto visible para la etiqueta de una hipótesis; nunca la presenta como física validada. */
export function hypothesisLabelText(label: Hypothesis["label"]): string {
  switch (label) {
    case "prepared_demo_hypothesis":
      return "Prepared demo hypothesis · not a discovery or validated physics";
    case "ai_hypothesis":
      return "AI-generated hypothesis · requires verification";
    default:
      return `Hypothesis with unrecognized label (${String(label)}) · requires verification`;
  }
}

function setChanges(a: string[], b: string[], noun: string): string[] {
  const out: string[] = [];
  for (const key of b) if (!a.includes(key)) out.push(`${key} added to ${noun}`);
  for (const key of a) if (!b.includes(key)) out.push(`${key} removed from ${noun}`);
  return out;
}

/** Cambios visibles de B respecto de A (target, required_match, vary, weights, allow_synthetic, ...), en inglés; [] si son equivalentes. */
export function describeScenarioChanges(a: RankingRequest, b: RankingRequest): string[] {
  const ca = canonicalRequest(a);
  const cb = canonicalRequest(b);
  const changes: string[] = [];
  const targetA = new Map(ca.target);
  const targetB = new Map(cb.target);
  for (const [key, value] of cb.target) {
    if (!targetA.has(key)) changes.push(`${key} target set to ${formatValue(value)}`);
    else if (JSON.stringify(targetA.get(key)) !== JSON.stringify(value)) {
      changes.push(`${key} target ${formatValue(targetA.get(key))} → ${formatValue(value)}`);
    }
  }
  for (const [key] of ca.target) if (!targetB.has(key)) changes.push(`${key} target removed`);
  changes.push(...setChanges(ca.required_match, cb.required_match, "required matches"));
  changes.push(...setChanges(ca.vary, cb.vary, "varied conditions"));
  const weightsA = new Map(ca.weights);
  const weightsB = new Map(cb.weights);
  for (const key of [...new Set([...weightsA.keys(), ...weightsB.keys()])].sort()) {
    const wa = weightsA.get(key);
    const wb = weightsB.get(key);
    if (wa === wb) continue;
    const show = (w: number | undefined) => (w === undefined ? "unset (default 1)" : formatValue(w));
    changes.push(`${key} weight ${show(wa)} → ${show(wb)}`);
  }
  if (ca.allow_synthetic !== cb.allow_synthetic) {
    changes.push(`Synthetic fixtures ${ca.allow_synthetic ? "allowed" : "not allowed"} → ${cb.allow_synthetic ? "allowed" : "not allowed"}`);
  }
  if (ca.minimum_coverage !== cb.minimum_coverage) changes.push(`Minimum coverage ${formatValue(ca.minimum_coverage)} → ${formatValue(cb.minimum_coverage)}`);
  if (ca.limit !== cb.limit) changes.push(`Limit ${formatValue(ca.limit)} → ${formatValue(cb.limit)}`);
  changes.push(...setChanges(ca.study_ids, cb.study_ids, "selected studies"));
  if (ca.condition_scope !== cb.condition_scope) changes.push(`Condition scope ${ca.condition_scope} → ${cb.condition_scope}`);
  return changes;
}
