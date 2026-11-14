import { useRef, useState } from "react";
import type { Health } from "../lib/client";
import { DATA_MODE_LABEL } from "../lib/format";
import { Mark, RollText, Tag } from "./ui";

const SECTIONS = [
  { id: "brief", label: "Brief" },
  { id: "canvas", label: "Evidence Canvas" },
  { id: "evidence", label: "Evidence" },
  { id: "synthesis", label: "Synthesis" },
  { id: "lab", label: "Lab" },
];

/**
 * Section links. Brief and Evidence live in sticky columns that are always on
 * screen, so a plain anchor would look inert: every jump also highlights the
 * target panel and moves focus to its heading.
 */
function SectionNav({ available }: { available: string[] }) {
  const [active, setActive] = useState("brief");
  const timer = useRef<number | undefined>(undefined);

  const go = (id: string) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startTop = panel.getBoundingClientRect().top;
    panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // Some embedded or throttled browsers never run smooth scrolling: jump if nothing moved.
    window.setTimeout(() => {
      if (Math.abs(panel.getBoundingClientRect().top - startTop) < 2) panel.scrollIntoView({ block: "start" });
    }, 400);
    const heading = panel.querySelector<HTMLElement>("h2");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    // Restart the highlight even when the same panel is chosen twice.
    panel.dataset.flash = "false";
    void panel.offsetWidth;
    panel.dataset.flash = "true";
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { panel.dataset.flash = "false"; }, 1300);
    setActive(id);
  };

  return <nav className="nav" aria-label="Sections">
    {SECTIONS.map(({ id, label }) => {
      const enabled = available.includes(id);
      return <a key={id} href={`#${id}`} className="nav-link roll-host"
        aria-current={active === id ? "location" : undefined}
        aria-disabled={!enabled || undefined}
        title={enabled ? undefined : "Run an investigation first"}
        onClick={(event) => { event.preventDefault(); if (enabled) go(id); }}>
        <RollText>{label}</RollText>
      </a>;
    })}
  </nav>;
}

export default function TopBar({ health, offline, theme, onTheme, sections }: {
  health: Health | null;
  offline: boolean;
  theme: "dark" | "light";
  onTheme: () => void;
  /** IDs of the sections currently rendered. */
  sections: string[];
}) {
  return <header className="topbar">
    <a className="brand roll-host" href="#brief">
      <Mark />
      <b><RollText>FlameLab SI</RollText></b>
      <span className="brand-team">Los TTS</span>
    </a>
    <SectionNav available={sections} />
    <div className="status" aria-live="polite">
      {offline ? <Tag tone="risk">API offline</Tag> : health ? <>
        <Tag tone={health.data_mode === "synthetic" ? "synthetic" : "neutral"}>{DATA_MODE_LABEL[health.data_mode] ?? health.data_mode}</Tag>
        <Tag tone={health.ai_provider === "demo" ? "neutral" : "signal"}>AI {health.ai_provider === "demo" ? "deterministic demo" : health.ai_provider}</Tag>
        <span className="status-db">{health.database} · v{health.version}</span>
      </> : <span className="status-db">Connecting…</span>}
      <button type="button" className="icon-btn bracket" onClick={onTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
        {theme === "dark"
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>}
      </button>
    </div>
  </header>;
}
