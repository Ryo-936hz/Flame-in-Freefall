import { conditionLabel } from "./filters";

/** Human wording for the API's ranking reason codes. Unknown codes pass through. */
export function reasonText(code: string): string {
  const [kind, detail] = code.split(":");
  const field = detail ? conditionLabel(detail) : "";
  switch (kind) {
    case "explicit_requirements_satisfied": return "Meets the explicit requirements";
    case "required_condition_mismatch": return `Does not match: ${field}`;
    case "required_condition_missing": return `No data for ${field}`;
    case "synthetic_not_allowed": return "Synthetic data excluded by filter";
    case "study_not_selected": return "Study not selected";
    case "coverage_below_minimum": return "Coverage below minimum";
    case "no_known_target_conditions": return "No known target conditions";
    case "no_active_target_weights": return "No conditions to score";
    default: return code;
  }
}

export function contributionNote(note: string): string {
  if (note.startsWith("fixed_numeric_scale_v1")) return note.includes("clipped") ? "Fixed scale v1 (distance clipped at 1)" : "Fixed numeric scale v1";
  return ({
    categorical_equality: "Categorical equality",
    varied_condition_not_scored: "Studied variable: not scored",
    zero_weight_not_scored: "Zero weight: not scored",
    missing_condition_reduces_coverage: "Missing value: reduces coverage",
  } as Record<string, string>)[note] ?? note;
}

export const ELIGIBILITY_LABEL: Record<string, string> = {
  eligible: "Eligible",
  excluded: "Excluded",
  indeterminate: "Indeterminate",
};

export const PROVENANCE_LABEL: Record<string, string> = {
  synthetic: "Synthetic",
  published: "Published",
  digitized: "Digitized",
  derived: "Derived",
};

export const DATA_MODE_LABEL: Record<string, string> = {
  empty: "No corpus",
  metadata_only: "Metadata only",
  synthetic: "Synthetic data",
  mixed: "Mixed: synthetic and real",
  scientific_unverified: "Real, unverified",
};

export function fmt(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/\.?0+$/, "");
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function shortId(id: string): string {
  return id.replace(/^synthetic:/, "");
}
