import type { Models, ResearchResponse } from "../../lib/client";

export type PlotPoint = Models["PlotPoint"];
export type RankedTrial = Models["RankedTrial"];

/**
 * One selection shared by chart, tables and evidence viewer. Every link is by
 * identity (trial, observation, evidence IDs), never by array position.
 */
export interface Selection {
  trialId: string | null;
  observationId: string | null;
  evidenceId: string | null;
}

export const EMPTY_SELECTION: Selection = { trialId: null, observationId: null, evidenceId: null };

function rankedTrial(result: ResearchResponse, trialId: string): RankedTrial | undefined {
  return result.ranking.items.find((item) => item.trial_id === trialId)
    ?? result.ranking.excluded.find((item) => item.trial_id === trialId);
}

/** Evidence IDs that support the current selection, most specific first. */
export function evidenceFor(result: ResearchResponse, selection: Selection): string[] {
  const ids: string[] = [];
  if (selection.observationId) {
    const point = result.comparison?.points.find((item) => item.observation_id === selection.observationId);
    if (point) ids.push(...point.evidence_ids);
  }
  if (selection.trialId) ids.push(...(rankedTrial(result, selection.trialId)?.evidence_ids ?? []));
  return [...new Set(ids)];
}

export function selectObservation(result: ResearchResponse, observationId: string): Selection {
  const point = result.comparison?.points.find((item) => item.observation_id === observationId);
  if (!point) return EMPTY_SELECTION;
  const selection: Selection = { trialId: point.trial_id, observationId, evidenceId: null };
  return { ...selection, evidenceId: evidenceFor(result, selection)[0] ?? null };
}

export function selectTrial(result: ResearchResponse, trialId: string): Selection {
  const selection: Selection = { trialId, observationId: null, evidenceId: null };
  return { ...selection, evidenceId: evidenceFor(result, selection)[0] ?? null };
}

export function selectEvidence(selection: Selection, evidenceId: string): Selection {
  return { ...selection, evidenceId };
}

/** True when the response may only be fetched for evidence retrieved with this run. */
export function isRetrieved(result: ResearchResponse, evidenceId: string): boolean {
  return result.evidence.some((item) => item.id === evidenceId);
}
