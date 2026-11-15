import { useEffect, useRef, useState } from "react";
import type { Api, Evidence } from "../../lib/client";
import AgentArena from "./AgentArena";
import { CONTROLS, FINDING, OBSERVATIONS, QUESTION, REVIEW_ITEMS, SOURCES, STEPS, preparedReport } from "./case";
import type { Stage } from "./case";
import "./research.css";

export default function AIResearch({ api, active }: { api: Api; active: boolean }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [checks, setChecks] = useState([false, false, false]);
  const [note, setNote] = useState("");
  const [source, setSource] = useState<number | null>(null);
  const [record, setRecord] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedSource = source === null ? null : SOURCES[source];
  const ticket = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const outcome = useRef<HTMLElement>(null);
  const current = STEPS.findIndex(s => s.id === stage);
  const step = STEPS[current];
  const frozen = paused || !active || !visible || source !== null;
  const working = ["plan", "retrieve", "analyze", "write"].includes(stage);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!working || frozen) return;
    let before = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(now - before, 500); before = now;
      setElapsed(value => value + delta);
    }, 100);
    return () => window.clearInterval(timer);
  }, [working, frozen, stage]);
  useEffect(() => {
    if (!working || frozen || !step || elapsed < step.duration) return;
    setElapsed(0); setStage(STEPS[current + 1]?.id ?? "complete");
  }, [elapsed, current, step, working, frozen]);
  useEffect(() => {
    if (source !== null && active) dialog.current?.showModal(); else dialog.current?.close();
  }, [source, active]);
  useEffect(() => { if (!active) closeSource(); }, [active]);
  useEffect(() => () => { ticket.current++; }, []);
  useEffect(() => {
    if (!active || (stage !== "review" && stage !== "complete")) return;
    const heading = outcome.current?.querySelector<HTMLElement>("h2");
    heading?.focus({ preventScroll: true });
    outcome.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [stage, active]);
  function closeSource() { ticket.current++; setSource(null); setRecord(null); setError(""); setLoading(false); }
  function openSource(index: number) { ticket.current++; setSource(index); setRecord(null); setError(""); setLoading(false); }
  async function loadSource() {
    if (!selectedSource) return;
    const turn = ++ticket.current; setLoading(true); setError("");
    try { const evidence = await api.evidence(selectedSource.evidenceId); if (turn === ticket.current) setRecord(evidence); }
    catch { if (turn === ticket.current) setError("This record is unavailable in the active corpus. The prepared source note and original publication remain available below."); }
    finally { if (turn === ticket.current) setLoading(false); }
  }
  function restart() { closeSource(); setStage("idle"); setElapsed(0); setChecks([false, false, false]); setNote(""); setPaused(false); }
  function download() {
    const url = URL.createObjectURL(new Blob([preparedReport(note)], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "BASS-II-prepared-research.md"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="air" data-stage={stage}>
    <header className="air-heading"><div><span className="eyebrow">BASS-II / RESEARCH CASE 01</span><h1 id="view-ai-research-title">AI Research<span className="air-heading-dot" aria-hidden="true" /></h1></div>
      <span className="air-badge" title="Predefined sequence and curated sources. Agent movement does not represent live model execution.">Prepared case</span></header>
    <div className="air-query"><div><span className="cap">Research question</span><p>{QUESTION}</p></div>
      <div className="air-actions">
        {stage === "idle" ? <button className="btn primary" onClick={() => { setStage("plan"); setElapsed(0); }}>Start research <span aria-hidden="true">↗</span></button>
          : <>{working && <button className="btn" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>}<button className="btn" onClick={restart}>Reset case</button></>}
      </div></div>
    <ol className="air-steps" aria-label="Research workflow">{STEPS.map((item, index) => <li key={item.id} data-status={stage === "complete" || index < current ? "done" : index === current ? "active" : "waiting"} aria-current={index === current ? "step" : undefined}>
      <span className="air-step-number">{stage === "complete" || index < current ? "✓" : `0${index + 1}`}</span><span>{item.label}</span>{item.id === "review" && <small>Human</small>}
    </li>)}</ol>
    <AgentArena stage={stage} paused={frozen} onSource={openSource} />
    <div className="air-status" role="status"><span className="air-status-led" data-working={working && !frozen} />
      <span>{stage === "idle" ? "Ready. Follow five agents through the prepared case." : stage === "complete" ? "Case complete. Review decision included in the prepared report." : `${step?.agent} · ${step?.message}`}</span>
      {working && <span className="air-status-time num">{paused ? "Paused" : "Prepared sequence"}</span>}</div>
    {stage === "review" && <section ref={outcome} className="air-review" aria-labelledby="air-review-title">
      <div><span className="eyebrow">HUMAN REVIEW REQUIRED</span><h2 id="air-review-title" tabIndex={-1}>A discrepancy needs your attention.</h2>
        <p>M8 table: <b>0.056 / 0.04 mm/s</b>. Figure fit: <b>0.0557 / 0.0391 mm/s</b>, at 6 / 5 cm/s. Keep both representations distinct.</p>
        <button className="btn small" onClick={() => openSource(1)}>Inspect source ↗</button></div>
      <div className="air-review-controls">{REVIEW_ITEMS.map((text, index) => <label key={text}><input type="checkbox" checked={checks[index]} onChange={event => setChecks(checks.map((value, i) => i === index ? event.target.checked : value))} /><span>{text}</span></label>)}
        <label className="air-note">Review note <textarea value={note} maxLength={1000} onChange={event => setNote(event.target.value)} placeholder="Optional scope or follow-up note" /></label>
        <button className="btn primary" disabled={!checks.every(Boolean)} onClick={() => { setElapsed(0); setStage("write"); setPaused(false); }}>Accept descriptive scope →</button>
        <small>Acknowledges this case's scope; does not mark the corpus as scientifically validated.</small>
      </div></section>}
    {stage === "complete" && <section ref={outcome} className="air-result" aria-labelledby="air-result-title"><div><span className="eyebrow">RESEARCH BRIEF</span><h2 id="air-result-title" tabIndex={-1}>A comparison with boundaries.</h2><p>{FINDING}</p><p className="air-result-limit">M8 discrepancy retained · effective segment O₂ unknown · source order is not time.</p>
      <div className="air-actions"><button className="btn primary" onClick={download}>Download prepared report ↓</button><a className="btn" href="#/dashboard/lab">Open Mission Lab ↗</a></div></div>
      <dl className="air-metrics"><div><dt>Published observations</dt><dd>10</dd></div><div><dt>Identified samples</dt><dd>7</dd></div><div><dt>Flow conditions</dt><dd>2</dd></div></dl>
    </section>}
    <div className="air-bottom"><section className="air-sources" aria-label="Case sources"><h2>Source trail <span className="num">03</span></h2>{SOURCES.map((item, index) => <button key={item.title} onClick={() => openSource(index)}><span className="num">0{index + 1}</span><span><b>{item.title}</b><small>{item.locator}</small></span><span aria-hidden="true">↗</span></button>)}</section>
      <details className="air-values"><summary>Published observations <span className="num">10 / 7 samples</span></summary><p>Table 5.1 · rates in mm/s. Repeated samples across successive segments remain the same independent unit.</p><p>{CONTROLS}</p><div className="air-table-scroll"><table><thead><tr><th>Trial</th><th>Segment</th><th>Sample</th><th>Flow cm/s</th><th>Spread mm/s</th></tr></thead><tbody>{OBSERVATIONS.map(o => <tr key={`${o.trial}-${o.segment}`}><td>{o.trial}</td><td>{o.segment}</td><td>{o.sample}</td><td>{o.flow}</td><td>{o.rate}</td></tr>)}</tbody></table></div></details></div>
    <p className="air-footnote">Prepared BASS-II case · choreographed agent activity · published values with source references.</p>
    <dialog className="air-dialog" ref={dialog} aria-labelledby="air-source-title" onCancel={closeSource} onClose={() => { if (source !== null) closeSource(); }}>
      {selectedSource && <><div className="air-dialog-top"><span className="eyebrow">SOURCE RECORD</span><button className="btn small" autoFocus onClick={closeSource}>Close source ×</button></div><h2 id="air-source-title">{selectedSource.title}</h2><p className="num">{selectedSource.locator}</p><span className="air-badge">Prepared source note</span><p>{selectedSource.note}</p><a className="btn" href={selectedSource.url} target="_blank" rel="noreferrer">Open original publication ↗</a><hr />
        <button className="btn" disabled={loading} onClick={() => void loadSource()}>{loading ? "Loading record…" : "Load active corpus record"}</button>{error && <p role="alert">{error}</p>}{record && <section><h3>Active corpus · literal excerpt</h3><p className="num">{record.id}</p><p>{record.locator}</p><pre>{record.text}</pre></section>}</>}
    </dialog>
  </div>;
}
