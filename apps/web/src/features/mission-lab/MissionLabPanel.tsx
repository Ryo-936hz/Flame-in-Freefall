// Mission Lab (P6) · escenarios A/B de evidencia, hipótesis y consulta sin evidencia suficiente.
// Presenta respuestas de la API; no calcula ranking ni simula física en el navegador.
// Montaje: props MissionSlotProps (slot.ts). Textos visibles en inglés.
import { useEffect, useId, useRef, useState } from "react";
import { BassCasesPanel } from "./BassCasesPanel";
import { ApiError } from "../../lib/client";
import type { RankingRequest, ResearchResponse } from "../../lib/client";
import { conditionLabel, metricLabel } from "../../lib/filters";
import { PROVENANCE_LABEL, pct, reasonText, shortId } from "../../lib/format";
import { tx } from "../../lib/backendText";
import { createRequestGuard, describeRequest } from "./comparisonState";
import { providerText, summarizeProvenance } from "./provenance";
import {
  buildScenarioRequest, describeSegments, describeScenarioChanges, diffScenarioRankings, hypothesisLabelText, scenarioPresets,
  type RankedTrial, type ScenarioComparison, type TrialChange
} from "./scenarios";
import { clockTime, previousNotice, resultStatus, scenarioAName, type ComputedContext, type ResultStatusReason } from "./resultStatus";
import type { MissionSlotProps } from "./slot";
import "./mission-lab.css";

export interface ScenarioTrigger {
  presetId: string;
  /** Cambia en cada petición para relanzar el mismo preset. */
  nonce: number;
}

export interface MissionLabPanelProps extends MissionSlotProps {
  /** Pregunta actual del host para la consulta sin evidencia suficiente (por defecto, la del expediente activo). */
  question?: string;
  /** Petición externa (p. ej. un botón del formulario del host) para comparar un preset. */
  trigger?: ScenarioTrigger | null;
  campaign?: { name: string; request: RankingRequest };
  trialLabels?: ReadonlyMap<string, string>;
}

interface ComparisonEntry extends ComputedContext {
  presetId: string;
  scenarioB: RankingRequest;
  response: ScenarioComparison;
}

interface QueryEntry extends ComputedContext {
  /** Filtros enviados realmente (base + cambio del preset). */
  sent: RankingRequest;
  question: string;
  response: ResearchResponse;
}

interface Pending extends ComputedContext {
  label: string;
}

const INSUFFICIENT_PRESET = "gravity_lunar";
const FALLBACK_QUESTION = "Which trials provide applicable evidence under these filters?";
const LABEL_TEXT: Record<string, string> = {
  evidence_comparison_not_physical_simulation: "Evidence comparison · not a physical simulation"
};
const STATUS_TEXT: Record<TrialChange["status"], string> = { kept: "Kept", entered: "Enters in B", left: "Leaves in B" };

function num(value: number | null | undefined): string {
  if (typeof value !== "number") return "undetermined";
  return String(Math.round(value * 1000) / 1000);
}

function signed(value: number | null): string {
  if (value === null) return "undetermined";
  const rounded = Math.round(value * 1000) / 1000;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function errorText(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status} · ${error.code}${error.requestId ? ` · request ${error.requestId}` : ""})`;
  return error instanceof Error ? error.message : "The operation could not be completed.";
}

function countReasons(items: RankedTrial[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const reason of new Set(item.reasons)) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function ProvenanceLine({ items, scope }: { items: RankedTrial[]; scope: string }) {
  const summary = summarizeProvenance(items.map((item) => item.provenance));
  return <p className={`ml-prov ml-prov-${summary.kind}`}>
    <span className="ml-tag">provenance · {summary.kind.replace("_", " ")}</span>{" "}
    <span className="ml-sr">{scope}: </span>{summary.text}
  </p>;
}

function EvidenceButtons({ ids, onOpen, context }: { ids: string[]; onOpen(id: string): void; context: string }) {
  if (!ids.length) return <span className="ml-muted">no linked evidence</span>;
  return <>{ids.map((id) => <button type="button" className="reference" key={id}
    aria-label={`Open evidence ${id} (${context})`} title={id} onClick={() => onOpen(id)}>{ids.length === 1 ? "Open source" : `Source ${ids.indexOf(id) + 1}`}</button>)}</>;
}

function FiltersList({ request }: { request: RankingRequest }) {
  return <ul className="ml-filters">{describeRequest(request).map((line) => <li key={line}>{line}</li>)}</ul>;
}

function ComputedAt({ at }: { at: Date }) {
  return <time dateTime={at.toISOString()}>{clockTime(at)}</time>;
}

/** Contexto de cálculo: aviso visible de resultado anterior, filtros usados y botón de recálculo. */
function ContextBlock({ entry, status, subject, filtersTitle, sentFilters, currentResearchId, canRecompute, onRecompute }: {
  entry: ComputedContext; status: ResultStatusReason; subject: "comparison" | "query"; filtersTitle: string;
  sentFilters?: RankingRequest; currentResearchId: string | null; canRecompute: boolean; onRecompute(): void;
}) {
  const notice = previousNotice(status, subject);
  const where = entry.researchId ? <> while research <code>{entry.researchId}</code> was active</> : <> with no active research</>;
  const filters = <>
    <p>Measurement · {metricLabel(entry.metric)}</p>
    <p className="ml-filters-title">{filtersTitle}</p>
    <FiltersList request={entry.request} />
    {sentFilters && <>
      <p className="ml-filters-title">Filters actually sent</p>
      <FiltersList request={sentFilters} />
    </>}
  </>;
  if (!notice) {
    return <div className="ml-context">
      <p className="ml-muted"><span className="ml-tag">current</span> Computed at <ComputedAt at={entry.at} />{where}, with the current filters and metric.</p>
      <details><summary>{filtersTitle}</summary>{filters}</details>
    </div>;
  }
  return <div className="ml-previous" role="note">
    <p className="ml-previous-title"><strong>{notice}</strong></p>
    <p>Computed at <ComputedAt at={entry.at} />{where}.
      {status === "filters_unknown" && " The current filters are not valid, so they cannot be matched to this result."}
      {status === "filters_changed" && " The filters in the form have changed since then."}
      {status === "metric_changed" && " The metric in the form has changed since then."}
      {status === "question_changed" && " The question in the form has changed since then."}
      {status === "variable_order_changed" && " The order of studied variables changed; research can choose a different X axis."}
      {status === "research_changed" && <> The active research is now {currentResearchId ? <code>{currentResearchId}</code> : "none"}.</>}
    </p>
    {filters}
    <div className="actions">
      <button type="button" disabled={!canRecompute} onClick={onRecompute}>Recompute with current filters</button>
    </div>
    {!canRecompute && <p className="ml-muted">Recompute needs valid current filters and no pending request.</p>}
  </div>;
}

function ScenarioColumn({ side, name, selected, excluded, noEvidence, metric }: {
  side: "A" | "B"; name: string; selected: RankedTrial[]; excluded: RankedTrial[]; noEvidence: boolean; metric: ScenarioComparison["metric"];
}) {
  const reasonCounts = countReasons(excluded);
  return <div className={`ml-column ml-column-${side.toLowerCase()}`}>
    <h5 className="ml-column-title">{name}</h5>
    <dl className="ml-counts">
      <div><dt>Selected</dt><dd>{selected.length}</dd></div>
      <div><dt>Excluded or undetermined</dt><dd>{excluded.length}</dd></div>
    </dl>
    <ProvenanceLine items={selected} scope={`Scenario ${side} provenance`} />
    {noEvidence && <div className="ml-insufficient" role="note">
      <p><strong>Insufficient applicable evidence.</strong> No trials met these filters{metric && <> with a recorded value for {metricLabel(metric).toLowerCase()}</>}.</p>
    </div>}
    {reasonCounts.length > 0 && <details>
      <summary>Why trials were excluded in {side}</summary>
      <ul className="ml-list">
        {reasonCounts.map(([reason, count]) => <li key={reason}>{reasonText(reason)} <strong className="num">{count.toLocaleString("en-GB")}</strong></li>)}
      </ul>
    </details>}
  </div>;
}

export function MissionLabPanel({ api, research, request, metric, researchState, onOpenRun, onOpenEvidence, beginResearchIntent, question, trigger, campaign, trialLabels }: MissionLabPanelProps) {
  const uid = useId();
  const researchId = research?.id ?? null;
  const [presetId, setPresetId] = useState<string>(scenarioPresets[0]?.id ?? "");
  const [baseline, setBaseline] = useState("current");
  const [comparison, setComparison] = useState<ComparisonEntry | null>(null);
  const [comparePending, setComparePending] = useState<Pending | null>(null);
  const [compareError, setCompareError] = useState("");
  const [query, setQuery] = useState<QueryEntry | null>(null);
  const [queryPending, setQueryPending] = useState<Pending | null>(null);
  const [queryError, setQueryError] = useState("");
  const compareGuard = useRef(createRequestGuard());
  const queryGuard = useRef(createRequestGuard());
  const comparisonHeading = useRef<HTMLHeadingElement>(null);
  const queryHeading = useRef<HTMLHeadingElement>(null);
  const focusComparison = useRef(false);
  const focusQuery = useRef(false);

  const preset = scenarioPresets.find((item) => item.id === presetId) ?? null;
  const baselineCampaign = baseline === "campaign" ? campaign : undefined;
  const baseRequest = baselineCampaign?.request ?? request;
  const queryQuestion = question !== undefined ? question.trim() : research?.question || FALLBACK_QUESTION;
  const queryQuestionValid = queryQuestion.length >= 3 && queryQuestion.length <= 4000;

  useEffect(() => () => { compareGuard.current.cancel(); queryGuard.current.cancel(); }, []);

  async function compare(id: string) {
    const base = baseRequest ? structuredClone(baseRequest) : null;
    const item = scenarioPresets.find((entry) => entry.id === id);
    if (!base) { setCompareError("The current filters are not valid. Fix them before comparing."); return; }
    if (!item) { setCompareError(`Unknown scenario: ${id}.`); return; }
    let body;
    try {
      // A se nombra al mostrarse según su vigencia; nunca se envía como "current filters".
      body = { ...buildScenarioRequest(base, id, metric), name_a: baselineCampaign ? `A · ${baselineCampaign.name} study` : "A · base filters" };
    } catch (error) { setCompareError(errorText(error)); return; }
    const context: ComputedContext = { request: base, metric, at: new Date(), researchId };
    const token = compareGuard.current.begin();
    setCompareError("");
    setComparePending({ ...context, label: `B · ${item.title}` });
    try {
      const response = await api.scenarios(body);
      if (!compareGuard.current.isCurrent(token)) return;
      focusComparison.current = true;
      setComparison({ ...context, presetId: id, scenarioB: body.scenario_b, response });
    } catch (error) {
      if (compareGuard.current.isCurrent(token)) setCompareError(errorText(error));
    } finally {
      if (compareGuard.current.isCurrent(token)) setComparePending(null);
    }
  }

  async function runInsufficient() {
    const base = request ? structuredClone(request) : null;
    if (!base) { setQueryError("The current filters are not valid. Fix them before running the query."); return; }
    let sent: RankingRequest;
    try { sent = buildScenarioRequest(base, INSUFFICIENT_PRESET, metric).scenario_b; }
    catch (error) { setQueryError(errorText(error)); return; }
    const context: ComputedContext = { request: base, metric, at: new Date(), researchId };
    const asked = queryQuestion;
    if (!queryQuestionValid) { setQueryError("Enter a question between 3 and 4000 characters before running the query."); return; }
    context.question = asked;
    const token = queryGuard.current.begin();
    setQueryError("");
    setQueryPending({ ...context, label: "lunar evidence query" });
    try {
      const response = await api.research({ question: asked, ranking: sent, metric, planning_mode: "explicit", include_hypotheses: true });
      if (!queryGuard.current.isCurrent(token)) return;
      focusQuery.current = true;
      setQuery({ ...context, sent, question: asked, response });
    } catch (error) {
      if (queryGuard.current.isCurrent(token)) setQueryError(errorText(error));
    } finally {
      if (queryGuard.current.isCurrent(token)) setQueryPending(null);
    }
  }

  useEffect(() => {
    if (!trigger) return;
    setPresetId(trigger.presetId);
    void compare(trigger.presetId);
    // Solo reacciona a una nueva petición externa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.nonce]);

  useEffect(() => {
    if (comparison && focusComparison.current) { focusComparison.current = false; comparisonHeading.current?.focus(); }
  }, [comparison]);
  useEffect(() => {
    if (query && focusQuery.current) { focusQuery.current = false; queryHeading.current?.focus(); }
  }, [query]);

  // Vigencia del A/B: filtros usados frente a los actuales y expediente activo al enviarlo.
  const compareStatus = comparison ? resultStatus(comparison, baseRequest, researchId, metric) : null;
  const shownResponse = comparison && compareStatus
    ? { ...comparison.response, name_a: baselineCampaign && compareStatus === "current" ? comparison.response.name_a : scenarioAName(compareStatus, comparison.at) } : null;
  const diff = shownResponse ? diffScenarioRankings(shownResponse) : null;
  const rows = diff ? [...diff.left, ...diff.entered, ...diff.kept] : [];
  const comparedPreset = comparison ? scenarioPresets.find((item) => item.id === comparison.presetId) ?? null : null;
  const scenarioChanges = comparison ? describeScenarioChanges(comparison.request, comparison.scenarioB) : [];
  const pendingStale = comparePending ? resultStatus(comparePending, baseRequest, researchId, metric) !== "current" : false;

  // La consulta abierta como expediente activo no se marca como "otro expediente".
  const queryResearchId = query && researchId === query.response.id ? query.researchId : researchId;
  const queryStatus = query ? resultStatus(query, request, queryResearchId, metric, queryQuestion) : null;
  const queryPendingStale = queryPending ? resultStatus(queryPending, request, researchId, metric, queryQuestion) !== "current" : false;

  let liveCompare = "";
  if (comparePending) liveCompare = `Comparing A vs ${comparePending.label}…`;
  else if (diff && compareStatus) liveCompare = `A/B comparison ready${compareStatus === "current" ? "" : ", marked as previous"}. ${diff.summary.join(" ")}`;

  return <section aria-labelledby={`${uid}-title`} className="mission-lab">
    <header className="ml-head">
      <h2 id={`${uid}-title`}>Mission Lab · evidence scenarios</h2>
      <p className="ml-muted">Compare which trials apply when a condition changes, then inspect the measurements and original sources.</p>
    </header>

    <div className="ml-block" role="group" aria-labelledby={`${uid}-scenario`}>
      <h3 id={`${uid}-scenario`}>Compare evidence across scenarios</h3>
      <div className="ml-setup">
        <label>Scenario A · Baseline
          <select className="select" value={baselineCampaign ? "campaign" : "current"} onChange={(event) => setBaseline(event.target.value)}>
            <option value="current">Current investigation filters</option>
            {campaign && <option value="campaign">{campaign.name} measurement preset</option>}
          </select>
        </label>
        <p><span>Measurement</span><strong>{metricLabel(metric)}</strong></p>
      </div>
      {!baseRequest && <p className="ml-warn" role="note">Complete the investigation filters or choose a study preset.</p>}
      <fieldset className="ml-presets">
        <legend>Scenario B · Change one condition</legend>
        {scenarioPresets.map((item) => <label key={item.id} className={item.id === presetId ? "ml-preset ml-preset-active" : "ml-preset"}>
          <input type="radio" name={`${uid}-preset`} value={item.id} checked={item.id === presetId} onChange={() => setPresetId(item.id)} />
          <span className="ml-preset-title">{item.title}</span>
          <span className="ml-preset-text">{item.change}</span>
        </label>)}
      </fieldset>
      <div className="actions">
        <button className="btn primary" type="button" disabled={!baseRequest || !preset || !!comparePending} onClick={() => preset && void compare(preset.id)}>
          Compare A vs B{preset ? ` · ${preset.title}` : ""}
        </button>
      </div>

      <p className="ml-sr" aria-live="polite">{liveCompare}</p>
      {comparePending && <p className="ml-muted" aria-busy="true">
        Comparing A vs {comparePending.label}, started at <ComputedAt at={comparePending.at} />…
        {pendingStale && " Inputs or the active research changed while this comparison was pending; it will be shown as previous."}
      </p>}
      {compareError && <p className="error" role="alert">{compareError}</p>}

      {comparison && diff && compareStatus && <div className={compareStatus === "current" ? "ml-result" : "ml-result ml-result-previous"}
        data-result-kind="comparison" data-freshness={compareStatus}>
        <h4 ref={comparisonHeading} tabIndex={-1} className="ml-result-title">
          {compareStatus === "current" ? "A/B result" : "Previous A/B result"}{comparedPreset ? ` · ${comparedPreset.title}` : ""}
        </h4>
        <p className="ml-label">{LABEL_TEXT[comparison.response.label ?? ""] ?? "Evidence comparison"}</p>
        <div className="ml-transition" aria-label="Changes in selected trials" role="group">
          {([
            ["Selected in both", "kept", diff.kept.length],
            ["Added in B", "entered", diff.entered.length],
            ["Absent from B’s selection", "left", diff.left.length],
          ] as const).map(([label, status, count]) => <div key={status} className="ml-transition-row" data-change={status}>
            <span>{label}</span><span className="num">{count}</span>
            <span className="ml-track" aria-hidden="true"><span style={{ width: `${100 * count / Math.max(1, diff.kept.length + diff.entered.length + diff.left.length)}%` }} /></span>
          </div>)}
          <p>Counts describe the returned selections. The result limit can leave eligible trials out.</p>
        </div>
        <ContextBlock entry={comparison} status={compareStatus} subject="comparison" filtersTitle="Filters used for A"
          currentResearchId={researchId} canRecompute={!!baseRequest && !comparePending}
          onRecompute={() => void compare(comparison.presetId)} />
        <div className="ml-changes">
          <p className="ml-filters-title">Changes from A to B</p>
          {scenarioChanges.length
            ? <ul className="ml-filters">{scenarioChanges.map((line) => <li key={line}>{line}</li>)}</ul>
            : <p className="ml-muted">No filter changes: B uses the same filters as A.</p>}
        </div>
        <div className="ml-columns">
          <ScenarioColumn side="A" name={diff.nameA} selected={comparison.response.ranking_a.items} excluded={comparison.response.ranking_a.excluded}
            noEvidence={diff.noEvidenceA} metric={comparison.response.metric} />
          <ScenarioColumn side="B" name={diff.nameB} selected={comparison.response.ranking_b.items} excluded={comparison.response.ranking_b.excluded}
            noEvidence={diff.noEvidenceB} metric={comparison.response.metric} />
        </div>
        {rows.length > 0 ? <table className="ml-table">
          <caption>Selection changes between A and B. Similarity, coverage and their numeric difference are rounded to three decimals; they are not probability or hazard. Evidence opens from the current corpus.</caption>
          <thead><tr>
            <th scope="col">Trial</th><th scope="col">Selection</th><th scope="col">Similarity A / B</th>
            <th scope="col">Coverage A / B</th><th scope="col">Reason in B</th><th scope="col">Sources</th>
          </tr></thead>
          <tbody>{rows.map((change) => {
            const item = change.b ?? change.a;
            const ids = [...new Set([...(change.a?.evidence_ids ?? []), ...(change.b?.evidence_ids ?? [])])];
            return <tr key={change.trial_id} className={`ml-row-${change.status}`}>
              <th scope="row" data-label="Trial" title={change.trial_id}>{trialLabels?.get(change.trial_id) ?? shortId(change.trial_id)}<br /><span className="ml-tag">{item ? PROVENANCE_LABEL[item.provenance] ?? item.provenance : "No provenance"}</span>
                {(change.a?.scored_segment_id || change.b?.scored_segment_id) && <details><summary>Segments</summary>
                  <p>A · {describeSegments(change.a)}</p><p>B · {describeSegments(change.b)}</p></details>}
              </th>
              <td data-label="Selection">{STATUS_TEXT[change.status]}</td>
              <td data-label="Similarity A / B">{change.a ? num(change.a.similarity) : "—"} / <span data-score="B">{change.b ? num(change.b.similarity) : "—"}</span>
                {change.status === "kept" && change.similarityDelta !== null && <small className="ml-delta">Change {signed(change.similarityDelta)}</small>}
              </td>
              <td data-label="Coverage A / B">{change.a ? pct(change.a.coverage) : "—"} / {change.b ? pct(change.b.coverage) : "—"}</td>
              <td data-label="Reasons in B">{change.reasonsB.length ? change.reasonsB.map(reasonText).join(" · ") : change.selectionNote ?? "—"}</td>
              <td data-label="Evidence"><EvidenceButtons ids={ids} context="current corpus"
                onOpen={(id) => onOpenEvidence(id, change.trial_id, "corpus")} /></td>
            </tr>;
          })}</tbody>
        </table> : <p>No trial selected in A or B.</p>}
        {diff.warnings.length > 0 && <details>
          <summary>Comparison notes ({diff.warnings.length})</summary>
          <ul>{diff.warnings.map((warning, index) => <li key={index}>{tx(warning)}</li>)}</ul>
        </details>}
      </div>}
    </div>

    <BassCasesPanel api={api} research={research} researchState={researchState} onOpenRun={onOpenRun}
      onOpenEvidence={onOpenEvidence} beginResearchIntent={beginResearchIntent} />

    <div className="ml-block" role="group" aria-labelledby={`${uid}-hyp`}>
      <h3 id={`${uid}-hyp`}>Hypotheses of the active research</h3>
      {researchState === "loading" && <p className="ml-muted" aria-busy="true">The workspace is loading a research{research ? <>; the hypotheses below still belong to <code>{research.id}</code></> : ""}.</p>}
      {researchState === "error" && !research && <p className="ml-muted">The last research request failed; no hypotheses to show.</p>}
      {!research ? <p className="ml-muted">No active research. Run or recover a research to receive hypotheses from the backend.</p> : <>
        <p className="ml-mode">{providerText(research.provider)} · {research.status === "completed" ? "Completed" : "Insufficient evidence"} <code>{research.id}</code></p>
        <ProvenanceLine items={research.ranking.items} scope="Active research provenance" />
        {!research.hypotheses.length
          ? <p>This research returned no hypotheses. They are not replaced with text written here.</p>
          : <div className="ml-hypotheses">{research.hypotheses.map((hypothesis) => <article key={hypothesis.id} className="ml-hypothesis" aria-labelledby={`${uid}-h-${hypothesis.id}`}>
            <p className="ml-tag ml-tag-strong">{hypothesisLabelText(hypothesis.label)}</p>
            <h4 id={`${uid}-h-${hypothesis.id}`}>{hypothesis.statement}</h4>
            <dl className="ml-hdl">
              <div><dt>Rationale</dt><dd>{hypothesis.rationale}<div className="ml-refs"><EvidenceButtons ids={hypothesis.evidence_ids} context="saved research"
                onOpen={(id) => onOpenEvidence(id, null, "record")} /></div></dd></div>
              <div><dt>Alternative explanation</dt><dd>{hypothesis.alternative_explanation}</dd></div>
              <div className="ml-next"><dt>Next proposed test</dt><dd>{hypothesis.next_measurement}</dd></div>
              <div><dt>Falsification condition</dt><dd>{hypothesis.falsification}</dd></div>
            </dl>
          </article>)}</div>}
      </>}
    </div>

    <div className="ml-block" role="group" aria-labelledby={`${uid}-insufficient`}>
      <h3 id={`${uid}-insufficient`}>Lunar query · synthetic insufficiency check</h3>
      <p>Runs a research with the current question, selected metric and filters changed as in scenario B “lunar gravity”. The default synthetic fixtures have no lunar trials, so their expected result is insufficient evidence. Other corpora may contain eligible lunar trials: the status and results below always come from the API.</p>
      <p className="ml-muted">“{queryQuestion}” · {metricLabel(metric)}</p>
      {!queryQuestionValid && <p className="ml-warn" role="note">Enter a question between 3 and 4000 characters before running the query.</p>}
      <div className="actions">
        <button type="button" disabled={!request || !!queryPending || !queryQuestionValid} onClick={() => void runInsufficient()}>Run lunar evidence query</button>
      </div>
      <p className="ml-sr" aria-live="polite">{queryPending ? "Running query…" : query ? tx(query.response.summary) : ""}</p>
      {queryPending && <p className="ml-muted" aria-busy="true">
        Running query, started at <ComputedAt at={queryPending.at} />…
        {queryPendingStale && " Inputs or the active research changed while this query was pending; it will be shown as previous."}
      </p>}
      {queryError && <p className="error" role="alert">{queryError}</p>}
      {query && queryStatus && <div className={queryStatus === "current" ? "ml-result" : "ml-result ml-result-previous"} data-result-kind="query" data-research-id={query.response.id} data-freshness={queryStatus}>
        <h4 ref={queryHeading} tabIndex={-1} className="ml-result-title">{queryStatus === "current" ? "Lunar evidence" : "Previous lunar result"}</h4>
        <ContextBlock entry={query} status={queryStatus} subject="query" filtersTitle="Base filters used" sentFilters={query.sent}
          currentResearchId={researchId} canRecompute={!!request && !queryPending && queryQuestionValid} onRecompute={() => void runInsufficient()} />
        {query.response.status === "insufficient_evidence"
          ? <p className="ml-insufficient"><strong>Insufficient evidence.</strong> {tx(query.response.summary)}</p>
          : <p>{tx(query.response.summary)}</p>}
        {query.response.plan && <details className="ml-plan">
          <summary>Saved analysis plan</summary>
          <p>{tx(query.response.plan.message)}</p>
          <p>{metricLabel(query.response.plan.metric)} · Horizontal axis {query.response.plan.x_condition ? conditionLabel(query.response.plan.x_condition) : "not assigned"} · {query.response.plan.blocked ? "Analysis blocked" : "Analysis permitted"}.</p>
          <ul>{(query.response.plan.limits ?? []).map((limit, index) => <li key={index}>{tx(limit)}</li>)}</ul>
        </details>}
        <p className="ml-mode"><span className="ml-tag">mode</span> {providerText(query.response.provider)}</p>
        <ProvenanceLine items={query.response.ranking.items} scope="Query provenance" />
        <p className="ml-muted">Question sent: “{query.question}” · research <code>{query.response.id}</code> · {query.response.ranking.items.length} eligible candidates · comparison {query.response.comparison ? "available" : "not built"} · {query.response.hypotheses.length} hypotheses.</p>
        <div className="actions">
          {researchId === query.response.id
            ? <span className="ml-tag">Open in the workspace</span>
            : <button type="button" onClick={() => onOpenRun(query.response)}>Open this research in the workspace</button>}
        </div>
        <h5>What is missing</h5>
        {query.response.ranking.excluded.length ? <ul className="ml-list">
          {countReasons(query.response.ranking.excluded).map(([reason, count]) => <li key={reason}>
            {reasonText(reason)} · {count.toLocaleString("en-GB")} trials
          </li>)}
        </ul> : <p>The API returned no excluded candidates with reasons.</p>}
        <h5>Warnings</h5>
        {query.response.warnings.length
          ? <ul>{query.response.warnings.map((warning, index) => <li key={index}>{tx(warning)}</li>)}</ul>
          : <p className="ml-muted">No warnings returned.</p>}
      </div>}
    </div>
  </section>;
}

export default MissionLabPanel;
