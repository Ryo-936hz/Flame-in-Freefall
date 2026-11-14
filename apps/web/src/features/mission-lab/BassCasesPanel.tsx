// P6 curated source walkthrough. Measurements/reports are always returned by the API.
import { useEffect, useId, useRef, useState } from "react";
import casesText from "../../../../../data/catalog/p2-demo-cases-v1.1.0.json?raw";
import copyText from "../../../../../data/catalog/p2-demo-copy-v1.1.1.json?raw";
import { ApiError } from "../../lib/client";
import type { Models, ResearchResponse } from "../../lib/client";
import type { MissionSlotProps } from "./slot";
import { createRequestGuard, describeRequest } from "./comparisonState";
import { describeSegments, diffScenarioRankings } from "./scenarios";
import { assessBassComparison, assessBassRun, bassScenarioRequest, BASS_STUDY, hasBassCohort, parseBassCases, parseBassCopy,
  type BassAssessment, type BassCaseId } from "./bassCases";

type Props = Pick<MissionSlotProps, "api" | "research" | "researchState" | "onOpenRun" | "onOpenEvidence" | "beginResearchIntent"> & {
  onBrowseScenarios?(): void;
};
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
  const m8Sources = run.evidence.filter((source) => source.id.startsWith(`${BASS_STUDY}:M8:stage:`) && source.id.endsWith(":table51"));
  return <div className="ml-bass-run" data-research-id={run.id}>
    <p>Observed API status: <strong>{run.status}</strong> · {run.ranking.items.length} selected trials · {points.length} observations.</p>
    <p><code>{run.id}</code> · {active ? "Active research in the workspace" : "Saved result; another research is active"}.</p>
    {!active && <button type="button" onClick={onOpen}>Open this BASS-II research</button>}
    <p>{run.summary}</p>
    {run.plan && <details><summary>Saved filters and metric</summary>
      <p>Metric: <code>{run.plan.metric}</code> · X <code>{run.plan.x_condition ?? "not assigned"}</code></p>
      <ul className="ml-filters">{describeRequest(run.plan.ranking).map((line) => <li key={line}>{line}</li>)}</ul>
    </details>}
    {points.length > 0 && <table className="ml-table ml-bass-points">
      <caption>Observations returned by the API. Original values/units are retained when available, together with segment and sample identity; rows are not additional independent replicates.</caption>
      <thead><tr><th>Trial / segment / observation</th><th>Sample</th><th>X: {run.comparison?.x_condition ?? "unassigned"}</th><th>Y: {run.comparison?.metric ?? "unassigned"}</th><th>Source</th></tr></thead>
      <tbody>{points.map((point) => <tr key={point.observation_id}>
        <th scope="row" data-label="Trial / segment"><code>{point.trial_id}</code><br/><code>{point.segment_id ?? "not assigned"}</code><br/><code>{point.observation_id}</code></th>
        <td data-label="Sample"><code>{point.independent_unit_id}</code><br/>{point.independent_unit_status}</td>
        <td data-label={`X: ${run.comparison?.x_condition ?? "unassigned"}`}>{point.x ?? "unavailable"} {run.comparison?.x_unit ?? ""}</td>
        <td data-label={`Y: ${run.comparison?.metric ?? "unassigned"}`}>{point.original_value ?? point.y} {point.original_unit ?? run.comparison?.unit}<br/><span className="ml-tag">{point.provenance}</span></td>
        <td data-label="Source">{point.evidence_ids.map((id) => <button className="reference" type="button" key={id} disabled={!active}
          onClick={() => onEvidence(id)} aria-label={`Open evidence ${id} (saved BASS-II research)`}>{id}</button>)}</td>
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

export function BassCasesPanel({ api, research, researchState, onOpenRun, onOpenEvidence, beginResearchIntent, onBrowseScenarios }: Props) {
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

  return <section className="ml-block ml-bass" aria-labelledby={`${uid}-bass-title`}>
    <h3 id={`${uid}-bass-title`}>BASS-II · approved source cases</h3>
    <p><strong>Fixed metric: flame spread rate (mm/s).</strong> Independent of the general form.</p>
    <p className="ml-bass-requirement">Requires the imported P2 demo 1.1.1 package. The review is limited and descriptive; the full corpus remains scientifically unverified.</p>
    <details className="ml-method"><summary>Source scope and corpus requirements</summary>
      <p>Presets select only BASS-II segments, exclude synthetic data and request no hypotheses. They preserve the general form.</p>
      <p>On a fixture-only or different corpus, only the actual API response is shown. Source data and approved interpretations are never substituted.</p>
    </details>
    {onBrowseScenarios && <button className="ml-text-action" type="button" onClick={onBrowseScenarios}>Use A/B scenarios with the current corpus</button>}
    {!config.ok ? <p role="alert">{config.message}</p> : <>
      <div className="actions ml-bass-actions">
        {(["bass_6", "bass_5", "lunar"] as const).map((id) => <button type="button" key={id} disabled={pending !== null}
          onClick={() => void execute(id)}>Run BASS-II · {TITLES[id]}</button>)}
        <button type="button" disabled={pending !== null} onClick={() => void execute("compare")}>Compare BASS-II · 6 → 5 cm/s</button>
      </div>
      <details><summary>Exact preset inputs</summary><pre>{JSON.stringify(config.cases, null, 2)}</pre></details>
      {pending && <p role="status" aria-busy="true">Loading BASS-II {pending === "compare" ? "A/B source cases" : TITLES[pending]} from the API…</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => void execute(lastOperation)} disabled={pending !== null}>Retry BASS-II request</button></div>}
      {outcome && <div className="ml-result" data-bass-case={outcome.kind === "case" ? outcome.id : undefined}
        data-research-id={outcome.kind === "case" ? outcome.run.id : undefined} data-bass-comparison={outcome.kind === "comparison" ? "true" : undefined}
        data-approved-match={outcome.assessment.confirmed ? "true" : "false"}>
        <h4 ref={heading} tabIndex={-1}>{outcome.kind === "case" ? `BASS-II result · ${TITLES[outcome.id]}` : "BASS-II A/B result · 6 → 5 cm/s"}</h4>
        <p className="ml-muted">Requested metric: <strong>flame spread rate (mm/s)</strong> · fixed preset.</p>
        <p className={outcome.assessment.confirmed ? "ml-muted" : "ml-warn"}>{outcome.assessment.confirmed
          ? "Returned identities, values and citations match the limited approved source case. This is not validation of the full corpus or a causal model."
          : "This response does not reproduce the approved source case. Only the actual API result is shown; the prepared interpretation is not applied."}</p>
        {outcome.assessment.notes.length > 0 && <ul>{outcome.assessment.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
        {outcome.kind === "case" ? <>
          {outcome.id === "lunar" && outcome.assessment.confirmed && <blockquote data-approved-copy="lunar">{config.copy.lunar_insufficient}</blockquote>}
          <RunDetails run={outcome.run} active={research?.id === outcome.run.id} onOpen={() => onOpenRun(outcome.run)} onEvidence={(id) => openEvidence(outcome.run, id)} />
        </> : <>
          {outcome.assessment.confirmed && <blockquote data-approved-copy="comparison">{config.copy.bass_comparison}</blockquote>}
          <p className="ml-label">Evidence selection comparison · not combustion or risk.</p>
          {diff && <><ul className="ml-summary">{diff.summary.map((line, index) => <li key={index}>{line}</li>)}</ul>
            <details className="ml-method"><summary>Trial and segment changes</summary><ul className="ml-list">{[...diff.kept, ...diff.entered, ...diff.left].map((change) => <li key={change.trial_id}>
              <code>{change.trial_id}</code> · {change.status}<br/>A: {describeSegments(change.a)}<br/>B: {describeSegments(change.b)}
            </li>)}</ul></details></>}
          <div className="actions"><button type="button" onClick={() => onOpenRun(outcome.a)}>Open BASS-II research A</button><button type="button" onClick={() => onOpenRun(outcome.b)}>Open BASS-II research B</button></div>
          <h5>A · 6 cm/s</h5><RunDetails run={outcome.a} active={research?.id === outcome.a.id} onOpen={() => onOpenRun(outcome.a)} onEvidence={(id) => openEvidence(outcome.a, id)} />
          <h5>B · 5 cm/s</h5><RunDetails run={outcome.b} active={research?.id === outcome.b.id} onOpen={() => onOpenRun(outcome.b)} onEvidence={(id) => openEvidence(outcome.b, id)} />
        </>}
      </div>}
    </>}
  </section>;
}
