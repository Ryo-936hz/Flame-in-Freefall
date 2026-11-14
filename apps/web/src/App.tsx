import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createApi } from "./lib/client";
import type { Health, Models, Profile, RankingRequest, ResearchResponse } from "./lib/client";
import { buildRanking, demoDraft, METRICS } from "./lib/filters";
import type { BriefDraft, ConditionKey } from "./lib/filters";
import { createLatest } from "./lib/latest";
import { metricPreset } from "./lib/metricPresets";
import { BASS_DATASET } from "./features/mission-lab/bassCases";
import { tx } from "./lib/backendText";
import { shortId } from "./lib/format";
import TopBar, { DashboardNav, DashboardSubnav, SECTIONS } from "./components/TopBar";
import type { Section } from "./components/TopBar";
import { MissionIntro } from "./components/MissionIntro";
import { FlameChat } from "./components/FlameChat";
import MissionBrief from "./components/MissionBrief";
import SynthesisPanel from "./components/SynthesisPanel";
import { MissionLabPanel } from "./features/mission-lab/MissionLabPanel";
import { ReportPanel } from "./features/report/ReportPanel";
import type { EvidenceSource, MissionSlotProps } from "./features/mission-lab/slot";
import { StudyCatalog } from "./features/catalog/StudyCatalog";
import { SaffireContext } from "./features/catalog/SaffireContext";
import "./p6-integration.css";
import FlameIllustration from "./components/FlameIllustration";
import { Panel, StateMessage } from "./components/ui";
import EvidenceCanvas from "./features/evidence/EvidenceCanvas";
import { CorpusChart } from "./features/evidence/CorpusChart";
import { StudyComparison } from "./features/evidence/StudyComparison";
import EvidenceViewer from "./features/evidence/EvidenceViewer";
import RankingTable from "./features/evidence/RankingTable";
import { EMPTY_SELECTION, evidenceFor, isRetrieved, selectEvidence, selectObservation, selectTrial } from "./features/evidence/selection";
import type { Selection } from "./features/evidence/selection";

const api = createApi(import.meta.env.VITE_API_BASE_URL ?? "");
const THEME_KEY = "flamelab-theme";

type Run =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string; request: RankingRequest; metric: BriefDraft["metric"]; question: string }
  | { state: "ready"; result: ResearchResponse };

type GlobalRank =
  | { state: "idle" | "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; result: Models["RankingResponse"] };

function sectionFromHash(hash: string): Section | null {
  return SECTIONS.find(({ id }) => `#${id}` === hash.split("?")[0])?.id ?? null;
}

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
  const [locationHash, setLocationHash] = useState(() => window.location.hash);
  const section = sectionFromHash(locationHash);
  const [catalogVisited, setCatalogVisited] = useState(section === "catalog");
  const [studyRequest, setStudyRequest] = useState<{ id: string } | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [metricDraft, setMetricDraft] = useState<BriefDraft["metric"] | null>(null);
  const [chartScope, setChartScope] = useState<"campaign" | "current">("campaign");
  const [rankingMode, setRankingMode] = useState<"global" | "research">("global");
  const [globalRank, setGlobalRank] = useState<GlobalRank>({ state: "idle" });
  const [theme, setTheme] = useState(initialTheme);
  const [health, setHealth] = useState<Health | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trials, setTrials] = useState<Models["Trial"][]>([]);
  const [offline, setOffline] = useState<string | null>(null);
  const [corpusError, setCorpusError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BriefDraft>(demoDraft);
  const [run, setRun] = useState<Run>({ state: "idle" });
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>("record");
  const [chatCitation, setChatCitation] = useState<{ evidenceId: string; researchId: string } | null>(null);
  const latest = useRef(createLatest());
  const globalLatest = useRef(createLatest());
  const connection = useRef(createLatest());
  const heading = useRef<HTMLHeadingElement>(null);
  const focusSection = useRef(false);
  const catalogDetails = useRef<HTMLDetailsElement>(null);
  const evidenceReader = useRef<HTMLElement>(null);
  const labels = useMemo(() => new Map(trials.map((trial) => [trial.id, tx(trial.label)])), [trials]);
  const suggestions = useMemo(() => {
    const values: Partial<Record<ConditionKey, Set<string>>> = {};
    for (const trial of trials) {
      for (const [key, condition] of Object.entries(trial.conditions)) {
        if (condition.status === "known" && typeof condition.value === "string") {
          (values[key as ConditionKey] ??= new Set()).add(condition.value);
        }
      }
    }
    return Object.fromEntries(Object.entries(values).map(([key, set]) => [key, [...set].sort()]));
  }, [trials]);

  const navigate = useCallback((next: Section, studies?: string[]) => {
    const hash = `#${next}${studies?.length ? `?${new URLSearchParams(studies.map((id) => ["study", id])).toString()}` : ""}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    focusSection.current = true;
    setReaderOpen(false);
    setLocationHash(hash);
    if (next === "catalog") setCatalogVisited(true);
    if (heading.current?.dataset.section === next) {
      window.scrollTo({ top: 0 });
      heading.current.focus({ preventScroll: true });
      focusSection.current = false;
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash;
      const next = sectionFromHash(hash);
      setLocationHash(hash);
      setReaderOpen(false);
      if (next === "catalog") setCatalogVisited(true);
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!section) return;
    window.scrollTo({ top: 0 });
    if (focusSection.current) heading.current?.focus({ preventScroll: true });
    focusSection.current = false;
  }, [section]);

  useEffect(() => {
    if (section === "catalog" && studyRequest && catalogDetails.current) catalogDetails.current.open = true;
  }, [section, studyRequest]);

  const openStudy = useCallback((id: string) => {
    setStudyRequest({ id });
    navigate("catalog");
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const connect = useCallback(async () => {
    const token = connection.current.begin();
    const isCurrent = () => connection.current.isCurrent(token);
    setCorpusError(null);
    const corpusErrors: string[] = [];
    await Promise.all([
      api.health().then((status) => {
        if (!isCurrent()) return;
        globalLatest.current.cancel();
        setGlobalRank({ state: "idle" });
        setHealth(status);
        setOffline(null);
      }, (error: unknown) => { if (isCurrent()) setOffline(failure(error)); }),
      api.profile().then((dataset) => {
        if (isCurrent()) setProfile(dataset);
      }, (error: unknown) => { corpusErrors.push(`Dataset summary: ${failure(error)}`); }),
      api.trials().then((trials) => {
        if (isCurrent()) setTrials(trials);
      }, (error: unknown) => { corpusErrors.push(`Trial index: ${failure(error)}`); }),
    ]);
    if (isCurrent() && corpusErrors.length) setCorpusError(corpusErrors.join(" · "));
  }, []);

  useEffect(() => { void connect(); return () => connection.current.cancel(); }, [connect]);
  useEffect(() => () => latest.current.cancel(), []);

  const loadGlobalRank = useCallback(async () => {
    if (!health) return;
    const token = globalLatest.current.begin();
    setGlobalRank({ state: "loading" });
    try {
      const response = await api.rank({
        target: { flow_velocity_cm_s: 5 },
        allow_synthetic: health.data_mode === "synthetic",
        minimum_coverage: 0.6,
        limit: 10,
      });
      if (globalLatest.current.isCurrent(token)) setGlobalRank({ state: "ready", result: response });
    } catch (error) {
      if (globalLatest.current.isCurrent(token)) setGlobalRank({ state: "error", message: failure(error) });
    }
  }, [health]);

  useEffect(() => {
    if (section !== "ranking" || rankingMode !== "global" || globalRank.state !== "idle" || offline) return;
    void loadGlobalRank();
  }, [section, rankingMode, globalRank.state, offline, loadGlobalRank]);

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
    setMetricDraft(null);
    setChartScope("campaign");
    setChatCitation(null);
    setLabKey((k) => k + 1);
    setReaderOpen(false);
    setRankingMode("global");
    window.scrollTo({ top: 0 });
  }, []);

  const showRun = useCallback((result: ResearchResponse) => {
    latest.current.cancel();
    setRun({ state: "ready", result });
    setSelection(initialSelection(result));
    setEvidenceSource("record");
    setMetricDraft(null);
    setChartScope("current");
    setChatCitation(null);
  }, []);

  async function investigate(request: RankingRequest, metric = draft.metric, question = draft.question, scope: "campaign" | "current" = "current") {
    navigate("canvas");
    setMetricDraft(null);
    setChartScope(scope);
    setChatCitation(null);
    const token = latest.current.begin();
    setRun({ state: "loading" });
    setSelection(EMPTY_SELECTION);
    setEvidenceSource("record");
    try {
      const result = await api.research({ question: question.trim(), ranking: request, metric, include_hypotheses: true });
      // A slower earlier request must never replace the current one.
      if (!latest.current.isCurrent(token)) return;
      setRun({ state: "ready", result });
      setSelection(initialSelection(result));
    } catch (error) {
      if (latest.current.isCurrent(token)) setRun({ state: "error", message: failure(error), request, metric, question });
    }
  }

  const result = run.state === "ready" ? run.result : null;
  // Brief values that drive the illustrative flame (display only, never sent anywhere).
  const used = (key: "gravity_regime" | "oxygen_pct" | "flow_velocity_cm_s") => {
    const c = draft.conditions[key];
    return (c.role === "match" || c.role === "similar") && c.value.trim() ? c.value.trim() : null;
  };
  const asNumber = (v: string | null) => (v !== null && Number.isFinite(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : null);
  const currentRequest = useMemo(() => buildRanking(draft).request, [draft]);
  const evidenceIds = useMemo(() => {
    if (chatCitation) return [chatCitation.evidenceId];
    if (evidenceSource === "corpus") return selection.evidenceId ? [selection.evidenceId] : [];
    if (!result) return [];
    const ids = evidenceFor(result, selection);
    return selection.evidenceId && !ids.includes(selection.evidenceId) ? [selection.evidenceId, ...ids] : ids;
  }, [result, selection, evidenceSource, chatCitation]);
  const context = selection.trialId ? (labels.get(selection.trialId) ?? shortId(selection.trialId)) : null;

  const openSearchSource = useCallback((trial: Models["Trial"], id: string) => {
    setChatCitation(null);
    setEvidenceSource("corpus");
    setSelection({ trialId: trial.id, observationId: null, evidenceId: id });
    navigate("evidence");
  }, [navigate]);

  const showReader = useCallback(() => {
    setReaderOpen(true);
    window.requestAnimationFrame(() => {
      const reader = evidenceReader.current;
      if (!reader || reader.hidden) return;
      const title = reader.querySelector("h2");
      if (title) {
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
      reader.scrollIntoView({ block: "nearest" });
    });
  }, []);

  const onOpenEvidence = useCallback((evidenceId: string, trialId: string | null, source: EvidenceSource = "record") => {
    setChatCitation(null);
    setEvidenceSource(source);
    setSelection({ trialId, observationId: null, evidenceId });
    showReader();
  }, [showReader]);

  function pickObservation(id: string) {
    if (!result) return;
    setChatCitation(null);
    setEvidenceSource("record");
    setSelection(selectObservation(result, id));
    showReader();
  }

  function pickRankedTrial(trialId: string) {
    if (rankingMode === "research" && result) {
      setChatCitation(null);
      setEvidenceSource("record");
      setSelection(selectTrial(result, trialId));
      showReader();
    } else if (globalRank.state === "ready") {
      const row = [...globalRank.result.items, ...globalRank.result.excluded].find((item) => item.trial_id === trialId);
      if (row?.evidence_ids[0]) onOpenEvidence(row.evidence_ids[0], trialId, "corpus");
      else {
        const trial = trials.find((item) => item.id === trialId);
        if (trial) openStudy(trial.study_id);
      }
    }
  }
  const slot: MissionSlotProps = {
    api, research: result, request: currentRequest, metric: draft.metric,
    researchState: run.state, onOpenRun: showRun, onOpenEvidence, beginResearchIntent,
  };
  const retrieved = Boolean(chatCitation) || (evidenceSource !== "corpus" && Boolean(result && selection.evidenceId && isRetrieved(result, selection.evidenceId)));

  const activeSection = SECTIONS.find(({ id }) => id === section);
  const ranking = rankingMode === "research" ? result?.ranking : globalRank.state === "ready" ? globalRank.result : null;
  const runSpec = result?.plan;
  const chartMetric = metricDraft ?? runSpec?.metric ?? result?.comparison?.metric ?? draft.metric;
  const campaign = profile?.dataset_id === BASS_DATASET ? metricPreset(chartMetric) : undefined;
  const useCampaign = campaign && chartScope === "campaign";
  const chartRequest = useCampaign ? campaign.request : runSpec?.ranking ?? currentRequest;
  const corpusCoverage = profile ? ([
    ["material", "Material"], ["pressure_kpa", "Pressure"], ["oxygen_pct", "Oxygen"],
    ["flow_velocity_cm_s", "Airflow"], ["gravity_regime", "Gravity"],
  ] as const).flatMap(([key, label]) => {
    const known = profile.missing_by_condition[key]?.known;
    return known == null ? [] : [{ key, label, known }];
  }) : [];
  const chartQuestion = useCampaign ? `What measurements are available for ${METRICS.find(({ key }) => key === chartMetric)?.label}?` : result?.question ?? draft.question;
  const canUpdateChart = Boolean(chartRequest && chartQuestion.trim().length >= 3);
  const metricControl = <form className="dashboard-metric-control" onSubmit={(event) => {
    event.preventDefault();
    if (chartRequest && chartQuestion.trim().length >= 3) {
      setDraft((previous) => ({ ...previous, metric: chartMetric }));
      void investigate(chartRequest, chartMetric, chartQuestion, chartScope);
    }
  }}>
    <label><span>Chart metric</span>
      <select className="select" value={chartMetric}
        onChange={(event) => {
          const metric = event.target.value as BriefDraft["metric"];
          setMetricDraft(metric);
          setChartScope(profile?.dataset_id === BASS_DATASET && metricPreset(metric) ? "campaign" : "current");
        }}>
        {METRICS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
    {campaign && <label><span>Chart filters</span>
      <select className="select" value={chartScope} onChange={(event) => {
        setChartScope(event.target.value === "current" ? "current" : "campaign");
      }}>
        <option value="campaign">{campaign.name} study preset</option>
        <option value="current">Keep current filters</option>
      </select>
    </label>}
    <button type="submit" className="btn" disabled={!canUpdateChart}>Update chart</button>
  </form>;

  const sectionLink = (target: Section, label: string, className?: string) => <a className={className} href={`#${target}`} onClick={(event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    navigate(target);
  }}>{label}</a>;

  if (!section || !activeSection) return <MissionIntro onEnter={() => navigate("dashboard")} />;

  return <div className="app">
    <a className="skip" href="#dashboard-main" onClick={(event) => {
      event.preventDefault();
      heading.current?.focus();
    }}>Skip to content</a>
    <TopBar api={api} trials={trials} health={health} offline={Boolean(offline)} theme={theme}
      onTheme={() => setTheme(theme === "dark" ? "light" : "dark")} onNavigate={navigate}
      onOpenStudy={openStudy} onOpenSource={openSearchSource} onResetAll={resetAll} />
    <div className="dashboard-frame">
      <DashboardNav active={section} onNavigate={navigate} />
      <main id="dashboard-main" className="dashboard-content">
        <header className="dashboard-heading">
          <h1 ref={heading} tabIndex={-1} data-section={section}>{activeSection.title}</h1>
        </header>
        <DashboardSubnav active={section} onNavigate={navigate} />
        {offline && <StateMessage kind="error" title="No connection to the API"
          action={<button type="button" className="btn" onClick={() => void connect()}>Retry connection</button>}>
          <p>{offline}</p>
        </StateMessage>}
        {!offline && corpusError && <StateMessage kind="error" title="Some corpus data could not be loaded"
          action={<button type="button" className="btn" onClick={() => void connect()}>Retry corpus loading</button>}>
          <p>{corpusError}</p>
        </StateMessage>}
        <div className="dashboard-grid" data-evidence-open={readerOpen || section === "evidence"}>
          <div className="dashboard-panes" hidden={section === "evidence"}>
            <div className="dashboard-pane" data-section="dashboard" hidden={section !== "dashboard"}>
              {section === "dashboard" && !offline && <CorpusChart api={api} datasetId={profile?.dataset_id} synthetic={health?.data_mode === "synthetic"} trials={trials}
                onSource={(id, trialId) => onOpenEvidence(id, trialId, "corpus")} />}
              <div className="dashboard-overview-grid">
                <section className="dashboard-card corpus-coverage" aria-labelledby="corpus-coverage-title">
                  <h2 id="corpus-coverage-title">What the records tell us</h2>
                  {profile ? <>
                    <p>{profile.n_studies.toLocaleString("en-GB")} studies · {profile.n_trials.toLocaleString("en-GB")} trial records · {profile.n_observations.toLocaleString("en-GB")} observations</p>
                    {profile.n_trials > 0 && corpusCoverage.length > 0 && <dl className="dashboard-stats">
                      {corpusCoverage.map(({ key, label, known }) => <div key={key}>
                        <dt>{label}</dt>
                        <dd><meter min={0} max={profile.n_trials} value={known} aria-label={`${label}: trial records with known value`} />
                          <span>{known.toLocaleString("en-GB")} <small>/ {profile.n_trials.toLocaleString("en-GB")}</small></span></dd>
                      </div>)}
                    </dl>}
                    <p className="coverage-note">Counts show known trial-level values. Conditions recorded only for individual segments are counted separately in the dataset.</p>
                  </> : <p>{offline || corpusError ? "Corpus counts are unavailable." : "Loading corpus coverage…"}</p>}
                  {profile?.n_trials === 0 && <p>The active dataset has no trial records.</p>}
                  {sectionLink("catalog", "Browse studies and source documents", "coverage-link")}
                </section>
                <section className="dashboard-card dashboard-start" aria-labelledby="dashboard-start-title">
                  <h2 id="dashboard-start-title">Start an investigation</h2>
                  <p>Choose the conditions to match and the measurement you want to compare.</p>
                  {sectionLink("brief", "Set research filters", "btn primary")}
                  <div className="dashboard-shortcuts">
                    <button type="button" disabled={!health || Boolean(offline) || profile?.n_trials === 0 || run.state === "loading"}
                      onClick={() => {
                        const example = demoDraft();
                        const exampleDraft = { ...example, allowSynthetic: health?.data_mode === "synthetic",
                          question: "How does flame spread vary with airflow in microgravity?" };
                        const { request } = buildRanking(exampleDraft);
                        if (!request) return;
                        setDraft(exampleDraft);
                        void investigate(request, exampleDraft.metric, exampleDraft.question);
                      }}>Plot flame spread vs airflow</button>
                    {sectionLink("lab", "Compare scenarios A and B")}
                    {sectionLink("ranking", "See the global relevance ranking")}
                  </div>
                </section>
              </div>
              <div className="overview-flames">
                <FlameIllustration key={labKey} gravityLabel={used("gravity_regime")} o2={asNumber(used("oxygen_pct"))} flow={asNumber(used("flow_velocity_cm_s"))} />
              </div>
            </div>

            <div className="dashboard-pane" data-section="chat" hidden={section !== "chat"}>
              <FlameChat api={api} researchId={result?.id} onCompare={(ids) => navigate("compare-studies", ids)} onSource={(source) => {
                if (source.evidence_id && source.research_id) {
                  setChatCitation({ evidenceId: source.evidence_id, researchId: source.research_id });
                  setSelection({ trialId: null, observationId: null, evidenceId: source.evidence_id });
                  showReader();
                }
                else if (source.evidence_id) onOpenEvidence(source.evidence_id, null, "corpus");
                else if (source.study_id) openStudy(source.study_id);
                else navigate(source.section);
              }} />
            </div>
            {section === "compare-studies" && <StudyComparison key={locationHash} api={api}
              ids={new URLSearchParams(locationHash.split("?")[1]).getAll("study").slice(0, 2)} onStudy={openStudy} />}
            <div className="dashboard-pane" data-section="brief" hidden={section !== "brief"}>
              <MissionBrief draft={draft} onChange={setDraft} onSubmit={(request) => void investigate(request)}
                onReset={() => setDraft(demoDraft())} busy={run.state === "loading"} suggestions={suggestions} />
            </div>

            <div className="dashboard-pane" data-section="canvas" hidden={section !== "canvas"}>
              {section === "canvas" && run.state === "idle" && !offline && <CorpusChart api={api} datasetId={profile?.dataset_id} synthetic={health?.data_mode === "synthetic"} trials={trials}
                onSource={(id, trialId) => onOpenEvidence(id, trialId, "corpus")} />}
              {run.state === "idle" && <Panel id="canvas" title="Evidence Canvas">
                <div className="panel-b">
                  {metricControl}
                  <StateMessage kind="empty" title="Run an investigation to show a chart"
                    action={sectionLink("brief", "Set filters", "btn ghost")}>
                    <p>Choose a metric to use the current filters, or start with a new question.</p>
                  </StateMessage>
                </div>
              </Panel>}
              {run.state === "loading" && <Panel id="canvas" title="Evidence Canvas">
                <div className="panel-b"><StateMessage kind="loading" title="Querying the API: profile, ranking, comparison and evidence…" /></div>
              </Panel>}
              {run.state === "error" && <Panel id="canvas" title="Evidence Canvas">
                <div className="panel-b"><StateMessage kind="error" title="The investigation did not complete"
                  action={<button type="button" className="btn" onClick={() => void investigate(run.request, run.metric, run.question, chartScope)}>Retry</button>}>
                  <p>{run.message}</p>
                </StateMessage></div>
              </Panel>}
              {result && <>
                <p className="run-id num">Research record <span className="id">{result.id}</span> · {new Date(result.created_at).toLocaleString("en-GB")} · “{result.question}”</p>
                <EvidenceCanvas result={result} selection={selection} metricControl={metricControl} onSelectObservation={pickObservation} trials={trials} />
              </>}
            </div>

            <div className="dashboard-pane" data-section="ranking" hidden={section !== "ranking"}>
              <Panel id="ranking" title={rankingMode === "global" ? "Global top" : "Current investigation"}>
                <div className="panel-b">
                  <div className="dashboard-ranking-tools">
                    <div className="seg" role="group" aria-label="Ranking scope">
                      <button type="button" aria-pressed={rankingMode === "global"} onClick={() => setRankingMode("global")}>Global top</button>
                      <button type="button" aria-pressed={rankingMode === "research"} onClick={() => setRankingMode("research")}>Current investigation</button>
                    </div>
                    {rankingMode === "global"
                      ? <p className="hint">Top 10 trials by airflow similarity to 5 cm/s across the active corpus. Each trial must report airflow; inspect its other conditions before comparison.</p>
                      : <p className="hint">Eligible trials ordered by relevance to the active question’s explicit filters.</p>}
                  </div>
                  {rankingMode === "global" && (globalRank.state === "loading" || globalRank.state === "idle") && !offline
                    && <StateMessage kind="loading" title="Loading eligible trials…" />}
                  {rankingMode === "global" && globalRank.state === "error" && <StateMessage kind="error" title="Could not load global ranking"
                    action={<button className="btn" type="button" onClick={() => void loadGlobalRank()}>Retry ranking</button>}>
                    <p>{globalRank.message}</p>
                  </StateMessage>}
                  {rankingMode === "research" && !ranking && <StateMessage kind="empty" title="No active investigation"
                    action={sectionLink("brief", "Ask a question", "btn")} />}
                  {ranking && <>
                    <p className="hint">Weighted Gower similarity measures how closely conditions match. Coverage measures how much is known. A high rank does not establish physical compatibility or hazard.</p>
                    <RankingTable ranking={ranking} labels={labels} selectedTrial={selection.trialId} onSelect={pickRankedTrial} />
                  </>}
                </div>
              </Panel>
            </div>

            <div className="dashboard-pane" data-section="synthesis" hidden={section !== "synthesis"}>
              {result ? <SynthesisPanel result={result} onCite={onOpenEvidence} /> : <Panel id="synthesis" title="Cited findings">
                <div className="panel-b"><StateMessage kind="empty" title="Findings will appear after an investigation"
                  action={sectionLink("brief", "Ask a question", "btn")} /></div>
              </Panel>}
            </div>

            <div className="dashboard-pane p6-slot" data-section="lab" id="lab" key={labKey} hidden={section !== "lab"}>
              <MissionLabPanel {...slot} question={draft.question} />
              <ReportPanel {...slot} />
            </div>

            <div className="dashboard-pane" data-section="catalog" id="catalog" hidden={section !== "catalog"}>
              {catalogVisited && <section className="panel p6-catalog" aria-label="Study catalog">
                <details ref={catalogDetails}>
                  <summary>Study catalog</summary>
                  <div className="panel-b"><StudyCatalog api={api} studyRequest={studyRequest} /></div>
                </details>
              </section>}
            </div>

            <div className="dashboard-pane" data-section="saffire" id="saffire" hidden={section !== "saffire"}>
              <SaffireContext />
            </div>
          </div>

          <aside className="dashboard-evidence" ref={evidenceReader} data-section="evidence" hidden={!readerOpen && section !== "evidence"} aria-label="Evidence reader">
            {readerOpen && section !== "evidence" && <button className="btn ghost dashboard-reader-close" type="button" onClick={() => {
              setReaderOpen(false);
              heading.current?.focus();
            }}>Close reader</button>}
            <EvidenceViewer api={api} researchId={chatCitation?.researchId ?? result?.id ?? null} ids={evidenceIds}
              retrieved={retrieved} activeId={selection.evidenceId}
              context={context} onPick={(id) => setSelection(selectEvidence(selection, id))} />
          </aside>
        </div>
      </main>
    </div>
    <footer className="foot">
      <span>FlameLab SI · Los TTS · NASA Space Apps 2026 “Flame in Freefall”</span>
    </footer>
  </div>;
}
