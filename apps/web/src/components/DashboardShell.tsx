import { Fragment, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import { useInk } from "../lib/motion";
import type { Health, Profile } from "../lib/client";
import { DATA_MODE_LABEL } from "../lib/format";
import { routeHash } from "../lib/route";
import type { View } from "../lib/route";
import { Icon } from "./icons";
import ThemeSwitch from "./ThemeSwitch";
import { Mark, RollText, Tag } from "./ui";

export const VIEW_META: Record<View, { label: string; summary: string }> = {
  overview: { label: "Overview", summary: "Corpus, latest investigation and system status at a glance." },
  investigate: { label: "Investigate", summary: "Describe the conditions, rank compatible trials and read each result with its source." },
  chat: { label: "Ask SI", summary: "Ask in your own words. Each question runs an investigation with the brief’s filters and answers with cited sources." },
  lab: { label: "Mission Lab", summary: "Compare two evidence scenarios side by side and run the approved BASS-II cases." },
  report: { label: "Report", summary: "Read, download or recover the saved report of a research record." },
  catalog: { label: "Catalog", summary: "Browse the imported studies, their sources and normalized observations." },
  saffire: { label: "Saffire context", summary: "Documentary scale context from published Saffire and BASS-II configurations. It adds no data points." },
};

const ORDER: View[] = ["overview", "investigate", "chat", "lab", "report", "catalog", "saffire"];
const GROUPS: { title: string; views: View[] }[] = [
  { title: "Workspace", views: ["overview", "investigate", "chat", "lab", "report"] },
  { title: "Reference", views: ["catalog", "saffire"] },
];

export function Sidebar({ view, health, profile, offline }: {
  view: View;
  health: Health | null;
  profile: Profile | null;
  offline: boolean;
}) {
  // Hover lighting: the pointer position feeds a soft spotlight drawn in CSS on the link under it.
  const light = (event: PointerEvent<HTMLElement>) => {
    const link = (event.target as Element).closest<HTMLElement>(".sb-link");
    if (!link) return;
    const box = link.getBoundingClientRect();
    link.style.setProperty("--mx", `${event.clientX - box.left}px`);
    link.style.setProperty("--my", `${event.clientY - box.top}px`);
  };
  return <aside className="sidebar" aria-label="Dashboard">
    <a className="sb-brand roll-host" href={routeHash({ page: "home" })} title="Back to the welcome page">
      <Mark />
      <span className="sb-text"><b><RollText>Ignition Protocol</RollText></b><small>Los TTS</small></span>
    </a>
    <nav className="sb-nav" aria-label="Views" onPointerMove={light}>
      {GROUPS.map(({ title, views }) => <Fragment key={title}>
        <p className="sb-group cap sb-text">{title}</p>
        {views.map((id) => <a key={id} className="sb-link" href={routeHash({ page: "dashboard", view: id })}
          aria-current={view === id ? "page" : undefined} title={VIEW_META[id].label}>
          <Icon name={id} /><span className="sb-text">{VIEW_META[id].label}</span>
        </a>)}
      </Fragment>)}
      <p className="sb-group cap sb-text">General</p>
      <a className="sb-link" href={routeHash({ page: "home" })} title="Welcome">
        <Icon name="home" /><span className="sb-text">Welcome</span>
      </a>
    </nav>
    <div className="sb-foot sb-text" aria-live="polite">
      {offline ? <Tag tone="risk">API offline</Tag> : health ? <>
        <div className="sb-tags">
          <Tag tone={health.data_mode === "synthetic" ? "synthetic" : "neutral"}>{DATA_MODE_LABEL[health.data_mode] ?? health.data_mode}</Tag>
          <Tag tone={health.ai_provider === "demo" ? "neutral" : "signal"}>AI {health.ai_provider === "demo" ? "deterministic demo" : health.ai_provider}</Tag>
        </div>
        {profile && <p className="num">{profile.n_studies} studies · {profile.n_trials} trials{profile.synthetic_trials ? ` (${profile.synthetic_trials} synthetic)` : ""}</p>}
        <p className="num">{health.database} · v{health.version}</p>
      </> : <p className="num">Connecting…</p>}
    </div>
  </aside>;
}

export function DashboardHeader({ view, theme, onTheme, onToggleSidebar, onResetAll, search }: {
  view: View;
  /** Search trigger shown between the breadcrumb and the actions. */
  search?: ReactNode;
  theme: "dark" | "light";
  onTheme: () => void;
  onToggleSidebar: () => void;
  onResetAll: () => void;
}) {
  return <header className="dash-header">
    <button type="button" className="icon-btn sb-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar" title="Toggle sidebar">
      <Icon name="panel" />
    </button>
    <nav className="crumbs" aria-label="Breadcrumb">
      <a href={routeHash({ page: "home" })}>Ignition Protocol</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{VIEW_META[view].label}</span>
    </nav>
    {search && <div className="dash-search">{search}</div>}
    <div className="dash-actions">
      <button type="button" className="btn small" onClick={onResetAll} title="Clear results, selection and filters">
        <Icon name="reset" /> Reset
      </button>
      <ThemeSwitch theme={theme} onToggle={onTheme} />
    </div>
  </header>;
}

/** Horizontal tabs that replace the sidebar on narrow screens. */
export function MobileTabs({ view }: { view: View }) {
  const nav = useRef<HTMLElement>(null);
  useInk(nav, [view]);
  return <nav className="mobile-tabs" aria-label="Views (compact)" ref={nav}>
    <span className="ink" aria-hidden="true" />
    {ORDER.map((id) => <a key={id} className="roll-host" href={routeHash({ page: "dashboard", view: id })} aria-current={view === id ? "page" : undefined}>
      <RollText>{VIEW_META[id].label}</RollText>
    </a>)}
  </nav>;
}
