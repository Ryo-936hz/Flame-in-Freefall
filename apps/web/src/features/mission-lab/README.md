# Mission Lab (P6)

Mission Lab presenta escenarios A/B, hipótesis y el caso sin evidencia suficiente sobre el cliente común
(`apps/web/src/lib/client.ts`). P5 revisa el punto de montaje e integración visual.

- `scenarios.ts`: lógica pura. `scenarioPresets` define escenarios B; `buildScenarioRequest(base, presetId, metric)`
  arma la petición a `/api/v1/scenarios/compare`; `diffScenarioRankings(response)` clasifica ensayos en
  entra/sale/se mantiene con los motivos de `ranking_b.excluded`; `hypothesisLabelText(label)` rotula hipótesis.
  La métrica es obligatoria: ambos escenarios comprueban disponibilidad antes del límite.
  Los omitidos por top-k no aparecen en `excluded`; no se inventan motivos ni totales de exclusión.
- La API es la autoridad: no recalcular ranking ni elegibilidad en el navegador. `null` no es `0`.
- `/scenarios/compare` compara aplicabilidad de evidencia (`evidence_comparison_not_physical_simulation`);
  no simula física.
- Las hipótesis conservan `prepared_demo_hypothesis` o `ai_hypothesis`; los fixtures son sintéticos, no NASA.
- Guion, peticiones verificadas, respaldo y aceptación: [docs/DEMO.md](../../../../../docs/DEMO.md#p6--recorrido-mission-lab).
- `MissionLabPanel.tsx`: panel montable con `MissionSlotProps` (`slot.ts`) más `question` y `trigger` opcionales.
  Cada resultado A/B y la consulta insuficiente guardan filtros usados, métrica, hora y expediente activo;
  la consulta guarda además la pregunta y el orden original de `vary` (puede cambiar el eje X); `resultStatus.ts`
  decide si es actual. Si no lo es, se rotula «Previous comparison/query» con los filtros usados y botón Recompute,
  y A nunca se llama «A · current filters». Evidencia del A/B se abre con `source: "corpus"`; la de hipótesis con `"record"`.
  Se conservan y muestran los segmentos puntuado/elegibles de cada escenario sin contarlos como réplicas.
  `MissionLab.tsx` solo reexporta el panel por compatibilidad.
- `mission-lab.css`: estilos acotados a `.mission-lab`/`ml-`. Lee los tokens de P5 (`--surface`, `--ink`, `--ink-3`,
  `--rule`, `--signal`, `--warn`, `--font-num`…) mediante variables `--ml-*` con valores de respaldo que reproducen el
  aspecto claro del arnés; así es legible en los temas oscuro y claro de P5. No define tokens globales; incluye estilo
  propio de botones y tablas dentro del panel porque P5 no estiliza `button`/`table` sin clase.
  El host define `.p6-slot { container-type: inline-size; container-name: mission-slot; }`;
  la tabla pasa a filas apiladas dentro de columnas estrechas, también en escritorio.
- Montaje actual en P5: `App.tsx` sustituye `InterimMissionTools` por
  `<MissionLabPanel {...slot} question={draft.question} />` y `<ReportPanel {...slot} />` dentro de `#lab`. El
  `slot.metric` recibe `draft.metric`. `beginResearchIntent` coordina recuperaciones con Reset/Investigate;
  `onOpenEvidence` del host lee sin `research_id` cuando `source === "corpus"`, incluso sin expediente activo.
  El parche antiguo se conserva como antecedente y no se aplica sobre el montaje actual.
- Recorrido E2E con navegador y backend reales: `apps/web/tests/e2e/p6-walkthrough.mjs` (`--host=harness|p5`); usa
  roles, nombres accesibles, `data-freshness` (resultado A/B y consulta) y `data-research-id` (informe/eventos).
  Cambiar esos textos o atributos exige actualizar el recorrido.

La consulta lunar envía `planning_mode: explicit` y la métrica seleccionada. Muestra
su plan guardado, sin reconstruirlo. Si hay evidencia lunar, presenta el estado que
devuelve la API en vez de forzar insuficiencia; el resultado vacío solo está previsto
para el respaldo sintético documentado. Cambiar la pregunta o la métrica marca la
consulta anterior; una pregunta explícitamente vacía no se sustituye por otra.

Los resultados llevan `data-result-kind="comparison"|"query"`, `data-freshness`
(`current`, `filters_changed`, `filters_unknown`, `metric_changed`, `question_changed`,
`variable_order_changed`, `research_changed`) y `data-research-id` en la consulta.
Las guardas descartan respuestas de peticiones anteriores y de paneles desmontados.

El botón se llama «Run lunar evidence query»: la insuficiencia se espera solo en
el respaldo sintético, no se promete para cualquier corpus. Las etiquetas de
procedencia cuentan ensayos seleccionados, no fuentes ni observaciones.
