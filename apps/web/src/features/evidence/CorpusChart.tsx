import { useEffect, useMemo, useState } from "react";
import type { Api, Models } from "../../lib/client";
import { fmt } from "../../lib/format";
import { StateMessage } from "../../components/ui";
import { BASS_DATASET, BASS_METRIC, BASS_REFERENCE } from "../mission-lab/bassCases";
import ScatterChart, { segmentSeries, type ChartStyle } from "./ScatterChart";
import { BarChart } from "./BarChart";
import { ChartViewControls, medianRows } from "./ChartViewControls";
import PointsTable from "./PointsTable";

const bassPoints = [...BASS_REFERENCE.bass_5, ...BASS_REFERENCE.bass_6];
const bassTrialIds = [...new Set(bassPoints.map((point) => point.trial))];
const bassSegmentIds = bassPoints.map((point) => point.segment);
const chartSeries = new Map<string, number>();

export function CorpusChart({ api, datasetId, synthetic, trials, onSource }: {
  api: Api;
  datasetId?: string;
  synthetic: boolean;
  trials: Models["Trial"][];
  onSource: (evidenceId: string, trialId: string) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ data: Models["ComparisonResponse"] } | { error: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ChartStyle>("chart");
  const isBass = datasetId === BASS_DATASET;
  const trialIds = useMemo(() => isBass ? bassTrialIds : synthetic ? trials.filter((trial) => trial.provenance === "synthetic"
    && trial.conditions.gravity_regime?.value === "microgravity").map((trial) => trial.id) : [], [isBass, synthetic, trials]);

  useEffect(() => {
    if (!datasetId || trialIds.length === 0) return;
    let current = true;
    setResult(null);
    api.compare({ trial_ids: trialIds, segment_ids: isBass ? bassSegmentIds : [],
      metric: BASS_METRIC, x_condition: "flow_velocity_cm_s", vary: ["flow_velocity_cm_s"], allow_synthetic: !isBass })
      .then((data) => { if (current) setResult({ data }); }, (error: unknown) => {
        if (current) setResult({ error: error instanceof Error ? error.message : "Comparison request failed." });
      });
    return () => { current = false; };
  }, [api, attempt, datasetId, isBass, trialIds]);

  const comparison = result && "data" in result ? result.data : null;
  const groups = useMemo(() => new Map(comparison?.groups.map((group, index) => [group.id, index])), [comparison]);
  const lines = useMemo(() => comparison ? segmentSeries(comparison, trials) : [], [comparison, trials]);
  const bars = medianRows(comparison?.groups ?? []);
  const selected = comparison?.points.find((point) => point.observation_id === selectedId);
  return <section className="dashboard-card corpus-chart" aria-labelledby="corpus-chart-title">
    <header className="corpus-chart-header">
      <div>
        <h2 id="corpus-chart-title">Flame spread vs. airflow</h2>
        <p>{isBass ? "BASS-II · NASA Physical Sciences Informatics" : synthetic ? "Synthetic demo data" : "Microgravity experiments"}</p>
      </div>
      {comparison && comparison.points.length > 0 && <ChartViewControls label="Overview comparison view"
        view={view} onChange={setView} canShowLines={lines.length > 0} canShowBars={bars.length > 0} />}
    </header>
    {result && "error" in result && <StateMessage kind="error" title="Could not load the comparison"
      action={<button className="btn" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry chart</button>}><p>{result.error}</p></StateMessage>}
    {comparison && comparison.points.length > 0 ? <>
      {view === "bars" ? <BarChart title="Median by descriptive group" unit={comparison.unit} rows={bars} /> : view !== "table" ? <ScatterChart comparison={comparison} groupIndex={chartSeries} selectedObservation={selectedId}
        selectedTrial={selected?.trial_id ?? null} onSelect={setSelectedId} lines={view === "lines" && lines.length ? lines : undefined} />
        : <PointsTable comparison={comparison} groupIndex={groups} selectedObservation={selectedId}
          selectedTrial={selected?.trial_id ?? null} onSelect={setSelectedId} />}
      <div className="corpus-chart-caption">
        <span>{comparison.points.length} observations{isBass && " · Descriptive comparison of the 5 and 6 cm/s cases"}</span>
        {!selected && view !== "bars" && <span>Select an observation to inspect its source.</span>}
      </div>
      {selected && <div className="corpus-chart-selection">
        <span><strong>{fmt(selected.y)} {comparison.unit}</strong>{selected.x != null && ` at ${fmt(selected.x)} ${comparison.x_unit ?? ""}`}</span>
        {selected.evidence_ids[0] && <button type="button" className="btn ghost"
          onClick={() => onSource(selected.evidence_ids[0]!, selected.trial_id)}>Read observation source</button>}
      </div>}
    </> : !result ? <StateMessage kind={datasetId && !trialIds.length ? "empty" : "loading"}
      title={datasetId && !trialIds.length ? "No preview available yet. Use the research filters to select measurements." : "Loading comparison…"} />
      : comparison && <StateMessage kind="empty" title="No measurements returned for this comparison" />}
  </section>;
}
