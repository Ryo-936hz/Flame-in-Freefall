import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createApi } from "./lib/client";
import type { Health, Profile, RankingRequest, ResearchResponse } from "./lib/client";
import { buildRanking, demoDraft } from "./lib/filters";
import type { BriefDraft, ConditionKey } from "./lib/filters";
import { createLatest } from "./lib/latest";
import { shortId } from "./lib/format";
import TopBar from "./components/TopBar";
import MissionBrief from "./components/MissionBrief";
import SynthesisPanel from "./components/SynthesisPanel";
import InterimMissionTools from "./components/InterimMissionTools";
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
  if (error instanceof ApiError) return `${error.message} · ${error.code} (HTTP ${error.status})${error.requestId ? ` · request ${error.requestId}` : ""}`;
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const connect = useCallback(async () => {
    try {
      const [newHealth, newProfile, trials] = await Promise.all([api.health(), api.profile(), api.trials()]);
      setHealth(newHealth); setProfile(newProfile); setOffline(null);
      setLabels(new Map(trials.map((trial) => [trial.id, trial.label])));
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

  return <>
    <a className="skip" href="#brief">Skip to the form</a>
    <TopBar health={health} offline={Boolean(offline)} theme={theme} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      sections={result ? ["brief", "canvas", "evidence", "synthesis", "lab"] : ["brief", "canvas", "evidence", "lab"]} />
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
          <div className="panel-b"><StateMessage kind="empty" title="Ask a question and press “Investigate”">
            <p>Results appear here: chart, observation table and ranking with coverage. Every point, row and citation opens its evidence.</p>
          </StateMessage></div>
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

        <InterimMissionTools api={api} research={result} request={currentRequest} onOpenRun={showRun} onOpenEvidence={onCite} />
      </div>

      <div className="col-evidence">
        <EvidenceViewer api={api} researchId={result?.id ?? null} ids={evidenceIds}
          retrieved={result && selection.evidenceId ? isRetrieved(result, selection.evidenceId) : true} activeId={result ? selection.evidenceId : null}
          context={context} onPick={(id) => setSelection(selectEvidence(selection, id))} />
      </div>
    </main>
    <footer className="foot">
      <span>FlameLab SI · Los TTS · NASA Space Apps 2026 “Flame in Freefall”</span>
      <span>Visual direction inspired by control-system software; no affiliation or third-party assets.</span>
    </footer>
  </>;
}
