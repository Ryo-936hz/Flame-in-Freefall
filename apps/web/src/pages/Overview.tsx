import type { ReactNode } from "react";
import type { Health, Profile, ResearchResponse } from "../lib/client";
import { DATA_MODE_LABEL, ELIGIBILITY_LABEL, fmt, pct, shortId } from "../lib/format";
import { tx } from "../lib/backendText";
import { routeHash } from "../lib/route";
import { Icon } from "../components/icons";
import { StateMessage, Tag } from "../components/ui";

function Kpi({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <div className="stat">
    <p className="cap">{label}</p>
    <p className="stat-value num">{value}</p>
    {note && <p className="stat-note">{note}</p>}
  </div>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="ov-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

/** Summary first: corpus figures, the latest research record and the system state. Detail lives in the other views. */
export default function Overview({ health, profile, offline, runState, result, labels }: {
  health: Health | null;
  profile: Profile | null;
  offline: string | null;
  runState: "idle" | "loading" | "error" | "ready";
  result: ResearchResponse | null;
  labels: Map<string, string>;
}) {
  const top = result?.ranking.items[0];
  const synthetic = profile?.synthetic_trials ?? 0;

  return <>
    <section className="stats" aria-label="Active corpus">
      <Kpi label="Studies" value={profile?.n_studies ?? "…"} />
      <Kpi label="Trials" value={profile?.n_trials ?? "…"} note={profile ? (synthetic ? `${synthetic} synthetic, not NASA measurements` : "No synthetic trials") : undefined} />
      <Kpi label="Observations" value={profile?.n_observations ?? "…"} />
      <Kpi label="Independent units" value={profile?.n_independent_units ?? "…"} note="Rows and frames are not replicates" />
    </section>

    <div className="ov-grid">
      <section className="card ov-card" aria-labelledby="ov-latest">
        <div className="ov-card-h">
          <h2 id="ov-latest">Latest investigation</h2>
          {result && <Tag tone={result.status === "completed" ? "signal" : "warn"}>{result.status === "completed" ? "Completed" : "Insufficient evidence"}</Tag>}
        </div>
        {runState === "loading" && <StateMessage kind="loading" title="Investigation running…" />}
        {runState === "error" && <StateMessage kind="error" title="The last investigation did not complete">
          <p>Open Investigate to see the error and retry.</p>
        </StateMessage>}
        {!result && runState === "idle" && <div className="ov-empty">
          <p>No investigation in this session yet. Describe the scenario in Investigate, or recover a saved record from Report.</p>
          <div className="hero-cta">
            <a className="btn primary" href={routeHash({ page: "dashboard", view: "investigate" })}>Start an investigation <Icon name="arrow" /></a>
            <a className="btn" href={routeHash({ page: "dashboard", view: "report" })}>Recover a record</a>
          </div>
        </div>}
        {result && <>
          <p className="ov-question">“{result.question}”</p>
          <p className="ov-summary">{tx(result.summary)}</p>
          <div className="ov-mini">
            <Kpi label="Eligible trials" value={result.ranking.items.length} />
            <Kpi label="Excluded" value={result.ranking.excluded.length} />
            <Kpi label="Compared obs." value={result.comparison?.points.length ?? 0} />
            <Kpi label="Cited claims" value={result.claims.length} />
          </div>
          {top && <dl className="ov-list">
            <Row label="First candidate">{labels.get(top.trial_id) ?? shortId(top.trial_id)}</Row>
            <Row label="Similarity · coverage"><span className="num">{fmt(top.similarity)} · {pct(top.coverage)}</span></Row>
            <Row label="Eligibility">{ELIGIBILITY_LABEL[top.eligibility] ?? top.eligibility}</Row>
          </dl>}
          <p className="hint">Similarity orders eligible trials; it is not a probability, a confidence or a hazard.</p>
          <dl className="ov-list">
            <Row label="Record"><span className="id">{result.id}</span></Row>
            <Row label="Created"><span className="num">{new Date(result.created_at).toLocaleString("en-GB")}</span></Row>
          </dl>
          <div className="hero-cta">
            <a className="btn primary" href={routeHash({ page: "dashboard", view: "investigate" })}>Open results <Icon name="arrow" /></a>
            <a className="btn" href={routeHash({ page: "dashboard", view: "report" })}>Open report</a>
          </div>
        </>}
      </section>

      <section className="card ov-card" aria-labelledby="ov-system">
        <div className="ov-card-h">
          <h2 id="ov-system">System</h2>
          {offline ? <Tag tone="risk">API offline</Tag> : health && <Tag tone={health.status === "ok" ? "neutral" : "warn"}>API {health.status}</Tag>}
        </div>
        {offline ? <p className="muted">{offline}</p> : <dl className="ov-list">
          <Row label="Data mode">{health ? DATA_MODE_LABEL[health.data_mode] ?? health.data_mode : "…"}</Row>
          <Row label="AI">{health ? (health.ai_provider === "demo" ? "Deterministic demo · no LLM" : health.ai_provider) : "…"}</Row>
          <Row label="Dataset"><span className="id">{profile?.dataset_id ?? "…"}</span></Row>
          <Row label="Database"><span className="num">{health?.database ?? "…"}</span></Row>
          <Row label="Version"><span className="num">{health ? `v${health.version}` : "…"}</span></Row>
        </dl>}
        {profile && profile.issues.length > 0 && <p className="hint">{profile.issues.length} corpus {profile.issues.length === 1 ? "issue" : "issues"} reported by the profile.</p>}
      </section>
    </div>
  </>;
}
