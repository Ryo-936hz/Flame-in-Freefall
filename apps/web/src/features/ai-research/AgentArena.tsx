import type { CSSProperties } from "react";
import "./arena.css";

export type ArenaStage = "idle" | "plan" | "retrieve" | "analyze" | "review" | "write" | "complete";

const AGENTS = [
  { name: "Coordinator", role: "Plan", kind: "coordinator", stage: "plan" },
  { name: "Scout", role: "Sources", kind: "scout", stage: "retrieve" },
  { name: "Analyst", role: "Measurements", kind: "analyst", stage: "analyze" },
  { name: "Critic", role: "Limits", kind: "critic", stage: "review" },
  { name: "Writer", role: "Report", kind: "writer", stage: "write" },
] as const;
const STAGE_LABEL: Record<ArenaStage, string> = {
  idle: "Ready to explore", plan: "Mapping the question", retrieve: "Following the sources",
  analyze: "Connecting observations", review: "Your review", write: "Assembling the record", complete: "Research record ready",
};

function Dot({ kind }: { kind: string }) {
  return <span className={`ar-dot ar-dot-${kind}`}>
    <span className="ar-dot-halo" /><span className="ar-dot-body"><span className="ar-dot-eyes"><i /><i /></span><span className="ar-dot-mouth" /></span>
    <span className="ar-dot-shadow" />
  </span>;
}

/** A choreographed view of the prepared case, never a model execution monitor. */
export default function AgentArena({ stage, paused, onSource }: {
  stage: ArenaStage; paused: boolean; onSource: (index: number) => void;
}) {
  const resting = paused || stage === "idle" || stage === "complete" || stage === "review";
  return <section className="ar-arena" data-stage={stage} data-resting={resting ? "true" : "false"} aria-label="Prepared BASS-II agent workflow">
    <div className="ar-arena-top"><span className="ar-arena-caption"><i /> AGENT WORKSPACE</span><span className="ar-prepared">Prepared case</span></div>
    <div className="ar-world">
      <svg className="ar-connections" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
        <path className="ar-track" d="M180 120 C350 120 300 260 500 260 S680 120 820 120 M500 260 C360 260 380 440 180 440 M500 260 C670 260 670 440 820 440" />
        <path className="ar-flow ar-flow-one" d="M180 120 C350 120 300 260 500 260 S680 120 820 120" />
        <path className="ar-flow ar-flow-two" d="M500 260 C360 260 380 440 180 440" />
        <path className="ar-flow ar-flow-three" d="M500 260 C670 260 670 440 820 440" />
      </svg>
      <button className="ar-document ar-document-report" onClick={() => onSource(0)} type="button" aria-label="Open NASA report source">
        <span className="ar-doc-top"><span className="ar-file-icon">PDF</span><span className="ar-source-arrow" aria-hidden="true">↗</span></span>
        <b>NASA report</b><span className="ar-doc-sub">BASS-II · published evidence</span>
        <span className="ar-paper" aria-hidden="true"><i /><i /><i /><i /><span className="ar-scan" /></span>
        <span className="ar-doc-bottom">SOURCE DOCUMENT</span>
      </button>
      <button className="ar-document ar-document-table" onClick={() => onSource(1)} type="button" aria-label="Open BASS-II Table 5.1 source">
        <span className="ar-doc-top"><span className="ar-file-icon">DATA</span><span className="ar-source-arrow" aria-hidden="true">↗</span></span>
        <b>Table 5.1</b><span className="ar-doc-sub">Flow · spread rate · specimen</span>
        <span className="ar-paper ar-paper-table" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}<span className="ar-scan" /></span>
        <span className="ar-doc-bottom">BASS-II OBSERVATIONS</span>
      </button>
      <button className="ar-document ar-document-notes" onClick={() => onSource(2)} type="button" aria-label="Open M8 review evidence">
        <span className="ar-doc-top"><span className="ar-file-icon">NOTE</span><span className="ar-source-arrow" aria-hidden="true">↗</span></span>
        <b>M8 · sample record</b><span className="ar-doc-sub">Sample identity · comparison limits</span>
        <span className="ar-note-mark" aria-hidden="true"><i /> Review required</span>
        <span className="ar-doc-bottom">SCIENTIFIC LIMIT</span>
      </button>
      <div className="ar-record" aria-hidden="true"><span className="ar-file-icon">RECORD</span><b>Evidence → findings</b><span>Sources stay attached</span><div className="ar-record-lines"><i /><i /><i /></div></div>
      <div className="ar-nucleus" aria-hidden="true"><span className="ar-nucleus-orbit" /><span className="ar-nucleus-cross">✦</span><b>BASS-II</b><span>{STAGE_LABEL[stage]}</span></div>
      <div className="ar-characters" aria-hidden="true">{AGENTS.map((agent, index) => <div className={`ar-agent ar-agent-${agent.kind}`} key={agent.kind} style={{ "--ar-index": index } as CSSProperties} data-active={agent.stage === stage ? "true" : "false"}>
        <Dot kind={agent.kind} /><span className="ar-agent-name">{agent.name}</span>
      </div>)}</div>
    </div>
    <div className="ar-team" aria-label="Agent roles">{AGENTS.map((agent) => <div key={agent.kind} className="ar-team-member" data-active={agent.stage === stage ? "true" : "false"}>
      <span className="ar-team-indicator" aria-hidden="true" /><span><b>{agent.name}</b><small>{agent.role}</small></span>
    </div>)}</div>
  </section>;
}