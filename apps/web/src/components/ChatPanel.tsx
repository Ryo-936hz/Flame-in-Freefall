import { useEffect, useRef, useState } from "react";
import type { Models, ResearchResponse } from "../lib/client";
import { tx } from "../lib/backendText";
import { HABITATS } from "../lib/filters";
import type { HabitatId } from "../lib/filters";
import { shortId } from "../lib/format";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import { Tag } from "./ui";
import { M13_QUESTION, M13_REFERENCE, M13_ROWS } from "../lib/m13Reference";
import "./m13-reference.css";

export type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "si"; pending: true }
  | { id: number; role: "si"; error: string; retry?: Models["ChatRequest"] }
  | { id: number; role: "si"; answer: Models["ChatResponse"] }
  | { id: number; role: "si"; run: ResearchResponse };

/** Free-form answers cite corpus sources. Habitat shortcuts run explicit investigations. */
export default function ChatPanel({ open, onClose, messages, busy, activeRunId, onAsk, onPreset, onCite, onSource, onCompare, onRetry, onShowRun }: {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  busy: boolean;
  activeRunId: string | null;
  onAsk: (question: string) => void;
  onPreset: (id: HabitatId) => void;
  onCite: (evidenceId: string, researchId: string, trialId: string | null) => void;
  onSource: (source: Models["ChatSource"]) => void;
  onCompare: (ids: string[]) => void;
  onRetry: (id: number, request: Models["ChatRequest"]) => void;
  onShowRun: (run: ResearchResponse) => void;
}) {
  const [text, setText] = useState("");
  const panel = useRef<HTMLElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useGSAP(() => {
    if (!open || prefersReducedMotion()) return;
    const tween = gsap.fromTo(panel.current, { xPercent: 104, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.55, ease: "expo.out", clearProps: "transform,opacity" });
    window.setTimeout(() => tween.progress(1), 900);
  }, { dependencies: [open] });

  useGSAP(() => {
    const last = log.current?.lastElementChild;
    if (!last || prefersReducedMotion()) return;
    gsap.from(last, { y: 12, opacity: 0, duration: 0.45, ease: "expo.out", clearProps: "transform,opacity" });
  }, { dependencies: [messages.length] });

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { log.current?.lastElementChild?.scrollIntoView({ block: "nearest" }); }, [messages]);

  if (!open) return null;
  const send = () => {
    const question = text.trim();
    if (question.length < 3 || question.length > 500 || busy) return;
    onAsk(question);
    setText("");
  };

  return <aside ref={panel} className="chat panel" aria-label="Ask SI conversation">
    <header className="panel-h">
      <h2>Ask SI</h2>
      <button type="button" className="btn ghost" onClick={onClose} aria-label="Close conversation">Close</button>
    </header>
    <p className="chat-note">
      Ask about studies, measurements or how the app works. Choose a habitat to run a filtered investigation.
    </p>

    <ol className="chat-log" ref={log} aria-live="polite">
      {messages.length === 0 && <li className="chat-empty"><span>Explore a published measurement</span><button type="button" className="m13-prompt" disabled={busy} onClick={() => onAsk(M13_QUESTION)}>{M13_QUESTION}<span aria-hidden="true">↗</span></button></li>}
      {messages.map((message) => {
        if (message.role === "user") return <li key={message.id} className="msg user">{message.text}</li>;
        if ("pending" in message) return <li key={message.id} className="msg si"><span className="typing" aria-label="Investigating"><i /><i /><i /></span></li>;
        if ("error" in message) return <li key={message.id} className="msg si error">
          {message.error}
          {message.retry && <button type="button" className="btn ghost" disabled={busy}
            onClick={() => { if (message.retry) onRetry(message.id, message.retry); }}>Try again</button>}
        </li>;
        if ("answer" in message) {
          const { answer } = message;
          const followUp = answer.suggested_question;
          const pair = answer.comparison_studies;
          return <li key={message.id} className="msg si">
            <p>{answer.answer}</p>
            {answer === M13_REFERENCE && <section className="m13-reference" aria-label="M13 segment measurements">
              <header><b>BASS-II / M13</b><span>Published reference · Sample 169m</span></header>
              <table><thead><tr><th>Segment</th><th>Flow <small>cm/s</small></th><th>Flame spread <small>mm/s</small></th></tr></thead><tbody>
                {M13_ROWS.map(row => <tr key={row.segment}><td><span className="m13-segment-dot" />0{row.segment}</td><td>{row.flow}</td><td><b>{row.rate}</b><span className="m13-rate-bar" style={{ width: `${Number(row.rate) / 0.047 * 48}px` }} aria-hidden="true" /></td></tr>)}
              </tbody></table>
              <p>Three successive observations · one sample · source order, not elapsed time.</p>
              <a href="https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65" target="_blank" rel="noreferrer">NASA/TM-20210011385 · Table 5.1 ↗</a>
            </section>}

            {followUp && <button type="button" className="btn ghost" disabled={busy} onClick={() => onAsk(followUp)}>{followUp}</button>}
            {pair?.length === 2 && <button type="button" className="btn ghost" onClick={() => onCompare(pair)}>Open study comparison</button>}
            {!!answer.technical_details?.length && <details className="msg-steps">
              <summary>Technical details</summary>
              <ul>{answer.technical_details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>
            </details>}
            {!!answer.sources.length && <details className="msg-steps">
              <summary>Sources ({answer.sources.length})</summary>
              <div className="cites">{answer.sources.map((source, index) => <button type="button" className="chip"
                key={index} onClick={() => onSource(source)}>{source.title}</button>)}</div>
            </details>}
          </li>;
        }
        const run = message.run;
        const points = run.comparison?.points.length ?? 0;
        return <li key={message.id} className="msg si">
          <div className="msg-tags">
            <Tag tone={run.status === "completed" ? "signal" : "warn"}>{run.status === "completed" ? "Completed" : "Insufficient evidence"}</Tag>
            {run.ranking.items.some((item) => item.provenance === "synthetic") && <Tag tone="synthetic">Synthetic data</Tag>}
          </div>
          <p>{tx(run.summary)}</p>
          <p className="msg-meta num">{run.ranking.items.length} eligible · {run.ranking.excluded.length} excluded · {points} points</p>
          {run.claims.slice(0, 3).map((claim, index) => <div key={index} className="msg-claim">
            <p>{tx(claim.text)}</p>
            <div className="cites">{claim.citations.map((citation, i) => <button type="button" key={i} className="chip"
              onClick={() => onCite(citation.evidence_id, run.id, citation.trial_id ?? null)}>{shortId(citation.evidence_id)}</button>)}</div>
          </div>)}
          {run.hypotheses[0] && <p className="msg-hypo"><Tag tone="warn">Prepared proposal</Tag> {tx(run.hypotheses[0].statement)}</p>}
          <details className="msg-steps"><summary>Tool steps ({run.events.length})</summary>
            <ol>{run.events.map((event) => <li key={event.sequence}>{tx(event.message)}</li>)}</ol>
          </details>
          {run.id !== activeRunId && <button type="button" className="btn ghost" onClick={() => onShowRun(run)}>Show this run in the canvas</button>}
        </li>;
      })}
    </ol>

    <div className="chat-presets" role="group" aria-label="Ask about a habitat">
      {HABITATS.slice(0, 4).map((habitat) => <button type="button" key={habitat.id} className="chip" disabled={busy}
        onClick={() => onPreset(habitat.id)}>{habitat.label}</button>)}
    </div>
    <form className="chat-form" onSubmit={(event) => { event.preventDefault(); send(); }}>
      <label htmlFor="chat-input" className="sr-only">Question</label>
      <textarea id="chat-input" ref={input} rows={2} value={text} maxLength={500} placeholder="Ask about the evidence…"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />
      <button type="submit" className="btn primary" disabled={busy || text.trim().length < 3}>Ask</button>
    </form>
  </aside>;
}
