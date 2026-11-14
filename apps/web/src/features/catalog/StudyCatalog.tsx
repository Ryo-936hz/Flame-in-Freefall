import { useEffect, useRef, useState } from "react";
import { sourceLink } from "../../lib/client";
import type { createApi, Evidence, Models } from "../../lib/client";
import "./catalog.css";

const limit = 20;

export function StudyCatalog({ api, studyRequest = null }: { api: ReturnType<typeof createApi>; studyRequest?: { id: string } | null }) {
  const [studies, setStudies] = useState<Models["Study"][]>([]);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [id, setId] = useState("");
  const [offset, setOffset] = useState(0);
  const pageTicket = useRef(0);
  const sourceTicket = useRef(0);
  const appliedRequest = useRef<{ id: string } | null>(null);
  const [pageAttempt, setPageAttempt] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [page, setPage] = useState<Models["StudyEvidencePage"] | null>(null);
  const [observations, setObservations] = useState<Models["StudyObservationPage"] | null>(null);
  const [sourceRequest, setSourceRequest] = useState<{ id: string; attempt: number } | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [source, setSource] = useState<Evidence | null>(null);

  useEffect(() => {
    let current = true;
    setCatalogLoading(true); setCatalogError("");
    api.studies().then((data) => { if (current) setStudies(data); })
      .catch(() => { if (current) setCatalogError("No se pudo cargar el catálogo."); })
      .finally(() => { if (current) setCatalogLoading(false); });
    return () => { current = false; };
  }, [api, catalogAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    const ticket = pageTicket.current;
    setPageLoading(true); setPageError(""); setPage(null); setObservations(null);
    Promise.all([api.studyEvidence(id, offset, limit), api.studyObservations(id, offset, limit)])
      .then(([evidence, values]) => {
        if (evidence.items.some((item) => item.study_id !== id)) throw new Error("Study mismatch");
        if (current && ticket === pageTicket.current) { setPage(evidence); setObservations(values); }
      })
      .catch(() => { if (current && ticket === pageTicket.current) setPageError("No se pudo cargar la página del estudio."); })
      .finally(() => { if (current && ticket === pageTicket.current) setPageLoading(false); });
    return () => { current = false; };
  }, [api, id, offset, pageAttempt]);

  useEffect(() => {
    if (!sourceRequest) return;
    let current = true;
    setSourceLoading(true); setSourceError(""); setSource(null);
    api.evidence(sourceRequest.id).then((data) => {
      if (data.study_id !== id || data.id !== sourceRequest.id) throw new Error("Source mismatch");
      if (current && sourceRequest.attempt === sourceTicket.current) setSource(data);
    }).catch(() => { if (current && sourceRequest.attempt === sourceTicket.current) setSourceError("No se pudo abrir la fuente."); })
      .finally(() => { if (current && sourceRequest.attempt === sourceTicket.current) setSourceLoading(false); });
    return () => { current = false; };
  }, [api, id, sourceRequest]);

  function clearSource() {
    sourceTicket.current += 1;
    setSourceRequest(null); setSource(null); setSourceError(""); setSourceLoading(false);
  }

  function load(nextId: string, start: number) {
    pageTicket.current += 1;
    setId(nextId); setOffset(start); setPage(null); setObservations(null);
    setPageError(""); setPageLoading(Boolean(nextId)); clearSource();
  }

  function openSource(ref: string) {
    setSource(null); setSourceError(""); setSourceLoading(true);
    // A new request identity also allows retrying the same failed reference.
    sourceTicket.current += 1;
    setSourceRequest({ id: ref, attempt: sourceTicket.current });
  }

  useEffect(() => {
    if (!studyRequest || appliedRequest.current === studyRequest || !studies.some((item) => item.id === studyRequest.id)) return;
    appliedRequest.current = studyRequest;
    if (id === studyRequest.id && offset === 0) return;
    load(studyRequest.id, 0);
  }, [studyRequest, studies, id, offset]);

  const study = studies.find((item) => item.id === id);
  const link = sourceLink(source?.source_url);
  const total = Math.max(page?.total ?? 0, observations?.total ?? 0);
  return <section className="study-catalog" aria-labelledby="catalog-title">
    <h2 id="catalog-title">Catálogo de estudios</h2>
    <p>Contenido del corpus activo. Los perfiles documentales, las configuraciones y las observaciones no representan el mismo tipo de registro. Varias observaciones o segmentos de un ensayo no crean réplicas independientes.</p>
    {catalogLoading && <p role="status">Cargando catálogo…</p>}
    {catalogError && <div role="alert"><p>{catalogError}</p>
      <button onClick={() => setCatalogAttempt((attempt) => attempt + 1)}>Reintentar catálogo</button>
    </div>}
    {!catalogLoading && !catalogError && studies.length === 0 && <p>El corpus activo no contiene estudios.</p>}
    <label>Estudio<select value={id} disabled={catalogLoading || studies.length === 0}
      onChange={(event) => load(event.target.value, 0)}>
      <option value="">Selecciona un estudio</option>
      {studies.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select></label>
    {study && <div className="catalog-study"><p><code>{study.id}</code> · {study.family}</p>
      <p>{study.description}</p><p>Estado del estudio: <strong>{study.dataset_status}</strong></p>
      {study.dataset_status === "synthetic" && <p>Datos sintéticos de demostración; no son mediciones NASA.</p>}
      {study.dataset_status === "metadata_only" && <p>Perfil documental: no se han incorporado ensayos numéricos para este estudio.</p>}
      {study.dataset_status === "unverified" && <p>Las correspondencias científicas de este estudio siguen pendientes de revisión. Su presencia en el catálogo no implica validación científica global.</p>}
    </div>}
    {pageLoading && <p role="status">Cargando página del estudio…</p>}
    {pageError && <div role="alert"><p>{pageError}</p>
      <button onClick={() => { clearSource(); pageTicket.current += 1; setPageAttempt((attempt) => attempt + 1); }}>Reintentar página</button>
    </div>}
    {page && <details open><summary>Fuentes y registros ({page.total})</summary>
      {page.items.length === 0 && <p>No hay fuentes en esta página.</p>}
      <ul className="catalog-records">{page.items.map((item) => <li key={item.id}>
        <button className="reference" onClick={() => { clearSource(); setSource(item); }}>{item.title}</button>
        <p><code>{item.id}</code> · {item.provenance}</p>
      </li>)}</ul>
    </details>}
    {observations && <details><summary>Observaciones normalizadas ({observations.total})</summary>
      {observations.total === 0 && <p>No hay observaciones normalizadas para este estudio en el corpus activo. Esto no implica que el estudio original no contenga resultados.</p>}
      {observations.total > 0 && observations.items.length === 0 && <p>No hay observaciones en esta página.</p>}
      <ul className="catalog-records">{observations.items.map((item) => <li key={item.id} data-observation-id={item.id}>
        <dl>
          <dt>Observación</dt><dd><code>{item.id}</code></dd>
          <dt>Ensayo o registro</dt><dd><code>{item.trial_id}</code></dd>
          <dt>Segmento</dt><dd>{item.segment_id ? <code>{item.segment_id}</code> : "Sin segmento asignado"}</dd>
          <dt>Métrica</dt><dd><code>{item.metric}</code></dd>
          <dt>Valor normalizado</dt><dd>{item.value == null ? "Sin valor numérico" : item.value} {item.unit}</dd>
          <dt>Estado del valor</dt><dd>{item.status ?? "known"}</dd>
          <dt>Valor original</dt><dd>{item.original_value == null ? "No disponible" : <code>{JSON.stringify(item.original_value)}</code>}</dd>
          <dt>Unidad original</dt><dd>{item.original_unit == null ? "No disponible" : <code>{JSON.stringify(item.original_unit)}</code>}</dd>
          <dt>Procedencia</dt><dd>{item.provenance}{item.provenance === "synthetic" ? " · datos sintéticos" : ""}</dd>
        </dl>
        {item.evidence_ids.map((ref) => <div className="catalog-reference" key={ref}>
          <button className="reference" onClick={() => openSource(ref)}>Abrir registro</button> <code>{ref}</code>
        </div>)}
      </li>)}</ul>
    </details>}
    {page && <div className="catalog-pagination">
      <p>Fuentes y observaciones se paginan por separado, con el mismo desplazamiento: {offset}. Hasta {limit} registros de cada tipo por página.</p>
      <div className="actions">
        <button disabled={offset === 0 || pageLoading} onClick={() => load(id, offset - limit)}>Anterior</button>
        <button disabled={offset + limit >= total || pageLoading} onClick={() => load(id, offset + limit)}>Siguiente</button>
      </div>
    </div>}
    {sourceLoading && <p role="status">Cargando fuente…</p>}
    {sourceError && <div role="alert"><p>{sourceError}</p>
      <button onClick={() => { if (sourceRequest) openSource(sourceRequest.id); }}>Reintentar fuente</button>
    </div>}
    {source && <article className="catalog-source" aria-label="Fuente del catálogo" data-evidence-id={source.id}>
      <h3>{source.title}</h3>
      <p>Fuente del corpus activo; no es una cita guardada de un expediente. El texto siguiente se muestra tal como lo devuelve la API.</p>
      <dl>
        <dt>Fuente</dt><dd><code>{source.id}</code></dd>
        <dt>Estudio</dt><dd><code>{source.study_id}</code></dd>
        <dt>Localizador</dt><dd>{source.locator}</dd>
        {source.page != null && <><dt>Página</dt><dd>{source.page}</dd></>}
        <dt>Procedencia</dt><dd>{source.provenance}{source.provenance === "synthetic" ? " · datos sintéticos" : ""}</dd>
        <dt>Revisión registrada</dt><dd>{source.reviewed ? "Sí" : "No"}</dd>
      </dl>
      <pre>{source.text}</pre>
      {link && <a href={link} target="_blank" rel="noreferrer">Abrir fuente</a>}
    </article>}
  </section>;
}
