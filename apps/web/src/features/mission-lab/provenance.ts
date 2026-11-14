// Mission Lab · etiquetas de procedencia y modo derivadas de los datos reales (lógica pura).
import type { Models } from "../../lib/client";

type Provenance = Models["RankedTrial"]["provenance"];

export type ProvenanceKind = "synthetic" | "non_synthetic" | "mixed" | "no_evidence";

export interface ProvenanceSummary {
  kind: ProvenanceKind;
  /** Recuento por valor de provenance presente (published, digitized, derived, synthetic). */
  counts: Partial<Record<Provenance, number>>;
  /** Texto visible. Nunca afirma "revisado" por ser published: revisión es Evidence.reviewed. */
  text: string;
}

/** A partir de las procedencias de los elementos seleccionados (vacío → no_evidence). */
export function summarizeProvenance(values: readonly Provenance[]): ProvenanceSummary {
  void values; throw new Error("Pendiente de implementación.");
}

export type ModeKind = "demo_provider" | "external_provider" | "prepared_hypothesis" | "ai_hypothesis";

/** Texto visible del proveedor de una investigación (ResearchResponse.provider). */
export function providerText(provider: Models["ResearchResponse"]["provider"]): string {
  void provider; throw new Error("Pendiente de implementación.");
}
