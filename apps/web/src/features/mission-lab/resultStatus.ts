// Mission Lab · vigencia frente a filtros, métrica, pregunta y expediente activo.
import type { RankingRequest } from "../../lib/client";
import type { MissionMetric } from "./slot";
import { freshness } from "./comparisonState";

/** Entrada exacta capturada al enviar; question solo corresponde a una investigación. */
export interface ComputedContext {
  request: RankingRequest;
  metric: MissionMetric;
  question?: string;
  at: Date;
  researchId: string | null;
}

export type ResultStatusReason =
  | "current"
  | "filters_changed"
  | "filters_unknown"
  | "metric_changed"
  | "question_changed"
  | "variable_order_changed"
  | "research_changed";

export function resultStatus(
  context: ComputedContext,
  currentRequest: RankingRequest | null,
  currentResearchId: string | null,
  currentMetric: MissionMetric,
  currentQuestion?: string
): ResultStatusReason {
  const fresh = freshness(context.request, currentRequest);
  if (fresh === "unknown") return "filters_unknown";
  if (fresh === "stale") return "filters_changed";
  if (context.metric !== currentMetric) return "metric_changed";
  if (context.question !== undefined) {
    if (context.question !== currentQuestion) return "question_changed";
    // Ranking treats vary as a set; research chooses the first numeric varied axis.
    // Conservatively mark any reordered variables as previous for research only.
    if (JSON.stringify(context.request.vary ?? []) !== JSON.stringify(currentRequest?.vary ?? [])) {
      return "variable_order_changed";
    }
  }
  if (context.researchId !== currentResearchId) return "research_changed";
  return "current";
}

function pad(value: number): string { return String(value).padStart(2, "0"); }

export function clockTime(at: Date): string {
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

export function scenarioAName(status: ResultStatusReason, at: Date): string {
  return status === "current" ? "A · current filters" : `A · filters used at ${clockTime(at)}`;
}

export function previousNotice(status: ResultStatusReason, subject: "comparison" | "query"): string | null {
  const noun = subject === "comparison" ? "Previous comparison" : "Previous query";
  switch (status) {
    case "current": return null;
    case "filters_changed":
    case "filters_unknown": return `${noun} — not computed with the current filters`;
    case "metric_changed": return `${noun} — not computed with the current metric`;
    case "question_changed": return `${noun} — not computed with the current question`;
    case "variable_order_changed": return `${noun} — computed with another variable order`;
    case "research_changed": return `${noun} — computed while another research was active`;
  }
}
