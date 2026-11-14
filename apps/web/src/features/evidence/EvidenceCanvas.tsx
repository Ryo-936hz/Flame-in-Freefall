import { useMemo, useState, type ReactNode } from "react";
import type { Models, ResearchResponse } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { fmt, reasonText } from "../../lib/format";
import { tx } from "../../lib/backendText";
import { Panel, StateMessage, Tag } from "../../components/ui";
import ScatterChart, { segmentSeries, type ChartStyle } from "./ScatterChart";
import { BarChart } from "./BarChart";
import { ChartViewControls, medianRows } from "./ChartViewControls";
import PointsTable from "./PointsTable";
import type { Selection } from "./selection";
import { comparisonCsv, csvFileName, downloadCsv } from "./exportCsv";

export default function EvidenceCanvas({ result, selection, onSelectObservation, metricControl, trials }: {
  result: ResearchResponse;
  selection: Selection;
  onSelectObservation: (observationId: string) => void;
  metricControl?: ReactNode;
  trials: Models["Trial"][];
}) {
  const [view, setView] = useState<ChartStyle>("chart");
  const comparison = result.comparison;
  const hasNumericX = comparison?.points.some((point) => point.x != null);
  const groupIndex = useMemo(() => new Map((comparison?.groups ?? []).map((group, index) => [group.id, index])), [comparison]);
  const lines = useMemo(() => comparison ? segmentSeries(comparison, trials) : [], [comparison, trials]);
  const bars = medianRows(comparison?.groups ?? []);
  const synthetic = result.ranking.items.some((item) => item.provenance === "synthetic");
  const missingReasons = [...new Set(result.ranking.excluded.flatMap((item) => item.reasons))];

  return <Panel id="canvas" title="Evidence Canvas" className="canvas" meta={<>
    <Tag tone={result.status === "completed" ? "signal" : "warn"}>{result.status === "completed" ? "Completed" : "Insufficient evidence"}</Tag>
    {synthetic && <Tag tone="synthetic">Synthetic data · not NASA</Tag>}
  </>}>
    <div className="panel-b">
      <p className="summary">{tx(result.summary)}</p>
      {metricControl}

      {result.status === "insufficient_evidence" && <StateMessage kind="insufficient" title="Not enough evidence to answer with these filters">
        <p>The ranking returned these reasons:</p>
        <ul>{missingReasons.map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul>
        <p>Try the study preset for this measurement, or review the required conditions and minimum coverage.</p>
      </StateMessage>}

      {comparison && comparison.points.length > 0 && <section className="block" aria-labelledby="cmp-title">
        <div className="block-h">
          <h3 id="cmp-title">{metricLabel(comparison.metric)}{hasNumericX ? ` vs ${conditionLabel(comparison.x_condition ?? "")}` : " by observation"}</h3>
          <div className="block-actions">
            <button type="button" className="btn ghost" onClick={() => downloadCsv(csvFileName(result), comparisonCsv(result, comparison))}
              title="One row per observation, with units, provenance and evidence IDs">Export CSV</button>
            <ChartViewControls label="Comparison view" view={view} onChange={setView}
              canShowLines={lines.length > 0} canShowBars={bars.length > 0} />
          </div>
        </div>
        {view === "bars" ? <BarChart title="Median by descriptive group" unit={comparison.unit} rows={bars} /> : view !== "table"
          ? <ScatterChart comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} lines={view === "lines" && lines.length ? lines : undefined} />
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
      {comparison && comparison.points.length === 0 && <StateMessage kind="empty" title="No comparable observations for this metric" />}
    </div>
  </Panel>;
}
