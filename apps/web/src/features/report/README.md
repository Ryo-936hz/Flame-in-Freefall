# Informe y recuperación (P6)

`ReportPanel` muestra el informe persistido del expediente activo, reproduce sus eventos guardados y recupera
expedientes por id. Recibe `MissionSlotProps` (`../mission-lab/slot.ts`); P5 lo monta en `App.tsx`.

```tsx
import { ReportPanel } from "./features/report/ReportPanel"; // también export default
<ReportPanel api={api} research={result} request={currentRequest} researchState={state}
  onOpenRun={showRun} onOpenEvidence={onCite} />
```

Usa `api`, `research`, `researchState` y `onOpenRun`; `request` y `onOpenEvidence` no se usan.

## Comportamiento

- **Informe.** Cada vez que cambia `research.id` se pide `GET /api/v1/research/{id}/report`. El texto se muestra
  tal cual en un `<pre>` (Markdown fuente, sin renderizar ni ejecutar), con id y `created_at` del expediente.
  No se reconstruye en el navegador.
- **Pertenencia.** El estado del informe guarda el id del que procede, y solo se pinta si coincide con el
  expediente activo. Una guarda local (contador) descarta respuestas tardías. No depende de `createRequestGuard`.
- **Descarga.** Un `Blob` `text/markdown` con exactamente el texto mostrado. El nombre sale de
  `reportFileName(id)`, por ejemplo `synthetic:run-1` → `flamelab-report-synthetic-run-1.md`.
- **Eventos.** «Replay saved events» lee `GET /events` (SSE persistido, `replay: true`, `live: false`). Se
  muestra como texto, rotulado «Replay · not live». Se descarta al cambiar de expediente.
- **Recuperación.** Hay un campo de id y una lista de recientes. Recuperar llama a `api.getResearch(id)`, luego
  a `rememberRun` y después a `onOpenRun(run)`. El foco pasa al encabezado del panel cuando el host ya
  muestra ese expediente. Cada expediente activo se recuerda automáticamente.
- **Recarga de página.** *Decisión:* no se reabre nada automáticamente. Si no hay expediente activo y hay
  recientes, se ofrece el botón «Reopen last research» y la lista. Así el host no cambia de estado sin
  una acción de la persona, y una API caída no deja un error inesperado al cargar.
- **Errores.** Informe, eventos y recuperación muestran su mensaje en `role="alert"` y un botón Retry. Se
  distinguen 404, error del servidor y API inaccesible.
- **Persistencia.** Los expedientes viven en la base del backend (SQLite en local), así que la recuperación
  funciona tras reiniciar la API. Los recientes son solo ids en `localStorage` (`flamelab.recentRuns.v1`):
  como máximo 10, sin duplicados, el más reciente primero. Todo acceso va en try/catch; si el
  almacenamiento falla, la lista vale solo para la sesión.

## Archivos

- `report.ts`: lógica pura (`reportFileName`, `loadRecentRuns`, `rememberRun`, `RECENT_RUNS_KEY`,
  `MAX_RECENT_RUNS`).
- `ReportPanel.tsx`: componente (export nombrado y default).
- `report.css`: estilos con el prefijo `rp-`. Lee los tokens de P5 (`--surface`, `--ink`, `--signal`…) con
  valores de respaldo; no define globales.
- Pruebas: `apps/web/tests/report.test.ts` (`npx tsx --test apps/web/tests/report.test.ts`).

## Límites

- El texto del informe lo genera el backend, hoy en español. La interfaz del panel está en inglés.
- Los recientes solo guardan ids; para la fecha hay que abrir el expediente.
