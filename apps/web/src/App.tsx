import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createApi } from "./lib/client";
import type { Health, Profile, RankingRequest, ResearchResponse } from "./lib/client";
import { buildRanking, demoDraft } from "./lib/filters";
import type { BriefDraft, ConditionKey } from "./lib/filters";
import { createLatest } from "./lib/latest";
import { tx } from "./lib/backendText";
import { countUp, reveal, useGSAP } from "./lib/motion";
import { shortId } from "./lib/format";
import TopBar from "./components/TopBar";
import MissionBrief from "./components/MissionBrief";
import SynthesisPanel from "./components/SynthesisPanel";
import InterimMissionTools from "./components/InterimMissionTools";
import FlameIllustration from "./components/FlameIllustration";
import { Panel, StateMessage } from "./components/ui";
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
  const [theme, setTheme] = useState(initialTheme);
  const [health, setHealth] = useState<Health | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [suggestions, setSuggestions] = useState<Partial<Record<ConditionKey, string[]>>>({});
  const [offline, setOffline] = useState<string | null>(null);
  const [draft, setDraft] = useState<BriefDraft>(demoDraft);
  const [run, setRun] = useState<Run>({ state: "idle" });
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
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

  // Full reset: back to the first-load state (demo filters, no run, no selection, fresh Mission Lab).
  const [labKey, setLabKey] = useState(0);
  const resetAll = useCallback(() => {
    latest.current.cancel();
    setRun({ state: "idle" });
    setSelection(EMPTY_SELECTION);
    setDraft(demoDraft());
    setLabKey((k) => k + 1);
    root.current?.querySelectorAll(".col-brief, .col-work, .col-evidence").forEach((col) => col.scrollTo({ top: 0 }));
  }, []);

  const showRun = useCallback((result: ResearchResponse) => {
    latest.current.cancel();
    setRun({ state: "ready", result });
    setSelection(initialSelection(result));
  }, []);

  async function investigate(request: RankingRequest) {
    const token = latest.current.begin();
    setRun({ state: "loading" });
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
  // Brief values that drive the illustrative flame (display only, never sent anywhere).
  const used = (key: "gravity_regime" | "oxygen_pct" | "flow_velocity_cm_s") => {
    const c = draft.conditions[key];
    return (c.role === "match" || c.role === "similar") && c.value.trim() ? c.value.trim() : null;
  };
  const asNumber = (v: string | null) => (v !== null && Number.isFinite(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : null);
  const currentRequest = useMemo(() => buildRanking(draft).request, [draft]);
  const evidenceIds = useMemo(() => {
    if (!result) return [];
    const ids = evidenceFor(result, selection);
    return selection.evidenceId && !ids.includes(selection.evidenceId) ? [selection.evidenceId, ...ids] : ids;
  }, [result, selection]);
  const context = selection.observationId ? shortId(selection.observationId) : selection.trialId ? (labels.get(selection.trialId) ?? shortId(selection.trialId)) : null;

  const onCite = (evidenceId: string, trialId: string | null) => {
    setSelection({ trialId, observationId: null, evidenceId });
    document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // One authored entrance: bar drops in, columns wipe up left to right.
  useGSAP(() => reveal((tl) => {
    tl.from(".topbar", { yPercent: -100, opacity: 0, duration: 0.7 })
      .from(".brand svg", { rotate: -180, scale: 0.4, duration: 0.9 }, 0.1)
      .from(".nav-link", { y: -10, opacity: 0, stagger: 0.05, duration: 0.5 }, 0.2)
      .from([".col-brief", ".col-work > *", ".col-evidence"], { clipPath: "inset(0 0 100% 0)", y: 18, stagger: 0.08, duration: 0.9, clearProps: "clipPath,transform" }, 0.25);
  }), { scope: root });

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

  return <div className="app" ref={root}>
    <a className="skip" href="#brief">Skip to the form</a>
    <TopBar health={health} offline={Boolean(offline)} theme={theme} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      sections={result ? ["brief", "canvas", "evidence", "synthesis", "lab"] : ["brief", "canvas", "evidence", "lab"]} onResetAll={resetAll} />
    <main className="shell">
      <div className="col-brief">
        <MissionBrief draft={draft} onChange={setDraft} onSubmit={(request) => void investigate(request)} onReset={() => setDraft(demoDraft())}
          busy={run.state === "loading"} suggestions={suggestions} />
        {profile && <p className="corpus num">{profile.n_studies} studies · {profile.n_trials} trials ({profile.synthetic_trials} synthetic) · {profile.n_observations} obs. · {profile.n_independent_units} indep. units</p>}
      </div>

      <div className="col-work">
        {offline && <StateMessage kind="error" title="No connection to the API" action={<button type="button" className="btn" onClick={() => void connect()}>Retry connection</button>}>
          <p>{offline}</p><p>Start the API with <code>scripts/dev-api.ps1</code> and try again.</p>
        </StateMessage>}

        {run.state === "idle" && <Panel id="canvas" title="Evidence Canvas">
          <div className="panel-b">
            <StateMessage kind="empty" title="Ask a question and press “Investigate”">
              <p>Results appear here: chart, observation table and ranking with coverage. Every point, row and citation opens its evidence.</p>
            </StateMessage>
          </div>
        </Panel>}
        {run.state === "loading" && <Panel id="canvas" title="Evidence Canvas">
          <div className="panel-b"><StateMessage kind="loading" title="Querying the API: profile, ranking, comparison and evidence…" /></div>
        </Panel>}
        {run.state === "error" && <Panel id="canvas" title="Evidence Canvas">
          <div className="panel-b"><StateMessage kind="error" title="The investigation did not complete"
            action={currentRequest && <button type="button" className="btn" onClick={() => void investigate(currentRequest)}>Retry</button>}>
            <p>{run.message}</p><p>Check the form values; the API validates ranges and combinations.</p>
          </StateMessage></div>
        </Panel>}

        {result && <>
          <p className="run-id num">Research record <span className="id">{result.id}</span> · {new Date(result.created_at).toLocaleString("en-GB")} · “{result.question}”</p>
          <EvidenceCanvas result={result} labels={labels} selection={selection}
            onSelectObservation={(id) => setSelection(selectObservation(result, id))}
            onSelectTrial={(id) => setSelection(selectTrial(result, id))} />
          <SynthesisPanel result={result} onCite={onCite} />
        </>}

        <InterimMissionTools key={labKey} api={api} research={result} request={currentRequest} onOpenRun={showRun} onOpenEvidence={onCite} />
      </div>

      <div className="col-evidence">
        {!result && <section className="panel flame-panel" aria-label="Illustration">
          <div className="panel-b">
            <FlameIllustration gravityLabel={used("gravity_regime")} o2={asNumber(used("oxygen_pct"))} flow={asNumber(used("flow_velocity_cm_s"))} />
          </div>
        </section>}
        <EvidenceViewer api={api} researchId={result?.id ?? null} ids={evidenceIds}
          retrieved={result && selection.evidenceId ? isRetrieved(result, selection.evidenceId) : true} activeId={result ? selection.evidenceId : null}
          context={context} onPick={(id) => setSelection(selectEvidence(selection, id))} />
      </div>
    </main>
    <footer className="foot">
      <span>FlameLab SI · Los TTS · NASA Space Apps 2026 “Flame in Freefall”</span>
      <span>Visual direction inspired by control-system software; no affiliation or third-party assets.</span>
    </footer>
  </div>;
}
