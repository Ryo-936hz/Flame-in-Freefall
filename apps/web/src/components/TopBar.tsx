import type { Health } from "../lib/client";
import { DATA_MODE_LABEL } from "../lib/format";
import { Mark, RollText, Tag } from "./ui";

const SECTIONS = [
  { href: "#brief", label: "Brief" },
  { href: "#canvas", label: "Evidence Canvas" },
  { href: "#evidence", label: "Evidencia" },
  { href: "#synthesis", label: "Síntesis" },
  { href: "#lab", label: "Lab" },
];

export default function TopBar({ health, offline, theme, onTheme }: {
  health: Health | null;
  offline: boolean;
  theme: "dark" | "light";
  onTheme: () => void;
}) {
  return <header className="topbar">
    <a className="brand roll-host" href="#brief">
      <Mark />
      <b><RollText>FlameLab SI</RollText></b>
      <span className="brand-team">Los TTS</span>
    </a>
    <nav className="nav" aria-label="Secciones">
      {SECTIONS.map((item) => <a key={item.href} className="nav-link roll-host" href={item.href}><RollText>{item.label}</RollText></a>)}
    </nav>
    <div className="status" aria-live="polite">
      {offline ? <Tag tone="risk">API sin conexión</Tag> : health ? <>
        <Tag tone={health.data_mode === "synthetic" ? "synthetic" : "neutral"}>{DATA_MODE_LABEL[health.data_mode] ?? health.data_mode}</Tag>
        <Tag tone={health.ai_provider === "demo" ? "neutral" : "signal"}>IA {health.ai_provider === "demo" ? "demo determinista" : health.ai_provider}</Tag>
        <span className="status-db">{health.database} · v{health.version}</span>
      </> : <span className="status-db">Conectando…</span>}
      <button type="button" className="icon-btn bracket" onClick={onTheme} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
        {theme === "dark"
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>}
      </button>
    </div>
  </header>;
}
