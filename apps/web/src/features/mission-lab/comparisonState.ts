// Mission Lab · vigencia de resultados respecto de los filtros actuales (lógica pura).
import type { RankingRequest } from "../../lib/client";

/** Huella canónica e independiente del orden de claves/listas de un RankingRequest (con defaults del contrato aplicados). */
export function requestFingerprint(request: RankingRequest): string {
  void request; throw new Error("Pendiente de implementación.");
}

export function sameRequest(a: RankingRequest | null, b: RankingRequest | null): boolean {
  void a; void b; throw new Error("Pendiente de implementación.");
}

export type Freshness =
  /** Calculado con exactamente los filtros actuales. */
  | "current"
  /** Calculado con otros filtros: debe mostrarse como anterior junto a sus filtros. */
  | "stale"
  /** No hay filtros actuales válidos para comparar. */
  | "unknown";

export function freshness(usedRequest: RankingRequest, currentRequest: RankingRequest | null): Freshness {
  void usedRequest; void currentRequest; throw new Error("Pendiente de implementación.");
}

/** Resumen legible de un RankingRequest (target, required_match, vary, weights, allow_synthetic, minimum_coverage, limit, study_ids). */
export function describeRequest(request: RankingRequest): string[] {
  void request; throw new Error("Pendiente de implementación.");
}

/** Guarda contra respuestas tardías: solo la última petición iniciada puede aplicar su resultado. */
export function createRequestGuard(): { begin(): number; isCurrent(token: number): boolean; cancel(): void } {
  throw new Error("Pendiente de implementación.");
}
