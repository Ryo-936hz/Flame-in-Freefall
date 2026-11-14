# Contrato local implementado

El contrato `1.1` está implementado (con lectura compatible de bundles `1.0`) en `apps/api/src/flamelab/domain/contracts.py`, autoridad ejecutable.
OpenAPI y tipos TypeScript se generan desde la API en `packages/contracts/`. La API es local, no un
servicio publicado. [CONTRACT_MODELS](CONTRACT_MODELS.md) conserva las tablas y explica los ajustes
respecto de la propuesta documental. P1 coordina cambios y regeneración con productores/consumidores.
JSON snake_case en red y modelos; rutas `/api/v1`.

## Límites de módulo implementados

- `flamelab.science.ranking.rank_trials(bundle, request) -> RankingResponse`.
- `flamelab.science.comparison.compare_trials(bundle, request) -> ComparisonResponse`.
- `flamelab.science.profiling.profile_dataset(bundle) -> ProfileResponse`.
- `flamelab.ai.engine.run_research(request, bundle, settings) -> ResearchResponse` es async.
- `flamelab.data.loader.load_bundle(path) -> DatasetBundle` valida integridad.
- `flamelab.storage.repository.Repository(session)` expone `get_bundle()`, `replace_bundle(bundle, allow_replace=False)`, `save_run(response, bundle=None)`, `get_run(id)` y `get_run_bundle(id)`. El endpoint entrega explícitamente el bundle analizado al guardar.
- `Settings` vive en `flamelab.config`: database_url, ai_provider (demo/openai), openai_api_key, openai_model, ai_timeout_seconds, ai_max_context_chars, seed_demo, fixture_path, cors_origins. SQLite requiere fichero; el modo en memoria se rechaza explícitamente.
- `flamelab.main.create_app(settings=None)` crea FastAPI; `app` es la instancia ASGI.

## HTTP implementado

| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| GET | /health | — | HealthResponse |
| GET | /studies | — | list[Study] |
| GET | /trials | study_id opcional | list[Trial] |
| GET | /trials/{id} | — | Trial |
| GET | /evidence/{id} | research_id opcional para la evidencia guardada en una investigación | Evidence |
| GET | /datasets/profile | — | ProfileResponse |
| POST | /rankings | RankingRequest | RankingResponse |
| POST | /comparisons | ComparisonRequest | ComparisonResponse |
| POST | /research | ResearchRequest | ResearchResponse |
| GET | /research/{id} | — | ResearchResponse |
| GET | /research/{id}/events | — | SSE de eventos guardados, no streaming en vivo |
| GET | /research/{id}/report | — | text/markdown |
| POST | /scenarios/compare | ScenarioComparisonRequest | ScenarioComparisonResponse |

Las rutas de la tabla llevan prefijo `/api/v1`. FastAPI sirve `/openapi.json` y `/docs`.
No subida pública arbitraria de PDFs, ejecución de código del LLM ni fetch de URLs suministradas por usuario.
Ingesta de archivos: CLI local, no endpoint sin autenticación. Servicio de desarrollo local; no desplegar públicamente sin autenticación y límites.

## Procedencia y estados

`published`, `digitized`, `derived`, `synthetic` viajan con datos y puntos.
No mezclar métricas, unidades, muestras o geometrías incompatibles. Datos ausentes tienen estado explícito.
`allow_synthetic=false` por defecto; los ejemplos de conectividad lo activan explícitamente.
Las fuentes NASA de catálogo no se utilizan como citas de cifras sintéticas.
Los intervalos de bootstrap requieren unidades independientes; no están implícitos por tener muchas observaciones.
Los paneles son una lista cerrada con `data_ref`; nunca HTML o JavaScript generado por IA.

## Autoridad de la pregunta

En el esqueleto los filtros explícitos de ResearchRequest mandan. La pregunta se usa en la síntesis;
el planificador de lenguaje natural será una ampliación del propietario P4. No afirmar que el modo demo
entiende cualquier restricción verbal. Una variable de `vary` no puede estar en `required_match`.

## Cambios

Proponer cambio a P1, actualizar modelo, generador OpenAPI y tipos, pruebas y consumidor en el mismo PR.
Ningún agente modifica contratos o lockfiles de otro propietario en paralelo sin coordinación.

## Consistencia de las visualizaciones

ComparisonResponse incluye `x_condition` y `x_unit`, además de `metric` y `unit` para Y.
El agente no debe mostrar un eje como oxígeno cuando los puntos contienen velocidad del flujo.
Elegir la variable X de forma explícita y mantener el mismo significado en herramienta, respuesta y UI.


## Errores e idempotencia implementados

- HTTP 404 para entidad o investigación inexistente; 422 para JSON o condiciones inválidas; 503 para proveedor o almacén no disponible; 504 para tiempo de proveedor agotado. Las respuestas de error deben seguir `ErrorResponse`, incluidas las de validación del framework.
- Una consulta válida sin evidencia produce HTTP 200 y `status=insufficient_evidence` cuando corresponda. No confundir ausencia de evidencia con caída de infraestructura.
- La investigación necesita al menos un par X/Y conocido para completar la comparación cuantitativa; si todos los X son nulos conserva los puntos disponibles y devuelve `insufficient_evidence`. Esto no acredita réplicas suficientes ni inferencia causal.
- `request_id` permite correlacionar logs sin devolver trazas, claves o contenido sensible. Los errores internos usan un mensaje público breve.
- El primer `POST /research` es síncrono en HTTP y devuelve el resultado guardado. Los eventos posteriores son reproducción de acciones registradas. Un trabajo en cola y streaming real exigirían ampliar estados y rutas, no simularse con animaciones.
- La ingesta valida el bundle completo antes de modificar la base; mismo contenido debe ser idempotente. Sustituir un corpus diferente requiere una acción explícita. Una investigación guardada conserva el contexto de datos usado para que su informe no cambie al reimportar.
- Un bundle vacío permite arrancar y consultar salud; las herramientas devuelven ausencia de evidencia y nunca inventan una semilla NASA. La semilla sintética se activa explícitamente.

## Ajustes respecto del diseño previo

Tipos estrictos, números finitos, IDs con namespace y sin `/`, condiciones conocidas con referencias,
fuentes HTTP(S), separación de estudios sintéticos y científicos, `uncertainty=null` e `interval=null`
se validan en el dominio. Cada resultado de ranking incluye la unión de fuentes del ensayo, condiciones
y observaciones, para validar citas legítimas a mediciones. Los perfiles incluyen `known` y todos los
estados de ausencia. Las decisiones y los límites de series reales se registran en ADR 0007; no se ha
forzado la tabla BASS-II dentro de una granularidad incorrecta para simular ingesta científica.

## Contrato 1.1: condiciones sucesivas

`DatasetBundle.schema_version` acepta 1.0 y 1.1; al escribir, el default es 1.1. Los bundles 1.0 siguen siendo legibles. Un `Trial` conserva la unidad experimental y puede contener `segments` ordenados por `sequence` (orden reportado, no tiempo medido). Cada segmento contiene condiciones efectivas explicitas y evidencia; no hereda condiciones implicitamente del ensayo. `Observation.segment_id` es opcional y solo puede referir a un segmento del mismo ensayo. Si la asignacion no esta respaldada, se deja nulo.

`oxygen_initial_pct` y `oxygen_final_pct` son condiciones separadas del ensayo; no se propagan a segmentos. `combustion_face` es una condicion categorica de control y `geometry` conserva su significado previo. `ConditionValue` conserva valor y unidad originales y referencias. Los segmentos no son replicas ni unidades experimentales nuevas.
