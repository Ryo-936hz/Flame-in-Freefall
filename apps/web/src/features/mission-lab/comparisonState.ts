// Mission Lab · vigencia de resultados respecto de los filtros actuales (lógica pura).
import type { RankingRequest } from "../../lib/client";
import { conditionLabel, conditionValueLabel } from "../../lib/filters";

/**
 * Defaults del contrato RankingRequest (apps/api/src/flamelab/domain/contracts.py).
 * Un campo ausente equivale a su default, por lo que la huella aplica estos valores.
 */
export const RANKING_REQUEST_DEFAULTS = {
  condition_scope: "trial",
  allow_synthetic: false,
  minimum_coverage: 0.6,
  limit: 3
} as const;

type Scalar = string | number | boolean | null;

function sortedRecord<T>(record: Record<string, T> | null | undefined): [string, T][] {
  return Object.entries(record ?? {})
    .filter(([, value]) => value !== undefined)
    .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0));
}

function sortedSet(values: readonly string[] | null | undefined): string[] {
  return [...new Set(values ?? [])].sort();
}

/** Forma canónica con defaults del contrato aplicados, claves ordenadas y listas-conjunto ordenadas. */
export function canonicalRequest(request: RankingRequest) {
  return {
    condition_scope: request.condition_scope ?? RANKING_REQUEST_DEFAULTS.condition_scope,
    target: sortedRecord(request.target as Record<string, Scalar> | undefined),
    required_match: sortedSet(request.required_match),
    vary: sortedSet(request.vary),
    weights: sortedRecord(request.weights as Record<string, number> | undefined),
    study_ids: sortedSet(request.study_ids),
    allow_synthetic: request.allow_synthetic ?? RANKING_REQUEST_DEFAULTS.allow_synthetic,
    minimum_coverage: request.minimum_coverage ?? RANKING_REQUEST_DEFAULTS.minimum_coverage,
    limit: request.limit ?? RANKING_REQUEST_DEFAULTS.limit
  };
}

/** Huella canónica e independiente del orden de claves/listas de un RankingRequest (con defaults del contrato aplicados). */
export function requestFingerprint(request: RankingRequest): string {
  return JSON.stringify(canonicalRequest(request));
}

export function sameRequest(a: RankingRequest | null, b: RankingRequest | null): boolean {
  if (a === null || b === null) return a === b;
  return requestFingerprint(a) === requestFingerprint(b);
}

export type Freshness =
  /** Calculado con exactamente los filtros actuales. */
  | "current"
  /** Calculado con otros filtros: debe mostrarse como anterior junto a sus filtros. */
  | "stale"
  /** No hay filtros actuales válidos para comparar. */
  | "unknown";

export function freshness(usedRequest: RankingRequest, currentRequest: RankingRequest | null): Freshness {
  if (currentRequest === null) return "unknown";
  return sameRequest(usedRequest, currentRequest) ? "current" : "stale";
}

export function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function listOrNone(values: string[]): string {
  return values.length ? values.join(", ") : "none";
}

/** Resumen legible (inglés, visible en la UI) de un RankingRequest con defaults aplicados. */
export function describeRequest(request: RankingRequest): string[] {
  const c = canonicalRequest(request);
  const lines = [
    `Target: ${c.target.length ? c.target.map(([key, value]) => `${conditionLabel(key)} · ${conditionValueLabel(key, value)}`).join(", ") : "none"}`,
    `Required matches: ${listOrNone(c.required_match.map(conditionLabel))}`,
    `Varied (not scored): ${listOrNone([...new Set(request.vary ?? [])].map(conditionLabel))}`,
    `Weights: ${c.weights.length ? c.weights.map(([key, value]) => `${conditionLabel(key)} · ${formatValue(value)}`).join(", ") : "default (1 per scored target)"}`,
    `Synthetic fixtures: ${c.allow_synthetic ? "allowed" : "not allowed"}`,
    `Minimum coverage: ${Math.round(c.minimum_coverage * 100)}%`,
    `Limit: ${formatValue(c.limit)}`,
    `Studies: ${c.study_ids.length ? c.study_ids.join(", ") : "all"}`
  ];
  if (c.condition_scope !== RANKING_REQUEST_DEFAULTS.condition_scope) lines.push("Conditions evaluated per trial segment");
  return lines;
}

/** Guarda contra respuestas tardías: solo la última petición iniciada puede aplicar su resultado. */
export function createRequestGuard(): { begin(): number; isCurrent(token: number): boolean; cancel(): void } {
  let current = 0;
  return {
    begin(): number { current += 1; return current; },
    isCurrent(token: number): boolean { return token === current; },
    cancel(): void { current += 1; }
  };
}
