// P6 curated source walkthrough. Measurements/reports are always returned by the API.
import { useEffect, useId, useRef, useState } from "react";
import casesText from "../../../../../data/catalog/p2-demo-cases-v1.1.0.json?raw";
import copyText from "../../../../../data/catalog/p2-demo-copy-v1.1.1.json?raw";
import { ApiError } from "../../lib/client";
import type { Models, ResearchResponse } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { PROVENANCE_LABEL, shortId } from "../../lib/format";
import { tx } from "../../lib/backendText";
import ScatterChart from "../evidence/ScatterChart";
import type { MissionSlotProps } from "./slot";
import { createRequestGuard, describeRequest } from "./comparisonState";
import { describeSegments, diffScenarioRankings } from "./scenarios";
import { assessBassComparison, assessBassRun, bassScenarioRequest, BASS_STUDY, hasBassCohort, parseBassCases, parseBassCopy,
  type BassAssessment, type BassCaseId } from "./bassCases";

type Props = Pick<MissionSlotProps, "api" | "research" | "researchState" | "onOpenRun" | "onOpenEvidence" | "beginResearchIntent">;
type Operation = BassCaseId | "compare";
type Outcome =
  | { kind: "case"; id: BassCaseId; run: ResearchResponse; assessment: BassAssessment }
  | { kind: "comparison"; a: ResearchResponse; b: ResearchResponse; response: Models["ScenarioComparisonResponse"]; assessment: BassAssessment };
const TITLES: Record<BassCaseId, string> = { bass_6: "6 cm/s", bass_5: "5 cm/s", lunar: "lunar" };

function loadConfig() {
  try {
    const caseJson: unknown = JSON.parse(casesText);
    const copyJson: unknown = JSON.parse(copyText);
    return { ok: true as const, cases: parseBassCases(caseJson), copy: parseBassCopy(copyJson) };
  } catch {
    return { ok: false as const, message: "The versioned BASS-II case definitions could not be loaded. The generic Mission Lab remains available." };
  }
}

function failure(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status} · ${error.code}${error.requestId ? ` · request ${error.requestId}` : ""})`;
  return "The BASS-II request could not be completed. Check the API connection and try again.";
}

function RunDetails({ run, active, onOpen, onEvidence }: {
  run: ResearchResponse; active: boolean; onOpen(): void; onEvidence(id: string): void;
}) {
  const points = run.comparison?.points ?? [];
  const xLabel = run.comparison?.x_condition ? conditionLabel(run.comparison.x_condition) : "Condition";
  const yLabel = run.comparison ? metricLabel(run.comparison.metric) : "Measurement";
  const m8Sources = run.evidence.filter((source) => source.id.startsWith(`${BASS_STUDY}:M8:stage:`) && source.id.endsWith(":table51"));
  return <div className="ml-bass-run" data-research-id={run.id}>
    <p><strong>{run.status === "completed" ? "Completed" : "Insufficient evidence"}</strong> · {run.ranking.items.length} selected trials · {points.length} observations.</p>
    {!active && <button type="button" onClick={onOpen}>Open this BASS-II research</button>}
    <p>{tx(run.summary)}</p>
    {run.plan && <details><summary>Saved filters and metric</summary>
      <p>{metricLabel(run.plan.metric)} · Horizontal axis {run.plan.x_condition ? conditionLabel(run.plan.x_condition) : "not assigned"}</p>
      <ul className="ml-filters">{describeRequest(run.plan.ranking).map((line) => <li key={line}>{line}</li>)}</ul>
    </details>}
    {points.length > 0 && <table className="ml-table ml-bass-points">
      <caption>Observations returned by the API. Original values/units are retained when available, together with segment and sample identity; rows are not additional independent replicates.</caption>
      <thead><tr><th>Trial / segment</th><th>Sample</th><th>{xLabel}</th><th>{yLabel}</th><th>Source</th></tr></thead>
      <tbody>{points.map((point) => <tr key={point.observation_id}>
        <th scope="row" data-label="Trial / segment" title={point.observation_id}>{point.trial_id.split(":").at(-1)}<br/>
          {point.segment_id ? `Segment ${point.segment_id.split(":").at(-1)}` : "No segment"}</th>
        <td data-label="Sample" title={point.independent_unit_id}>{point.independent_unit_status === "identified" ? point.independent_unit_id.split(":").at(-1) : "Unresolved"}</td>
        <td data-label={xLabel}>{point.x ?? "Unavailable"} {run.comparison?.x_unit ?? ""}</td>
        <td data-label={yLabel}>{point.original_value ?? point.y} {point.original_unit ?? run.comparison?.unit}<br/><span className="ml-tag">{PROVENANCE_LABEL[point.provenance]}</span></td>
        <td data-label="Source">{point.evidence_ids.map((id, index) => <button className="reference" type="button" key={id} disabled={!active} title={id}
          onClick={() => onEvidence(id)} aria-label={`Open evidence ${id} (saved BASS-II research)`}>{point.evidence_ids.length === 1 ? "Open source" : `Source ${index + 1}`}</button>)}</td>
      </tr>)}</tbody>
    </table>}
    {points.length > 0 && !active && <p className="ml-muted">Open this saved research before opening its evidence; citations are read from that research snapshot.</p>}
    {m8Sources.map((source) => <details className="ml-bass-m8" key={source.id}>
      <summary>M8 · source text from saved evidence ({source.id})</summary>
      <p>{source.locator}</p><pre>{source.text}</pre>
    </details>)}
    {!!run.warnings.length && <details><summary>API warnings ({run.warnings.length})</summary><ul>{run.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
  </div>;
}

export function BassCasesPanel({ api, research, researchState, onOpenRun, onOpenEvidence, beginResearchIntent }: Props) {
  const uid = useId();
  const [config] = useState(loadConfig);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, setPending] = useState<Operation | null>(null);
  const [lastOperation, setLastOperation] = useState<Operation>("bass_6");
  const [error, setError] = useState("");
  const guard = useRef(createRequestGuard());
  const intent = useRef<(() => boolean) | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => { guard.current.cancel(); intent.current = null; }, [api]);
  useEffect(() => {
    if (!beginResearchIntent || (intent.current && !intent.current())) {
      guard.current.cancel(); intent.current = null; setPending(null);
    }
  }, [research?.id, researchState, beginResearchIntent]);
  useEffect(() => { if (outcome) heading.current?.focus(); }, [outcome]);

  async function execute(operation: Operation) {
    if (!config.ok) return;
    const token = guard.current.begin();
    const currentIntent = beginResearchIntent?.() ?? (() => true);
    intent.current = currentIntent;
    setLastOperation(operation); setPending(operation); setError("");
    const current = () => guard.current.isCurrent(token) && currentIntent();
    try {
      if (operation === "compare") {
        const [a, b, response, trials] = await Promise.all([
          api.research(structuredClone(config.cases.bass_6)), api.research(structuredClone(config.cases.bass_5)),
          api.scenarios(bassScenarioRequest(config.cases)), api.trials(BASS_STUDY)
        ]);
        if (!current()) return;
        const assessment = assessBassComparison(a, b, response, config.cases, hasBassCohort(trials), config.copy);
        intent.current = null; setPending(null);
        setOutcome({ kind: "comparison", a, b, response, assessment });
        onOpenRun(b);
      } else {
        const request = structuredClone(config.cases[operation]);
        const [run, trials] = await Promise.all([api.research(request), api.trials(BASS_STUDY)]);
        if (!current()) return;
        const assessment = assessBassRun(operation, run, request, hasBassCohort(trials), config.copy);
        intent.current = null; setPending(null);
        setOutcome({ kind: "case", id: operation, run, assessment });
        onOpenRun(run);
      }
    } catch (reason) {
      if (current()) setError(failure(reason));
    } finally {
      if (guard.current.isCurrent(token)) { intent.current = null; setPending(null); }
    }
  }

  const openEvidence = (run: ResearchResponse, id: string) => {
    if (research?.id !== run.id) return;
    const trial = run.comparison?.points.find((point) => point.evidence_ids.includes(id))?.trial_id ?? null;
    onOpenEvidence(id, trial, "record");
  };
  const diff = outcome?.kind === "comparison" ? diffScenarioRankings(outcome.response) : null;
  const paired = outcome?.kind === "comparison" && outcome.assessment.confirmed && outcome.a.comparison && outcome.b.comparison
    ? { ...outcome.a.comparison, points: [...outcome.a.comparison.points, ...outcome.b.comparison.points] } : null;

  return <section className="ml-block ml-bass" aria-labelledby={`${uid}-bass-title`}>
    <h3 id={`${uid}-bass-title`}>BASS-II · approved source cases</h3>
    <p><strong>Fixed metric: flame spread rate (mm/s).</strong> These fixed presets are independent of the general form, including its selected metric.</p>
    <p>These fixed source presets use P2 demo 1.1.1 and P3's limited descriptive review. They select only BASS-II segments, exclude synthetic data and request no hypotheses. They do not change the general form above.</p>
    <p className="ml-muted">The active API must contain the imported P2 package. On a fixture-only or different corpus, the observed response is shown without substituting source data or claiming the approved result. The corpus remains scientifically unverified as a whole.</p>
    {!config.ok ? <p role="alert">{config.message}</p> : <>
      <div className="actions ml-bass-actions">
        {(["bass_6", "bass_5", "lunar"] as const).map((id) => <button type="button" key={id} disabled={pending !== null}
          onClick={() => void execute(id)}>Run BASS-II · {TITLES[id]}</button>)}
        <button type="button" disabled={pending !== null} onClick={() => void execute("compare")}>Compare BASS-II · 6 → 5 cm/s</button>
      </div>
      <details><summary>Preset filters</summary>
        {(["bass_6", "bass_5", "lunar"] as const).map((id) => {
          const ranking = config.cases[id].ranking;
          return ranking && <div key={id}>
            <h4>{TITLES[id]}</h4><ul className="ml-filters">{describeRequest(ranking).map((line) => <li key={line}>{line}</li>)}</ul>
          </div>;
        })}
      </details>
      {pending && <p role="status" aria-busy="true">Loading BASS-II {pending === "compare" ? "A/B source cases" : TITLES[pending]} from the API…</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => void execute(lastOperation)} disabled={pending !== null}>Retry BASS-II request</button></div>}
      {outcome && <div className="ml-result" data-bass-case={outcome.kind === "case" ? outcome.id : undefined}
        data-research-id={outcome.kind === "case" ? outcome.run.id : undefined} data-bass-comparison={outcome.kind === "comparison" ? "true" : undefined}
        data-approved-match={outcome.assessment.confirmed ? "true" : "false"}>
        <h4 ref={heading} tabIndex={-1}>{outcome.kind === "case" ? `BASS-II result · ${TITLES[outcome.id]}` : "BASS-II A/B result · 6 → 5 cm/s"}</h4>
        <p className="ml-muted"><strong>Fixed metric: flame spread rate (mm/s).</strong> Requested by this preset, independently of the general form.</p>
        <p className={outcome.assessment.confirmed ? "ml-muted" : "ml-warn"}>{outcome.assessment.confirmed
          ? "Returned identities, values and citations match the limited approved source case. This is not validation of the full corpus or a causal model."
          : "This response does not reproduce the approved source case. Only the actual API result is shown; the prepared interpretation is not applied."}</p>
        {outcome.assessment.notes.length > 0 && <ul>{outcome.assessment.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
        {outcome.kind === "case" ? <>
          {outcome.id === "lunar" && outcome.assessment.confirmed && <blockquote data-approved-copy="lunar">{config.copy.lunar_insufficient}</blockquote>}
          <RunDetails run={outcome.run} active={research?.id === outcome.run.id} onOpen={() => onOpenRun(outcome.run)} onEvidence={(id) => openEvidence(outcome.run, id)} />
        </> : <>
          {outcome.assessment.confirmed && <blockquote data-approved-copy="comparison">{config.copy.bass_comparison}</blockquote>}
          {paired && <section className="ml-bass-measurements" aria-label="BASS-II flame spread measurements">
            <h5>Flame spread at 5 and 6 cm/s</h5>
            <p>{paired.points.length} observations from {new Set(paired.points.map((point) => point.independent_unit_id)).size} identified samples. Each point opens the source for that observation.</p>
            <ScatterChart comparison={paired} groupIndex={new Map()} selectedObservation={null} selectedTrial={null}
              onSelect={(id) => {
                const point = paired.points.find((entry) => entry.observation_id === id);
                if (!point?.evidence_ids[0]) return;
                const run = outcome.a.comparison?.points.some((entry) => entry.observation_id === id) ? outcome.a : outcome.b;
                onOpenRun(run);
                onOpenEvidence(point.evidence_ids[0], point.trial_id, "record");
              }} />
          </section>}
          {diff && <details><summary>Trials that changed between A and B</summary>
            <ul className="ml-list">{[...diff.kept, ...diff.entered, ...diff.left].map((change) => <li key={change.trial_id}>
              <span title={change.trial_id}>{shortId(change.trial_id).split(":").at(-1)}</span> · {{ kept: "Selected in both", entered: "Added in B", left: "Absent in B" }[change.status]}<br/>A: {describeSegments(change.a)}<br/>B: {describeSegments(change.b)}
            </li>)}</ul>
          </details>}
          <div className="actions"><button type="button" onClick={() => onOpenRun(outcome.a)}>Open BASS-II research A</button><button type="button" onClick={() => onOpenRun(outcome.b)}>Open BASS-II research B</button></div>
          <h5>A · 6 cm/s</h5><RunDetails run={outcome.a} active={research?.id === outcome.a.id} onOpen={() => onOpenRun(outcome.a)} onEvidence={(id) => openEvidence(outcome.a, id)} />
          <h5>B · 5 cm/s</h5><RunDetails run={outcome.b} active={research?.id === outcome.b.id} onOpen={() => onOpenRun(outcome.b)} onEvidence={(id) => openEvidence(outcome.b, id)} />
        </>}
        <p className="ml-muted">Use Report and recovery for the active research's original report and saved evidence. The generic form remains independent of these fixed presets.</p>
      </div>}
    </>}
  </section>;
}
