import { useRef, useState } from "react";
import type { Api, Models } from "../lib/client";

type Turn = { question: string; researchId?: string; result?: Models["ChatResponse"]; error?: boolean };

export function FlameChat({ api, researchId, onSource, onCompare }: {
  api: Api;
  researchId?: string;
  onSource: (source: Models["ChatSource"]) => void;
  onCompare: (ids: string[]) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);

  async function ask(question: string, retryIndex?: number) {
    if (pending.current || question.trim().length < 3 || question.length > 500) return;
    pending.current = true;
    if (retryIndex === undefined) setText("");
    setBusy(true);
    const index = retryIndex ?? turns.length;
    const previousQuestion = turns.slice(0, index).reverse().find(({ result }) => result)?.question;
    const turn = { question, researchId: retryIndex === undefined ? researchId : turns[index]?.researchId };
    const replace = (next: Turn) => setTurns((previous) =>
      previous.map((item, position) => position === index ? next : item));
    if (retryIndex === undefined) setTurns((previous) => [...previous, turn]);
    else replace(turn);
    try {
      const result = await api.chat({ question, previous_question: previousQuestion, research_id: turn.researchId });
      replace({ ...turn, result });
    } catch {
      replace({ ...turn, error: true });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <section className="flame-chat" aria-label="FlameLab chat">
    {!turns.length && <div className="flame-chat-intro">
      <p>Ask about combustion research</p>
      <div className="flame-chat-prompts">
        {["What did BASS-II measure?", "What was the flame spread rate in BASS-II M13?", "How does Gower similarity work?"].map((question) =>
          <button type="button" key={question} onClick={() => void ask(question)}>{question}<span aria-hidden="true">↗</span></button>)}
      </div>
    </div>}
    <div role="log" aria-live="polite" aria-label="Conversation">
      {turns.map(({ question, result, error }, index) => <article key={index}>
        <h2>{question}</h2>
        {result && <>
          <p className="flame-chat-answer">{result.answer}</p>
          {result.suggested_question && <button type="button" className="btn" disabled={busy}
            onClick={() => void ask(result.suggested_question!)}>{result.suggested_question}</button>}
          {result.comparison_studies?.length === 2 && <button type="button" className="btn primary" onClick={() => onCompare(result.comparison_studies!)}>Open study comparison</button>}
          {!!result.technical_details?.length && <details className="flame-chat-details">
            <summary>Technical details</summary>
            <ul>{result.technical_details.map((detail, i) => <li key={i}>{detail}</li>)}</ul>
          </details>}
          {result.sources.length > 0 && <details className="flame-chat-details">
            <summary>Sources ({result.sources.length})</summary>
            <ol className="flame-chat-sources">
              {result.sources.map((source, i) => <li key={i}><button type="button" className="btn ghost" onClick={() => onSource(source)}>{source.title}</button></li>)}
            </ol>
          </details>}
        </>}
        {error && <p>The answer could not be loaded. <button className="btn ghost" type="button" disabled={busy} onClick={() => void ask(question, index)}>Try again</button></p>}
      </article>)}
      {busy && <p>Checking the evidence…</p>}
    </div>
    <form onSubmit={(event) => { event.preventDefault(); void ask(text.trim()); input.current?.focus(); }}>
      <input ref={input} className="input" aria-label="Question for FlameLab" value={text} maxLength={500}
        placeholder="Ask a question" onChange={(event) => setText(event.target.value)} />
      <button className="btn primary" disabled={busy || text.trim().length < 3}>Send</button>
    </form>
  </section>;
}
