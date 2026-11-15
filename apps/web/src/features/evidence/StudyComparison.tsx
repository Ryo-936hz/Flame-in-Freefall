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
  return <ul className="study-bars" aria-label={label}>
    {rows.map(({ label, value }) => <li key={label}>
      <span>{label}</span>
      <span className="num">{fmt(value)}{unit ? ` ${unit}` : ""}</span>
      <span className="study-bar-track" aria-hidden="true"><span style={{ width: `${value / maximum * 100}%` }} /></span>
    </li>)}
  </ul>;
}

export function StudyComparison({ api, ids, choices, onCompare, onStudy }: {
  api: Api;
  ids?: [string, string];
  choices: Models["Study"][];
  onCompare: (ids: string[]) => void;
  onStudy: (id: string) => void;
}) {
  const [first, second] = ids ?? [];
  const [studyA, setStudyA] = useState(first ?? "");
  const [studyB, setStudyB] = useState(second ?? "");
  const [result, setResult] = useState<Measurements>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [metric, setMetric] = useState("");

  useEffect(() => {
    if (!first || !second) return;
    let current = true;
    setResult({ state: "loading" });
    Promise.all([api.studyChart(first), api.studyChart(second)]).then(
      (studies) => { if (current) setResult({ state: "ready", studies }); },
      () => { if (current) setResult({ state: "error" }); },
    );
    return () => { current = false; };
  }, [api, first, second, attempt]);

  const studies = result.state === "ready" ? result.studies : null;
  const mixedProvenance = studies && (studies[0].study.dataset_status === "synthetic") !== (studies[1].study.dataset_status === "synthetic");
  const shared = mixedProvenance ? [] : studies?.[0].metrics.filter((a) => studies[1].metrics.some((b) => metricKey(a) === metricKey(b))) ?? [];
  const selected = shared.find((item) => metricKey(item) === metric) ?? shared[0];
  const countScale = Math.max(1, ...(studies?.flatMap(({ metrics }) => metrics.map((item) => item.known_observations)) ?? []));
  const sharedRows = selected && studies ? studies.flatMap(({ study, metrics }) => {
    const item = metrics.find((entry) => metricKey(entry) === metricKey(selected));
    return item ? [{ label: `${study.title} (${item.known_observations} observations)`, value: item.median }] : [];
  }) : [];

  return <Panel id="study-comparison" title="Study comparison">
    <div className="panel-b study-compare">
      <details open={Boolean(ids) || undefined}>
        <summary>Choose two studies</summary>
        <form className="study-pair" onSubmit={(event) => { event.preventDefault(); onCompare([studyA, studyB]); }}>
          <label>Study A<Select ariaLabel="Study A" value={studyA} onChange={setStudyA}
            options={choices.map((study) => ({ value: study.id, label: study.title }))} placeholder="Select a study" /></label>
          <label>Study B<Select ariaLabel="Study B" value={studyB} onChange={setStudyB}
            options={choices.map((study) => ({ value: study.id, label: study.title }))} placeholder="Select a study" /></label>
          <button className="btn primary" type="submit" disabled={!studyA || !studyB || studyA === studyB}>Compare studies</button>
        </form>
      </details>
      {ids && result.state === "loading" && <StateMessage kind="loading" title="Loading study measurements…" />}
      {result.state === "error" && <StateMessage kind="error" title="Could not load the study measurements"
        action={<button type="button" className="btn" onClick={() => setAttempt((value) => value + 1)}>Retry</button>} />}
      {studies && <>
        {selected ? <>
          <Select ariaLabel="Shared study measurement" value={metricKey(selected)} onChange={setMetric}
            options={shared.map((item) => ({ value: metricKey(item), label: `${metricLabel(item.metric)} (${item.unit})` }))} />
          <h3>Median by study</h3>
          <MeasurementBars label="Median by study" rows={sharedRows} unit={selected.unit} />
          <p className="hint">The studies share this metric and unit. Differences in materials, conditions and methods limit what their medians can tell us.</p>
        </> : <>
          <h3>Measurement availability</h3>
          <p>{mixedProvenance ? "One study uses synthetic data. The bars count records available in each study." : "These studies report different measurements. The bars count available observations on a shared scale."}</p>
          <div className="study-availability">
            {studies.map(({ study, metrics }) => <div className="block" key={study.id}>
              <h4>{study.title}{study.dataset_status === "synthetic" && " · Synthetic"}</h4>
              {metrics.length ? <MeasurementBars label={`Known observations in ${study.title}`} scale={countScale} rows={metrics.map((item) => ({
              label: `${metricLabel(item.metric)} (${item.unit})`, value: item.known_observations,
            }))} /> : <p>No known measurements in the imported corpus.</p>}
            </div>)}
          </div>
        </>}
        <div className="actions">
          {studies.map(({ study }) => <button type="button" className="btn" key={study.id}
            onClick={() => onStudy(study.id)}>{study.id.replace(/^psi:/, "")} · Study and sources</button>)}
        </div>
      </>}
    </div>
  </Panel>;
}
