import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createApi } from "./lib/client";
import type { Health, Profile, RankingRequest, ResearchResponse } from "./lib/client";
import { buildRanking, demoDraft } from "./lib/filters";
import type { BriefDraft, ConditionKey } from "./lib/filters";
import { createLatest } from "./lib/latest";
import { tx } from "./lib/backendText";
import { shortId } from "./lib/format";
import TopBar, { type WorkspacePage, WORKSPACE_PAGES } from "./components/TopBar";
import MissionBrief from "./components/MissionBrief";
import SynthesisPanel from "./components/SynthesisPanel";
import { MissionLabPanel } from "./features/mission-lab/MissionLabPanel";
import { ReportPanel } from "./features/report/ReportPanel";
import type { EvidenceSource, MissionSlotProps } from "./features/mission-lab/slot";
import { StudyCatalog } from "./features/catalog/StudyCatalog";
import { SaffireContext } from "./features/catalog/SaffireContext";
import "./p6-integration.css";
import { StateMessage } from "./components/ui";
import EvidenceCanvas from "./features/evidence/EvidenceCanvas";
import EvidenceViewer from "./features/evidence/EvidenceViewer";
import { EMPTY_SELECTION, evidenceFor, isRetrieved, selectEvidence, selectObservation, selectTrial } from "./features/evidence/selection";
import type { Selection } from "./features/evidence/selection";

const api = createApi(import.meta.env.VITE_API_BASE_URL ?? "");
const THEME_KEY = "flamelab-theme";

type Run =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; result: ResearchResponse };

function failure(error: unknown): string {
  if (error instanceof ApiError) return `${tx(error.message)} · ${error.code} (HTTP ${error.status})${error.requestId ? ` · request ${error.requestId}` : ""}`;
  return error instanceof Error ? error.message : "The operation could not be completed.";
}

function initialTheme(): "dark" | "light" {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* storage unavailable */ }
  return "dark";
}

/** First point if the comparison has one, otherwise the first eligible trial; never an excluded one. */
function initialSelection(result: ResearchResponse): Selection {
  const point = result.comparison?.points[0];
  if (point) return selectObservation(result, point.observation_id);
  const trial = result.ranking.items[0];
  return trial ? selectTrial(result, trial.trial_id) : EMPTY_SELECTION;
}

export default function App() {
  const [page, setPage] = useState<WorkspacePage>(() => readPage());
  const [resultView, setResultView] = useState<"data" | "findings">("data");
  const [libraryView, setLibraryView] = useState<"catalog" | "context">("catalog");
  const [sourceOpen, setSourceOpen] = useState(false);
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const scrollArea = useRef<HTMLElement>(null);
  const firstPage = useRef(true);
  const navigate = useCallback((next: WorkspacePage) => {
    setSourceOpen(false);
    setPage(next);
    if (window.location.hash !== `#${next}`) window.location.hash = next;
  }, []);
  useEffect(() => {
    const onHash = () => { setSourceOpen(false); setPage(readPage()); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    scrollArea.current?.scrollTo({ top: 0 });
    if (firstPage.current) { firstPage.current = false; return; }
    const frame = requestAnimationFrame(() => document.getElementById(`heading-${page}`)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [page]);
  useEffect(() => {
    const dialog = sourceDialog.current;
    if (!dialog) return;
    if (sourceOpen && !dialog.open) dialog.showModal();
    else if (!sourceOpen && dialog.open) dialog.close();
  }, [sourceOpen]);
  const [theme, setTheme] = useState(initialTheme);
  const [health, setHealth] = useState<Health | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [suggestions, setSuggestions] = useState<Partial<Record<ConditionKey, string[]>>>({});
  const [offline, setOffline] = useState<string | null>(null);
  const [draft, setDraft] = useState<BriefDraft>(demoDraft);
  const [run, setRun] = useState<Run>({ state: "idle" });
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>("record");
  const latest = useRef(createLatest());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const connect = useCallback(async () => {
    try {
      const [newHealth, newProfile, trials] = await Promise.all([api.health(), api.profile(), api.trials()]);
      setHealth(newHealth); setProfile(newProfile); setOffline(null);
      setLabels(new Map(trials.map((trial) => [trial.id, tx(trial.label)])));
      const values: Partial<Record<ConditionKey, Set<string>>> = {};
      for (const trial of trials) {
        for (const [key, condition] of Object.entries(trial.conditions)) {
          if (condition.status === "known" && typeof condition.value === "string") {
            (values[key as ConditionKey] ??= new Set()).add(condition.value);
          }
        }
      }
      setSuggestions(Object.fromEntries(Object.entries(values).map(([key, set]) => [key, [...set].sort()])));
    } catch (error) {
      setOffline(failure(error));
    }
  }, []);

  useEffect(() => { void connect(); }, [connect]);
  useEffect(() => () => latest.current.cancel(), []);

  // Research and recovery share one publication order across both hosts.
  const beginResearchIntent = useCallback(() => {
    const token = latest.current.begin();
    setRun((previous) => previous.state === "loading" ? { state: "idle" } : previous);
    return () => latest.current.isCurrent(token);
  }, []);

  // Full reset: back to the first-load state (demo filters, no run, no selection, fresh Mission Lab).
  const [labKey, setLabKey] = useState(0);
  const resetAll = useCallback(() => {
    latest.current.cancel();
    setRun({ state: "idle" });
    setSelection(EMPTY_SELECTION);
    setEvidenceSource("record");
    setDraft(demoDraft());
    setLabKey((k) => k + 1);
    setResultView("data");
    navigate("research");
  }, [navigate]);

  const showRun = useCallback((result: ResearchResponse) => {
    latest.current.cancel();
    setRun({ state: "ready", result });
    setSelection(initialSelection(result));
    setResultView("data");
    navigate("results");
    setEvidenceSource("record");
  }, [navigate]);

  async function investigate(request: RankingRequest) {
    const token = latest.current.begin();
    setRun({ state: "loading" });
    setResultView("data");
    navigate("results");
    setSelection(EMPTY_SELECTION);
    setEvidenceSource("record");
    try {
      const result = await api.research({ question: draft.question.trim(), ranking: request, metric: draft.metric, include_hypotheses: true });
      // A slower earlier request must never replace the current one.
      if (!latest.current.isCurrent(token)) return;
      setRun({ state: "ready", result });
      setSelection(initialSelection(result));
    } catch (error) {
      if (latest.current.isCurrent(token)) setRun({ state: "error", message: failure(error) });
    }
  }

  const result = run.state === "ready" ? run.result : null;
  const currentRequest = useMemo(() => buildRanking(draft).request, [draft]);
  const evidenceIds = useMemo(() => {
    if (evidenceSource === "corpus") return selection.evidenceId ? [selection.evidenceId] : [];
    if (!result) return [];
    const ids = evidenceFor(result, selection);
    return selection.evidenceId && !ids.includes(selection.evidenceId) ? [selection.evidenceId, ...ids] : ids;
  }, [result, selection, evidenceSource]);
  const context = selection.observationId ? shortId(selection.observationId) : selection.trialId ? (labels.get(selection.trialId) ?? shortId(selection.trialId)) : null;

  const onOpenEvidence = useCallback((evidenceId: string, trialId: string | null, source: EvidenceSource = "record") => {
    setEvidenceSource(source);
    setSelection({ trialId, observationId: null, evidenceId });
    setSourceOpen(true);
  }, []);
  const slot: MissionSlotProps = {
    api, research: result, request: currentRequest, metric: draft.metric,
    researchState: run.state, onOpenRun: showRun, onOpenEvidence, beginResearchIntent,
  };
  const retrieved = evidenceSource !== "corpus" && Boolean(result && selection.evidenceId && isRetrieved(result, selection.evidenceId));

  return <div className="app workspace-app" ref={root}>
    <a className="skip" href={`#heading-${page}`} onClick={(event) => { event.preventDefault(); document.getElementById(`heading-${page}`)?.focus(); }}>Skip to content</a>
    <TopBar health={health} offline={Boolean(offline)} theme={theme} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      activePage={page} onNavigate={navigate} onResetAll={resetAll} />
    <main className="workspace-scroll" ref={scrollArea}>
      {offline && <div className="workspace-connection"><StateMessage kind="error" title="API unavailable"
        action={<button type="button" className="btn" onClick={() => void connect()}>Retry connection</button>}>
        <p>{offline}</p>
      </StateMessage></div>}

      <section className="workspace-screen research-screen" data-screen="research" hidden={page !== "research"} aria-labelledby="heading-research">
        <div className="screen-heading"><div><span className="eyebrow">01 / RESEARCH</span><h1 id="heading-research" tabIndex={-1}>New investigation</h1></div>
          <button className="btn" onClick={() => navigate("lab")}>Mission Lab <span aria-hidden="true">↗</span></button>
        </div>
        <MissionBrief draft={draft} onChange={setDraft} onSubmit={(request) => void investigate(request)} onReset={() => setDraft(demoDraft())}
          busy={run.state === "loading"} suggestions={suggestions} />
      </section>

      <section className="workspace-screen" data-screen="results" hidden={page !== "results"} aria-labelledby="heading-results">
        <div className="screen-heading"><div><span className="eyebrow">02 / RESULTS</span><h1 id="heading-results" tabIndex={-1}>Results</h1></div>
          <div className="screen-actions"><button className="btn" onClick={() => navigate("research")}>Edit query</button>
            {result && <button className="btn" onClick={() => navigate("reports")}>Report <span aria-hidden="true">↗</span></button>}</div>
        </div>
        {run.state === "idle" && <StateMessage kind="empty" title="No investigation selected" action={<button className="btn primary" onClick={() => navigate("research")}>New investigation</button>} />}
        {run.state === "loading" && <StateMessage kind="loading" title="Investigating…" />}
        {run.state === "error" && <StateMessage kind="error" title="The investigation did not complete"
          action={currentRequest && <button type="button" className="btn" onClick={() => void investigate(currentRequest)}>Retry</button>}><p>{run.message}</p></StateMessage>}
        {result && <>
          <div className="record-bar"><p className="record-question">{result.question}</p>
            <details className="record-meta"><summary>Record details</summary><p className="run-id num">Research record <span className="id">{result.id}</span> · {new Date(result.created_at).toLocaleString("en-GB")}</p></details>
          </div>
          <div className="view-switch" role="group" aria-label="Result views">
            <button type="button" aria-pressed={resultView === "data"} onClick={() => setResultView("data")}>Data</button>
            <button type="button" aria-pressed={resultView === "findings"} onClick={() => setResultView("findings")}>Findings</button>
            {selection.evidenceId && <button className="selection-source" onClick={() => setSourceOpen(true)}>Selected source ↗</button>}
          </div>
          <div hidden={resultView !== "data"}>
            <EvidenceCanvas result={result} labels={labels} selection={selection}
              onSelectObservation={(id) => { setEvidenceSource("record"); setSelection(selectObservation(result, id)); setSourceOpen(true); }}
              onSelectTrial={(id) => { setEvidenceSource("record"); setSelection(selectTrial(result, id)); setSourceOpen(true); }} />
          </div>
          <div hidden={resultView !== "findings"}><SynthesisPanel result={result} onCite={onOpenEvidence} /></div>
        </>}
      </section>

      <section className="workspace-screen lab-screen" data-screen="lab" hidden={page !== "lab"} aria-labelledby="heading-lab">
        <div className="screen-heading"><div><span className="eyebrow">03 / LABORATORY</span><h1 id="heading-lab" tabIndex={-1}>Mission Lab</h1></div>
          <button className="btn" onClick={() => navigate("research")}>Edit query</button></div>
        <div className="p6-slot" key={labKey}><MissionLabPanel {...slot} question={draft.question} /></div>
      </section>

      <section className="workspace-screen" data-screen="library" hidden={page !== "library"} aria-labelledby="heading-library">
        <div className="screen-heading"><div><span className="eyebrow">04 / LIBRARY</span><h1 id="heading-library" tabIndex={-1}>Study library</h1></div>
          {profile && <span className="library-count num">{profile.n_studies} studies</span>}</div>
        {profile && <details className="corpus-details"><summary>Corpus overview</summary><p className="num">{profile.n_trials} records · {profile.n_observations} observations · {profile.n_independent_units} independent units · {profile.synthetic_trials} synthetic trials</p></details>}
        <div className="view-switch" role="group" aria-label="Library views">
          <button type="button" aria-pressed={libraryView === "catalog"} onClick={() => setLibraryView("catalog")}>Studies</button>
          <button type="button" aria-pressed={libraryView === "context"} onClick={() => setLibraryView("context")}>Saffire context</button>
        </div>
        <section className="panel p6-catalog" aria-label="Study catalog" hidden={libraryView !== "catalog"}><div className="panel-b"><StudyCatalog api={api} /></div></section>
        <div className="panel library-context" hidden={libraryView !== "context"}><SaffireContext /></div>
      </section>

      <section className="workspace-screen reports-screen" data-screen="reports" hidden={page !== "reports"} aria-labelledby="heading-reports">
        <div className="screen-heading"><div><span className="eyebrow">05 / RECORDS</span><h1 id="heading-reports" tabIndex={-1}>Reports</h1></div>
          {result && <button className="btn" onClick={() => navigate("results")}>View results</button>}</div>
        <ReportPanel key={labKey} {...slot} />
      </section>
    </main>
    <dialog ref={sourceDialog} className="source-drawer" aria-label="Evidence source" onCancel={() => setSourceOpen(false)} onClose={() => setSourceOpen(false)}>
      <div className="drawer-heading"><span className="eyebrow">SOURCE</span><button autoFocus type="button" className="btn" onClick={() => setSourceOpen(false)}>Close source <span aria-hidden="true">×</span></button></div>
      <EvidenceViewer api={api} researchId={result?.id ?? null} ids={evidenceIds}
        retrieved={retrieved} activeId={selection.evidenceId} context={context}
        onPick={(id) => setSelection(selectEvidence(selection, id))} />
    </dialog>
    <footer className="foot"><span>FlameLab SI · Los TTS</span><span>NASA Space Apps 2026</span></footer>
  </div>;
}

function readPage(): WorkspacePage {
  const value = window.location.hash.slice(1);
  return WORKSPACE_PAGES.some((item) => item.id === value) ? value as WorkspacePage : "research";
}
