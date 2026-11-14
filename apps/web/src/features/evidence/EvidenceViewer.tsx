import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../../lib/motion";
import type { Api, Evidence } from "../../lib/client";
import { ApiError, sourceLink } from "../../lib/client";
import { createLatest } from "../../lib/latest";
import { shortId } from "../../lib/format";
import { tx, txText } from "../../lib/backendText";
import { Panel, ProvenanceTag, StateMessage, Tag } from "../../components/ui";

type Load = { state: "idle" } | { state: "loading" } | { state: "ready"; evidence: Evidence } | { state: "error"; message: string };

/**
 * Shows the evidence behind the current selection. It always passes the
 * research_id so a saved run keeps its historical sources after the corpus changes.
 */
export default function EvidenceViewer({ api, researchId, ids, retrieved, activeId, context, onPick }: {
  api: Api;
  researchId: string | null;
  ids: string[];
  /**
   * Whether the evidence was retrieved with the run. Excluded trials' sources are
   * not stored in the dossier, so they are read from the active corpus and labelled.
   */
  retrieved: boolean;
  activeId: string | null;
  context: string | null;
  onPick: (evidenceId: string) => void;
}) {
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(createLatest());

  useEffect(() => {
    if (!activeId || !researchId) { latest.current.cancel(); setLoad({ state: "idle" }); return; }
    const token = latest.current.begin();
    setLoad({ state: "loading" });
    api.evidence(activeId, retrieved ? researchId : undefined).then(
      (evidence) => { if (latest.current.isCurrent(token)) setLoad({ state: "ready", evidence }); },
      (error: unknown) => {
        if (!latest.current.isCurrent(token)) return;
        setLoad({ state: "error", message: error instanceof ApiError ? `${tx(error.message)} (${error.code}${error.requestId ? ` · ${error.requestId}` : ""})` : "The evidence could not be loaded." });
      },
    );
  }, [api, activeId, researchId, retrieved, attempt]);

  const evidence = load.state === "ready" ? load.evidence : null;
  const body = useRef<HTMLDivElement>(null);
  // New evidence slides in: tags, title, metadata and text cascade.
  useGSAP(() => {
    if (!evidence || prefersReducedMotion()) return;
    gsap.from(".ev > *", { opacity: 0, y: 10, stagger: 0.05, duration: 0.45, ease: "expo.out", clearProps: "opacity,transform" });
  }, { scope: body, dependencies: [evidence?.id] });
  const link = sourceLink(evidence?.source_url);

  return <Panel id="evidence" title="Evidence" className="evidence" meta={context && <span className="id">{context}</span>}>
    <div className="panel-b" ref={body}>
      {ids.length > 1 && <div className="ev-tabs" role="group" aria-label="Evidence for the selection">
        {ids.map((id) => <button type="button" key={id} className="chip" aria-pressed={id === activeId} onClick={() => onPick(id)}>{shortId(id)}</button>)}
      </div>}
      {load.state === "idle" && <StateMessage kind="empty" title="Nothing selected">
        <p>Pick a chart point, a table row or a citation to see its source.</p>
      </StateMessage>}
      {load.state === "loading" && <StateMessage kind="loading" title="Loading evidence from the research record…" />}
      {load.state === "error" && <StateMessage kind="error" title="The evidence could not be opened" action={<button type="button" className="btn" onClick={() => setAttempt(attempt + 1)}>Retry</button>}>
        <p>{load.message}</p>
      </StateMessage>}
      {evidence && <article className="ev">
        <div className="ev-tags">
          <ProvenanceTag value={evidence.provenance} />
          <Tag tone={evidence.reviewed ? "neutral" : "warn"}>{evidence.reviewed ? "Reviewed" : "Review pending"}</Tag>
          {!retrieved && <Tag tone="warn">Active corpus · not in this research record</Tag>}
        </div>
        <h3>{tx(evidence.title)}</h3>
        <dl className="ev-meta">
          <div><dt>ID</dt><dd className="id">{evidence.id}</dd></div>
          <div><dt>Study</dt><dd className="id">{evidence.study_id}</dd></div>
          <div><dt>Locator</dt><dd className="id">{evidence.locator}{evidence.page != null ? ` · PDF page ${evidence.page}` : ""}</dd></div>
        </dl>
        <pre className="ev-text">{txText(evidence.text)}</pre>
        {link
          ? <a className="btn" href={link} target="_blank" rel="noreferrer">Open public source ↗</a>
          : <p className="hint">{evidence.provenance === "synthetic"
            ? "Synthetic fixture: it does not link to any NASA measurement."
            : "No public URL. The source can be found with the file locator; no link is invented."}</p>}
      </article>}
    </div>
  </Panel>;
}
