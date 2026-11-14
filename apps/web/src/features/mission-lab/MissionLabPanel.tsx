// Mission Lab (P6) · escenarios A/B de evidencia, hipótesis y consulta sin evidencia suficiente.
// Presenta respuestas de la API; no calcula ranking ni simula física en el navegador.
// Montaje: props MissionSlotProps (slot.ts). Textos visibles en inglés.
import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../lib/client";
import type { RankingRequest, ResearchResponse } from "../../lib/client";
import { createRequestGuard, describeRequest } from "./comparisonState";
import { providerText, summarizeProvenance } from "./provenance";
import {
  buildScenarioRequest, describeScenarioChanges, diffScenarioRankings, hypothesisLabelText, scenarioPresets,
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

function uniqueReasons(items: RankedTrial[]): string[] {
  return [...new Set(items.flatMap((item) => item.reasons))];
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
    aria-label={`Open evidence ${id} (${context})`} onClick={() => onOpen(id)}>{id}</button>)}</>;
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
    <p className="ml-filters-title">{filtersTitle}</p>
    <FiltersList request={entry.request} />
    {sentFilters && <>
      <p className="ml-filters-title">Filters actually sent</p>
      <FiltersList request={sentFilters} />
    </>}
  </>;
  if (!notice) {
    return <div className="ml-context">
      <p className="ml-muted"><span className="ml-tag">current</span> Computed at <ComputedAt at={entry.at} />{where}, with the current filters.</p>
      <details><summary>{filtersTitle}</summary>{filters}</details>
    </div>;
  }
  return <div className="ml-previous" role="note">
    <p className="ml-previous-title"><strong>{notice}</strong></p>
    <p>Computed at <ComputedAt at={entry.at} />{where}.
      {status === "filters_unknown" && " The current filters are not valid, so they cannot be matched to this result."}
      {status === "filters_changed" && " The filters in the form have changed since then."}
      {status === "research_changed" && <> The active research is now {currentResearchId ? <code>{currentResearchId}</code> : "none"}.</>}
    </p>
    {filters}
    <div className="actions">
      <button type="button" disabled={!canRecompute} onClick={onRecompute}>Recompute with current filters</button>
    </div>
    {!canRecompute && <p className="ml-muted">Recompute needs valid current filters and no pending request.</p>}
  </div>;
}

function ScenarioColumn({ side, name, selected, excluded, noEvidence }: {
  side: "A" | "B"; name: string; selected: RankedTrial[]; excluded: RankedTrial[]; noEvidence: boolean;
}) {
  return <div className={`ml-column ml-column-${side.toLowerCase()}`}>
    <h5 className="ml-column-title">{name}</h5>
    <dl className="ml-counts">
      <div><dt>Selected</dt><dd>{selected.length}</dd></div>
      <div><dt>Outside the selection</dt><dd>{excluded.length}</dd></div>
    </dl>
    <ProvenanceLine items={selected} scope={`Scenario ${side} provenance`} />
    {noEvidence && <div className="ml-insufficient" role="note">
      <p><strong>Insufficient applicable evidence.</strong> No eligible candidates with these explicit filters and minimum coverage.</p>
      <p>What is missing: {uniqueReasons(excluded).length ? uniqueReasons(excluded).map((reason) => <code key={reason}>{reason}</code>) : "the API returned no exclusion reasons."}</p>
    </div>}
    {selected.length > 0 && <ul className="ml-list">
      {selected.map((item) => <li key={item.trial_id}>
        <code>{item.trial_id}</code> <span className="ml-tag">{item.provenance}</span>
        <span className="ml-metrics">similarity {num(item.similarity)} · coverage {num(item.coverage)}</span>
      </li>)}
    </ul>}
    {excluded.length > 0 && <details>
      <summary>Reasons outside the selection in {side}</summary>
      <ul className="ml-list">
        {excluded.map((item) => <li key={item.trial_id}>
          <code>{item.trial_id}</code> <span className="ml-tag">{item.provenance}</span> · {item.eligibility}
          <span className="ml-metrics">{item.reasons.join("; ") || "no reason declared"}</span>
        </li>)}
      </ul>
    </details>}
  </div>;
}

export function MissionLabPanel({ api, research, request, researchState, onOpenRun, onOpenEvidence, question, trigger }: MissionLabPanelProps) {
  const uid = useId();
  const researchId = research?.id ?? null;
  const [presetId, setPresetId] = useState<string>(scenarioPresets[0]?.id ?? "");
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
  const queryQuestion = (question ?? "").trim() || research?.question || FALLBACK_QUESTION;

  useEffect(() => () => { compareGuard.current.cancel(); queryGuard.current.cancel(); }, []);

  async function compare(id: string) {
    const base = request;
    const item = scenarioPresets.find((entry) => entry.id === id);
    if (!base) { setCompareError("The current filters are not valid. Fix them before comparing."); return; }
    if (!item) { setCompareError(`Unknown scenario: ${id}.`); return; }
    let body;
    try {
      // A se nombra al mostrarse según su vigencia; nunca se envía como "current filters".
      body = { ...buildScenarioRequest(base, id), name_a: "A · base filters" };
    } catch (error) { setCompareError(errorText(error)); return; }
    const context: ComputedContext = { request: base, at: new Date(), researchId };
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
    const base = request;
    if (!base) { setQueryError("The current filters are not valid. Fix them before running the query."); return; }
    let sent: RankingRequest;
    try { sent = buildScenarioRequest(base, INSUFFICIENT_PRESET).scenario_b; }
    catch (error) { setQueryError(errorText(error)); return; }
    const context: ComputedContext = { request: base, at: new Date(), researchId };
    const asked = queryQuestion;
    const token = queryGuard.current.begin();
    setQueryError("");
    setQueryPending({ ...context, label: "query without sufficient evidence" });
    try {
      const response = await api.research({ question: asked, ranking: sent, include_hypotheses: true });
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
  const compareStatus = comparison ? resultStatus(comparison, request, researchId) : null;
  const shownResponse = comparison && compareStatus
    ? { ...comparison.response, name_a: scenarioAName(compareStatus, comparison.at) } : null;
  const diff = shownResponse ? diffScenarioRankings(shownResponse) : null;
  const rows = diff ? [...diff.left, ...diff.entered, ...diff.kept] : [];
  const comparedPreset = comparison ? scenarioPresets.find((item) => item.id === comparison.presetId) ?? null : null;
  const scenarioChanges = comparison ? describeScenarioChanges(comparison.request, comparison.scenarioB) : [];
  const pendingStale = comparePending ? resultStatus(comparePending, request, researchId) !== "current" : false;

  // La consulta abierta como expediente activo no se marca como "otro expediente".
  const queryResearchId = query && researchId === query.response.id ? query.researchId : researchId;
  const queryStatus = query ? resultStatus(query, request, queryResearchId) : null;
  const queryPendingStale = queryPending ? resultStatus(queryPending, request, researchId) !== "current" : false;

  let liveCompare = "";
  if (comparePending) liveCompare = `Comparing A vs ${comparePending.label}…`;
  else if (diff && compareStatus) liveCompare = `A/B comparison ready${compareStatus === "current" ? "" : ", marked as previous"}. ${diff.summary.join(" ")}`;

  return <section aria-labelledby={`${uid}-title`} className="mission-lab">
    <header className="ml-head">
      <p className="ml-eyebrow">P6 · Mission Lab</p>
      <h2 id={`${uid}-title`}>Mission Lab · evidence scenarios</h2>
      <p className="ml-modes">
        <span><strong>Live:</strong> A/B comparisons and queries are computed by the API when requested.</span>
        <span><strong>Hypotheses:</strong> shown with the label returned by the backend; the research provider is stated next to them.</span>
        <span><strong>Illustrative:</strong> no conceptual scene in this view; if one is added it keeps its label.</span>
      </p>
      <p className="ml-muted">Changing a scenario changes which evidence applies; it does not predict a flame. Provenance labels below are derived from the items the API returns.</p>
    </header>

    <div className="ml-block" role="group" aria-labelledby={`${uid}-scenario`}>
      <h3 id={`${uid}-scenario`}>Scenario B versus A</h3>
      {!request && <p className="ml-warn" role="note">The current filters are not valid; A/B comparisons need valid filters.</p>}
      <fieldset className="ml-presets">
        <legend>Explicit change for B</legend>
        {scenarioPresets.map((item) => <label key={item.id} className={item.id === presetId ? "ml-preset ml-preset-active" : "ml-preset"}>
          <input type="radio" name={`${uid}-preset`} value={item.id} checked={item.id === presetId} onChange={() => setPresetId(item.id)} />
          <span className="ml-preset-title">B · {item.title}</span>
          <span className="ml-preset-text"><em>Change:</em> {item.change}</span>
          <span className="ml-preset-text"><em>Expected:</em> {item.expectation}</span>
        </label>)}
      </fieldset>
      <div className="actions">
        <button type="button" disabled={!request || !preset || !!comparePending} onClick={() => preset && void compare(preset.id)}>
          Compare A vs B{preset ? ` · ${preset.title}` : ""}
        </button>
      </div>

      <p className="ml-sr" aria-live="polite">{liveCompare}</p>
      {comparePending && <p className="ml-muted" aria-busy="true">
        Comparing A vs {comparePending.label}, started at <ComputedAt at={comparePending.at} />…
        {pendingStale && " The filters changed while this comparison was pending; it will be shown as previous."}
      </p>}
      {compareError && <p className="error" role="alert">{compareError}</p>}

      {comparison && diff && compareStatus && <div className={compareStatus === "current" ? "ml-result" : "ml-result ml-result-previous"}
        data-freshness={compareStatus}>
        <h4 ref={comparisonHeading} tabIndex={-1} className="ml-result-title">
          {compareStatus === "current" ? "A/B result" : "Previous A/B result"}{comparedPreset ? ` · ${comparedPreset.title}` : ""}
        </h4>
        <p className="ml-label"><span className="ml-tag ml-tag-strong">{LABEL_TEXT[comparison.response.label ?? ""] ?? "Unrecognized comparison label · treat as an evidence comparison"}</span> <code>{comparison.response.label ?? "no label"}</code></p>
        <ContextBlock entry={comparison} status={compareStatus} subject="comparison" filtersTitle="Filters used for A"
          currentResearchId={researchId} canRecompute={!!request && !comparePending}
          onRecompute={() => void compare(comparison.presetId)} />
        <div className="ml-changes">
          <p className="ml-filters-title">Changes from A to B</p>
          {scenarioChanges.length
            ? <ul className="ml-filters">{scenarioChanges.map((line) => <li key={line}>{line}</li>)}</ul>
            : <p className="ml-muted">No filter changes: B uses the same filters as A.</p>}
        </div>
        <ul className="ml-summary">{diff.summary.map((line, index) => <li key={index}>{line}</li>)}</ul>
        <div className="ml-columns">
          <ScenarioColumn side="A" name={diff.nameA} selected={comparison.response.ranking_a.items} excluded={comparison.response.ranking_a.excluded}
            noEvidence={diff.noEvidenceA} />
          <ScenarioColumn side="B" name={diff.nameB} selected={comparison.response.ranking_b.items} excluded={comparison.response.ranking_b.excluded}
            noEvidence={diff.noEvidenceB} />
        </div>
        {rows.length > 0 ? <table className="ml-table">
          <caption>Selection changes between A and B (similarity under explicit filters, not probability or hazard). Evidence opens from the current corpus.</caption>
          <thead><tr>
            <th scope="col">Trial / provenance</th><th scope="col">Change</th><th scope="col">Similarity A</th><th scope="col">Similarity B</th>
            <th scope="col">Δ similarity</th><th scope="col">Coverage A / B</th><th scope="col">Reasons in B</th><th scope="col">Evidence</th>
          </tr></thead>
          <tbody>{rows.map((change) => {
            const item = change.b ?? change.a;
            const ids = [...new Set([...(change.a?.evidence_ids ?? []), ...(change.b?.evidence_ids ?? [])])];
            return <tr key={change.trial_id} className={`ml-row-${change.status}`}>
              <th scope="row" data-label="Trial"><code>{change.trial_id}</code><br /><span className="ml-tag">{item?.provenance ?? "no provenance"}</span></th>
              <td data-label="Change">{STATUS_TEXT[change.status]}</td>
              <td data-label="Similarity A">{change.a ? num(change.a.similarity) : "—"}</td>
              <td data-label="Similarity B">{change.b ? num(change.b.similarity) : "—"}</td>
              <td data-label="Δ similarity">{change.status === "kept" ? signed(change.similarityDelta) : "not applicable"}</td>
              <td data-label="Coverage A / B">{change.a ? num(change.a.coverage) : "—"} / {change.b ? num(change.b.coverage) : "—"}</td>
              <td data-label="Reasons in B">{change.reasonsB.length ? change.reasonsB.map((reason) => <code key={reason}>{reason}</code>) : "—"}</td>
              <td data-label="Evidence"><EvidenceButtons ids={ids} context="current corpus"
                onOpen={(id) => onOpenEvidence(id, change.trial_id, "corpus")} /></td>
            </tr>;
          })}</tbody>
        </table> : <p>No trial selected in A or B.</p>}
        {diff.warnings.length > 0 && <details>
          <summary>API warnings ({diff.warnings.length})</summary>
          <ul>{diff.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
        </details>}
      </div>}
    </div>

    <div className="ml-block" role="group" aria-labelledby={`${uid}-hyp`}>
      <h3 id={`${uid}-hyp`}>Hypotheses of the active research</h3>
      {researchState === "loading" && <p className="ml-muted" aria-busy="true">The workspace is loading a research{research ? <>; the hypotheses below still belong to <code>{research.id}</code></> : ""}.</p>}
      {researchState === "error" && !research && <p className="ml-muted">The last research request failed; no hypotheses to show.</p>}
      {!research ? <p className="ml-muted">No active research. Run or recover a research to receive hypotheses from the backend.</p> : <>
        <p className="ml-mode"><span className="ml-tag">mode</span> {providerText(research.provider)} · research <code>{research.id}</code> ({research.status})</p>
        <ProvenanceLine items={research.ranking.items} scope="Active research provenance" />
        {!research.hypotheses.length
          ? <p>This research returned no hypotheses. They are not replaced with text written here.</p>
          : <div className="ml-hypotheses">{research.hypotheses.map((hypothesis) => <article key={hypothesis.id} className="ml-hypothesis" aria-labelledby={`${uid}-h-${hypothesis.id}`}>
            <p className="ml-tag ml-tag-strong">{hypothesisLabelText(hypothesis.label)}</p>
            <h4 id={`${uid}-h-${hypothesis.id}`}>{hypothesis.statement}</h4>
            <p className="ml-muted"><code>{hypothesis.id}</code> · <code>{hypothesis.label}</code></p>
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
      <h3 id={`${uid}-insufficient`}>Query without sufficient evidence</h3>
      <p>Runs a real research with the current question and the current filters changed as in scenario B “lunar gravity”. When no trial qualifies, the API must report insufficient evidence instead of filling in numbers.</p>
      <p className="ml-muted">Question to send: “{queryQuestion}”</p>
      <div className="actions">
        <button type="button" disabled={!request || !!queryPending || queryQuestion.length < 3} onClick={() => void runInsufficient()}>Run query without sufficient evidence</button>
      </div>
      <p className="ml-sr" aria-live="polite">{queryPending ? "Running query…" : query ? `Query finished with status ${query.response.status}. ${query.response.summary}` : ""}</p>
      {queryPending && <p className="ml-muted" aria-busy="true">
        Running query, started at <ComputedAt at={queryPending.at} />…
        {queryPendingStale && " The filters changed while this query was pending; it will be shown as previous."}
      </p>}
      {queryError && <p className="error" role="alert">{queryError}</p>}
      {query && queryStatus && <div className={queryStatus === "current" ? "ml-result" : "ml-result ml-result-previous"} data-freshness={queryStatus}>
        <h4 ref={queryHeading} tabIndex={-1} className="ml-result-title">{queryStatus === "current" ? "Response" : "Previous response"} · status <code>{query.response.status}</code></h4>
        <ContextBlock entry={query} status={queryStatus} subject="query" filtersTitle="Base filters used" sentFilters={query.sent}
          currentResearchId={researchId} canRecompute={!!request && !queryPending} onRecompute={() => void runInsufficient()} />
        {query.response.status === "insufficient_evidence"
          ? <p className="ml-insufficient"><strong>Insufficient evidence.</strong> {query.response.summary}</p>
          : <p className="ml-warn">The API returned <code>{query.response.status}</code> for these filters: {query.response.summary}</p>}
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
          {query.response.ranking.excluded.map((item) => <li key={item.trial_id}>
            <code>{item.trial_id}</code> <span className="ml-tag">{item.provenance}</span> · {item.eligibility}
            <span className="ml-metrics">{item.reasons.join("; ") || "no reason declared"}</span>
          </li>)}
        </ul> : <p>The API returned no excluded candidates with reasons.</p>}
        <h5>Warnings</h5>
        {query.response.warnings.length
          ? <ul>{query.response.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
          : <p className="ml-muted">No warnings returned.</p>}
      </div>}
    </div>
  </section>;
}

export default MissionLabPanel;
