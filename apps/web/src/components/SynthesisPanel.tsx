import { useState } from "react";
import type { ResearchResponse } from "../lib/client";
import { shortId } from "../lib/format";
import { Panel, Tag } from "./ui";

const KIND = { finding: "Hallazgo", inference: "Inferencia", limitation: "Límite" } as const;
const STAGE = { plan: "Plan", retrieve: "Recuperar", analyze: "Analizar", review: "Revisar", complete: "Completo", error: "Error" } as const;

/** Claims, hypotheses, tool activity and limitations, each with its own label. */
export default function SynthesisPanel({ result, onCite }: { result: ResearchResponse; onCite: (evidenceId: string, trialId: string | null) => void }) {
  const [allWarnings, setAllWarnings] = useState(false);
  const warnings = allWarnings ? result.warnings : result.warnings.slice(0, 4);
  return <Panel id="synthesis" title="Síntesis y límites" className="synthesis"
    meta={<Tag tone={result.provider === "demo" ? "neutral" : "signal"}>{result.provider === "demo" ? "Coordinador determinista · sin LLM" : `Síntesis externa · ${result.provider}`}</Tag>}>
    <div className="panel-b synth-grid">
      <section aria-labelledby="claims-title">
        <h3 id="claims-title" className="cap">Afirmaciones citadas</h3>
        {result.claims.length ? <ol className="claims">{result.claims.map((claim, index) => <li key={index}>
          <Tag tone={claim.kind === "limitation" ? "warn" : "neutral"}>{KIND[claim.kind]}</Tag>
          <p>{claim.text}</p>
          <div className="cites">{claim.citations.map((citation, i) => <button type="button" key={i} className="chip"
            onClick={() => onCite(citation.evidence_id, citation.trial_id ?? null)}>{shortId(citation.evidence_id)}</button>)}</div>
        </li>)}</ol> : <p className="muted">Sin afirmaciones: la evidencia no lo permite.</p>}

        {result.hypotheses.map((hypothesis) => <article key={hypothesis.id} className="hypo">
          <Tag tone="warn">{hypothesis.label === "prepared_demo_hypothesis" ? "Propuesta preparada · no es un descubrimiento" : "Hipótesis IA · sin validar"}</Tag>
          <p className="hypo-s">{hypothesis.statement}</p>
          <dl>
            <div><dt>Fundamento</dt><dd>{hypothesis.rationale}</dd></div>
            <div><dt>Alternativa</dt><dd>{hypothesis.alternative_explanation}</dd></div>
            <div><dt>Siguiente medida</dt><dd>{hypothesis.next_measurement}</dd></div>
            <div><dt>Refutación</dt><dd>{hypothesis.falsification}</dd></div>
          </dl>
        </article>)}
      </section>

      <section aria-labelledby="activity-title">
        <h3 id="activity-title" className="cap">Actividad de herramientas</h3>
        <ol className="events">{result.events.map((event) => <li key={event.sequence} data-stage={event.stage}>
          <span className="num">{String(event.sequence).padStart(2, "0")}</span>
          <span><b>{STAGE[event.stage]}</b> {event.message}</span>
        </li>)}</ol>
        <h3 className="cap">Advertencias ({result.warnings.length})</h3>
        <ul className="warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        {result.warnings.length > 4 && <button type="button" className="btn ghost" onClick={() => setAllWarnings(!allWarnings)}>{allWarnings ? "Ver menos" : "Ver todas"}</button>}
      </section>
    </div>
  </Panel>;
}
