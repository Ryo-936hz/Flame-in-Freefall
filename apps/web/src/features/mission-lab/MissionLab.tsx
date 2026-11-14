// Mission Lab (P6) · escenarios A/B de evidencia, hipótesis y consulta sin evidencia suficiente.
// Presenta respuestas de la API; no calcula ranking ni simula física en el navegador.
import { useEffect, useRef, useState } from "react";
import type { createApi, RankingRequest, ResearchResponse } from "../../lib/client";
import {
  buildScenarioRequest, diffScenarioRankings, hypothesisLabelText, scenarioPresets,
  type RankedTrial, type ScenarioComparison, type TrialChange
} from "./scenarios";
import "./mission-lab.css";

type Api = ReturnType<typeof createApi>;

export interface ScenarioTrigger {
  presetId: string;
  /** Cambia en cada petición para relanzar el mismo preset. */
  nonce: number;
}

export interface MissionLabProps {
  api: Api;
  getBase(): RankingRequest;
  question: string;
  busy: boolean;
  perform(action: () => Promise<void>): Promise<void>;
  result: ResearchResponse | null;
  /** live=true: evidencia de una comparación A/B en vivo (dataset actual, sin snapshot de investigación). */
  onEvidence(id: string, live?: boolean): void;
  /** Petición externa (p. ej. botón de la consulta) para comparar un preset. */
  trigger?: ScenarioTrigger | null;
}

const INSUFFICIENT_PRESET = "gravity_lunar";
const LABEL_TEXT: Record<string, string> = {
  evidence_comparison_not_physical_simulation: "Comparación de evidencia · no es una simulación física"
};

function num(value: number | null | undefined): string {
  if (typeof value !== "number") return "indeterminada";
  return String(Math.round(value * 1000) / 1000);
}

function signed(value: number | null): string {
  if (value === null) return "indeterminada";
  const rounded = Math.round(value * 1000) / 1000;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

const STATUS_TEXT: Record<TrialChange["status"], string> = { kept: "Se mantiene", entered: "Entra en B", left: "Sale en B" };

function uniqueReasons(items: RankedTrial[]): string[] {
  return [...new Set(items.flatMap((item) => item.reasons))];
}

function EvidenceButtons({ ids, busy, onEvidence }: { ids: string[]; busy: boolean; onEvidence(id: string): void }) {
  if (!ids.length) return <span className="ml-muted">sin evidencia enlazada</span>;
  return <>{ids.map((id) => <button type="button" className="reference" key={id} disabled={busy} onClick={() => onEvidence(id)}>{id}</button>)}</>;
}

function ScenarioColumn({ side, name, selected, excluded, noEvidence }: {
  side: "A" | "B"; name: string; selected: RankedTrial[]; excluded: RankedTrial[]; noEvidence: boolean;
}) {
  return <div className={`ml-column ml-column-${side.toLowerCase()}`}>
    <h4>{name}</h4>
    <dl className="ml-counts">
      <div><dt>Seleccionados</dt><dd>{selected.length}</dd></div>
      <div><dt>Fuera de la selección</dt><dd>{excluded.length}</dd></div>
    </dl>
    {noEvidence && <div className="ml-insufficient" role="note">
      <p><strong>Evidencia aplicable insuficiente.</strong> No hay candidatos elegibles con estos filtros explícitos y la cobertura mínima.</p>
      <p>Qué falta: {uniqueReasons(excluded).length ? uniqueReasons(excluded).map((reason) => <code key={reason}>{reason}</code>) : "la API no devolvió motivos de exclusión."}</p>
    </div>}
    {selected.length > 0 && <ul className="ml-list">
      {selected.map((item) => <li key={item.trial_id}>
        <code>{item.trial_id}</code> <span className="ml-tag">{item.provenance}</span>
        <span className="ml-metrics">similitud {num(item.similarity)} · cobertura {num(item.coverage)}</span>
      </li>)}
    </ul>}
    {excluded.length > 0 && <details>
      <summary>Motivos fuera de la selección en {side}</summary>
      <ul className="ml-list">
        {excluded.map((item) => <li key={item.trial_id}>
          <code>{item.trial_id}</code> <span className="ml-tag">{item.provenance}</span> · {item.eligibility}
          <span className="ml-metrics">{item.reasons.join("; ") || "sin motivo declarado"}</span>
        </li>)}
      </ul>
    </details>}
  </div>;
}

export default function MissionLab({ api, getBase, question, busy, perform, result, onEvidence, trigger }: MissionLabProps) {
  const [presetId, setPresetId] = useState<string>(scenarioPresets[0]?.id ?? "");
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [comparedPreset, setComparedPreset] = useState<string>("");
  const [insufficient, setInsufficient] = useState<ResearchResponse | null>(null);
  const comparisonHeading = useRef<HTMLHeadingElement>(null);
  const insufficientHeading = useRef<HTMLHeadingElement>(null);
  const focusComparison = useRef(false);
  const focusInsufficient = useRef(false);

  const preset = scenarioPresets.find((item) => item.id === presetId) ?? null;

  const compare = (id: string) => perform(async () => {
    setComparison(null);
    const response = await api.scenarios(buildScenarioRequest(getBase(), id));
    focusComparison.current = true;
    setComparedPreset(id);
    setComparison(response);
  });

  const runInsufficient = () => perform(async () => {
    setInsufficient(null);
    const ranking = buildScenarioRequest(getBase(), INSUFFICIENT_PRESET).scenario_b;
    const response = await api.research({ question, ranking, include_hypotheses: true });
    focusInsufficient.current = true;
    setInsufficient(response);
  });

  useEffect(() => {
    if (!trigger) return;
    setPresetId(trigger.presetId);
    void compare(trigger.presetId);
    // Solo reacciona a una nueva petición externa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.nonce]);

  useEffect(() => {
    if (comparison && focusComparison.current) {
      focusComparison.current = false;
      comparisonHeading.current?.focus();
    }
  }, [comparison]);

  useEffect(() => {
    if (insufficient && focusInsufficient.current) {
      focusInsufficient.current = false;
      insufficientHeading.current?.focus();
    }
  }, [insufficient]);

  const diff = comparison ? diffScenarioRankings(comparison) : null;
  const changes = diff ? [...diff.left, ...diff.entered, ...diff.kept] : [];
  const compared = scenarioPresets.find((item) => item.id === comparedPreset) ?? null;

  return <section aria-labelledby="mission-lab-title" className="mission-lab">
    <header className="ml-head">
      <p className="ml-eyebrow">P6 · Mission Lab</p>
      <h2 id="mission-lab-title">Mission Lab · escenarios de evidencia</h2>
      <p className="ml-modes">
        <span><strong>Funcional:</strong> ranking, comparación A/B y consultas calculados en vivo por la API.</span>
        <span><strong>Preparado:</strong> hipótesis con etiqueta <code>prepared_demo_hypothesis</code> del coordinador demo, no inferencia de un modelo externo.</span>
        <span><strong>Ilustrativo:</strong> ninguna escena conceptual en esta vista; si se añade, conservará su etiqueta.</span>
      </p>
      <p className="ml-muted">Datos sintéticos de demostración, no mediciones NASA. Cambiar un escenario cambia qué evidencia es aplicable; no predice una llama.</p>
    </header>

    <div className="ml-block" role="group" aria-labelledby="ml-scenario-title">
      <h3 id="ml-scenario-title">Escenario B frente a A (filtros actuales)</h3>
      <fieldset className="ml-presets">
        <legend>Cambio explícito para B</legend>
        {scenarioPresets.map((item) => <label key={item.id} className={item.id === presetId ? "ml-preset ml-preset-active" : "ml-preset"}>
          <input type="radio" name="ml-preset" value={item.id} checked={item.id === presetId} onChange={() => setPresetId(item.id)} />
          <span className="ml-preset-title">B · {item.title}</span>
          <span className="ml-preset-text"><em>Cambio:</em> {item.change}</span>
          <span className="ml-preset-text"><em>Esperado con fixtures sintéticos:</em> {item.expectation}</span>
        </label>)}
      </fieldset>
      <div className="actions">
        <button type="button" disabled={busy || !preset} onClick={() => preset && compare(preset.id)}>Comparar A vs B{preset ? ` · ${preset.title}` : ""}</button>
      </div>

      <p className="ml-sr" aria-live="polite">{diff ? `Comparación A/B lista. ${diff.summary.join(" ")}` : ""}</p>
      {comparison && diff && <div className="ml-result">
          <h4 ref={comparisonHeading} tabIndex={-1} className="ml-result-title">
            Resultado A/B{compared ? ` · ${compared.title}` : ""}
          </h4>
          <p className="ml-label"><span className="ml-tag ml-tag-strong">{LABEL_TEXT[comparison.label ?? ""] ?? "Etiqueta de comparación no reconocida · tratar como comparación de evidencia"}</span> <code>{comparison.label ?? "sin etiqueta"}</code></p>
          <ul className="ml-summary">{diff.summary.map((line, index) => <li key={index}>{line}</li>)}</ul>
          <div className="ml-columns">
            <ScenarioColumn side="A" name={diff.nameA} selected={comparison.ranking_a.items} excluded={comparison.ranking_a.excluded}
              noEvidence={diff.noEvidenceA} />
            <ScenarioColumn side="B" name={diff.nameB} selected={comparison.ranking_b.items} excluded={comparison.ranking_b.excluded}
              noEvidence={diff.noEvidenceB} />
          </div>
          {changes.length > 0 ? <table className="ml-table">
            <caption>Cambios de selección entre A y B (similitud con filtros explícitos, no probabilidad ni peligrosidad)</caption>
            <thead><tr>
              <th scope="col">Ensayo / procedencia</th><th scope="col">Cambio</th><th scope="col">Similitud A</th><th scope="col">Similitud B</th>
              <th scope="col">Δ similitud</th><th scope="col">Cobertura A / B</th><th scope="col">Motivos en B</th><th scope="col">Evidencia</th>
            </tr></thead>
            <tbody>{changes.map((change) => {
              const item = change.b ?? change.a;
              const ids = [...new Set([...(change.a?.evidence_ids ?? []), ...(change.b?.evidence_ids ?? [])])];
              return <tr key={change.trial_id} className={`ml-row-${change.status}`}>
                <th scope="row" data-label="Ensayo"><code>{change.trial_id}</code><br /><span className="ml-tag">{item?.provenance ?? "sin procedencia"}</span></th>
                <td data-label="Cambio">{STATUS_TEXT[change.status]}</td>
                <td data-label="Similitud A">{change.a ? num(change.a.similarity) : "—"}</td>
                <td data-label="Similitud B">{change.b ? num(change.b.similarity) : "—"}</td>
                <td data-label="Δ similitud">{change.status === "kept" ? signed(change.similarityDelta) : "no aplica"}</td>
                <td data-label="Cobertura A / B">{change.a ? num(change.a.coverage) : "—"} / {change.b ? num(change.b.coverage) : "—"}</td>
                <td data-label="Motivos en B">{change.reasonsB.length ? change.reasonsB.map((reason) => <code key={reason}>{reason}</code>) : "—"}</td>
                <td data-label="Evidencia"><EvidenceButtons ids={ids} busy={busy} onEvidence={(id) => onEvidence(id, true)} /></td>
              </tr>;
            })}</tbody>
          </table> : <p>Ningún ensayo seleccionado en A ni en B.</p>}
          {diff.warnings.length > 0 && <details>
            <summary>Advertencias de la API ({diff.warnings.length})</summary>
            <ul>{diff.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
          </details>}
        </div>}
    </div>

    <div className="ml-block">
      <h3 id="ml-hypotheses-title">Hipótesis de la investigación actual</h3>
      {!result ? <p className="ml-muted">Sin investigación activa. Pulsa <strong>Investigar</strong> en la consulta para recibir hipótesis del backend.</p>
        : !result.hypotheses.length ? <p>La investigación <code>{result.id}</code> ({result.status}) no devolvió hipótesis. No se sustituyen por texto propio.</p>
        : <div className="ml-hypotheses">{result.hypotheses.map((hypothesis) => <article key={hypothesis.id} className="ml-hypothesis" aria-labelledby={`ml-h-${hypothesis.id}`}>
          <p className="ml-tag ml-tag-strong">{hypothesisLabelText(hypothesis.label)}</p>
          <h4 id={`ml-h-${hypothesis.id}`}>{hypothesis.statement}</h4>
          <p className="ml-muted"><code>{hypothesis.id}</code> · <code>{hypothesis.label}</code></p>
          <dl className="ml-hdl">
            <div><dt>Fundamento</dt><dd>{hypothesis.rationale}<div className="ml-refs"><EvidenceButtons ids={hypothesis.evidence_ids} busy={busy} onEvidence={onEvidence} /></div></dd></div>
            <div><dt>Explicación alternativa</dt><dd>{hypothesis.alternative_explanation}</dd></div>
            <div className="ml-next"><dt>Siguiente prueba propuesta</dt><dd>{hypothesis.next_measurement}</dd></div>
            <div><dt>Condición de refutación</dt><dd>{hypothesis.falsification}</dd></div>
          </dl>
        </article>)}</div>}
    </div>

    <div className="ml-block">
      <h3>Consulta sin evidencia suficiente</h3>
      <p>Ejecuta una investigación real con la pregunta actual y los filtros del escenario B «gravedad lunar». La API debe declarar la falta de evidencia en lugar de rellenar cifras.</p>
      <div className="actions">
        <button type="button" disabled={busy || question.trim().length < 3} onClick={runInsufficient}>Consulta sin evidencia suficiente</button>
      </div>
      <p className="ml-sr" aria-live="polite">{insufficient ? `Consulta terminada con estado ${insufficient.status}. ${insufficient.summary}` : ""}</p>
      {insufficient && <div className="ml-result">
          <h4 ref={insufficientHeading} tabIndex={-1} className="ml-result-title">Respuesta · estado <code>{insufficient.status}</code></h4>
          {insufficient.status === "insufficient_evidence"
            ? <p className="ml-insufficient"><strong>Evidencia insuficiente.</strong> {insufficient.summary}</p>
            : <p className="ml-warn">La API devolvió <code>{insufficient.status}</code> para estos filtros: {insufficient.summary}</p>}
          <p className="ml-muted">Expediente <code>{insufficient.id}</code> · proveedor {insufficient.provider} · {insufficient.ranking.items.length} candidatos elegibles · comparación {insufficient.comparison ? "disponible" : "no construida"} · {insufficient.hypotheses.length} hipótesis.</p>
          <h5>Qué falta</h5>
          {insufficient.ranking.excluded.length ? <ul className="ml-list">
            {insufficient.ranking.excluded.map((item) => <li key={item.trial_id}>
              <code>{item.trial_id}</code> <span className="ml-tag">{item.provenance}</span> · {item.eligibility}
              <span className="ml-metrics">{item.reasons.join("; ") || "sin motivo declarado"}</span>
            </li>)}
          </ul> : <p>La API no devolvió candidatos excluidos con motivos.</p>}
          <h5>Advertencias</h5>
          <ul>{insufficient.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
        </div>}
    </div>
  </section>;
}
