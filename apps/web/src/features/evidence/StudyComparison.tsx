import { useEffect, useState } from "react";
import type { Api, Models } from "../../lib/client";
import { metricLabel } from "../../lib/filters";
import { fmt } from "../../lib/format";
import Select from "../../components/Select";
import { Panel, StateMessage } from "../../components/ui";

type Summary = Models["StudyChartData"];
type Measurements = { state: "loading" | "error" } | { state: "ready"; studies: [Summary, Summary] };

const metricKey = ({ metric, unit }: Summary["metrics"][number]) => JSON.stringify([metric, unit]);

function MeasurementBars({ rows, label, unit, scale }: {
  rows: { label: string; value: number }[];
  label: string;
  unit?: string;
  scale?: number;
}) {
  const maximum = scale ?? (Math.max(...rows.map(({ value }) => value)) || 1);
  return <ul className="groups" aria-label={label}>
    {rows.map(({ label, value }) => <li key={label}>
      <span>{label}</span>
      <span className="num">{fmt(value)}{unit ? ` ${unit}` : ""}</span>
      <svg className="comparison-meter" viewBox="0 0 120 10" aria-hidden="true">
        <rect width={120} height={10} rx={2} fill="var(--rule)" />
        <rect width={value / maximum * 120} height={10} rx={2} fill="var(--signal)" />
      </svg>
    </li>)}
  </ul>;
}

export function StudyComparison({ api, ids, onStudy }: {
  api: Api;
  ids: [string, string];
  onStudy: (id: string) => void;
}) {
  const [first, second] = ids;
  const [result, setResult] = useState<Measurements>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [metric, setMetric] = useState("");

  useEffect(() => {
    let current = true;
    setResult({ state: "loading" });
    Promise.all([api.studyChart(first), api.studyChart(second)]).then(
      (studies) => { if (current) setResult({ state: "ready", studies }); },
      () => { if (current) setResult({ state: "error" }); },
    );
    return () => { current = false; };
  }, [api, first, second, attempt]);

  const studies = result.state === "ready" ? result.studies : null;
  const shared = studies?.[0].metrics.filter((a) => studies[1].metrics.some((b) => metricKey(a) === metricKey(b))) ?? [];
  const selected = shared.find((item) => metricKey(item) === metric) ?? shared[0];
  const countScale = Math.max(1, ...(studies?.flatMap(({ metrics }) => metrics.map((item) => item.known_observations)) ?? []));
  const sharedRows = selected && studies ? studies.flatMap(({ study, metrics }) => {
    const item = metrics.find((entry) => metricKey(entry) === metricKey(selected));
    return item ? [{ label: `${study.title} (${item.known_observations} observations)`, value: item.median }] : [];
  }) : [];

  return <Panel id="study-comparison" title="Study comparison">
    <div className="panel-b">
      {result.state === "loading" && <StateMessage kind="loading" title="Loading study measurements…" />}
      {result.state === "error" && <StateMessage kind="error" title="Could not load the study measurements"
        action={<button type="button" className="btn" onClick={() => setAttempt((value) => value + 1)}>Retry</button>} />}
      {studies && <>
        {selected ? <>
          <Select ariaLabel="Shared study measurement" value={metricKey(selected)} onChange={setMetric}
            options={shared.map((item) => ({ value: metricKey(item), label: `${metricLabel(item.metric)} (${item.unit})` }))} />
          <MeasurementBars label="Median by study" rows={sharedRows} unit={selected.unit} />
          <p className="hint">Descriptive medians. Materials, conditions and methods can differ between studies.</p>
        </> : <>
          <p>These studies have no matching measurement and unit. The bars show the availability of recorded measurements.</p>
          {studies.map(({ study, metrics }) => <div className="block" key={study.id}>
            <h3>{study.title}{study.dataset_status === "synthetic" && " · Synthetic"}</h3>
            {metrics.length ? <MeasurementBars label="Known observations" scale={countScale} rows={metrics.map((item) => ({
              label: `${metricLabel(item.metric)} (${item.unit})`, value: item.known_observations,
            }))} /> : <p>No known measurements in the imported corpus.</p>}
          </div>)}
        </>}
        <div className="actions">
          {studies.map(({ study }) => <button type="button" className="btn" key={study.id}
            onClick={() => onStudy(study.id)}>{study.id.replace(/^psi:/, "")} · Study and sources</button>)}
        </div>
      </>}
    </div>
  </Panel>;
}
