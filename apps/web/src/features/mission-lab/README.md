# Mission Lab (P6)

Mission Lab presenta escenarios A/B, hipótesis y el caso sin evidencia suficiente sobre el cliente común
(`apps/web/src/lib/client.ts`). P5 revisa el punto de montaje e integración visual.

- `scenarios.ts`: lógica pura. `scenarioPresets` define escenarios B; `buildScenarioRequest(base, presetId)`
  arma la petición a `/api/v1/scenarios/compare`; `diffScenarioRankings(response)` clasifica ensayos en
  entra/sale/se mantiene con los motivos de `ranking_b.excluded`; `hypothesisLabelText(label)` rotula hipótesis.
  Sus firmas exportadas son estables.
- La API es la autoridad: no recalcular ranking ni elegibilidad en el navegador. `null` no es `0`.
- `/scenarios/compare` compara aplicabilidad de evidencia (`evidence_comparison_not_physical_simulation`);
  no simula física.
- Las hipótesis conservan `prepared_demo_hypothesis` o `ai_hypothesis`; los fixtures son sintéticos, no NASA.
- Guion, peticiones verificadas, respaldo y aceptación: [docs/DEMO.md](../../../../../docs/DEMO.md#p6--recorrido-mission-lab).
- `MissionLabPanel.tsx`: panel montable con `MissionSlotProps` (`slot.ts`) más `question` y `trigger` opcionales.
  Cada resultado A/B y la consulta insuficiente guardan filtros usados, hora y expediente activo; `resultStatus.ts`
  decide si es actual. Si no lo es, se rotula «Previous comparison/query» con los filtros usados y botón Recompute,
  y A nunca se llama «A · current filters». Evidencia del A/B se abre con `source: "corpus"`; la de hipótesis con `"record"`.
  `MissionLab.tsx` solo reexporta el panel por compatibilidad.
- `mission-lab.css`: estilos acotados a `.mission-lab`/`ml-`. Lee los tokens de P5 (`--surface`, `--ink`, `--ink-3`,
  `--rule`, `--signal`, `--warn`, `--font-num`…) mediante variables `--ml-*` con valores de respaldo que reproducen el
  aspecto claro del arnés; así es legible en los temas oscuro y claro de P5. No define tokens globales; incluye estilo
  propio de botones y tablas dentro del panel porque P5 no estiliza `button`/`table` sin clase.
- Montaje en P5: `docs/handoffs/P6-mount-for-P5.patch` sustituye `InterimMissionTools` por
  `<MissionLabPanel {...slot} question={draft.question} />` y `<ReportPanel {...slot} />` dentro de `#lab`. El
  `onOpenEvidence` del host lee sin `research_id` cuando `source === "corpus"`.
- Recorrido E2E con navegador y backend reales: `apps/web/tests/e2e/p6-walkthrough.mjs` (`--host=harness|p5`); usa
  roles, nombres accesibles, `data-freshness` (resultado A/B y consulta) y `data-research-id` (informe/eventos).
  Cambiar esos textos o atributos exige actualizar el recorrido.
