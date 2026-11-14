import { useEffect, useId, useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import type { Api, Health, Models } from "../lib/client";
import { DATA_MODE_LABEL } from "../lib/format";
import { tx } from "../lib/backendText";
import { Mark, Tag } from "./ui";

export const SECTIONS = [
  { id: "dashboard", label: "Overview", title: "Research overview", keywords: "home dashboard start dataset corpus" },
  { id: "chat", label: "Ask FlameLab", title: "Ask FlameLab", keywords: "chat qwen questions how to data" },
  { id: "brief", label: "Filters", title: "Research filters", keywords: "gravity oxygen pressure material habitats metric form" },
  { id: "canvas", label: "Charts", title: "Data visualizations", keywords: "chart graph scatter plot table csv observations metrics" },
  { id: "ranking", label: "Relevance ranking", title: "Evidence by relevance", keywords: "top global rank similarity coverage gower" },
  { id: "synthesis", label: "Synthesis", title: "Findings & interpretation", keywords: "ai si summary citations claims hypotheses limits" },
  { id: "lab", label: "Compare A/B", title: "Scenario comparison", keywords: "lab scenarios compare BASS II lunar report recovery" },
  { id: "compare-studies", label: "Compare studies", title: "Study comparison", keywords: "compare campaigns graphs bars" },
  { id: "catalog", label: "Study catalog", title: "Study catalog", keywords: "studies research PSI datasets NASA normalized records" },
  { id: "evidence", label: "Evidence", title: "Source reader", keywords: "sources documents original evidence references citations" },
  { id: "saffire", label: "Saffire context", title: "Combustion at spacecraft scale", keywords: "Saffire Cygnus published context transfer scale" },
] as const;

export type Section = (typeof SECTIONS)[number]["id"];

const NAV_GROUPS: { label: string; sections: [Section, ...Section[]] }[] = [
  { label: "Overview", sections: ["dashboard"] },
  { label: "Ask FlameLab", sections: ["chat"] },
  { label: "Research", sections: ["canvas", "brief", "ranking", "synthesis"] },
  { label: "Compare", sections: ["lab", "compare-studies"] },
  { label: "Library", sections: ["catalog", "evidence", "saffire"] },
];

function navigateSection(event: React.MouseEvent<HTMLAnchorElement>, id: Section, onNavigate: (section: Section) => void) {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  event.preventDefault();
  onNavigate(id);
}

const SECTION_ICONS: Record<Section, string> = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  chat: "M4 4h16v12H9l-5 4z M8 8h8 M8 12h5",
  brief: "M4 4h16v12H9l-5 4z M8 8h8 M8 12h6",
  canvas: "M4 4v16h16 M8 16l4-6 4 2 4-6",
  ranking: "M4 20h16 M5 12h4v8H5z M10 4h4v16h-4z M15 8h4v12h-4z",
  synthesis: "M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7",
  lab: "M7 4v16 M17 4v16 M3 9h8 M13 15h8 M7 6v6 M17 12v6",
  "compare-studies": "M4 20h16 M6 17v-6 M12 17V5 M18 17V8",
  catalog: "M4 4h5v16H4z M9 4h5v16H9z M14 5l5-1 3 15-5 1z",
  evidence: "M9 15l6-6 M8 17l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0 M16 7l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
  saffire: "M12 2v20 M2 12h20 M8 8h8v8H8z",
};

export function DashboardNav({ active, onNavigate }: { active: Section; onNavigate: (section: Section) => void }) {
  return <nav className="dashboard-nav" aria-label="Dashboard sections">
    {NAV_GROUPS.map(({ sections: [id, ...children], label }) => <a className="nav-link" key={id} href={`#${id}`}
      aria-current={active === id || children.includes(active) ? children.length ? "location" : "page" : undefined}
      onClick={(event) => navigateSection(event, id, onNavigate)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={SECTION_ICONS[id]} />
      </svg>
      {label}
    </a>)}
    <a className="nav-link dashboard-intro-link" href="#intro">Introduction</a>
  </nav>;
}

export function DashboardSubnav({ active, onNavigate }: { active: Section; onNavigate: (section: Section) => void }) {
  const group = NAV_GROUPS.find(({ sections }) => sections.includes(active));
  if (!group || group.sections.length < 2) return null;
  return <nav className="dashboard-subnav" aria-label={`${group.label} views`}>
    {group.sections.map((id) => <a key={id} href={`#${id}`} aria-current={active === id ? "page" : undefined}
      onClick={(event) => navigateSection(event, id, onNavigate)}>{SECTIONS.find((section) => section.id === id)?.label}</a>)}
  </nav>;
}

type SearchEntry = {
  id: string;
  type: "Section" | "Study" | "Trial" | "Source";
  label: string;
  keywords: string;
  open: () => void;
};

function searchText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ").trim();
}

function DashboardSearch({ api, trials, onNavigate, onOpenStudy, onOpenSource }: {
  api: Api;
  trials: Models["Trial"][];
  onNavigate: (section: Section) => void;
  onOpenStudy: (studyId: string) => void;
  onOpenSource: (trial: Models["Trial"], evidenceId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [studies, setStudies] = useState<Models["Study"][] | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const term = searchText(query);
  const words = term ? term.split(" ") : [];
  const shouldFetch = open && words.length > 0 && studies === null && !failed;

  useEffect(() => {
    if (!shouldFetch) return;
    let current = true;
    api.studies().then((items) => { if (current) setStudies(items); }, () => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [api, shouldFetch]);

  const trialIndex = useMemo(() => {
    const trialEntries: SearchEntry[] = [];
    const sourceEntries = new Map<string, SearchEntry>();
    for (const trial of trials) {
      const scopes = [trial, ...(trial.segments ?? [])];
      const conditions = scopes.flatMap(({ conditions }) => Object.values(conditions));
      const refs = [
        ...scopes.flatMap(({ evidence_ids }) => evidence_ids),
        ...conditions.flatMap(({ evidence_ids }) => evidence_ids ?? []),
      ];
      const first = refs[0];
      const label = tx(trial.label);
      trialEntries.push({
        id: trial.id, type: "Trial", label,
        keywords: [trial.study_id, trial.label, ...conditions.map(({ value }) => value ?? "")].join(" "),
        open: () => first ? onOpenSource(trial, first) : onOpenStudy(trial.study_id),
      });
      for (const id of refs) {
        if (!sourceEntries.has(id)) sourceEntries.set(id, {
          id, type: "Source", label: id, keywords: "", open: () => onOpenSource(trial, id),
        });
      }
    }
    return [...trialEntries, ...sourceEntries.values()].map(indexEntry);
  }, [trials, onOpenStudy, onOpenSource]);
  const sectionIndex = useMemo(() => SECTIONS.map(({ id, label, title, keywords }) => indexEntry({
    id, type: "Section", label, keywords: `${title} ${keywords}`, open: () => onNavigate(id),
  })), [onNavigate]);
  const studyIndex = useMemo(() => (studies ?? []).map((study) => indexEntry({
    id: study.id, type: "Study", label: study.title,
    keywords: `${study.family} ${study.description ?? ""}`, open: () => onOpenStudy(study.id),
  })), [studies, onOpenStudy]);
  const showResults = open && words.length > 0;
  const matches = showResults ? [...sectionIndex, ...studyIndex, ...trialIndex]
    .filter(({ searchable }) => words.every((word) => searchable.includes(word))) : [];
  const exact = matches.find(({ normalizedId, normalizedLabel }) => term === normalizedId || term === normalizedLabel);
  const entries = exact ? [exact, ...matches.filter((item) => item !== exact)].slice(0, 9) : matches.slice(0, 9);
  const choose = (entry: SearchEntry) => {
    setQuery("");
    setOpen(false);
    entry.open();
  };

  return <form className="dashboard-search" role="search"
    onSubmit={(event) => { event.preventDefault(); if (entries[0]) choose(entries[0]); }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => {
      if (event.key === "Escape") { input.current?.focus(); setOpen(false); }
    }}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
    <input ref={input} type="search" aria-label="Search studies, trials and sections"
      aria-controls={showResults ? resultsId : undefined} placeholder="Search studies, trials and sections"
      value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); setFailed(false); }}
      onFocus={() => setOpen(true)} />
    {showResults && <div className="dashboard-search-results" id={resultsId}>
      {entries.length > 0 && <ul aria-label="Search results">
        {entries.map((entry) => <li key={`${entry.type}:${entry.id}`}>
          <button type="button" onClick={() => choose(entry)}>
            <span>{entry.label}</span><small>{entry.type}{entry.type === "Section" || entry.type === "Source" ? "" : ` · ${entry.id}`}</small>
          </button>
        </li>)}
      </ul>}
      {shouldFetch && <p role="status">Searching the study catalog…</p>}
      {failed && <p role="status">Study catalog unavailable. <button type="button" onClick={() => setFailed(false)}>Retry</button></p>}
      {!entries.length && !shouldFetch && !failed && <p role="status">No matching studies, trials, sources or sections.</p>}
    </div>}
  </form>;
}

function indexEntry(entry: SearchEntry) {
  return {
    ...entry,
    searchable: searchText(`${entry.label} ${entry.keywords} ${entry.id}`),
    normalizedId: searchText(entry.id),
    normalizedLabel: searchText(entry.label),
  };
}

export default function TopBar({ api, trials, health, offline, theme, onTheme, onNavigate, onOpenStudy, onOpenSource, onResetAll }: {
  api: Api;
  trials: Models["Trial"][];
  health: Health | null;
  offline: boolean;
  theme: "dark" | "light";
  onTheme: () => void;
  onNavigate: (section: Section) => void;
  onOpenStudy: (studyId: string) => void;
  onOpenSource: (trial: Models["Trial"], evidenceId: string) => void;
  onResetAll: () => void;
}) {
  return <header className="topbar dashboard-topbar">
    <a className="brand" href="#dashboard" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      onNavigate("dashboard");
    }}>
      <Mark />
      <b>FlameLab SI</b>
    </a>
    <DashboardSearch api={api} trials={trials} onNavigate={onNavigate} onOpenStudy={onOpenStudy} onOpenSource={onOpenSource} />
    <div className="status">
      <span className="dashboard-status" aria-live="polite">
        {offline ? <Tag tone="risk">API offline</Tag> : health
          ? <Tag tone={health.data_mode === "synthetic" ? "synthetic" : "neutral"}>{DATA_MODE_LABEL[health.data_mode] ?? health.data_mode}</Tag>
          : <span className="status-db">Connecting…</span>}
      </span>
      <button type="button" className="reset-all" onClick={onResetAll} title="Clear results, selection and filters">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
        Reset
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
