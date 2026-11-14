# Modelos de contrato y autoridad ejecutable

El contrato de corpus `1.1` existe localmente en `apps/api/src/flamelab/domain/contracts.py`. Ese archivo y su OpenAPI
generado son la autoridad para campos y validación; esta guía explica las tablas procedentes de la propuesta
documental. No hay una API desplegada.

## Successive conditions in corpus 1.1

| Model | Added fields and semantics |
|---|---|
| `ConditionSegment` | Dataset-wide unique ID, positive source `sequence` unique in the trial, explicit condition map and evidence IDs. Sequence can have gaps. |
| `Trial` | `segments` defaults to `[]`. Segment conditions are resolved solely from its own map. |
| `Observation` | Optional `segment_id` must reference a segment of the same trial. Optional `original_value` and `original_unit` retain the source text. |
| `RankingRequest` | `condition_scope` defaults to `trial`. `segment` opts into filtering/scoring explicit segment conditions. |
| `RankedTrial` | `scored_segment_id` identifies the segment underlying the score in segment mode. `eligible_segment_ids` gives the segments that passed eligibility and coverage. |
| `ComparisonRequest` | Nonempty `segment_ids` restricts all observations to those segments; unassigned/unsegmented observations are excluded. Unknown or out-of-scope IDs give 404. |
| `PlotPoint` | Optional `segment_id`, `original_value` and `original_unit` trace the segment and measurement. |
| `ComparisonGroup`, `ProfileResponse` | `n_segments` counts segments apart from trials and units. `missing_by_segment_condition` counts explicit segment conditions in the profile. |

The trial-only keys `oxygen_initial_pct` and `oxygen_final_pct` use `%`,
`burn_duration_s` uses `s`, and `burning_faces` is a positive integer with unit
`count`. The categorical `combustion_face` identifies a face and has no unit.
Keep the original basis and units. Segment `oxygen_pct` keeps the appropriate
missing status when no segment-specific measurement is available.
Known oxygen values and ranking targets are bounded to 0–100 inclusive. Segments
reject initial and final oxygen fields regardless of their missingness status.

Older canonical unstaged bundles load through the same models. A storage-only reader
loads historical P2 snapshots without rewriting them. Identical legacy corpus reimports
remain idempotent.

## Plan visible y disponibilidad de métrica (adición compatible)

| Modelo | Campos y semántica |
|---|---|
| `ResearchRequest` | `planning_mode`: `explicit` por defecto, o `catalog` para las frases acotadas. |
| `ResearchPlan` | Modo, intención, ranking canónico efectivo, métrica, eje X, mensaje, `blocked` y límites. No contiene código ejecutable. |
| `ResearchResponse` | `plan` opcional; ausente en snapshots anteriores significa `null`, sin recalcular el expediente. |
| `ScenarioComparisonRequest/Response` | `metric` opcional. `null`: selección por condiciones; valor explícito: exige métrica disponible antes de limitar candidatos. |

La ruta de previsualización `POST /api/v1/research/plan` acepta `ResearchRequest`
y devuelve `ResearchPlan`. Un resultado bloqueado no admite análisis ejecutado.
Una comparación debe conservar métrica y eje declarado en su plan.
Los nuevos campos tienen valores predeterminados para mantener compatibilidad
con solicitudes y snapshots anteriores. No cambian la versión del corpus 1.1
ni requieren migración de tablas. OpenAPI/TypeScript se regeneran desde la API.
La tabla histórica inferior debe leerse junto a estas adiciones.

## Ajustes aceptados en la primera implementación

- Modelos estrictos, campos extra rechazados y números finitos. Booleanos no se convierten en números.
- `Identifier`: 3–240 caracteres, namespace obligatorio, patrón `^[A-Za-z0-9_.-]+:[A-Za-z0-9_.:-]+$`; no se admite `/` porque los IDs deben poder recuperarse por las rutas HTTP.
- Condiciones `known` requieren valor, tipo por clave, unidad canónica y al menos una referencia de evidencia. Las ausencias requieren valor nulo; cero sigue siendo un valor conocido válido.
- IDs y referencias se validan en el bundle, con estudio correcto y separación de procedencia sintética/científica. Un estudio `metadata_only` no puede contener ensayos.
- Las fuentes de Study/Evidence se restringen a HTTP(S); estudios sintéticos no tienen `source_urls` y evidencia sintética no tiene `source_url`. Un enlace válido no certifica respaldo semántico.
- `Observation.uncertainty` y `ComparisonGroup.interval` solo admiten `null` en esta versión; no son campos numéricos o intervalos funcionales.
- Pesos requieren claves presentes en target; `required_match` requiere objetivo y no puede coincidir con `vary`. La escala numérica de Gower es una decisión versionada de software, no un dominio experimental validado; véase `science/METHOD.md`.
- `RankedTrial.evidence_ids` incluye fuentes del ensayo, condiciones y observaciones. Las citas se validan contra la evidencia recuperada y el ensayo seleccionado, sin confundirlo con revisión científica del texto.
- Perfil incluye `known` y los cuatro estados de ausencia, también por estudio. Clave omitida cuenta como `not_reported`.
- UTC y secuencia contigua de eventos se validan; `Panel.kind` debe concordar con `data_ref`. Los eventos HTTP son reproducción guardada.
- La ruta de evidencia admite `research_id` opcional para recuperar la fuente histórica tras cambiar el corpus. La investigación es insuficiente si no hay ningún par X/Y conocido, aunque existan valores Y aislados.

Las restricciones de esta sección completan las tablas heredadas; no mantener una segunda implementación
de validadores a partir de la tabla. Un cambio futuro se coordina y genera junto con sus consumidores.

## Convenciones

- JSON snake_case; extra fields rechazados; números finitos; IDs estables y con espacio de nombres.
- Unidades canónicas codificadas en los nombres de condiciones. Conservar valor y unidad originales.
- Referencias tipadas mediante nombres de modelos de este documento.
- Los defaults implementados son decisiones de software, no hechos científicos.
- En campos opcionales sin default explícito: listas `[]`, mapas `{}`. La excepción `ResearchRequest.ranking` crea un `RankingRequest()` nuevo. No compartir contenedores mutables entre instancias.
- `Trial.conditions`, `RankingRequest.target` y `RankingRequest.weights` solo admiten claves de `ConditionKey`; rechazar claves desconocidas.
- Los tipos de condiciones deben concordar con su clave: números para O₂, presión, flujo y dimensiones; texto para material, geometría, dirección y gravedad.
- `required` significa que la clave debe existir en el JSON. Un campo obligatorio con `null` permitido puede expresar ausencia explícita.

## Tipos y enumeraciones

`ConditionKey`: oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime, oxygen_initial_pct, oxygen_final_pct, burning_faces, burn_duration_s.

`Metric`: flame_spread_rate_mm_s, extinction_oxygen_pct, heat_release_w, other.

`MissingStatus`: known, not_measured, not_reported, not_extracted, not_applicable.

`Provenance`: published, digitized, derived, synthetic.

## ConditionValue

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `value` | number o string o null | No | {"default": null} |
| `status` | MissingStatus | No | {"default": "not_reported"} |
| `unit` | string o null | No | {"default": null} |
| `original_value` | string o null | No | {"default": null} |
| `original_unit` | string o null | No | {"default": null} |
| `evidence_ids` | lista de string | No | — |

## Study

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | Identifier | Sí | {"minLength": 3, "maxLength": 240}; namespace sin `/`. |
| `title` | string | Sí | — |
| `family` | string | Sí | — |
| `description` | string | No | {"default": ""} |
| `source_urls` | lista de string | No | — |
| `dataset_status` | enum metadata_only, unverified, reviewed, synthetic | Sí | — |

## Evidence

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | Identifier | Sí | {"minLength": 3, "maxLength": 240}; namespace sin `/`. |
| `study_id` | string | Sí | — |
| `title` | string | Sí | — |
| `text` | string | Sí | — |
| `source_url` | string o null | No | {"default": null} |
| `locator` | string | Sí | — |
| `page` | integer o null | No | {"default": null} |
| `provenance` | Provenance | Sí | — |
| `reviewed` | boolean | No | {"default": false} |

## Trial

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | Identifier | Sí | {"minLength": 3, "maxLength": 240}; namespace sin `/`. |
| `study_id` | string | Sí | — |
| `sample_id` | string | Sí | — |
| `independent_unit_id` | string | Sí | — |
| `label` | string | Sí | — |
| `conditions` | mapa de ConditionValue | Sí | — |
| `evidence_ids` | lista de string | Sí | {"minItems": 1} |
| `provenance` | Provenance | Sí | — |
| `material_grade` | string o null | No | {"default": null} |
| `notes` | lista de string | No | — |

## Observation

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | Identifier | Sí | {"minLength": 3, "maxLength": 240}; namespace sin `/`. |
| `trial_id` | string | Sí | — |
| `metric` | enum flame_spread_rate_mm_s, extinction_oxygen_pct, heat_release_w, other | Sí | — |
| `value` | number o null | No | {"default": null} |
| `unit` | string | Sí | — |
| `status` | MissingStatus | No | {"default": "known"} |
| `evidence_ids` | lista de string | Sí | {"minItems": 1} |
| `provenance` | Provenance | Sí | — |
| `uncertainty` | null | No | Solo null; modelar significado, unidad y fuente antes de habilitar números. |

## DatasetBundle

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `schema_version` | '1.0' o '1.1' | No | {"default": "1.1"} |
| `dataset_id` | string | Sí | — |
| `description` | string | Sí | — |
| `studies` | lista de Study | No | — |
| `evidence` | lista de Evidence | No | — |
| `trials` | lista de Trial | No | — |
| `observations` | lista de Observation | No | — |

## RankingRequest

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `target` | mapa de number o string | No | — |
| `required_match` | lista de enum oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime | No | — |
| `vary` | lista de enum oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime | No | — |
| `weights` | mapa de number | No | — |
| `study_ids` | lista de string | No | — |
| `allow_synthetic` | boolean | No | {"default": false} |
| `minimum_coverage` | number | No | {"default": 0.6, "maximum": 1, "minimum": 0} |
| `limit` | integer | No | {"default": 3, "maximum": 50, "minimum": 1} |

## RankingContribution

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `variable` | enum oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime | Sí | — |
| `target` | number o string o null | Sí | — |
| `candidate` | number o string o null | Sí | — |
| `weight` | number | Sí | — |
| `distance` | number o null | No | {"default": null} |
| `note` | string | Sí | — |

## RankedTrial

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `trial_id` | string | Sí | — |
| `similarity` | number o null | No | {"default": null, "minimum": 0, "maximum": 1} |
| `coverage` | number | Sí | {"maximum": 1, "minimum": 0} |
| `eligibility` | enum eligible, excluded, indeterminate | Sí | — |
| `reasons` | lista de string | Sí | — |
| `contributions` | lista de RankingContribution | Sí | — |
| `evidence_ids` | lista de string | Sí | — |
| `provenance` | Provenance | Sí | — |

## RankingResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `schema_version` | '1.0' | No | {"default": "1.0"} |
| `dataset_id` | string | Sí | — |
| `method` | string | No | {"default": "compatibility_then_weighted_gower_v1"} |
| `items` | lista de RankedTrial | Sí | — |
| `excluded` | lista de RankedTrial | Sí | — |
| `warnings` | lista de string | Sí | — |

## ComparisonRequest

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `trial_ids` | lista de string | Sí | {"maxItems": 50, "minItems": 1} |
| `metric` | enum flame_spread_rate_mm_s, extinction_oxygen_pct, heat_release_w, other | No | {"default": "flame_spread_rate_mm_s"} |
| `x_condition` | enum oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime | No | {"default": "flow_velocity_cm_s"} |
| `vary` | lista de enum oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime | No | — |
| `allow_synthetic` | boolean | No | {"default": false} |

## PlotPoint

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `trial_id` | string | Sí | — |
| `observation_id` | string | Sí | — |
| `independent_unit_id` | string | Sí | — |
| `x` | number o null | Sí | — |
| `y` | number | Sí | — |
| `group_id` | string | Sí | — |
| `evidence_ids` | lista de string | Sí | — |
| `provenance` | Provenance | Sí | — |

## ComparisonGroup

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | string | Sí | — |
| `conditions` | mapa de string | Sí | — |
| `trial_ids` | lista de string | Sí | — |
| `n_trials` | integer | Sí | — |
| `n_observations` | integer | Sí | — |
| `n_independent_units` | integer | Sí | — |
| `median` | number o null | Sí | — |
| `interval` | null | No | Solo null; no se implementan intervalos ni bootstrap. |
| `warnings` | lista de string | Sí | — |

## ComparisonResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `metric` | enum flame_spread_rate_mm_s, extinction_oxygen_pct, heat_release_w, other | Sí | — |
| `unit` | string | Sí | — |
| `x_condition` | enum oxygen_pct, pressure_kpa, flow_velocity_cm_s, material, geometry, thickness_mm, diameter_mm, sample_width_mm, flow_direction, gravity_regime | No | {"default": "flow_velocity_cm_s"} |
| `x_unit` | string o null | No | {"default": "cm/s"} |
| `groups` | lista de ComparisonGroup | Sí | — |
| `points` | lista de PlotPoint | Sí | — |
| `warnings` | lista de string | Sí | — |

## ProfileResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `dataset_id` | string | Sí | — |
| `n_studies` | integer | Sí | — |
| `n_trials` | integer | Sí | — |
| `n_observations` | integer | Sí | — |
| `n_independent_units` | integer | Sí | — |
| `missing_by_condition` | mapa de mapa de integer | Sí | — |
| `missing_by_study` | mapa de mapa de mapa de integer | No | — |
| `issues` | lista de string | Sí | — |
| `synthetic_trials` | integer | Sí | — |

## Citation

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `evidence_id` | string | Sí | — |
| `trial_id` | string o null | No | {"default": null} |

## Claim

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `text` | string | Sí | — |
| `kind` | enum finding, inference, limitation | Sí | — |
| `citations` | lista de Citation | Sí | — |

## Hypothesis

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | string | Sí | — |
| `statement` | string | Sí | — |
| `rationale` | string | Sí | — |
| `evidence_ids` | lista de string | Sí | — |
| `alternative_explanation` | string | Sí | — |
| `next_measurement` | string | Sí | — |
| `falsification` | string | Sí | — |
| `label` | enum ai_hypothesis, prepared_demo_hypothesis | Sí | — |

## ActivityEvent

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `sequence` | integer | Sí | — |
| `stage` | enum plan, retrieve, analyze, review, complete, error | Sí | — |
| `message` | string | Sí | — |
| `evidence_ids` | lista de string | No | — |

## Panel

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `id` | string | Sí | — |
| `kind` | enum ranking, comparison, evidence, hypotheses, limitations | Sí | — |
| `title` | string | Sí | — |
| `data_ref` | enum ranking, comparison, evidence, hypotheses, warnings | Sí | — |

## ResearchRequest

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `question` | string | Sí | {"maxLength": 4000, "minLength": 3} |
| `ranking` | RankingRequest | No | — |
| `metric` | enum flame_spread_rate_mm_s, extinction_oxygen_pct, heat_release_w, other | No | {"default": "flame_spread_rate_mm_s"} |
| `include_hypotheses` | boolean | No | {"default": true} |

## ResearchResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `schema_version` | '1.0' | No | {"default": "1.0"} |
| `id` | string | Sí | — |
| `created_at` | string (date-time) | Sí | — |
| `provider` | enum demo, openai | Sí | — |
| `status` | enum completed, insufficient_evidence | Sí | — |
| `question` | string | Sí | — |
| `summary` | string | Sí | — |
| `claims` | lista de Claim | Sí | — |
| `ranking` | RankingResponse | Sí | — |
| `comparison` | ComparisonResponse o null | Sí | — |
| `evidence` | lista de Evidence | Sí | — |
| `hypotheses` | lista de Hypothesis | Sí | — |
| `panels` | lista de Panel | Sí | — |
| `events` | lista de ActivityEvent | Sí | — |
| `warnings` | lista de string | Sí | — |

## ScenarioComparisonRequest

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `name_a` | string | No | {"default": "Scenario A"} |
| `name_b` | string | No | {"default": "Scenario B"} |
| `scenario_a` | RankingRequest | Sí | — |
| `scenario_b` | RankingRequest | Sí | — |

## ScenarioComparisonResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `name_a` | string | Sí | — |
| `name_b` | string | Sí | — |
| `ranking_a` | RankingResponse | Sí | — |
| `ranking_b` | RankingResponse | Sí | — |
| `warnings` | lista de string | Sí | — |
| `label` | 'evidence_comparison_not_physical_simulation' | No | {"default": "evidence_comparison_not_physical_simulation"} |

## HealthResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `status` | enum ok, degraded | Sí | — |
| `version` | string | Sí | — |
| `schema_version` | string | Sí | — |
| `database` | string | Sí | — |
| `ai_provider` | string | Sí | — |
| `data_mode` | string | Sí | — |

## ErrorResponse

| Campo | Tipo | Obligatorio | Restricciones o valor inicial |
|---|---|---|---|
| `code` | string | Sí | — |
| `message` | string | Sí | — |
| `request_id` | string o null | No | {"default": null} |

## Invariantes que debe validar el código

1. Un valor known no puede ser nulo; los estados ausentes no se sustituyen por cero. Rechazar booleanos usados como números, NaN e infinitos.
2. IDs únicos por entidad; todas las referencias deben resolverse dentro del corpus o una fuente versionada explícita.
3. Evidencia sintética no puede sostener una medición publicada; conservar procedencia también en gráficos, ranking, hipótesis e informes.
4. Una variable no puede estar simultáneamente en required_match y vary. Las variables obligatorias deben tener valor objetivo. Pesos finitos no negativos.
5. No target o pesos activos insuficientes produce estado indeterminado, no similitud perfecta.
6. Los valores numéricos se interpretan según la variable y su unidad; no agrupar magnitudes diferentes bajo other sin especificación adicional.
7. Hipótesis y escenas conceptuales no equivalen a resultados medidos ni a validación lunar.
8. Los eventos describen acciones efectivamente realizadas. Un replay de eventos guardados debe identificarse como tal.
9. Las citas se validan contra el subconjunto realmente proporcionado al modelo y su vínculo con el ensayo; resolver IDs no prueba por sí solo que una afirmación esté respaldada.
10. Los paneles se eligen de un catálogo cerrado; no se ejecuta HTML, JavaScript, SQL o comandos arbitrarios generados por IA.
11. Un estado distinto de `known` lleva `value=null`. El estado `known` admite cero legítimo. `Observation` sin valor requiere declarar un estado de ausencia; el default `known` no permite un registro vacío.
12. `PlotPoint.x` es numérico en este contrato inicial. Una condición categórica puede servir para agrupar, pero no se convierte a un número arbitrario para dibujarla. Si se pide un eje categórico, devolver una advertencia o ampliar el contrato coordinadamente antes de representarlo.
13. El esqueleto deja `interval=null`. Antes de implementar intervalos, añadir método, nivel, número de unidades y parámetros de remuestreo al contrato. Un par de límites sin contexto no acredita un intervalo de confianza.
14. `uncertainty` permanece nulo salvo que se documente y modele su significado (p. ej., desviación estándar o incertidumbre instrumental), unidad, fuente y nivel si corresponde. No inferirlo por decimales del PDF.
15. `page` es índice de página PDF desde 1; `locator` conserva además etiqueta impresa, tabla, figura o región cuando difieran. No inventar página para una fuente HTML.
16. `created_at` utiliza ISO 8601 con zona UTC; las secuencias de eventos son crecientes y estables dentro de una investigación.
17. `metric=other` no se compara ni combina hasta disponer de identificador semántico y unidad compatibles. Añadirlos al contrato si el ZIP lo requiere, o devolver estado explícito de métrica no soportada.
18. `missing_by_condition` tiene forma condición → estado de ausencia → cantidad; `missing_by_study` tiene forma estudio → condición → estado → cantidad. Definir en la implementación si se incluyen estados `known`, documentarlo y mantenerlo en API y UI.

## Scientific review still required

The successive-condition model now preserves the parent trial and links each
observation to a stage. Trial oxygen endpoints are distinct from unmeasured stage
oxygen, and burning faces and original observation values/units are explicit.
These additive changes and their consumer behavior are recorded in
[ADR 0008](adr/0008-successive-conditions-and-bass-import.md).
P3 reviewed extraction and representation; documented source discrepancies and scientific comparability still require human review. Saffire is not
automatically combined with BASS-II. See [P2_DELIVERY](P2_DELIVERY.md).
