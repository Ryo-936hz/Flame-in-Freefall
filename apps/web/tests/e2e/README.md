# Recorrido E2E P6 (`p6-walkthrough.mjs`)

Recorrido de navegador real contra backend real. Arranca la API FastAPI (proveedor `demo`, semilla
sintética, SQLite temporal) y Vite en puertos propios, abre Chromium con Playwright y recorre los paneles
P6 (`MissionLabPanel`, `ReportPanel`) montados en un host. Todos los datos son **fixtures sintéticos, no
mediciones NASA**; el proveedor `demo` es un coordinador determinista sin LLM.

## Uso

```bash
# desde la raíz del repositorio, con dependencias instaladas (npm ci + uv sync)
node apps/web/tests/e2e/p6-walkthrough.mjs --host=harness            # arnés técnico de esta rama
node apps/web/tests/e2e/p6-walkthrough.mjs --host=p5                 # interfaz P5 con los paneles P6 montados
```

Opciones: `--api-port=8541` y `--web-port=5541` (o `P6_E2E_API_PORT`/`P6_E2E_WEB_PORT`), `--root=<repo>`,
`--db=<ruta.db>` (si se da, no se borra el directorio temporal), `--screenshots=<dir>`, `--headed`,
`--timeout=<ms>` por espera. `P6_E2E_TMP` elige dónde se crea el directorio temporal.

La API se lanza con `uv run --no-sync uvicorn flamelab.main:app` y `PYTHONPATH=<root>/apps/api/src`, de modo
que en un worktree con `.venv` enlazado se ejecuta el código del worktree y no se reinstala el entorno.

Salida: una línea `PASS`/`FAIL` por paso y un resumen; código de salida `0` solo si todo pasa.

## Qué comprueba

1. Carga del host y de las regiones «Mission Lab · evidence scenarios» y «Report and recovery».
2. Investigación (`POST /research`): proveedor `demo` y texto «Deterministic demo coordinator · no external model».
3. Evidencia de una hipótesis (`source: "record"`): la lectura lleva `research_id` del expediente activo.
4. A/B con gravedad lunar: etiqueta `evidence_comparison_not_physical_simulation`, resultado `data-freshness="current"`,
   B sin evidencia aplicable con motivos.
5. Evidencia de una fila A/B (`source: "corpus"`): la lectura va **sin** `research_id` y el visor la rotula como corpus activo.
6. Vigencia: cambiar filtros tras comparar ⇒ `data-freshness="filters_changed"`, «Previous comparison — not computed
   with the current filters», A deja de llamarse «A · current filters»; restaurar los mismos filtros ⇒ vuelve a `current`.
7. Consulta sin evidencia suficiente: `status = insufficient_evidence`, sin candidatos, «What is missing».
8. Informe: texto mostrado == `GET /research/{id}/report` == archivo descargado (nombre `flamelab-report-<slug>.md`).
9. Recarga de página + reinicio de la API sobre la misma base: «Reopen last research» recupera el mismo informe.
10. Id inexistente: alerta 404.
11. Error recuperable: API parada ⇒ alerta con «Retry report»; API de vuelta ⇒ Retry restaura el mismo informe.
12. Sin excepciones de página no capturadas.

## Adaptador de host

Solo cuatro acciones dependen del host (`hosts` en el script): esperar a que cargue, lanzar la investigación,
cambiar/restaurar filtros y localizar el visor de evidencia con su rótulo de corpus. Todo lo demás usa roles,
nombres accesibles y atributos (`data-freshness`, `data-research-id`) de los paneles P6. Si P5 cambia los textos
«Investigate», «Max. trials», «Reset demo query» o el rótulo «Active corpus · not in this research record», se
actualiza solo el adaptador `p5`.

## Dependencia de Playwright (propuesta para P1)

`playwright` **no** es dependencia del proyecto. El script lo busca en `node_modules` del repositorio, en
`PLAYWRIGHT_MODULE` o en la instalación global de npm (`npm root -g`), y falla con un mensaje claro si no existe.
Propuesta para P1 (no aplicada): añadir `playwright` como `devDependency` fijada en el lockfile, un script
`test:e2e:p6` y un job de CI que ejecute `npx playwright install --with-deps chromium` y
`node apps/web/tests/e2e/p6-walkthrough.mjs --host=<host de main>`. Hasta entonces es una comprobación local.
