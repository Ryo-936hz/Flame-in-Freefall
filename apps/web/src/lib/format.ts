import { conditionLabel } from "./filters";

/** Human wording for the API's ranking reason codes. Unknown codes pass through. */
export function reasonText(code: string): string {
  const [kind, detail] = code.split(":");
  const field = detail ? conditionLabel(detail) : "";
  switch (kind) {
    case "explicit_requirements_satisfied": return "Cumple los requisitos explícitos";
    case "required_condition_mismatch": return `No coincide: ${field}`;
    case "required_condition_missing": return `Sin dato de ${field}`;
    case "synthetic_not_allowed": return "Sintético excluido por el filtro";
    case "study_not_selected": return "Estudio no seleccionado";
    case "coverage_below_minimum": return "Cobertura por debajo del mínimo";
    case "no_known_target_conditions": return "Ninguna condición objetivo conocida";
    case "no_active_target_weights": return "Sin condiciones que puntuar";
    default: return code;
  }
}

export function contributionNote(note: string): string {
  if (note.startsWith("fixed_numeric_scale_v1")) return note.includes("clipped") ? "Escala fija v1 (distancia recortada a 1)" : "Escala numérica fija v1";
  return ({
    categorical_equality: "Igualdad categórica",
    varied_condition_not_scored: "Variable de estudio: no puntúa",
    zero_weight_not_scored: "Peso cero: no puntúa",
    missing_condition_reduces_coverage: "Dato ausente: reduce la cobertura",
  } as Record<string, string>)[note] ?? note;
}

export const ELIGIBILITY_LABEL: Record<string, string> = {
  eligible: "Elegible",
  excluded: "Excluido",
  indeterminate: "Indeterminado",
};

export const PROVENANCE_LABEL: Record<string, string> = {
  synthetic: "Sintético",
  published: "Publicado",
  digitized: "Digitalizado",
  derived: "Derivado",
};

export const DATA_MODE_LABEL: Record<string, string> = {
  empty: "Sin corpus",
  metadata_only: "Solo metadatos",
  synthetic: "Datos sintéticos",
  mixed: "Mixto: sintético y real",
  scientific_unverified: "Real sin verificar",
};

export function fmt(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/\.?0+$/, "");
}

export function pct(value: number): string {
  return `${Math.round(value * 100)} %`;
}

export function shortId(id: string): string {
  return id.replace(/^synthetic:/, "");
}
