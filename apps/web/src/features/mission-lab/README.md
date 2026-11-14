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
