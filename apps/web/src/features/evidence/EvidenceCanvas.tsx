import { useMemo, useState } from "react";
import type { ResearchResponse } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { fmt, reasonText } from "../../lib/format";
import { tx } from "../../lib/backendText";
import { Panel, StateMessage, Tag } from "../../components/ui";
import ScatterChart from "./ScatterChart";
import PointsTable from "./PointsTable";
import RankingTable from "./RankingTable";
import type { Selection } from "./selection";
import { comparisonCsv, csvFileName, downloadCsv } from "./exportCsv";
import "./workspace.css";

// Only repeated, identical messages with a known record prefix are folded.
// Unknown formats and every distinct source note stay visible in full.
const SCOPED_WARNING_CODES = new Set([
  "source_note", "x_unavailable", "x_unavailable_for_observation",
  "trial_level_axis_not_available_for_segment", "segment_unassigned",
  "synthetic_not_allowed", "metric_outside_campaign", "metric_not_reported_for_selected_segments",
  "observation_provenance_split", "metric_not_reported", "observation_missing", "incompatible_unit"
]);

export function WorkspaceWarnings({ result, warnings, title, label }: {
  result: ResearchResponse; warnings: string[]; title: string; label: string;
}) {
  const entries = [...new Set(warnings)];
  if (!entries.length) return null;
  const recordIds = [...new Set([
    ...result.ranking.items.map((item) => item.trial_id),
    ...result.ranking.excluded.map((item) => item.trial_id),
    ...(result.comparison?.points.flatMap((point) => [point.trial_id, point.observation_id]) ?? [])
  ])].sort((a, b) => b.length - a.length);
  const groups = new Map<string, [string, ...string[]]>();
  for (const warning of entries) {
    const code = warning.slice(0, warning.indexOf(":"));
    const matches = SCOPED_WARNING_CODES.has(code)
      ? recordIds.filter((id) => warning === `${code}:${id}` || warning.startsWith(`${code}:${id}:`))
      : [];
    // Ambiguous ID boundaries remain separate, visible warnings.
    const record = matches.length === 1 ? matches[0] : undefined;
    const key = record
      ? JSON.stringify([code, warning.slice(code.length + record.length + 1)])
      : JSON.stringify([warning]);
    const existing = groups.get(key);
    if (existing) existing.push(warning);
    else groups.set(key, [warning]);
  }
  return <section className="workspace-warning-box" aria-label={label}>
    <h3>{title} ({entries.length})</h3>
    <ul className="warnings">{[...groups.values()].map((group) => <li key={group[0]}>
      <span>{tx(group[0])}</span>
      {group.length > 1 && <details className="workspace-more" data-warning-repeats>
        <summary>{group.length - 1} additional occurrences · trial/source details</summary>
        <ul>{group.slice(1).map((warning) => <li key={warning}>{tx(warning)}</li>)}</ul>
      </details>}
    </li>)}</ul>
  </section>;
}

export default function EvidenceCanvas({ result, labels, selection, onSelectObservation, onSelectTrial }: {
  result: ResearchResponse;
  labels: Map<string, string>;
  selection: Selection;
  onSelectObservation: (observationId: string) => void;
  onSelectTrial: (trialId: string) => void;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const comparison = result.comparison;
  const groupIndex = useMemo(() => new Map((comparison?.groups ?? []).map((group, index) => [group.id, index])), [comparison]);
  const synthetic = result.ranking.items.some((item) => item.provenance === "synthetic");
  const missingReasons = [...new Set(result.ranking.excluded.flatMap((item) => item.reasons))];
  const scientificWarnings = [...(comparison?.warnings ?? []), ...(comparison?.groups.flatMap((group) => group.warnings) ?? [])];

  return <Panel id="canvas" title="Evidence Canvas" className="canvas workspace-canvas" meta={<>
    <Tag tone={result.status === "completed" ? "signal" : "warn"}>{result.status === "completed" ? "Completed" : "Insufficient evidence"}</Tag>
    {synthetic && <Tag tone="synthetic">Synthetic data · not NASA</Tag>}
  </>}>
    <div className="panel-b">
      {result.status === "insufficient_evidence" && <StateMessage kind="insufficient" title="Not enough evidence to answer with these filters">
        <p>{tx(result.summary)}</p>
        <ul>{missingReasons.slice(0, 2).map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul>
        {missingReasons.length > 2 && <details className="workspace-more">
          <summary>All exclusion reasons ({missingReasons.length})</summary>
          <ul>{missingReasons.slice(2).map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul>
        </details>}
        <p>Review the selected metric, controls and coverage. No values are substituted.</p>
      </StateMessage>}

      {comparison && comparison.points.length > 0 && <section className="canvas-primary" aria-labelledby="cmp-title">
        <div className="block-h">
          <div>
            <h3 id="cmp-title">{metricLabel(comparison.metric)}</h3>
            <p className="workspace-meta">Against {conditionLabel(comparison.x_condition ?? "")} · {comparison.points.length} observations</p>
          </div>
          <div className="block-actions">
            <button type="button" className="btn ghost" onClick={() => downloadCsv(csvFileName(result), comparisonCsv(result, comparison))}
              title="One row per observation, with units, provenance and evidence IDs">Export CSV</button>
            <div className="seg" role="group" aria-label="Comparison view">
              <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
              <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
            </div>
          </div>
        </div>
        {view === "chart"
          ? <ScatterChart comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} />
          : <PointsTable comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} />}
      </section>}
      {comparison && comparison.points.length === 0 && <StateMessage kind="empty" title="No comparable observations for this metric" />}

      <p className="workspace-meta">Groups are descriptive. Similarity is not hazard or proof of physical compatibility.</p>
      <WorkspaceWarnings result={result} warnings={scientificWarnings} title="Scientific warnings" label="Scientific warnings" />

      {comparison && comparison.groups.length > 0 && <details className="workspace-disclosure" data-groups-details>
        <summary>Groups and controls</summary>
        <p className="workspace-meta">Counts are per group; do not add independent units across segments or source representations.</p>
        <ul className="workspace-groups" aria-label="Descriptive groups">
          {comparison.groups.map((group, index) => <li key={group.id}>
            <div className="workspace-group-heading">
              <span><span className="swatch" data-series={index % 4} aria-hidden="true" /><b>G{index + 1}</b></span>
              <span className="num">{group.n_trials} {group.n_trials === 1 ? "trial" : "trials"} · {group.n_observations} obs. · {group.n_independent_units} indep. {group.n_independent_units === 1 ? "unit" : "units"}</span>
              <span className="num">Calculated median {fmt(group.median)} {comparison.unit}</span>
            </div>
            {(group.n_trials_with_unresolved_independence ?? 0) > 0 && <p className="workspace-meta">{group.n_trials_with_unresolved_independence} trials with unresolved independence</p>}
            <dl className="workspace-controls">{Object.entries(group.conditions).map(([key, value]) => <div key={key}>
              <dt>{conditionLabel(key)}</dt><dd>{value}</dd>
            </div>)}</dl>
            {group.warnings.length > 0 && <ul className="warnings">{group.warnings.map((warning) => <li key={warning}>{tx(warning)}</li>)}</ul>}
          </li>)}
        </ul>
      </details>}

      <details className="workspace-disclosure" data-ranking-details>
        <summary id="rank-title">Ranking and coverage</summary>
        <p className="workspace-meta">{result.ranking.method} · similarity is not probability, confidence or hazard</p>
        <RankingTable ranking={result.ranking} labels={labels} selectedTrial={selection.trialId} onSelect={onSelectTrial} />
      </details>
    </div>
  </Panel>;
}
