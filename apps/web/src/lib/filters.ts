import type { Models, RankingRequest } from "./client";

// Form state for the Mission Brief. It is translated into the generated
// RankingRequest; the API remains the validator and the scientific authority.
export type ConditionKey = NonNullable<RankingRequest["required_match"]>[number];
export type Metric = NonNullable<Models["ResearchRequest"]["metric"]>;

/** What the user wants a condition to do in the explicit filters. */
export type ConditionRole = "off" | "match" | "similar" | "vary";

export interface ConditionDraft {
  role: ConditionRole;
  value: string;
}

export interface BriefDraft {
  question: string;
  conditions: Record<ConditionKey, ConditionDraft>;
  metric: Metric;
  allowSynthetic: boolean;
  minimumCoverage: number;
  limit: number;
}

interface ConditionMeta {
  key: ConditionKey;
  label: string;
  /** Display unit for the input. The API enforces canonical units. */
  unit: string | null;
  numeric: boolean;
}

export const CONDITIONS = [
  { key: "gravity_regime", label: "Régimen de gravedad", unit: null, numeric: false },
  { key: "oxygen_pct", label: "Oxígeno", unit: "%", numeric: true },
  { key: "pressure_kpa", label: "Presión", unit: "kPa", numeric: true },
  { key: "flow_velocity_cm_s", label: "Velocidad de flujo", unit: "cm/s", numeric: true },
  { key: "flow_direction", label: "Dirección del flujo", unit: null, numeric: false },
  { key: "material", label: "Material", unit: null, numeric: false },
  { key: "geometry", label: "Geometría", unit: null, numeric: false },
  { key: "thickness_mm", label: "Espesor", unit: "mm", numeric: true },
  { key: "sample_width_mm", label: "Ancho de muestra", unit: "mm", numeric: true },
  { key: "diameter_mm", label: "Diámetro", unit: "mm", numeric: true },
] as const satisfies readonly ConditionMeta[];

export const METRICS = [
  { key: "flame_spread_rate_mm_s", label: "Velocidad de propagación de llama" },
  { key: "extinction_oxygen_pct", label: "Oxígeno de extinción" },
  { key: "heat_release_w", label: "Liberación de calor" },
  { key: "other", label: "Otra métrica" },
] as const satisfies readonly { key: Metric; label: string }[];

export const ROLE_LABELS: Record<ConditionRole, string> = {
  off: "Sin usar",
  match: "Debe coincidir",
  similar: "Ordenar por parecido",
  vary: "Variable de estudio",
};

const META = new Map<ConditionKey, ConditionMeta>(CONDITIONS.map((item) => [item.key, item]));

export function conditionLabel(key: string): string {
  return META.get(key as ConditionKey)?.label ?? key;
}

export function metricLabel(key: string): string {
  return METRICS.find((item) => item.key === key)?.label ?? key;
}

function emptyConditions(): Record<ConditionKey, ConditionDraft> {
  return Object.fromEntries(CONDITIONS.map(({ key }) => [key, { role: "off", value: "" }])) as Record<ConditionKey, ConditionDraft>;
}

/** The documented demo query: microgravity must match, flow is the studied variable. */
export function demoDraft(): BriefDraft {
  const conditions = emptyConditions();
  conditions.gravity_regime = { role: "match", value: "microgravity" };
  conditions.flow_velocity_cm_s = { role: "vary", value: "" };
  return {
    question: "¿Qué ensayos de la demostración permiten explorar el efecto del flujo?",
    conditions,
    metric: "flame_spread_rate_mm_s",
    allowSynthetic: true,
    minimumCoverage: 0.6,
    limit: 3,
  };
}

export interface BuildResult {
  request: RankingRequest | null;
  errors: Partial<Record<ConditionKey, string>>;
}

function parseNumber(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * Translate the form into explicit filters. Only input shape is checked here
 * (empty or non-numeric values); admissible ranges and policy stay in the API.
 */
export function buildRanking(draft: BriefDraft): BuildResult {
  const target: NonNullable<RankingRequest["target"]> = {};
  const required: ConditionKey[] = [];
  const vary: ConditionKey[] = [];
  const errors: BuildResult["errors"] = {};

  for (const { key, numeric } of CONDITIONS) {
    const { role, value } = draft.conditions[key];
    if (role === "off") continue;
    if (role === "vary") { vary.push(key); continue; }
    if (!value.trim()) { errors[key] = "Indica un valor o cambia su uso a «Sin usar»."; continue; }
    if (numeric) {
      const parsed = parseNumber(value);
      if (parsed === null) { errors[key] = "Introduce un número."; continue; }
      target[key] = parsed;
    } else {
      target[key] = value.trim();
    }
    if (role === "match") required.push(key);
  }

  if (Object.keys(errors).length) return { request: null, errors };
  return {
    request: {
      target,
      required_match: required,
      vary,
      allow_synthetic: draft.allowSynthetic,
      minimum_coverage: draft.minimumCoverage,
      limit: draft.limit,
    },
    errors,
  };
}

/** Plain-language lines describing exactly what will be sent to the API. */
export function describeRanking(request: RankingRequest): string[] {
  const lines: string[] = [];
  const target = request.target ?? {};
  for (const key of request.required_match ?? []) lines.push(`${conditionLabel(key)} debe ser ${target[key]}`);
  for (const [key, value] of Object.entries(target)) {
    if (!(request.required_match ?? []).includes(key as ConditionKey)) lines.push(`Preferir ${conditionLabel(key)} ≈ ${value}`);
  }
  for (const key of request.vary ?? []) lines.push(`Estudiar el efecto de ${conditionLabel(key)} (no puntúa)`);
  lines.push(request.allow_synthetic ? "Incluye datos sintéticos de demostración" : "Excluye datos sintéticos");
  lines.push(`Cobertura mínima ${Math.round((request.minimum_coverage ?? 0.6) * 100)} % · hasta ${request.limit ?? 3} ensayos`);
  return lines;
}
