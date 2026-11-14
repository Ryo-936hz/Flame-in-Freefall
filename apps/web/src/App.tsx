import { useEffect, useMemo, useState } from "react";
import { ApiError, createApi, demoRanking, sourceLink } from "./lib/client";
import type { Evidence, Health, Profile, RankingRequest, ResearchResponse } from "./lib/client";
import { MissionLabPanel, type ScenarioTrigger } from "./features/mission-lab/MissionLabPanel";
import { ReportPanel } from "./features/report/ReportPanel";
import type { EvidenceSource, MissionSlotProps, ResearchState } from "./features/mission-lab/slot";
import { StudyCatalog } from "./features/catalog/StudyCatalog";

const api = createApi(import.meta.env.VITE_API_BASE_URL ?? "");

function failure(error: unknown): string {
  if (error instanceof ApiError) return `${error.code} (HTTP ${error.status}): ${error.message}${error.requestId ? ` · solicitud ${error.requestId}` : ""}`;
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [question, setQuestion] = useState("¿Qué ensayos de la demostración permiten explorar el efecto del flujo?");
  const [rankingJson, setRankingJson] = useState(JSON.stringify(demoRanking, null, 2));
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [evidenceFrom, setEvidenceFrom] = useState<{ source: EvidenceSource; researchId: string | null }>({ source: "record", researchId: null });
  const [scenarioTrigger, setScenarioTrigger] = useState<ScenarioTrigger | null>(null);
  const [researchState, setResearchState] = useState<ResearchState>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const [newHealth, newProfile] = await Promise.all([api.health(), api.profile()]);
    setHealth(newHealth); setProfile(newProfile);
  };

  useEffect(() => { refresh().catch((reason: unknown) => setError(failure(reason))); }, []);

  async function perform(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); } catch (reason) { setError(failure(reason)); }
    finally { setBusy(false); }
  }

  function ranking(): RankingRequest {
    // The API, using the canonical Pydantic model, validates the editable JSON.
    const value: unknown = JSON.parse(rankingJson);
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Los filtros deben ser un objeto JSON.");
    return value as RankingRequest;
  }

  // Filtros actuales del formulario para Mission Lab; null si el JSON no es un objeto válido.
  const currentRequest = useMemo<RankingRequest | null>(() => {
    try { return ranking(); } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankingJson]);

  function showRun(value: ResearchResponse) {
    setResult(value); setEvidence(null); setResearchState("ready");
  }

  async function investigate() {
    setResult(null); setEvidence(null); setResearchState("loading");
    try { showRun(await api.research({ question, ranking: ranking(), include_hypotheses: true })); }
    catch (reason) { setResearchState("error"); throw reason; }
  }

  // "record": snapshot del expediente activo (research_id); "corpus": corpus actual, sin research_id.
  const openEvidence = (id: string, _trialId: string | null = null, source: EvidenceSource = "record") => perform(async () => {
    setEvidence(null);
    const researchId = source === "corpus" ? undefined : result?.id;
    const value = await api.evidence(id, researchId);
    setEvidenceFrom({ source, researchId: researchId ?? null });
    setEvidence(value);
  });
  const selectEvidence = (id: string) => openEvidence(id, null, "record");

  const slot: MissionSlotProps = {
    api, research: result, request: currentRequest, researchState,
    onOpenRun: showRun,
    onOpenEvidence: (id, trialId, source) => { void openEvidence(id, trialId, source); }
  };
  const source = sourceLink(evidence?.source_url);

  return <main>
    <header>
      <p className="eyebrow">Los TTS · Base integrada 0.1</p>
      <h1>FlameLab SI <span>Arnés técnico</span></h1>
      <p>Conexiones de API, ciencia, evidencia y persistencia. El frontend de producto se construirá en la siguiente fase.</p>
      <p className="notice">Los fixtures son sintéticos, no mediciones de NASA. El modo <code>demo</code> es un coordinador determinista sin llamadas a un modelo externo.</p>
    </header>

    <section aria-labelledby="status-title">
      <h2 id="status-title">Estado de integración</h2>
      {health ? <dl className="status-grid">
        <div><dt>API</dt><dd>{health.status} · {health.version}</dd></div>
        <div><dt>Datos</dt><dd>{health.data_mode}</dd></div>
        <div><dt>Proveedor</dt><dd>{health.ai_provider}</dd></div>
        <div><dt>Persistencia</dt><dd>{health.database}</dd></div>
      </dl> : <p>Sin estado confirmado. Comprueba que la API esté iniciada.</p>}
      {profile && <p>{profile.n_studies} estudios · {profile.n_trials} ensayos ({profile.synthetic_trials} sintéticos) · {profile.n_observations} observaciones · {profile.n_independent_units} unidades independientes.</p>}
      <button disabled={busy} onClick={() => perform(refresh)}>Actualizar estado</button>{" "}
      <a href="/docs" target="_blank" rel="noreferrer">Contrato HTTP</a>
    </section>

    <StudyCatalog api={api} />

    <section aria-labelledby="query-title">
      <h2 id="query-title">Consulta y filtros explícitos</h2>
      <p>Los filtros mandan. La pregunta acompaña la síntesis; el modo demo no interpreta restricciones verbales adicionales.</p>
      <label>Pregunta<textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={4000} rows={2} /></label>
      <label>RankingRequest (JSON validado por la API)<textarea className="code-input" value={rankingJson} onChange={(event) => setRankingJson(event.target.value)} rows={12} spellCheck={false} /></label>
      <div className="actions">
        <button disabled={busy || question.trim().length < 3} onClick={() => perform(investigate)}>Investigar</button>
        <button disabled={busy || !currentRequest} onClick={() => setScenarioTrigger({ presetId: "gravity_lunar", nonce: Date.now() })}>Comparar A/B · cambiar gravedad</button>
        <button disabled={busy} onClick={() => setRankingJson(JSON.stringify(demoRanking, null, 2))}>Restaurar filtros sintéticos</button>
      </div>
      {!currentRequest && <p className="error" role="note">El JSON de filtros no es un objeto válido; Mission Lab no puede usarlo.</p>}
      <p>La recuperación de expedientes, el informe y la reproducción de eventos están en el panel «Report and recovery».</p>
    </section>

    <div aria-live="polite">{busy && <p role="status">Esperando respuesta de la API…</p>}</div>
    {error && <p className="error" role="alert">{error}</p>}

    <MissionLabPanel {...slot} question={question} trigger={scenarioTrigger} />

    {result && <>
      <section aria-labelledby="research-title">
        <h2 id="research-title">Investigación guardada</h2>
        <p><code>{result.id}</code> · {result.status} · proveedor {result.provider} · {result.created_at}</p>
        <p>Pregunta guardada: {result.question}</p>
        <p>{result.summary}</p>
        <ul>{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
      </section>
      <section aria-labelledby="ranking-title">
        <h2 id="ranking-title">Ranking y cobertura</h2>
        <p>{result.ranking.method}. La similitud no es probabilidad, confianza ni índice de peligrosidad.</p>
        {result.ranking.items.length ? <div className="table-scroll"><table>
          <thead><tr><th>Ensayo / procedencia</th><th>Similitud</th><th>Cobertura</th><th>Elegibilidad</th><th>Evidencia</th></tr></thead>
          <tbody>{result.ranking.items.map((item) => <tr key={item.trial_id}>
            <td><code>{item.trial_id}</code><br /><strong>{item.provenance}</strong></td>
            <td>{item.similarity ?? "indeterminada"}</td><td>{item.coverage}</td><td>{item.eligibility}<br />{item.reasons.join("; ")}</td>
            <td>{item.evidence_ids.map((id) => <button className="reference" key={id} disabled={busy} onClick={() => selectEvidence(id)}>{id}</button>)}</td>
          </tr>)}</tbody>
        </table></div> : <p>No hay candidatos elegibles para estos filtros.</p>}
        <details><summary>Contribuciones, candidatos excluidos y advertencias</summary><pre>{JSON.stringify(result.ranking, null, 2)}</pre></details>
      </section>
      <section aria-labelledby="comparison-title">
        <h2 id="comparison-title">Comparación científica</h2>
        {result.comparison ? <>
          <p>X: {result.comparison.x_condition} ({result.comparison.x_unit ?? "sin unidad"}) · Y: {result.comparison.metric} ({result.comparison.unit}).</p>
          <ul>{result.comparison.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
          <div className="table-scroll"><table>
            <thead><tr><th>Observación</th><th>X</th><th>Y</th><th>Unidad independiente / grupo</th><th>Procedencia / evidencia</th></tr></thead>
            <tbody>{result.comparison.points.map((point) => <tr key={point.observation_id}>
              <td>{point.observation_id}<br />{point.trial_id}</td><td>{point.x ?? "no disponible"}</td><td>{point.y}</td><td>{point.independent_unit_status === "unresolved" ? "Independencia por verificar" : point.independent_unit_id}<br />{point.group_id}</td>
              <td><strong>{point.provenance}</strong><br />{point.evidence_ids.map((id) => <button className="reference" key={id} disabled={busy} onClick={() => selectEvidence(id)}>{id}</button>)}</td>
            </tr>)}</tbody>
          </table></div>
          {!result.comparison.points.length && <p>No hay observaciones comparables para esta métrica.</p>}
          <details><summary>Grupos y tamaños muestrales</summary><pre>{JSON.stringify(result.comparison.groups, null, 2)}</pre></details>
        </> : <p>Evidencia insuficiente para construir una comparación.</p>}
      </section>
      <section aria-labelledby="claims-title">
        <h2 id="claims-title">Afirmaciones e hipótesis</h2>
        {result.claims.map((claim, index) => <article key={index}><p><strong>{claim.kind}:</strong> {claim.text}</p>{claim.citations.map((citation, citationIndex) => <button className="reference" key={citationIndex} disabled={busy} onClick={() => selectEvidence(citation.evidence_id)}>{citation.evidence_id}</button>)}</article>)}
        {result.hypotheses.map((hypothesis) => <article key={hypothesis.id}><h3>{hypothesis.label}</h3><p>{hypothesis.statement}</p><p>{hypothesis.rationale}</p><p>Alternativa: {hypothesis.alternative_explanation}</p><p>Siguiente medida: {hypothesis.next_measurement}</p><p>Refutación: {hypothesis.falsification}</p></article>)}
      </section>
    </>}

    {evidence && <section aria-labelledby="evidence-title">
      <h2 id="evidence-title">Evidencia seleccionada · {evidence.provenance}</h2>
      <p className="eyebrow">{evidenceFrom.source === "corpus" ? "Leída del corpus activo actual (sin research_id)" : evidenceFrom.researchId ? `Leída del expediente ${evidenceFrom.researchId}` : "Leída sin expediente activo"}</p>
      <h3>{evidence.title}</h3><p><code>{evidence.id}</code> · {evidence.study_id} · revisión: {evidence.reviewed ? "marcada como revisada" : "pendiente"}</p>
      <p>Localizador: {evidence.locator}{evidence.page != null ? ` · página PDF ${evidence.page}` : ""}</p>
      <pre>{evidence.text}</pre>
      {source ? <a href={source} target="_blank" rel="noreferrer">Abrir fuente</a> : <p>Sin enlace HTTP público. Consulta el localizador del archivo; una fixture sintética no se vincula a una medición NASA.</p>}
    </section>}
    <ReportPanel {...slot} />
    <footer>Dirección visual futura: docs/DESIGN_ANDURIL.md. Este arnés preserva los contratos y las fronteras de P5/P6.</footer>
  </main>;
}
