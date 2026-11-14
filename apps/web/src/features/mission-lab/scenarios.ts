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

export const scenarioPresets: readonly ScenarioPreset[] = [];

export function buildScenarioRequest(base: RankingRequest, presetId: string): ScenarioComparisonRequest {
  void base; void presetId;
  throw new Error("Pendiente de implementación.");
}

export function diffScenarioRankings(response: ScenarioComparison): ScenarioDiff {
  void response;
  throw new Error("Pendiente de implementación.");
}

/** Texto visible para la etiqueta de una hipótesis; nunca la presenta como física validada. */
export function hypothesisLabelText(label: Hypothesis["label"]): string {
  void label;
  throw new Error("Pendiente de implementación.");
}
