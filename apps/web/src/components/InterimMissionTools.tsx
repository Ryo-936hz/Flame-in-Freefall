import { useState } from "react";
import type { Api, RankingRequest, ResearchResponse, ScenarioComparison } from "../lib/client";
import { ApiError } from "../lib/client";
import { reasonText, shortId } from "../lib/format";
import { Panel, StateMessage, Tag } from "./ui";

/**
 * Proposed mount contract for P6's MissionLabPanel and ReportPanel. P5 renders
 * whatever implements it in App; until P6 publishes those modules this interim
 * panel keeps the harness capabilities (A/B, report, replay, recovery) reachable.
 */
export interface MissionSlotProps {
  api: Api;
  research: ResearchResponse | null;
  /** Filters of the active research, as sent to the API. */
  request: RankingRequest | null;
  onOpenRun: (run: ResearchResponse) => void;
  onOpenEvidence: (evidenceId: string, trialId: string | null) => void;
}

function message(error: unknown): string {
  return error instanceof ApiError ? `${error.message} (${error.code})` : "No se pudo completar la operación.";
}

export default function InterimMissionTools({ api, research, request, onOpenRun }: MissionSlotProps) {
  const [scenario, setScenario] = useState<ScenarioComparison | null>(null);
  const [text, setText] = useState<{ title: string; body: string } | null>(null);
  const [runId, setRunId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); } catch (reason) { setError(message(reason)); } finally { setBusy(false); }
  }

  const compareLunar = () => run(async () => {
    if (!request) return;
    setScenario(await api.scenarios({
      name_a: "A · filtros actuales",
      name_b: "B · gravedad lunar",
      scenario_a: request,
      scenario_b: {
        ...request,
        target: { ...request.target, gravity_regime: "lunar" },
        required_match: [...new Set([...(request.required_match ?? []), "gravity_regime" as const])],
        vary: (request.vary ?? []).filter((key) => key !== "gravity_regime"),
      },
    }));
  });

  return <Panel id="lab" title="Mission Lab · provisional" className="lab"
    meta={<Tag tone="warn">Montaje provisional hasta los paneles de P6</Tag>}>
    <div className="panel-b lab-grid">
      <section aria-labelledby="ab-title">
        <h3 id="ab-title" className="cap">Escenario A/B</h3>
        <p className="hint">Compara qué evidencia es aplicable. No simula la combustión ni predice seguridad.</p>
        <button type="button" className="btn" disabled={busy || !request} onClick={compareLunar}>Comparar con gravedad lunar</button>
        {scenario && <div className="ab">
          {([[scenario.name_a, scenario.ranking_a], [scenario.name_b, scenario.ranking_b]] as const).map(([name, ranking]) => <div key={name} className="ab-col">
            <p><b>{name}</b></p>
            <p className="num big">{ranking.items.length} <small>elegibles</small></p>
            <ul>{ranking.items.map((item) => <li key={item.trial_id} className="id">{shortId(item.trial_id)}</li>)}</ul>
            {!ranking.items.length && <ul className="reasons">{[...new Set(ranking.excluded.flatMap((item) => item.reasons))].map((reason) => <li key={reason}>{reasonText(reason)}</li>)}</ul>}
          </div>)}
        </div>}
      </section>

      <section aria-labelledby="report-title">
        <h3 id="report-title" className="cap">Expediente</h3>
        <div className="actions">
          <button type="button" className="btn" disabled={busy || !research} onClick={() => run(async () => { if (research) setText({ title: "Informe persistido · Markdown sin ejecutar", body: await api.report(research.id) }); })}>Abrir informe</button>
          <button type="button" className="btn" disabled={busy || !research} onClick={() => run(async () => { if (research) setText({ title: "Eventos guardados · reproducción, no en vivo", body: await api.events(research.id) }); })}>Reproducir eventos</button>
        </div>
        <form className="recover" onSubmit={(event) => { event.preventDefault(); const id = runId.trim(); if (id) run(async () => onOpenRun(await api.getResearch(id))); }}>
          <label className="field"><span className="cap">Recuperar investigación guardada</span>
            <input className="input" value={runId} onChange={(event) => setRunId(event.target.value)} placeholder={research?.id ?? "research:…"} />
          </label>
          <button type="submit" className="btn" disabled={busy || !runId.trim()}>Recuperar</button>
        </form>
      </section>
      {error && <div className="lab-full"><StateMessage kind="error" title="Operación no completada"><p>{error}</p></StateMessage></div>}
      {text && <div className="lab-full"><p className="cap">{text.title}</p><pre className="ev-text">{text.body}</pre></div>}
    </div>
  </Panel>;
}
