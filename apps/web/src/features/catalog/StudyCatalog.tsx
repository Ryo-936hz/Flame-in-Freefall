import { useEffect, useState } from "react";
import { sourceLink } from "../../lib/client";
import type { createApi, Evidence, Models } from "../../lib/client";

const limit = 20;

export function StudyCatalog({ api }: { api: ReturnType<typeof createApi> }) {
  const [studies, setStudies] = useState<Models["Study"][]>([]);
  const [id, setId] = useState("");
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<Models["StudyEvidencePage"] | null>(null);
  const [observations, setObservations] = useState<Models["StudyObservationPage"] | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [source, setSource] = useState<Evidence | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    api.studies().then((data) => { if (current) setStudies(data); })
      .catch(() => { if (current) setError("No se pudo cargar el catálogo."); });
    return () => { current = false; };
  }, [api]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    Promise.all([api.studyEvidence(id, offset, limit), api.studyObservations(id, offset, limit)])
      .then(([evidence, values]) => { if (current) { setPage(evidence); setObservations(values); } })
      .catch(() => { if (current) setError("No se pudo cargar la página del estudio."); });
    return () => { current = false; };
  }, [api, id, offset]);

  useEffect(() => {
    if (!sourceId) return;
    let current = true;
    api.evidence(sourceId).then((data) => { if (current && data.study_id === id) setSource(data); })
      .catch(() => { if (current) setError("No se pudo abrir la fuente."); });
    return () => { current = false; };
  }, [api, id, sourceId]);

  function load(nextId: string, start: number) {
    setId(nextId); setOffset(start); setPage(null); setObservations(null);
    setSource(null); setSourceId(""); setError("");
  }

  const study = studies.find((item) => item.id === id);
  const link = sourceLink(source?.source_url);
  const total = Math.max(page?.total ?? 0, observations?.total ?? 0);
  return <section aria-labelledby="catalog-title">
    <h2 id="catalog-title">Catálogo de estudios</h2>
    <label>Estudio<select value={id} onChange={(event) => load(event.target.value, 0)}>
      <option value="">Selecciona un estudio</option>
      {studies.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select></label>
    {study && <><p>{study.description}</p><p>Estado: {study.dataset_status}</p></>}
    {page && <details open><summary>Fuentes y registros ({page.total})</summary><ul>
      {page.items.map((item) => <li key={item.id}><button className="reference" onClick={() => {
        setSourceId(""); setSource(item);
      }}>{item.title}</button></li>)}
    </ul></details>}
    {observations && <details><summary>Observaciones normalizadas ({observations.total})</summary><ul>
      {observations.items.map((item) => <li key={item.id}>
        <code>{item.trial_id}</code> · {item.metric} · {item.value == null ? item.status : `${item.value} ${item.unit}`} · {item.original_value} {item.original_unit}{" "}
        {item.evidence_ids.map((ref) => <button key={ref} className="reference" onClick={() => {
          if (sourceId !== ref) { setSource(null); setSourceId(ref); }
        }}>Abrir registro</button>)}
      </li>)}
    </ul></details>}
    {page && <div className="actions">
      <button disabled={offset === 0} onClick={() => load(id, offset - limit)}>Anterior</button>
      <button disabled={offset + limit >= total} onClick={() => load(id, offset + limit)}>Siguiente</button>
    </div>}
    {source && <article><h3>{source.title}</h3><p>{source.locator}</p><pre>{source.text}</pre>
      {link && <a href={link} target="_blank" rel="noreferrer">Abrir fuente</a>}
    </article>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
