// Informe, reproducción de eventos y recuperación de expedientes (P6).
// Consume GET /research/{id}/report y /events tal cual: no reconstruye el informe ni ejecuta Markdown.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../lib/client";
import type { MissionSlotProps } from "../mission-lab/slot";
import { loadRecentRuns, rememberRun, reportFileName } from "./report";
import "./report.css";

type Load<T> =
  | { status: "idle" }
  | { status: "loading"; id: string }
  | { status: "ready"; id: string; value: T }
  | { status: "error"; id: string; message: string };

/** Guarda local: solo la última petición iniciada aplica su resultado. */
function useLatest() {
  const token = useRef(0);
  const guard = useRef({
    begin: () => ++token.current,
    isCurrent: (value: number) => value === token.current,
    cancel: () => { token.current += 1; }
  });
  return guard.current;
}

export function errorText(error: unknown, subject: string): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return `${subject} not found on the server (HTTP 404 · ${error.code}).`;
    if (error.status === 0 || error.status >= 500) return `The server could not return the ${subject.toLowerCase()} (HTTP ${error.status} · ${error.code}).`;
    return `The server rejected the request (HTTP ${error.status} · ${error.code}).`;
  }
  return `The ${subject.toLowerCase()} could not be loaded: the API is unreachable or the response was invalid.`;
}

function downloadText(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportPanel({ api, research, researchState, onOpenRun, beginResearchIntent }: MissionSlotProps) {
  const uid = useId();
  const activeId = research?.id ?? null;
  const [report, setReport] = useState<Load<string>>({ status: "idle" });
  const [events, setEvents] = useState<Load<string>>({ status: "idle" });
  const [recover, setRecover] = useState<Load<null>>({ status: "idle" });
  const [recent, setRecent] = useState<string[]>(() => loadRecentRuns());
  const [runId, setRunId] = useState("");
  const [focusRun, setFocusRun] = useState<string | null>(null);
  const reportGuard = useLatest();
  const eventsGuard = useLatest();
  const recoverGuard = useLatest();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const recentRef = useRef(recent);
  const recoveryIntent = useRef<(() => boolean) | null>(null);

  const remember = useCallback((id: string) => {
    const next = rememberRun(id, undefined, recentRef.current);
    recentRef.current = next;
    setRecent(next);
  }, []);

  // Reset unmounts this panel. A late recovery must never reopen that record.
  useEffect(() => () => {
    reportGuard.cancel();
    eventsGuard.cancel();
    recoverGuard.cancel();
    recoveryIntent.current = null;
  }, [api, reportGuard, eventsGuard, recoverGuard]);

  // A host-owned ticket also guards changes initiated outside this panel.
  // Without that optional integration, at least cancel on visible host changes.
  useEffect(() => {
    if (!beginResearchIntent || (recoveryIntent.current && !recoveryIntent.current())) {
      recoverGuard.cancel();
      recoveryIntent.current = null;
      setRecover({ status: "idle" });
    }
  }, [activeId, researchState, beginResearchIntent, recoverGuard]);

  const loadReport = useCallback(async (id: string) => {
    const token = reportGuard.begin();
    setReport({ status: "loading", id });
    try {
      const text = await api.report(id);
      if (reportGuard.isCurrent(token)) setReport({ status: "ready", id, value: text });
    } catch (error) {
      if (reportGuard.isCurrent(token)) setReport({ status: "error", id, message: errorText(error, "Report") });
    }
  }, [api, reportGuard]);

  const loadEvents = useCallback(async (id: string) => {
    const token = eventsGuard.begin();
    setEvents({ status: "loading", id });
    try {
      const text = await api.events(id);
      if (eventsGuard.isCurrent(token)) setEvents({ status: "ready", id, value: text });
    } catch (error) {
      if (eventsGuard.isCurrent(token)) setEvents({ status: "error", id, message: errorText(error, "Event log") });
    }
  }, [api, eventsGuard]);

  const recoverRun = useCallback(async (raw: string) => {
    const id = raw.trim();
    if (!id) return;
    const token = recoverGuard.begin();
    const isCurrentIntent = beginResearchIntent?.() ?? (() => true);
    recoveryIntent.current = isCurrentIntent;
    setRecover({ status: "loading", id });
    try {
      const run = await api.getResearch(id);
      if (!recoverGuard.isCurrent(token)) return;
      recoveryIntent.current = null;
      setRecover({ status: "idle" });
      if (!isCurrentIntent()) return;
      remember(run.id);
      setFocusRun(run.id);
      onOpenRun(run);
    } catch (error) {
      if (!recoverGuard.isCurrent(token)) return;
      recoveryIntent.current = null;
      setRecover(isCurrentIntent()
        ? { status: "error", id, message: errorText(error, "Research") }
        : { status: "idle" });
    }
  }, [api, onOpenRun, beginResearchIntent, recoverGuard, remember]);

  // Cada expediente activo: se recuerda, se carga su informe y se descarta el replay anterior.
  useEffect(() => {
    eventsGuard.cancel();
    setEvents({ status: "idle" });
    if (!activeId) {
      reportGuard.cancel();
      setReport({ status: "idle" });
      return;
    }
    remember(activeId);
    void loadReport(activeId);
  }, [activeId, loadReport, remember, eventsGuard, reportGuard]);

  // Tras recuperar, el foco va al encabezado del informe cuando el host ya muestra ese expediente.
  useEffect(() => {
    if (focusRun && focusRun === activeId) {
      headingRef.current?.focus();
      setFocusRun(null);
    }
  }, [focusRun, activeId]);

  // Solo se muestra lo que procede del expediente activo.
  const shownReport = report.status !== "idle" && report.id === activeId ? report : null;
  const shownEvents = events.status !== "idle" && events.id === activeId ? events : null;
  const busyRecover = recover.status === "loading";
  const lastRun = recent[0] ?? null;

  let status = "";
  if (shownReport?.status === "loading") status = `Loading saved report for ${shownReport.id}…`;
  else if (shownReport?.status === "ready") status = `Saved report loaded for ${shownReport.id}.`;
  if (busyRecover) status = `Recovering research ${recover.id}…`;

  return <section className="rp" aria-labelledby={`${uid}-title`}>
    <header className="rp-head">
      <p className="rp-eyebrow">Research record · saved on the server</p>
      <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1}>Report and recovery</h2>
      {research
        ? <dl className="rp-meta">
            <div><dt>Research</dt><dd><code>{research.id}</code></dd></div>
            <div><dt>Created</dt><dd><time dateTime={research.created_at}>{research.created_at}</time></dd></div>
          </dl>
        : <p className="rp-muted">No active research. Run one or recover a saved research below.</p>}
      {researchState === "loading" && research &&
        <p className="rp-muted">The workspace is loading another research; everything below still belongs to <code>{research.id}</code>.</p>}
    </header>

    <p className="rp-sr" role="status" aria-live="polite">{status}</p>

    <section className="rp-block" aria-labelledby={`${uid}-report`}>
      <div className="rp-row">
        <h3 id={`${uid}-report`}>Saved report</h3>
        <span className="rp-tag">Markdown source · not rendered</span>
      </div>
      {!research && <p className="rp-muted">The report appears once a research is active.</p>}
      {shownReport?.status === "loading" && <p className="rp-muted" aria-busy="true">Loading report…</p>}
      {shownReport?.status === "error" && <div className="rp-error" role="alert">
        <p>{shownReport.message}</p>
        <button type="button" className="rp-btn" onClick={() => void loadReport(shownReport.id)}>Retry report</button>
      </div>}
      {shownReport?.status === "ready" && <>
        <div className="rp-actions">
          <button type="button" className="rp-btn rp-btn-primary"
            onClick={() => downloadText(shownReport.value, reportFileName(shownReport.id))}>
            Download report (.md)
          </button>
          <button type="button" className="rp-btn" onClick={() => void loadReport(shownReport.id)}>Reload</button>
          <span className="rp-muted">File: <code>{reportFileName(shownReport.id)}</code></span>
        </div>
        <pre className="rp-pre" tabIndex={0} aria-label={`Saved report for research ${shownReport.id}, Markdown source`}
          data-research-id={shownReport.id}>{shownReport.value}</pre>
      </>}
    </section>

    <section className="rp-block" aria-labelledby={`${uid}-events`}>
      <div className="rp-row">
        <h3 id={`${uid}-events`}>Saved events</h3>
        <span className="rp-tag">Replay · not live</span>
      </div>
      <p className="rp-muted">Replays the activity persisted with this research. Nothing is re-run.</p>
      <div className="rp-actions">
        <button type="button" className="rp-btn" disabled={!research || shownEvents?.status === "loading"}
          onClick={() => { if (research) void loadEvents(research.id); }}>
          {shownEvents?.status === "ready" ? "Replay again" : "Replay saved events"}
        </button>
      </div>
      {shownEvents?.status === "loading" && <p className="rp-muted" aria-busy="true">Loading saved events…</p>}
      {shownEvents?.status === "error" && <div className="rp-error" role="alert">
        <p>{shownEvents.message}</p>
        <button type="button" className="rp-btn" onClick={() => void loadEvents(shownEvents.id)}>Retry replay</button>
      </div>}
      {shownEvents?.status === "ready" && <pre className="rp-pre rp-pre-events" tabIndex={0}
        aria-label={`Event replay for research ${shownEvents.id}`} data-research-id={shownEvents.id}>{shownEvents.value}</pre>}
    </section>

    <section className="rp-block" aria-labelledby={`${uid}-recover`}>
      <h3 id={`${uid}-recover`}>Recover a saved research</h3>
      <p className="rp-muted">Reads the research persisted by the API. Recent ids are kept only in this browser.</p>
      {!research && lastRun && <div className="rp-actions">
        <button type="button" className="rp-btn rp-btn-primary" disabled={busyRecover} onClick={() => void recoverRun(lastRun)}>
          Reopen last research
        </button>
        <code className="rp-id">{lastRun}</code>
      </div>}
      <form className="rp-form" onSubmit={(event) => { event.preventDefault(); void recoverRun(runId); }}>
        <label htmlFor={`${uid}-runid`}>Research id</label>
        <div className="rp-row">
          <input id={`${uid}-runid`} className="rp-input" value={runId} autoComplete="off" spellCheck={false}
            onChange={(event) => setRunId(event.target.value)} placeholder={research?.id ?? "research id"} />
          <button type="submit" className="rp-btn" disabled={busyRecover || !runId.trim()}>Recover</button>
        </div>
      </form>
      {recover.status === "error" && <div className="rp-error" role="alert">
        <p>{recover.message} <span className="rp-muted">Id: <code>{recover.id}</code></span></p>
        <button type="button" className="rp-btn" onClick={() => void recoverRun(recover.id)}>Retry recovery</button>
      </div>}
      <h4>Recent in this browser</h4>
      {recent.length
        ? <ul className="rp-recent">
            {recent.map((id) => <li key={id}>
              <code className="rp-id">{id}</code>
              {id === activeId
                ? <span className="rp-tag">Active</span>
                : <button type="button" className="rp-btn rp-btn-small" disabled={busyRecover}
                    aria-label={`Open research ${id}`} onClick={() => void recoverRun(id)}>Open</button>}
            </li>)}
          </ul>
        : <p className="rp-muted">No research opened in this browser yet.</p>}
    </section>
  </section>;
}

export default ReportPanel;
