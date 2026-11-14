// Mission Lab (P6) · lógica pura de escenarios A/B.
// Compara aplicabilidad de evidencia entre dos RankingRequest; no simula física.
// INTERFAZ ACORDADA: las firmas y tipos exportados son estables para MissionLab.tsx.
import type { Models, RankingRequest } from "../../lib/client";

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
  /** Frases explicativas en español derivadas solo de los datos de la respuesta. */
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

/** Puntúa una condición por distancia de Gower sin exigir coincidencia: entra en target y sale de vary. */
function scoreCondition(base: RankingRequest, key: ConditionKey, value: string | number): RankingRequest {
  const next = cloneRequest(base);
  next.target = { ...next.target, [key]: value };
  next.vary = (next.vary ?? []).filter((item) => item !== key);
  return next;
}

// Las expectativas describen lo observado con data/fixtures/demo.json (sintético) partiendo de los
// filtros sintéticos por defecto (demoRanking) contra POST /api/v1/scenarios/compare. No afirman física.
export const scenarioPresets: readonly ScenarioPreset[] = [
  {
    id: "gravity_lunar",
    title: "gravedad lunar",
    change: "gravity_regime = lunar, exigido en required_match y retirado de vary.",
    expectation: "Con los filtros sintéticos por defecto, B no tiene ensayos elegibles: ningún fixture declara gravedad lunar. Los tres ensayos de A salen por required_condition_mismatch:gravity_regime y la API avisa de que no hay evidencia elegible.",
    build: (base) => requireCondition(base, "gravity_regime", "lunar")
  },
  {
    id: "gravity_earth",
    title: "gravedad terrestre",
    change: "gravity_regime = earth, exigido en required_match y retirado de vary.",
    expectation: "Con los filtros sintéticos por defecto, la selección cambia por completo: salen los tres ensayos en microgravedad y entra synthetic:trial-4, el único fixture declarado en gravedad terrestre.",
    build: (base) => requireCondition(base, "gravity_regime", "earth")
  },
  {
    id: "flow_scored_2",
    title: "flujo 2 cm/s puntuado",
    change: "flow_velocity_cm_s = 2 entra en target y deja de estar en vary: se puntúa por distancia, no se exige.",
    expectation: "Con los filtros sintéticos por defecto se conservan los mismos ensayos, pero cambia la similitud: synthetic:trial-1 (2 cm/s) mantiene 1 y los de 5 y 10 cm/s bajan ligeramente. El orden es de similitud con filtros explícitos, no de resultado físico.",
    build: (base) => scoreCondition(base, "flow_velocity_cm_s", 2)
  },
  {
    id: "exclude_synthetic",
    title: "sin fixtures sintéticos",
    change: "allow_synthetic = false; el resto de filtros no cambia.",
    expectation: "Con el dataset de demostración, B queda sin evidencia aplicable: todos los ensayos son sintéticos y salen por synthetic_not_allowed. Demuestra que los fixtures no se cuelan como evidencia real.",
    build: (base) => ({ ...cloneRequest(base), allow_synthetic: false })
  }
];

export function buildScenarioRequest(base: RankingRequest, presetId: string): ScenarioComparisonRequest {
  const preset = scenarioPresets.find((item) => item.id === presetId);
  if (!preset) {
    const known = scenarioPresets.map((item) => item.id).join(", ");
    throw new Error(`Escenario desconocido: "${presetId}". Disponibles: ${known}.`);
  }
  return {
    name_a: "A · filtros actuales",
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
      kept.push({ trial_id: trialId, status: "kept", a: itemA, b: itemB, similarityDelta: delta(itemA, itemB), reasonsB: [] });
    } else {
      left.push({
        trial_id: trialId, status: "left", a: itemA, b: null, similarityDelta: null,
        reasonsB: [...(excludedB.get(trialId)?.reasons ?? [])]
      });
    }
  }
  for (const [trialId, itemB] of selectedB) {
    if (!selectedA.has(trialId)) {
      entered.push({ trial_id: trialId, status: "entered", a: null, b: itemB, similarityDelta: null, reasonsB: [] });
    }
  }
  const order = (x: TrialChange, y: TrialChange) => x.trial_id < y.trial_id ? -1 : x.trial_id > y.trial_id ? 1 : 0;
  kept.sort(order); entered.sort(order); left.sort(order);

  const noEvidenceA = a.items.length === 0;
  const noEvidenceB = b.items.length === 0;
  const nameA = response.name_a;
  const nameB = response.name_b;
  const summary: string[] = [
    `${nameA}: ${countLabel(selectedA.size, "ensayo seleccionado", "ensayos seleccionados")} y ${countLabel(a.excluded.length, "fuera de la selección", "fuera de la selección")} (excluidos o indeterminados).`,
    `${nameB}: ${countLabel(selectedB.size, "ensayo seleccionado", "ensayos seleccionados")} y ${countLabel(b.excluded.length, "fuera de la selección", "fuera de la selección")} (excluidos o indeterminados).`
  ];
  if (noEvidenceA) summary.push(`${nameA} no tiene evidencia aplicable con sus filtros explícitos y su cobertura mínima.`);
  if (noEvidenceB) summary.push(`${nameB} no tiene evidencia aplicable con sus filtros explícitos y su cobertura mínima.`);
  if (kept.length) summary.push(`Se mantienen en ambos: ${kept.map((item) => item.trial_id).join(", ")}.`);
  if (entered.length) summary.push(`Entran en B: ${entered.map((item) => item.trial_id).join(", ")}.`);
  if (left.length) {
    const reasons = [...new Set(left.flatMap((item) => item.reasonsB))];
    summary.push(`Salen en B: ${left.map((item) => item.trial_id).join(", ")}` +
      (reasons.length ? ` (motivos en B: ${reasons.join(", ")}).` : "."));
  }
  const unknownDelta = kept.filter((item) => item.similarityDelta === null).length;
  if (unknownDelta) summary.push(`${countLabel(unknownDelta, "ensayo mantenido no tiene", "ensayos mantenidos no tienen")} similitud en ambos escenarios; su variación queda sin calcular.`);
  if (!kept.length && !entered.length && !left.length && !noEvidenceA) summary.push("La selección no cambia entre A y B.");

  const warnings = [...new Set([...response.warnings, ...a.warnings, ...b.warnings])];
  return {
    nameA, nameB,
    selectedA: a.items.length, selectedB: b.items.length,
    excludedA: a.excluded.length, excludedB: b.excluded.length,
    kept, entered, left, noEvidenceA, noEvidenceB, summary, warnings
  };
}

/** Texto visible para la etiqueta de una hipótesis; nunca la presenta como física validada. */
export function hypothesisLabelText(label: Hypothesis["label"]): string {
  switch (label) {
    case "prepared_demo_hypothesis":
      return "Hipótesis preparada para la demo · no es descubrimiento ni física validada";
    case "ai_hypothesis":
      return "Hipótesis generada por IA · requiere verificación";
    default:
      return `Hipótesis sin etiqueta reconocida (${String(label)}) · requiere verificación`;
  }
}

/** Cambios visibles de B respecto de A (target, required_match, vary, weights, allow_synthetic, ...), en español; [] si son iguales. */
export function describeScenarioChanges(a: RankingRequest, b: RankingRequest): string[] {
  void a; void b;
  throw new Error("Pendiente de implementación.");
}
