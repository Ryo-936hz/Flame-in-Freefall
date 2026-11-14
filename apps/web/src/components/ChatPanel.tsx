import { useEffect, useRef, useState } from "react";
import type { ResearchResponse } from "../lib/client";
import { tx } from "../lib/backendText";
import { HABITATS } from "../lib/filters";
import type { HabitatId } from "../lib/filters";
import { shortId } from "../lib/format";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import { Tag } from "./ui";

export type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "si"; pending: true }
  | { id: number; role: "si"; error: string }
  | { id: number; role: "si"; run: ResearchResponse };

/**
 * Conversation side panel. Each question runs a real investigation with the
 * brief's explicit filters; the answer summarises that run and links its
 * citations to the shared evidence viewer. It overlays the evidence column so
 * the comparison never leaves the screen.
 */
export default function ChatPanel({ open, onClose, messages, busy, filters, activeRunId, onAsk, onPreset, onCite, onShowRun }: {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  busy: boolean;
  /** Plain-language filters that the next question will use. */
  filters: string[] | null;
  activeRunId: string | null;
  onAsk: (question: string) => void;
  onPreset: (id: HabitatId) => void;
  onCite: (evidenceId: string, trialId: string | null) => void;
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
    if (question.length < 3 || busy || !filters) return;
    onAsk(question);
    setText("");
  };

  return <aside ref={panel} className="chat panel" aria-label="Ask SI conversation">
    <header className="panel-h">
      <h2>Ask SI</h2>
      <button type="button" className="btn ghost" onClick={onClose} aria-label="Close conversation">Close</button>
    </header>
    <p className="chat-note">
      Answers use the brief’s filters; constraints in your text are not read yet.
    </p>

    <ol className="chat-log" ref={log} aria-live="polite">
      {messages.length === 0 && <li className="chat-empty">Ask a question or pick a habitat.</li>}
      {messages.map((message) => {
        if (message.role === "user") return <li key={message.id} className="msg user">{message.text}</li>;
        if ("pending" in message) return <li key={message.id} className="msg si"><span className="typing" aria-label="Investigating"><i /><i /><i /></span></li>;
        if ("error" in message) return <li key={message.id} className="msg si error">{message.error}</li>;
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
              onClick={() => onCite(citation.evidence_id, citation.trial_id ?? null)}>{shortId(citation.evidence_id)}</button>)}</div>
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
    {filters && <p className="chat-filters">Uses: {filters.slice(0, 3).join(" · ")}</p>}
    {!filters && <p className="chat-filters field-error">Fix the highlighted brief conditions before asking.</p>}
    <form className="chat-form" onSubmit={(event) => { event.preventDefault(); send(); }}>
      <label htmlFor="chat-input" className="sr-only">Question</label>
      <textarea id="chat-input" ref={input} rows={2} value={text} maxLength={4000} placeholder="Ask about the evidence…"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
      <button type="submit" className="btn primary" disabled={busy || text.trim().length < 3 || !filters}>Ask</button>
    </form>
  </aside>;
}
