import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createApi } from "./lib/client";
import type { Health, Models, Profile, RankingRequest, ResearchResponse } from "./lib/client";
import { PROVENANCE_LABEL } from "./lib/format";
import type { SearchItem } from "./lib/search";
import CommandPalette from "./components/CommandPalette";
import { applyHabitat, buildRanking, demoDraft, METRICS, metricLabel } from "./lib/filters";
import type { BriefDraft, ConditionKey, HabitatId } from "./lib/filters";
import ChatPanel from "./components/ChatPanel";
import type { ChatMessage } from "./components/ChatPanel";
import { createLatest } from "./lib/latest";
import { metricPreset } from "./lib/metricPresets";
import { tx } from "./lib/backendText";
import { countUp, gsap, prefersReducedMotion, reveal, useGSAP, useInk, useRollHover } from "./lib/motion";
import { shortId } from "./lib/format";
import { HOME, VIEWS, parseRoute, routeHash } from "./lib/route";
import type { Route, View } from "./lib/route";
import { DashboardHeader, MobileTabs, Sidebar, VIEW_META } from "./components/DashboardShell";
import { Icon } from "./components/icons";
import MissionBrief from "./components/MissionBrief";
import Select from "./components/Select";
import SynthesisPanel from "./components/SynthesisPanel";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import AIResearch from "./features/ai-research/AIResearch";
import FlameIllustration from "./components/FlameIllustration";
import { MissionLabPanel } from "./features/mission-lab/MissionLabPanel";
import { ReportPanel } from "./features/report/ReportPanel";
import type { EvidenceSource, MissionSlotProps } from "./features/mission-lab/slot";
import { StudyCatalog } from "./features/catalog/StudyCatalog";
import { SaffireContext } from "./features/catalog/SaffireContext";
import "./p6-integration.css";
import "./shell.css";
import { Panel, StateMessage } from "./components/ui";
import EvidenceCanvas from "./features/evidence/EvidenceCanvas";
import EvidenceViewer from "./features/evidence/EvidenceViewer";
import { StudyComparison } from "./features/evidence/StudyComparison";
import { EMPTY_SELECTION, evidenceFor, isRetrieved, selectEvidence, selectObservation, selectTrial } from "./features/evidence/selection";
import type { Selection } from "./features/evidence/selection";

const api = createApi(import.meta.env.VITE_API_BASE_URL ?? "");
const THEME_KEY = "flamelab-theme";
const SIDEBAR_KEY = "flamelab-sidebar";
const chartMetricOptions = METRICS.map(({ key, label }) => ({ value: key, label }));

type ResultTab = "comparison" | "ranking" | "synthesis";
const RESULT_TABS: { id: ResultTab; label: string }[] = [
  { id: "comparison", label: "Comparison" },
  { id: "ranking", label: "Ranking" },
  { id: "synthesis", label: "Synthesis" },
];

type Run =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string; request: RankingRequest; question: string; metric: BriefDraft["metric"] }
  | { state: "ready"; result: ResearchResponse };

function failure(error: unknown): string {
  if (error instanceof ApiError) return `${tx(error.message)} · ${error.code} (HTTP ${error.status})${error.requestId ? ` · request ${error.requestId}` : ""}`;
  return error instanceof Error ? error.message : "The operation could not be completed.";
}

function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved && (allowed as readonly string[]).includes(saved)) return saved as T;
  } catch { /* storage unavailable */ }
  return fallback;
}
function store(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

/** First point if the comparison has one, otherwise the first eligible trial; never an excluded one. */
function initialSelection(result: ResearchResponse): Selection {
  const point = result.comparison?.points[0];
  if (point) return selectObservation(result, point.observation_id);
  const trial = result.ranking.items[0];
  return trial ? selectTrial(result, trial.trial_id) : EMPTY_SELECTION;
}

/** Hash routing: "#/" welcome, "#/dashboard/<view>" workspace; plain anchors keep the page. */
function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash) ?? HOME);
  useEffect(() => {
    const onHash = () => {
      const next = parseRoute(window.location.hash);
      if (next) { setRoute(next); window.scrollTo({ top: 0 }); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

const sameRoute = (a: Route, b: Route) => routeHash(a) === routeHash(b);
const chatViews: Record<Models["ChatSource"]["section"], View> = {
  dashboard: "overview", brief: "investigate", canvas: "investigate", ranking: "investigate",
  lab: "lab", catalog: "catalog", evidence: "investigate", synthesis: "investigate",
};

export default function App() {
  const target = useRoute();
  const root = useRef<HTMLDivElement>(null);
  // `route` is what is on screen. A new target first plays the outgoing animation
  // (whole page between welcome and dashboard, one view inside it), then swaps in.
  const [route, setRoute] = useState<Route>(target);
  useEffect(() => {
    if (sameRoute(target, route)) return;
    const pageChange = target.page !== route.page;
    const leaving = root.current?.querySelector<HTMLElement>(pageChange
      ? (route.page === "home" ? ".landing" : ".dash")
      : `[data-view="${route.page === "dashboard" ? route.view : ""}"]`);
    if (!leaving || prefersReducedMotion() || document.hidden) { setRoute(target); return; }
    const tween = gsap.to(leaving, {
      opacity: 0, y: pageChange ? -16 : 10, scale: pageChange ? 0.985 : 1,
      duration: pageChange ? 0.32 : 0.16, ease: "power2.in",
      onComplete: () => { gsap.set(leaving, { clearProps: "opacity,transform" }); setRoute(target); },
    });
    const failsafe = window.setTimeout(() => { if (tween.progress() < 1) tween.progress(1); }, 600);
    return () => { window.clearTimeout(failsafe); tween.kill(); gsap.set(leaving, { clearProps: "opacity,transform" }); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  // The dashboard stays mounted on the welcome page so its work survives a visit there.
  const [lastView, setLastView] = useState<View>("overview");
  const view = route.page === "dashboard" ? route.view : lastView;
  useEffect(() => { if (route.page === "dashboard") setLastView(route.view); }, [route]);
  // Switching views closes the evidence inspector; opening a source reopens it.
  useEffect(() => { setInspector(false); }, [view]);

  const [theme, setTheme] = useState(() => stored(THEME_KEY, ["dark", "light"] as const, "dark"));
  const [sidebar, setSidebar] = useState(() => stored(SIDEBAR_KEY, ["expanded", "collapsed"] as const, "expanded"));
  const [health, setHealth] = useState<Health | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trials, setTrials] = useState<Models["Trial"][]>([]);
  const [studies, setStudies] = useState<Models["Study"][]>([]);
  const [catalogRequest, setCatalogRequest] = useState<{ id: string; nonce: number } | null>(null);
  const [offline, setOffline] = useState<string | null>(null);
  const [dataIssues, setDataIssues] = useState<string[]>([]);
  const [draft, setDraft] = useState<BriefDraft>(demoDraft);
  const [run, setRun] = useState<Run>({ state: "idle" });
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>("record");
  const [citationRunId, setCitationRunId] = useState<string | null>(null);
  const [inspector, setInspector] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>("comparison");
  const [chartMetricOverride, setChartMetricOverride] = useState<BriefDraft["metric"] | null>(null);
  const latest = useRef(createLatest());
  const connectionLatest = useRef(createLatest());
  const chatLatest = useRef(createLatest());
  const chatRequestActive = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextMessage = useRef(1);
  const dash = useRef<HTMLDivElement>(null);
  const subtabs = useRef<HTMLDivElement>(null);
  useRollHover(dash);

  useEffect(() => { document.documentElement.dataset.theme = theme; store(THEME_KEY, theme); }, [theme]);
  useEffect(() => { store(SIDEBAR_KEY, sidebar); }, [sidebar]);
  // The evidence inspector opens whenever something with a source is selected.
  // Only Investigate opens it automatically (a new run selects its first point); elsewhere,
  // such as Ask SI, it waits for an explicit citation or source click (onOpenEvidence).
  useEffect(() => { if (selection.evidenceId && view === "investigate") setInspector(true); }, [selection.evidenceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const labels = useMemo(() => new Map(trials.map((trial) => [trial.id, tx(trial.label)])), [trials]);
  const suggestions = useMemo(() => {
    const values: Partial<Record<ConditionKey, Set<string>>> = {};
    for (const trial of trials) {
      for (const conditions of [trial.conditions, ...(trial.segments ?? []).map((segment) => segment.conditions)]) {
        for (const [key, condition] of Object.entries(conditions)) {
          if (condition.status === "known" && typeof condition.value === "string") (values[key as ConditionKey] ??= new Set()).add(condition.value);
        }
      }
    }
    return Object.fromEntries(Object.entries(values).map(([key, set]) => [key, [...set].sort()]));
  }, [trials]);

  const connect = useCallback(async () => {
    const token = connectionLatest.current.begin();
    const isCurrent = () => connectionLatest.current.isCurrent(token);
    const issues: string[] = [];
    setDataIssues([]);
    await Promise.all([
      api.health().then((status) => {
        if (isCurrent()) { setHealth(status); setOffline(null); }
      }, (error: unknown) => { if (isCurrent()) setOffline(failure(error)); }),
      api.profile().then((value) => { if (isCurrent()) setProfile(value); }, (error: unknown) => { issues.push(`Corpus summary · ${failure(error)}`); }),
      api.trials().then((value) => { if (isCurrent()) setTrials(value); }, (error: unknown) => { issues.push(`Trial index · ${failure(error)}`); }),
      api.studies().then((value) => { if (isCurrent()) setStudies(value); }, (error: unknown) => { issues.push(`Study index · ${failure(error)}`); }),
    ]);
    if (isCurrent()) setDataIssues(issues);
  }, []);

  useEffect(() => { void connect(); return () => connectionLatest.current.cancel(); }, [connect]);
  useEffect(() => () => { latest.current.cancel(); chatLatest.current.cancel(); }, []);

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
    setCitationRunId(null);
    setInspector(false);
    setDraft(demoDraft());
    setChartMetricOverride(null);
    setLabKey((k) => k + 1);
    setMessages([]);
    chatLatest.current.cancel();
    chatRequestActive.current = false;
    root.current?.querySelectorAll(".dash-content, .inv-brief").forEach((el) => el.scrollTo({ top: 0 }));
  }, []);

  const showRun = useCallback((result: ResearchResponse) => {
    latest.current.cancel();
    setRun({ state: "ready", result });
    setSelection(initialSelection(result));
    setEvidenceSource("record");
    setCitationRunId(null);
    setChartMetricOverride(null);
  }, []);

  /** Runs one investigation. Returns the record, an error message, or null when a newer request superseded it. */
  async function investigate(request: RankingRequest, question = draft.question.trim(), metric = draft.metric): Promise<ResearchResponse | string | null> {
    const token = latest.current.begin();
    setRun({ state: "loading" });
    setSelection(EMPTY_SELECTION);
    setEvidenceSource("record");
    setCitationRunId(null);
    setChartMetricOverride(null);
    try {
      const result = await api.research({ question, ranking: request, metric, include_hypotheses: true });
      // A slower earlier request must never replace the current one.
      if (!latest.current.isCurrent(token)) return null;
      setRun({ state: "ready", result });
      setSelection(initialSelection(result));
      return result;
    } catch (error) {
      if (!latest.current.isCurrent(token)) return null;
      const message = failure(error);
      setRun({ state: "error", message, request, question, metric });
      return message;
    }
  }

  const result = run.state === "ready" ? run.result : null;
  const chatBusy = messages.some((message) => "pending" in message);

  async function answerChat(id: number, request: Models["ChatRequest"]) {
    if (chatRequestActive.current) return;
    chatRequestActive.current = true;
    const token = chatLatest.current.begin();
    const replace = (next: ChatMessage) =>
      setMessages((list) => list.map((message) => message.id === id ? next : message));
    replace({ id, role: "si", pending: true });
    try {
      const answer = await api.chat(request);
      if (chatLatest.current.isCurrent(token)) replace({ id, role: "si", answer });
    } catch (error) {
      if (chatLatest.current.isCurrent(token)) replace({ id, role: "si", error: failure(error), retry: request });
    } finally {
      if (chatLatest.current.isCurrent(token)) chatRequestActive.current = false;
    }
  }

  function ask(question: string) {
    const clean = question.trim();
    if (chatBusy || chatRequestActive.current || clean.length < 3 || clean.length > 500) return;
    const userId = nextMessage.current++;
    const pendingId = nextMessage.current++;
    const previousQuestion = messages.reduce<string | undefined>((previous, message, index) => {
      const reply = messages[index + 1];
      return message.role === "user" && reply && "answer" in reply ? message.text : previous;
    }, undefined);
    setMessages((list) => [...list, { id: userId, role: "user", text: clean }, { id: pendingId, role: "si", pending: true }]);
    void answerChat(pendingId, { question: clean, previous_question: previousQuestion, research_id: result?.id });
  }

  async function askPreset(id: HabitatId) {
    if (chatBusy || chatRequestActive.current || run.state === "loading") return;
    const next = applyHabitat(draft, id);
    const request = buildRanking(next).request;
    if (!request) return;
    const question = next.question;
    const userId = nextMessage.current++;
    const pendingId = nextMessage.current++;
    setDraft(next);
    setMessages((list) => [...list, { id: userId, role: "user", text: question }, { id: pendingId, role: "si", pending: true }]);
    const outcome = await investigate(request, question, next.metric);
    setMessages((list) => list.map((message) => message.id !== pendingId ? message
      : outcome === null ? { id: pendingId, role: "si", error: "Superseded by a newer question." }
      : typeof outcome === "string" ? { id: pendingId, role: "si", error: outcome }
      : { id: pendingId, role: "si", run: outcome }));
  }

  // Brief values that drive the illustrative flame (display only, never sent anywhere).
  const used = (key: "gravity_regime" | "oxygen_pct" | "flow_velocity_cm_s") => {
    const c = draft.conditions[key];
    return (c.role === "match" || c.role === "similar") && c.value.trim() ? c.value.trim() : null;
  };
  const asNumber = (v: string | null) => (v !== null && Number.isFinite(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : null);
  const flame = { gravityLabel: used("gravity_regime"), o2: asNumber(used("oxygen_pct")), flow: asNumber(used("flow_velocity_cm_s")) };
  const currentRequest = useMemo(() => buildRanking(draft).request, [draft]);
  const chartMetric = chartMetricOverride ?? result?.plan?.metric ?? result?.comparison?.metric ?? draft.metric;
  const chartPreset = metricPreset(chartMetric, trials);
  const chartRequest = chartPreset?.request ?? result?.plan?.ranking ?? currentRequest;
  const chartQuestion = chartPreset
    ? `What measurements did ${chartPreset.name} report for ${metricLabel(chartMetric)}?`
    : result?.question ?? draft.question.trim();
  const chartControl = <form className="actions" onSubmit={(event) => {
    event.preventDefault();
    if (!chartRequest || chartQuestion.length < 3 || run.state === "loading") return;
    setResultTab("comparison");
    void investigate(chartRequest, chartQuestion, chartMetric);
  }}>
    <Select ariaLabel="Chart metric" value={chartMetric} options={chartMetricOptions}
      onChange={(metric) => setChartMetricOverride(metric as BriefDraft["metric"])} />
    <button type="submit" className="btn ghost" disabled={!chartRequest || chartQuestion.length < 3 || run.state === "loading"}>Update chart</button>
    {chartPreset && <p className="hint">Charts use the {chartPreset.name} study preset. Use the Mission Brief to apply your own filters.</p>}
  </form>;
  const evidenceIds = useMemo(() => {
    if (citationRunId || evidenceSource === "corpus") return selection.evidenceId ? [selection.evidenceId] : [];
    if (!result) return [];
    const ids = evidenceFor(result, selection);
    return selection.evidenceId && !ids.includes(selection.evidenceId) ? [selection.evidenceId, ...ids] : ids;
  }, [result, selection, evidenceSource, citationRunId]);
  const context = selection.observationId ? shortId(selection.observationId) : selection.trialId ? (labels.get(selection.trialId) ?? shortId(selection.trialId)) : null;

  const onOpenEvidence = useCallback((evidenceId: string, trialId: string | null, source: EvidenceSource = "record") => {
    setCitationRunId(null);
    setEvidenceSource(source);
    setSelection({ trialId, observationId: null, evidenceId });
    setInspector(true);
  }, []);
  const openStudy = (id: string) => {
    setCatalogRequest({ id, nonce: Date.now() });
    window.location.hash = routeHash({ page: "dashboard", view: "catalog" });
  };
  const openCitation = (evidenceId: string, researchId: string, trialId: string | null = null) => {
    onOpenEvidence(evidenceId, trialId);
    setCitationRunId(researchId);
  };
  const openChatSource = (source: Models["ChatSource"]) => {
    if (source.evidence_id) {
      if (source.research_id) openCitation(source.evidence_id, source.research_id);
      else onOpenEvidence(source.evidence_id, null, "corpus");
      return;
    }
    if (source.study_id) { openStudy(source.study_id); return; }
    if (source.section === "ranking" || source.section === "synthesis") setResultTab(source.section);
    else if (source.section === "canvas" || source.section === "brief") setResultTab("comparison");
    window.location.hash = routeHash({ page: "dashboard", view: chatViews[source.section] });
  };
  const openStudyComparison = (ids: string[]) => {
    const [a, b] = ids;
    if (a && b && a !== b) window.location.hash = routeHash({ page: "dashboard", view: "lab", studyIds: [a, b] });
  };
  // Header search covers what is already loaded: sections, catalog studies and corpus trials.
  const searchIndex = useMemo<SearchItem[]>(() => {
    const studyTitle = new Map(studies.map((study) => [study.id, study.title]));
    return [
      ...VIEWS.map((id): SearchItem => ({ kind: "section", id, title: VIEW_META[id].label, detail: VIEW_META[id].summary })),
      ...studies.map((study): SearchItem => ({ kind: "study", id: study.id, title: study.title, detail: `${study.id} · ${study.family}`, keywords: study.description })),
      ...trials.map((trial): SearchItem => ({
        kind: "trial", id: trial.id, title: tx(trial.label),
        detail: `${studyTitle.get(trial.study_id) ?? trial.study_id} · ${PROVENANCE_LABEL[trial.provenance] ?? trial.provenance}`,
        keywords: `${trial.study_id} ${trial.sample_id} ${trial.material_grade ?? ""}`,
      })),
    ];
  }, [studies, trials]);

  const onSearch = (item: SearchItem) => {
    if (item.kind === "section") { window.location.hash = routeHash({ page: "dashboard", view: item.id as View }); return; }
    if (item.kind === "study") { openStudy(item.id); return; }
    const trial = trials.find((candidate) => candidate.id === item.id);
    if (!trial) return;
    // A trial opens its first source from the active corpus, labelled as not part of any research record.
    const evidenceId = trial.evidence_ids[0];
    if (evidenceId) { onOpenEvidence(evidenceId, trial.id, "corpus"); return; }
    openStudy(trial.study_id);
  };

  const slot: MissionSlotProps = {
    api, research: result, request: currentRequest, metric: draft.metric,
    researchState: run.state, onOpenRun: showRun, onOpenEvidence, beginResearchIntent,
  };
  const retrieved = Boolean(citationRunId) || (evidenceSource !== "corpus" && Boolean(result && selection.evidenceId && isRetrieved(result, selection.evidenceId)));
  const inspectorOpen = inspector && (evidenceIds.length > 0 || Boolean(selection.evidenceId));

  // Entering the dashboard from the welcome page: sidebar slides in, header drops, then the view.
  // Switching views: only the view's title and panels rise in.
  const lastPage = useRef(route.page);
  useGSAP(() => {
    const fromHome = lastPage.current !== "dashboard";
    lastPage.current = route.page;
    if (route.page !== "dashboard") return;
    return reveal((tl) => {
      if (fromHome) {
        tl.from(".sidebar", { x: -28, opacity: 0, duration: 0.6, clearProps: "transform,opacity" })
          .from(".sb-link", { x: -10, opacity: 0, stagger: 0.035, duration: 0.45, clearProps: "transform,opacity" }, 0.15)
          .from(".dash-header", { y: -14, opacity: 0, duration: 0.5, clearProps: "transform,opacity" }, 0.05);
      }
      tl.from(`[data-view="${route.view}"] > *`, { y: 14, opacity: 0, stagger: 0.06, duration: 0.6, clearProps: "transform,opacity" }, fromHome ? 0.2 : 0);
    });
  }, { scope: root, dependencies: [route.page, view], revertOnUpdate: true });

  // Result tabs: the new panel slides in from the side of the tab that was chosen.
  const lastTab = useRef(resultTab);
  useGSAP(() => {
    const from = RESULT_TABS.findIndex((tab) => tab.id === lastTab.current);
    const to = RESULT_TABS.findIndex((tab) => tab.id === resultTab);
    lastTab.current = resultTab;
    if (from === to || prefersReducedMotion()) return;
    gsap.fromTo(".result-panel", { x: (to > from ? 1 : -1) * 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out", clearProps: "transform,opacity" });
  }, { scope: root, dependencies: [resultTab] });
  useInk(subtabs, [resultTab, result?.id]);

  // The evidence inspector slides in from the right edge when it opens.
  useGSAP(() => {
    if (!inspectorOpen || prefersReducedMotion()) return;
    gsap.fromTo(".inspector", { x: 36, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out", clearProps: "transform,opacity" });
  }, { scope: root, dependencies: [inspectorOpen] });

  // Each new research record animates its own content: points pop, rows and claims cascade, numbers count.
  useGSAP(() => {
    if (!result) return;
    const cleanup = reveal((tl) => {
      tl.from(".run-id", { opacity: 0, x: -12, duration: 0.4 })
        .from(".chart .pt-dot", { scale: 0, transformOrigin: "50% 50%", stagger: 0.04, duration: 0.6, ease: "back.out(2.2)" }, 0.1)
        .from(".chart .axis line", { opacity: 0, stagger: 0.01, duration: 0.4 }, 0)
        .from(".groups li, .canvas .warnings li", { opacity: 0, x: -10, stagger: 0.05, duration: 0.45 }, 0.25)
        .from(".ranking tbody tr.row", { opacity: 0, y: 10, stagger: 0.05, duration: 0.5 }, 0.3)
        .from(".ranking .cov-bar i", { scaleX: 0, stagger: 0.05, duration: 0.8, ease: "power3.out" }, 0.35)
        .from(".claims li, .hypo, .events li", { opacity: 0, y: 8, stagger: 0.04, duration: 0.45 }, 0.45);
    });
    root.current?.querySelectorAll(".ranking td.big").forEach((cell, index) => {
      const value = Number(cell.textContent);
      if (Number.isFinite(value)) countUp(cell, value, 3, 0.3 + index * 0.05);
    });
    return cleanup;
  }, { scope: root, dependencies: [result?.id], revertOnUpdate: true });

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const viewHead = (id: View) => <div className="view-head">
    <h1 id={`view-${id}-title`}>{VIEW_META[id].label}</h1>
    <p>{VIEW_META[id].summary}</p>
  </div>;

  return <div className="app" ref={root} data-page={route.page}>
    {route.page === "home" && <Landing health={health} profile={profile} offline={offline} onRetry={() => void connect()}
      theme={theme} onTheme={toggleTheme}
      flame={flame} />}

    <div className="dash" ref={dash} hidden={route.page !== "dashboard"} data-sidebar={sidebar} data-inspector={inspectorOpen ? "open" : "closed"}>
      <a className="skip" href="#brief">Skip to the form</a>
      <Sidebar view={view} health={health} profile={profile} offline={Boolean(offline)} />
      <div className="dash-main">
        <DashboardHeader view={view} theme={theme} onTheme={toggleTheme} onResetAll={resetAll}
          search={<CommandPalette items={searchIndex} enabled={route.page === "dashboard"} onSelect={onSearch} />}
          onToggleSidebar={() => setSidebar(sidebar === "expanded" ? "collapsed" : "expanded")} />
        <MobileTabs view={view} />
        <main className="dash-content">
          {offline && <StateMessage kind="error" title="No connection to the API" action={<button type="button" className="btn" onClick={() => void connect()}>Retry connection</button>}>
            <p>{offline}</p><p>Start the API with <code>scripts/dev-api.ps1</code> and try again.</p>
          </StateMessage>}
          {!offline && dataIssues.length > 0 && <StateMessage kind="error" title="Could not load all corpus data"
            action={<button type="button" className="btn" onClick={() => void connect()}>Retry data loading</button>}>
            <ul>{dataIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
          </StateMessage>}

          <section className="view" data-view="ai-research" hidden={view !== "ai-research"} aria-labelledby="view-ai-research-title">
            <AIResearch key={`ai-research-${labKey}`} api={api} active={route.page === "dashboard" && view === "ai-research"} />
          </section>

          <section className="view" data-view="overview" hidden={view !== "overview"} aria-labelledby="view-overview-title">
            {viewHead("overview")}
            <Overview health={health} profile={profile} offline={offline} runState={run.state} result={result} labels={labels} />
          </section>

          <section className="view" data-view="investigate" hidden={view !== "investigate"} aria-labelledby="view-investigate-title">
            {viewHead("investigate")}
            <div className="investigate">
              <div className="inv-brief">
                <MissionBrief draft={draft} onChange={setDraft} onSubmit={(request) => void investigate(request)} onReset={() => setDraft(demoDraft())}
                  busy={run.state === "loading"} suggestions={suggestions} />
              </div>
              <div className="inv-results">
                {/* Illustrative flame follows the brief's gravity, O₂ and flow until the first result, as before. */}
                {!result && route.page === "dashboard" && <section className="panel flame-panel" aria-label="Illustration">
                  <div className="panel-b">
                    <FlameIllustration {...flame} />
                  </div>
                </section>}
                {run.state === "idle" &&<Panel id="canvas" title="Evidence Canvas">
                  <div className="panel-b">
                    {chartControl}
                    <StateMessage kind="empty" title="Ask a question and press “Investigate”">
                      <p>The chart, observation table and ranking appear here. Every point, row and citation opens its source.</p>
                    </StateMessage>
                  </div>
                </Panel>}
                {run.state === "loading" && <Panel id="canvas" title="Evidence Canvas">
                  <div className="panel-b"><StateMessage kind="loading" title="Querying the API: profile, ranking, comparison and evidence…" /></div>
                </Panel>}
                {run.state === "error" && <Panel id="canvas" title="Evidence Canvas">
                  <div className="panel-b"><StateMessage kind="error" title="The investigation did not complete"
                    action={<button type="button" className="btn" onClick={() => void investigate(run.request, run.question, run.metric)}>Retry</button>}>
                    <p>{run.message}</p><p>Check the form values; the API validates ranges and combinations.</p>
                  </StateMessage></div>
                </Panel>}
                {result && <>
                  <p className="run-id num">Research record <span className="id">{result.id}</span> · {new Date(result.created_at).toLocaleString("en-GB")} · “{result.question}”</p>
                  <div className="subtabs" role="tablist" aria-label="Results" ref={subtabs}>
                    <span className="ink" aria-hidden="true" />
                    {RESULT_TABS.map(({ id, label }) => {
                      const count = id === "comparison" ? result.comparison?.points.length ?? 0 : id === "ranking" ? result.ranking.items.length : result.claims.length;
                      return <button key={id} type="button" role="tab" id={`result-tab-${id}`} aria-controls="result-panel"
                        aria-selected={resultTab === id} tabIndex={resultTab === id ? 0 : -1}
                        onClick={() => setResultTab(id)}
                        onKeyDown={(event) => {
                          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                          const index = RESULT_TABS.findIndex((tab) => tab.id === resultTab);
                          const next = RESULT_TABS[(index + (event.key === "ArrowRight" ? 1 : RESULT_TABS.length - 1)) % RESULT_TABS.length]!.id;
                          setResultTab(next);
                          document.getElementById(`result-tab-${next}`)?.focus();
                        }}>
                        {label} <span className="num subtab-n">{count}</span>
                      </button>;
                    })}
                  </div>
                  <div role="tabpanel" id="result-panel" aria-labelledby={`result-tab-${resultTab}`} className="result-panel">
                    {resultTab === "synthesis"
                      ? <SynthesisPanel result={result} onCite={onOpenEvidence} />
                      : <EvidenceCanvas result={result} labels={labels} selection={selection} show={resultTab}
                        trials={trials} metricControl={chartControl}
                        onSelectObservation={(id) => {
                          setCitationRunId(null); setEvidenceSource("record"); setSelection(selectObservation(result, id)); setInspector(true);
                        }}
                        onSelectTrial={(id) => {
                          setCitationRunId(null); setEvidenceSource("record"); setSelection(selectTrial(result, id)); setInspector(true);
                        }} />}
                  </div>
                </>}
              </div>
            </div>
          </section>

          {/* Mission Lab and Report carry their own panel titles, so these views have no extra heading. */}
          {/* Ask SI conversation: P5's ChatPanel (branch codex/p5-evidence-canvas), hosted here as its own view. */}
          <section className="view chat-view" data-view="chat" hidden={view !== "chat"} aria-labelledby="view-chat-title">
            <div className="view-head chat-head">
              <h1 id="view-chat-title"><span className="chat-face"><Icon name="chat" /></span>Ask SI</h1>
              <p>{VIEW_META.chat.summary}</p>
            </div>
            <ChatPanel open={route.page === "dashboard" && view === "chat"} messages={messages} busy={chatBusy}
              activeRunId={result?.id ?? null} onAsk={ask} onPreset={(id) => void askPreset(id)}
              onCite={openCitation} onSource={openChatSource} onCompare={openStudyComparison}
              onRetry={(id, request) => { if (!chatBusy) void answerChat(id, request); }}
              onShowRun={(record) => { showRun(record); window.location.hash = routeHash({ page: "dashboard", view: "investigate" }); }}
              onClose={() => {
                // Escape also closes the search dialog; leave the chat only when nothing else is open.
                if (document.querySelector("dialog[open], .dd-list")) return;
                window.location.hash = routeHash({ page: "dashboard", view: "investigate" });
              }} />
          </section>

          <div id="lab" className="view p6-slot" data-view="lab" hidden={view !== "lab"}>
            {route.page === "dashboard" && route.view === "lab" && route.studyIds && <StudyComparison key={routeHash(route)}
              api={api} ids={route.studyIds} onStudy={openStudy} />}
            <MissionLabPanel key={`lab-${labKey}`} {...slot} question={draft.question} />
          </div>

          <div className="view p6-slot" data-view="report" hidden={view !== "report"}>
            <ReportPanel key={`report-${labKey}`} {...slot} />
          </div>

          <section className="view" data-view="catalog" hidden={view !== "catalog"} aria-labelledby="view-catalog-title">
            {viewHead("catalog")}
            <section className="panel p6-catalog" aria-label="Study catalog">
              <div className="panel-b"><StudyCatalog api={api} requested={catalogRequest} /></div>
            </section>
          </section>

          <section className="view" data-view="saffire" hidden={view !== "saffire"} aria-labelledby="view-saffire-title">
            {viewHead("saffire")}
            <div className="panel saffire-panel">
              <div className="panel-b"><SaffireContext /></div>
            </div>
          </section>
        </main>
      </div>

      <aside className="inspector" hidden={!inspectorOpen} aria-label="Evidence inspector">
        <button type="button" className="icon-btn inspector-close" onClick={() => setInspector(false)} aria-label="Close evidence" title="Close evidence">
          <Icon name="close" />
        </button>
        <EvidenceViewer api={api} researchId={citationRunId ?? result?.id ?? null} ids={evidenceIds}
          retrieved={retrieved} activeId={selection.evidenceId}
          context={context} onPick={(id) => setSelection(selectEvidence(selection, id))} />
      </aside>
    </div>
  </div>;
}
