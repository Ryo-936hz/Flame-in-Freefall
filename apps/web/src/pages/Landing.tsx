import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Health, Profile } from "../lib/client";
import { DATA_MODE_LABEL } from "../lib/format";
import { gsap, prefersReducedMotion, reveal, useGSAP, useInk, useRollHover } from "../lib/motion";
import { routeHash } from "../lib/route";
import type { View } from "../lib/route";
import FlameIllustration from "../components/FlameIllustration";
import { VIEW_META } from "../components/DashboardShell";
import { Icon } from "../components/icons";
import ThemeSwitch from "../components/ThemeSwitch";
import { Mark, RollText, Tag } from "../components/ui";

const SECTIONS = [
  { id: "how", label: "How it works" },
  { id: "workspace", label: "Workspace" },
  { id: "principles", label: "Principles" },
];

const STEPS: { title: string; body: string }[] = [
  { title: "Describe the scenario", body: "Write the question and set the conditions that matter: gravity, oxygen, pressure, flow, material." },
  { title: "Rank compatible trials", body: "Eligibility rules filter first. Only then are the remaining trials ordered by similarity, with their information coverage shown apart." },
  { title: "Open the evidence", body: "Every chart point, table row and citation opens the source text it came from, with its locator and provenance." },
];

const PRINCIPLES: { title: string; body: string }[] = [
  { title: "Labels stay on", body: "Synthetic fixtures, AI hypotheses and illustrative animations keep their label in the dashboard and in reports." },
  { title: "Code computes, AI explains", body: "Filters, rankings and comparisons run in verifiable code. The assistant explains results and never reorders them." },
  { title: "Missing is not zero", body: "Absent values keep their status. When the evidence is not enough, the answer says so and lists what is missing." },
];

const VIEWS: View[] = ["investigate", "chat", "lab", "report", "catalog"];

function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <div className="stat">
    <p className="cap">{label}</p>
    <p className="stat-value num">{value}</p>
    {note && <p className="stat-note">{note}</p>}
  </div>;
}

export default function Landing({ health, profile, offline, onRetry, theme, onTheme, flame }: {
  health: Health | null;
  profile: Profile | null;
  offline: string | null;
  onRetry: () => void;
  theme: "dark" | "light";
  onTheme: () => void;
  flame: { gravityLabel: string | null; o2: number | null; flow: number | null };
}) {
  const root = useRef<HTMLDivElement>(null);
  const links = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);
  useRollHover(root);
  useInk(links, [active], "line");

  // Scroll spy: the section nearest the top of the viewport marks its nav link.
  useEffect(() => {
    const sections = SECTIONS.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
      else if (window.scrollY < 200) setActive(null);
    }, { rootMargin: "-80px 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Nav links glide to their section; its heading and items then rise in.
  const scrollToSection = (id: string | null) => {
    const target = id ? document.getElementById(id) : null;
    const reduce = prefersReducedMotion();
    const y = target ? target.getBoundingClientRect().top + window.scrollY - 72 : 0;
    if (reduce) { window.scrollTo({ top: y }); return; }
    gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 0.9, ease: "power3.inOut" });
    if (target) gsap.fromTo(target.querySelectorAll(".section-head > *, .card, .principles > div"), { y: 18, opacity: 0.2 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, delay: 0.45, ease: "power3.out", clearProps: "transform,opacity" });
  };

  useGSAP(() => reveal((tl) => {
    tl.from(".hero-copy > *", { y: 16, opacity: 0, stagger: 0.07, duration: 0.8 })
      .from(".hero-art", { opacity: 0, scale: 0.97, duration: 0.9 }, 0.15)
      .from(".stat", { y: 12, opacity: 0, stagger: 0.06, duration: 0.6 }, 0.3);
  }), { scope: root });

  return <div className="landing" ref={root}>
    <header className="land-nav">
      <a className="sb-brand roll-host" href={routeHash({ page: "home" })}
        onClick={(event) => { event.preventDefault(); scrollToSection(null); }}>
        <Mark />
        <span><b><RollText>Ignition Protocol</RollText></b><small>Los TTS</small></span>
      </a>
      <nav className="land-links" aria-label="Welcome page" ref={links}>
        <span className="ink" aria-hidden="true" />
        {SECTIONS.map(({ id, label }) => <a key={id} href={`#${id}`} className="roll-host" data-active={active === id ? "true" : undefined}
          onClick={(event) => { event.preventDefault(); scrollToSection(id); }}>
          <RollText>{label}</RollText>
        </a>)}
      </nav>
      <div className="land-actions">
        <ThemeSwitch theme={theme} onToggle={onTheme} />
        <a className="btn primary roll-host" href={routeHash({ page: "dashboard", view: "overview" })}><RollText>Open dashboard</RollText></a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">NASA Space Apps 2026 · Flame in Freefall</p>
          <h1>Find the combustion experiments that answer your fire-safety question.</h1>
          <p className="lede">Ignition Protocol gathers microgravity combustion studies, compares the trials that match a spacecraft
            or habitat scenario, and shows the source behind every result.</p>
          <div className="hero-cta">
            <a className="btn primary lg" href={routeHash({ page: "dashboard", view: "investigate" })}>Start an investigation <Icon name="arrow" /></a>
            <a className="btn lg" href="#how" onClick={(event) => { event.preventDefault(); scrollToSection("how"); }}>How it works</a>
          </div>
        </div>
        <div className="hero-art">
          <FlameIllustration {...flame} />
        </div>
      </section>

      <section className="stats" aria-label="Active corpus">
        {offline ? <div className="stats-offline">
          <Tag tone="risk">API offline</Tag>
          <p>The corpus figures load from the local API. Start it with <code>scripts/dev-api.ps1</code>.</p>
          <button type="button" className="btn small" onClick={onRetry}>Retry connection</button>
        </div> : <>
          <Stat label="Studies" value={profile?.n_studies ?? "…"} />
          <Stat label="Trials" value={profile?.n_trials ?? "…"} note={profile ? (profile.synthetic_trials ? `${profile.synthetic_trials} synthetic, not NASA measurements` : "No synthetic trials") : undefined} />
          <Stat label="Observations" value={profile?.n_observations ?? "…"} />
          <Stat label="Independent units" value={profile?.n_independent_units ?? "…"} note="Rows and frames are not replicates" />
          <Stat label="Data mode" value={<span className="stat-mode">{health ? DATA_MODE_LABEL[health.data_mode] ?? health.data_mode : "…"}</span>}
            note={health ? `AI ${health.ai_provider === "demo" ? "deterministic demo" : health.ai_provider}` : undefined} />
        </>}
      </section>

      <section className="land-section" id="how" aria-labelledby="how-title">
        <div className="section-head">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">Three steps from question to source</h2>
        </div>
        <ol className="steps">
          {STEPS.map((step, index) => <li key={step.title} className="card">
            <span className="step-n num">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>)}
        </ol>
      </section>

      <section className="land-section" id="workspace" aria-labelledby="workspace-title">
        <div className="section-head">
          <p className="eyebrow">Workspace</p>
          <h2 id="workspace-title">One view at a time</h2>
        </div>
        <div className="view-cards">
          {VIEWS.map((view) => <a key={view} className="card view-card" href={routeHash({ page: "dashboard", view })}>
            <span className="view-icon"><Icon name={view} /></span>
            <h3>{VIEW_META[view].label}</h3>
            <p>{VIEW_META[view].summary}</p>
            <span className="view-go">Open <Icon name="arrow" /></span>
          </a>)}
        </div>
      </section>

      <section className="land-section" id="principles" aria-labelledby="principles-title">
        <div className="section-head">
          <p className="eyebrow">Principles</p>
          <h2 id="principles-title">What the results promise, and what they don’t</h2>
        </div>
        <div className="principles">
          {PRINCIPLES.map((item) => <div key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>)}
        </div>
      </section>
    </main>

    <footer className="foot">
      <span>Ignition Protocol · Los TTS · NASA Space Apps 2026 “Flame in Freefall”</span>
      <span>Visual direction inspired by control-system software; no affiliation or third-party assets.</span>
    </footer>
  </div>;
}
