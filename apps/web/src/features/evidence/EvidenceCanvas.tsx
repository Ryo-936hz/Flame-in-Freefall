import { useMemo, useState } from "react";
import type { ResearchResponse } from "../../lib/client";
import { conditionLabel } from "../../lib/filters";
import { fmt, reasonText } from "../../lib/format";
import { Panel, StateMessage, Tag } from "../../components/ui";
import ScatterChart from "./ScatterChart";
import PointsTable from "./PointsTable";
import RankingTable from "./RankingTable";
import type { Selection } from "./selection";

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

  return <Panel id="canvas" title="Evidence Canvas" className="canvas" meta={<>
    <Tag tone={result.status === "completed" ? "signal" : "warn"}>{result.status === "completed" ? "Completed" : "Insufficient evidence"}</Tag>
    {synthetic && <Tag tone="synthetic">Synthetic data · not NASA</Tag>}
  </>}>
    <div className="panel-b">
      <p className="summary">{result.summary}</p>

      {result.status === "insufficient_evidence" && <StateMessage kind="insufficient" title="Not enough evidence to answer with these filters">
        <p>No figures are substituted and no conclusion is forced. Reasons returned by the ranking:</p>
        <ul>{missingReasons.map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul>
        <p>Try relaxing a “Must match” condition, lowering the minimum coverage or allowing synthetic data.</p>
      </StateMessage>}

      {comparison && comparison.points.length > 0 && <section className="block" aria-labelledby="cmp-title">
        <div className="block-h">
          <h3 id="cmp-title">Comparison · metric vs {conditionLabel(comparison.x_condition ?? "")}</h3>
          <div className="seg" role="group" aria-label="Comparison view">
            <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
          </div>
        </div>
        {view === "chart"
          ? <ScatterChart comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} />
          : <PointsTable comparison={comparison} groupIndex={groupIndex} selectedObservation={selection.observationId}
            selectedTrial={selection.trialId} onSelect={onSelectObservation} />}
        <ul className="groups" aria-label="Descriptive groups">
          {comparison.groups.map((group, index) => <li key={group.id}>
            <span className="swatch" data-series={index % 4} aria-hidden="true" />
            <b>G{index + 1}</b>
            <span className="num">{group.n_trials} trials · {group.n_observations} obs. · {group.n_independent_units} indep. units</span>
            <span className="num">median {fmt(group.median)} {comparison.unit}</span>
          </li>)}
        </ul>
        {comparison.warnings.length > 0 && <ul className="warnings">{comparison.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
      </section>}
      {comparison && comparison.points.length === 0 && <StateMessage kind="empty" title="No comparable observations for this metric" />}

      <section className="block" aria-labelledby="rank-title">
        <div className="block-h">
          <h3 id="rank-title">Ranking and coverage</h3>
          <span className="hint">{result.ranking.method} · similarity is not probability, confidence or hazard</span>
        </div>
        <RankingTable ranking={result.ranking} labels={labels} selectedTrial={selection.trialId} onSelect={onSelectTrial} />
      </section>
    </div>
  </Panel>;
}
