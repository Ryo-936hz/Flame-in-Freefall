import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import type { Health } from "../lib/client";
import { DATA_MODE_LABEL } from "../lib/format";
import { Mark, RollText, Tag } from "./ui";

export const WORKSPACE_PAGES = [
  { id: "research", label: "Research" },
  { id: "results", label: "Results" },
  { id: "lab", label: "Lab" },
  { id: "library", label: "Library" },
  { id: "reports", label: "Reports" },
] as const;
export type WorkspacePage = typeof WORKSPACE_PAGES[number]["id"];

export default function TopBar({ health, offline, theme, onTheme, activePage, onNavigate, onResetAll }: {
  health: Health | null;
  offline: boolean;
  theme: "dark" | "light";
  onTheme: () => void;
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
  onResetAll: () => void;
}) {
  return <header className="topbar">
    <a className="brand roll-host" href="#research" onClick={(event) => { event.preventDefault(); onNavigate("research"); }}>
      <Mark /><b><RollText>FlameLab SI</RollText></b>
    </a>
    <nav className="nav" aria-label="Workspace">
      {WORKSPACE_PAGES.map(({ id, label }) => <a key={id} href={`#${id}`} className="nav-link"
        aria-current={activePage === id ? "page" : undefined}
        onClick={(event) => { event.preventDefault(); onNavigate(id); }}>{label}</a>)}
    </nav>
    <div className="status">
      <div className="status-modes" aria-live="polite">
        {offline ? <Tag tone="risk">API offline</Tag> : health ? <>
          <Tag tone={health.data_mode === "synthetic" ? "synthetic" : "neutral"}>{DATA_MODE_LABEL[health.data_mode] ?? health.data_mode}</Tag>
          <Tag tone="neutral">{health.ai_provider === "demo" ? "AI demo" : `AI ${health.ai_provider}`}</Tag>
        </> : <span className="status-db">Connecting…</span>}
      </div>
      <button type="button" className="reset-all" onClick={onResetAll} title="Clear results, selection and filters">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>Reset
      </button>
      <ThemeSwitch theme={theme} onToggle={onTheme} />
    </div>
  </header>;
}

const SUN = <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const MOON = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>;

/** Labelled day/night switch; the knob slides with GSAP and the icon spins in. */
function ThemeSwitch({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const first = useRef(true);
  const dark = theme === "dark";
  useGSAP(() => {
    const knob = ref.current?.querySelector(".ts-knob");
    if (!knob) return;
    const x = dark ? 0 : (ref.current!.querySelector(".ts-track") as HTMLElement).offsetWidth - (knob as HTMLElement).offsetWidth - 4;
    if (first.current || prefersReducedMotion()) { gsap.set(knob, { x }); first.current = false; return; }
    const slide = gsap.to(knob, { x, duration: 0.55, ease: "back.out(1.6)" });
    window.setTimeout(() => slide.progress(1), 900);
    gsap.fromTo(ref.current!.querySelector(".ts-knob svg"), { rotate: -120, scale: 0.4 }, { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(2)" });
    gsap.fromTo(ref.current!.querySelector(".ts-label"), { y: dark ? -8 : 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
  }, { dependencies: [dark], scope: ref });

  return <button ref={ref} type="button" role="switch" aria-checked={dark} className="theme-switch" onClick={onToggle}
    aria-label="Night mode" title={dark ? "Switch to day mode" : "Switch to night mode"}>
    <span className="ts-track" aria-hidden="true">
      <span className="ts-icon ts-moon">{MOON}</span>
      <span className="ts-icon ts-sun">{SUN}</span>
      <span className="ts-knob">{dark ? MOON : SUN}</span>
    </span>
    <span className="ts-label" aria-hidden="true">{dark ? "Night" : "Day"}</span>
  </button>;
}
