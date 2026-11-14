// Mission Lab · etiquetas de procedencia y modo derivadas de los datos reales (lógica pura).
// Textos visibles en inglés. "published" solo indica origen publicado; la revisión es Evidence.reviewed.
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

const NON_SYNTHETIC_ORDER: readonly Provenance[] = ["published", "digitized", "derived"];

function detail(counts: Partial<Record<Provenance, number>>, keys: readonly Provenance[]): string {
  return keys.filter((key) => counts[key]).map((key) => `${counts[key]} ${key}`).join(", ");
}

/** A partir de las procedencias de los elementos seleccionados (vacío → no_evidence). */
export function summarizeProvenance(values: readonly Provenance[]): ProvenanceSummary {
  const counts: Partial<Record<Provenance, number>> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  const total = values.length;
  const synthetic = counts.synthetic ?? 0;
  const others = [...new Set(values.filter((value) => value !== "synthetic"))];
  const extra = others.filter((value) => !NON_SYNTHETIC_ORDER.includes(value));
  const order = [...NON_SYNTHETIC_ORDER, ...extra];

  if (total === 0) {
    return { kind: "no_evidence", counts, text: "No selected evidence: provenance cannot be summarized." };
  }
  if (synthetic === total) {
    return {
      kind: "synthetic", counts,
      text: `Synthetic fixtures only (${total}): they test connections and algorithms and are not NASA measurements.`
    };
  }
  if (synthetic === 0) {
    return {
      kind: "non_synthetic", counts,
      text: `Non-synthetic sources (${detail(counts, order)}). Provenance describes origin only; review status is reported per evidence item.`
    };
  }
  return {
    kind: "mixed", counts,
    text: `Mixed provenance: ${synthetic} synthetic fixture${synthetic === 1 ? "" : "s"} (not NASA measurements) and ${detail(counts, order)}. Provenance describes origin only; review status is reported per evidence item.`
  };
}

export type ModeKind = "demo_provider" | "external_provider" | "prepared_hypothesis" | "ai_hypothesis";

/** Texto visible del proveedor de una investigación (ResearchResponse.provider). */
export function providerText(provider: Models["ResearchResponse"]["provider"]): string {
  switch (provider) {
    case "demo":
      return "Deterministic demo coordinator · no external model";
    case "openai":
      return "External model synthesis · requires verification";
    default:
      return `Unrecognized provider (${String(provider)}) · requires verification`;
  }
}
