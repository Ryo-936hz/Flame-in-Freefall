import { useEffect, useState } from "react";
import type { Api, Models } from "../../lib/client";
import { metricLabel } from "../../lib/filters";
import { Panel, StateMessage } from "../../components/ui";
import { BarChart } from "./BarChart";

export function StudyComparison({ api, ids, onStudy }: { api: Api; ids: string[]; onStudy: (id: string) => void }) {
  const [choices, setChoices] = useState<Models["Study"][]>([]);
  const [selection, setSelection] = useState([ids[0] ?? "", ids[1] ?? ""]);
  const [data, setData] = useState<Models["StudyChartData"][] | null>(null);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [metric, setMetric] = useState("");
  const [first, second] = selection;

  useEffect(() => {
    let active = true;
    setCatalogError(false);
    api.studies().then((studies) => { if (active) setChoices(studies); }, () => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, [api, attempt]);

  useEffect(() => {
    setData(null);
    setError("");
    setMetric("");
    if (!first || !second || first === second) return;
    let active = true;
    Promise.all([api.studyChart(first), api.studyChart(second)]).then(
      (value) => { if (active) setData(value); }, () => { if (active) setError("Could not load the study measurements."); },
    );
    return () => { active = false; };
  }, [api, first, second, attempt]);

  const shared = data?.[0]?.metrics.filter((a) => data[1]?.metrics.some((b) => a.metric === b.metric && a.unit === b.unit)) ?? [];
  const selected = shared.find((item) => item.metric === metric) ?? shared[0];
  const rows = selected && data ? data.flatMap(({ study, metrics }) => {
    const item = metrics.find(({ metric: key, unit }) => key === selected.metric && unit === selected.unit);
    return item ? [{ label: study.title, value: item.median, detail: `${item.known_observations} recorded observations${study.dataset_status === "synthetic" ? " · Synthetic" : ""}` }] : [];
  }) : [];

  return <Panel title="Compare two studies">
    <div className="panel-b study-comparison">
      <div className="study-comparison-selects">
        {selection.map((id, index) => <label key={index}>Study {index === 0 ? "A" : "B"}
          <select className="select" value={id} onChange={(event) => {
            const next = event.target.value;
            setSelection((previous) => previous.map((value, i) => i === index ? next : value));
          }}>
            <option value="">Select a study</option>
            {id && !choices.some((study) => study.id === id) && <option value={id}>{id}</option>}
            {choices.map((study) => <option key={study.id} value={study.id}>{study.title}</option>)}
          </select>
        </label>)}
      </div>
      {catalogError && !error && <StateMessage kind="error" title="Could not load the study catalog" action={<button type="button" className="btn" onClick={() => setAttempt((value) => value + 1)}>Retry</button>} />}
      {error && <StateMessage kind="error" title={error} action={<button type="button" className="btn" onClick={() => setAttempt((value) => value + 1)}>Retry</button>} />}
      {first && second && first === second && <p>Choose two different studies.</p>}
      {first && second && first !== second && !data && !error && <p role="status">Loading measurements…</p>}
      {data && <>
        {selected ? <>
          <label>Shared measurement <select className="select" value={selected.metric} onChange={(event) => setMetric(event.target.value)}>
            {shared.map((item) => <option key={item.metric} value={item.metric}>{metricLabel(item.metric)} ({item.unit})</option>)}
          </select></label>
          <BarChart title={`Median ${metricLabel(selected.metric).toLowerCase()}`} unit={selected.unit} rows={rows} />
          <p className="hint">Descriptive comparison. Differences in materials, conditions and methods affect how these medians can be interpreted.</p>
        </> : <>
          <p>No shared measurement with the same definition and unit is available. The bars show how many records have a value for each metric.</p>
          <div className="study-comparison-selects">{data.map(({ study, metrics }) => <div key={study.id}>
            <h3>{study.title}{study.dataset_status === "synthetic" && " · Synthetic"}</h3>
            {metrics.length ? <BarChart title="Known observations by metric" unit="" rows={metrics.map((item) => ({ label: metricLabel(item.metric), value: item.known_observations }))} />
              : <p>No known measurements in the imported corpus.</p>}
          </div>)}</div>
        </>}
        <div className="actions">{data.map(({ study }) => <button type="button" className="btn" key={study.id} onClick={() => onStudy(study.id)}>{study.id.replace(/^psi:/, "")} · Study and sources</button>)}</div>
      </>}
    </div>
  </Panel>;
}
