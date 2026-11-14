import { useMemo, useState } from "react";
import type { ResearchResponse } from "../../lib/client";
import { conditionLabel } from "../../lib/filters";
import { fmt, reasonText } from "../../lib/format";
import { tx } from "../../lib/backendText";
import { Panel, StateMessage, Tag } from "../../components/ui";
import ScatterChart, { CHART_FORMS } from "./ScatterChart";
import type { ChartForm } from "./ScatterChart";
import PointsTable from "./PointsTable";
import RankingTable from "./RankingTable";
import type { Selection } from "./selection";
import { comparisonCsv, csvFileName, downloadCsv } from "./exportCsv";

export default function EvidenceCanvas({ result, labels, selection, onSelectObservation, onSelectTrial, show = "all" }: {
  result: ResearchResponse;
  labels: Map<string, string>;
  selection: Selection;
  onSelectObservation: (observationId: string) => void;
  onSelectTrial: (trialId: string) => void;
  /** Which block to render; the host may split comparison and ranking into tabs. */
  show?: "all" | "comparison" | "ranking";
}) {
  const showComparison = show !== "ranking";
  const showRanking = show !== "comparison";
  const [view, setView] = useState<"chart" | "table">("chart");
  const [form, setForm] = useState<ChartForm>("points");
  const comparison = result.comparison;
  const groupIndex = useMemo(() => new Map((comparison?.groups ?? []).map((group, index) => [group.id, index])), [comparison]);
  const synthetic = result.ranking.items.some((item) => item.provenance === "synthetic");
  const missingReasons = [...new Set(result.ranking.excluded.flatMap((item) => item.reasons))];

  return <Panel id="canvas" title="Evidence Canvas" className="canvas" meta={<>
    <Tag tone={result.status === "completed" ? "signal" : "warn"}>{result.status === "completed" ? "Completed" : "Insufficient evidence"}</Tag>
    {synthetic && <Tag tone="synthetic">Synthetic data · not NASA</Tag>}
  </>}>
    <div className="panel-b">
      <p className="summary">{tx(result.summary)}</p>

      {result.status === "insufficient_evidence" && <StateMessage kind="insufficient" title="Not enough evidence to answer with these filters">
        <p>No figures are substituted and no conclusion is forced. Reasons returned by the ranking:</p>
        <ul>{missingReasons.map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul>
        <p>Try relaxing a “Must match” condition, lowering the minimum coverage or allowing synthetic data.</p>
      </StateMessage>}

      {showComparison && comparison && comparison.points.length > 0 && <section className="block" aria-labelledby="cmp-title">
        <div className="block-h">
          <h3 id="cmp-title">Comparison · metric vs {conditionLabel(comparison.x_condition ?? "")}</h3>
          <div className="block-actions">
          <button type="button" className="btn ghost" onClick={() => downloadCsv(csvFileName(result), comparisonCsv(result, comparison))}
            title="One row per observation, with units, provenance and evidence IDs">Export CSV</button>
          <div className="seg" role="group" aria-label="Comparison view">
            <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
          </div>
          {view === "chart" && <div className="seg" role="group" aria-label="Chart form">
            {CHART_FORMS.map(({ id, label }) => <button key={id} type="button" aria-pressed={form === id} onClick={() => setForm(id)}>{label}</button>)}
          </div>}
          </div>
        </div>
        {view === "chart"
          ? <ScatterChart comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} form={form} />
          : <PointsTable comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} />}
        <ul className="groups" aria-label="Descriptive groups">
          {comparison.groups.map((group, index) => <li key={group.id}>
            <span className="swatch" data-series={index % 4} aria-hidden="true" />
            <b>G{index + 1}</b>
            <span className="num">{group.n_trials} {group.n_trials === 1 ? "trial" : "trials"} · {group.n_observations} obs. · {group.n_independent_units} indep. {group.n_independent_units === 1 ? "unit" : "units"}</span>
            <span className="num">median {fmt(group.median)} {comparison.unit}</span>
          </li>)}
        </ul>
        {comparison.warnings.length > 0 && <ul className="warnings">{comparison.warnings.map((warning) => <li key={warning}>{tx(warning)}</li>)}</ul>}
      </section>}
      {showComparison && comparison && comparison.points.length === 0 && <StateMessage kind="empty" title="No comparable observations for this metric" />}
      {show === "comparison" && !comparison && result.status !== "insufficient_evidence" && <StateMessage kind="empty" title="This research record has no comparison" />}

      {showRanking && <section className="block" aria-labelledby="rank-title">
        <div className="block-h">
          <h3 id="rank-title">Ranking and coverage</h3>
          <span className="hint">{result.ranking.method} · similarity is not probability, confidence or hazard</span>
        </div>
        <RankingTable ranking={result.ranking} labels={labels} selectedTrial={selection.trialId} onSelect={onSelectTrial} />
      </section>}
    </div>
  </Panel>;
}
