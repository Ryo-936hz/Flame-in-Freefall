// Mission Lab (P6) · vigencia visible de un resultado A/B o de la consulta insuficiente (lógica pura).
// Un resultado es "actual" solo si se calculó con los filtros actuales y con el mismo expediente activo.
import type { RankingRequest } from "../../lib/client";
import { freshness } from "./comparisonState";

/** Contexto guardado junto a cada resultado: filtros usados, momento y expediente activo al enviarlo. */
export interface ComputedContext {
  request: RankingRequest;
  at: Date;
  researchId: string | null;
}

export type ResultStatusReason =
  /** Mismos filtros y mismo expediente activo. */
  | "current"
  /** Los filtros actuales son distintos de los usados. */
  | "filters_changed"
  /** No hay filtros actuales válidos con los que comparar. */
  | "filters_unknown"
  /** Mismos filtros, pero el expediente activo cambió desde el cálculo. */
  | "research_changed";

export function resultStatus(
  context: ComputedContext,
  currentRequest: RankingRequest | null,
  currentResearchId: string | null
): ResultStatusReason {
  const fresh = freshness(context.request, currentRequest);
  if (fresh === "unknown") return "filters_unknown";
  if (fresh === "stale") return "filters_changed";
  if (context.researchId !== currentResearchId) return "research_changed";
  return "current";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Hora local HH:MM (24 h) del cálculo. */
export function clockTime(at: Date): string {
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** Nombre visible de A: solo "current filters" si el resultado es actual. */
export function scenarioAName(status: ResultStatusReason, at: Date): string {
  return status === "current" ? "A · current filters" : `A · filters used at ${clockTime(at)}`;
}

/** Rótulo visible (inglés) cuando el resultado no es actual; null si lo es. */
export function previousNotice(status: ResultStatusReason, subject: "comparison" | "query"): string | null {
  const noun = subject === "comparison" ? "Previous comparison" : "Previous query";
  switch (status) {
    case "current":
      return null;
    case "filters_changed":
    case "filters_unknown":
      return `${noun} — not computed with the current filters`;
    case "research_changed":
      return `${noun} — computed while another research was active`;
  }
}
