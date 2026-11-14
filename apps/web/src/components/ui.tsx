import type { ReactNode } from "react";
import { PROVENANCE_LABEL } from "../lib/format";

/** Hover roll: letters slide up and their copy rises from below (CSS in style.css). */
export function RollText({ children }: { children: string }) {
  return <span className="roll">
    <span className="sr-only">{children}</span>
    {[...children].map((char, index) => <span key={index} className="roll-c" aria-hidden="true" style={{ ["--i" as string]: index }}>{char === " " ? " " : char}</span>)}
  </span>;
}

export function Mark({ className }: { className?: string }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.6 2.4" />
    <circle cx="16" cy="16" r="3.4" fill="var(--signal)" />
  </svg>;
}

/** Provenance stays visible as text, never colour alone. */
export function ProvenanceTag({ value }: { value: string }) {
  return <span className="tag" data-tone={value === "synthetic" ? "synthetic" : "real"}>{PROVENANCE_LABEL[value] ?? value}</span>;
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "risk" | "signal" | "synthetic" }) {
  return <span className="tag" data-tone={tone}>{children}</span>;
}

export function Panel({ id, title, meta, children, className = "" }: { id?: string; title: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  const headingId = id ? `${id}-title` : undefined;
  return <section id={id} className={`panel ${className}`} aria-labelledby={headingId}>
    <header className="panel-h">
      <h2 id={headingId}>{title}</h2>
      {meta && <div className="panel-meta">{meta}</div>}
    </header>
    {children}
  </section>;
}

export function StateMessage({ kind, title, children, action }: {
  kind: "empty" | "loading" | "error" | "insufficient";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return <div className="state" data-kind={kind} role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined}>
    {kind === "loading" && <span className="state-bar" aria-hidden="true" />}
    <p className="state-title">{title}</p>
    {children && <div className="state-body">{children}</div>}
    {action}
  </div>;
}
