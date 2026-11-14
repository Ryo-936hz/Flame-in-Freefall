# Registro de verificaciones

14 de noviembre de 2026, zona Europe/Madrid. Las primeras secciones registran la
construcción local Windows; la última registra la publicación y CI remota.
Ninguna de estas verificaciones equivale a validación científica.

## Integration of `main` and `lujan`

Integrated `main` at `9ccc996` and `lujan` at `a4b03c7` after fast-forward-only
pulls of both branches. The merged contract preserves the `main` oxygen scope and
range checks, P3 comparison rules, and P2 corpus mappings. OpenAPI and TypeScript
were regenerated from the merged schema. The PostgreSQL workflow and test from
`main` are included.

- Python with both real 1.1 bundles: **213 passed**. PostgreSQL was skipped in
  this local run because a test database URL was not configured.
- Both P3 evaluation suites passed. SQLite HTTP and restart smoke passed.
- Ruff, OpenAPI/TypeScript drift, typecheck, **6 client tests** and Vite build passed.

## P2 follow-up after P1/P3 review

Branch `lujan`, starting commit `cfc0795`. Used P1's segment contract at `94989a7`
and P3's scientific baseline at `8134b1c`. The shared bundle version is 1.1 and
OpenAPI and TypeScript were regenerated from the consolidated model.

- The exact P1 example in `docs/examples/sequential_conditions.json` validates.
  It contains one physical trial, two segments and two linked observations.
- Re-extracted the hash-verified BASS-II PDF and the full set of NASA sources in WSL.
  The full corpus has 24 studies, 2,265 evidence entries, 1,058 trial/configuration
  records and 1,673 observations (1,283 known). BASS-II retains 20 trials and 43
  segments, with 39 known rates and four explicit absences. Checked every observation
  against the previous extraction after the segment field rename. Values, units,
  absence states and evidence references match.
- Imports into `sqlite:///work/nasa-24-v11.db` returned `changed: true` and then
  `changed: false`. Legacy P2 snapshots can be read without rewriting saved payloads.
- `FLAMELAB_BASS_BUNDLE=data/processed/bass-table51-v11/bundle.json FLAMELAB_NASA_BUNDLE=data/processed/nasa-24-v11/bundle.json uv run --locked pytest -q`
  passed **190 tests**, including both real-data integrations and the imported
  P1/P3 regressions. The existing Starlette/httpx warning remains.
- `uv run --locked python evals/science/run.py` and
  `uv run --locked python evals/science/segment_run.py` passed all **9 P3 cases**.
  The regressions cover absent segment flow, oxygen scopes, isolated controls,
  observation provenance, finite large weights and finite large medians.
- Ruff, OpenAPI/TypeScript drift checks, typecheck, all **6 client tests**, Vite
  build, and the SQLite HTTP/restart smoke test passed. The smoke health response
  reports contract 1.1. These are local checks. Review of the NASA interpretations
  and integration into `main` remain pending.

## Extended NASA corpus on `lujan`

- Built the 24-study corpus from `datasets/` in WSL using `extract-nasa` and the
  isolated PyMuPDF 2.1 tool. Verified the 123 inventoried source files, parsed all
  22 CSVs, and compared two runs of `bundle.json` and `quality.json` byte-for-byte.
- `validate` passed. Import into `sqlite:///work/nasa-24.db` returned `changed: true`
  and `changed: false` on consecutive runs. The bundle has 2,265 evidence entries,
  1,058 mapped records and 1,673 outcome entries, including 1,283 known values.
- `FLAMELAB_NASA_BUNDLE=data/processed/nasa-24/bundle.json FLAMELAB_BASS_BUNDLE=data/processed/bass-table51/bundle.json uv run --locked pytest -q`
  passed **142 tests**, with the existing Starlette/httpx deprecation warning.
  The real-corpus test verifies study evidence, pagination, provenance, campaign
  restrictions, unresolved units and a saved FLEX research response.
- Ruff, OpenAPI and TypeScript drift checks, typecheck, **6 client tests**, and
  Vite production build passed. `uv run --locked python scripts/smoke.py` passed
  using SQLite and the synthetic fixture. API verification used TestClient and
  the smoke test used real HTTP. The new catalog UI was verified by typecheck/build.
- Details about the quantities and pending source interpretation are in
  [P2_NASA_24](P2_NASA_24.md).

## P2 branch verification — 14 November 2026

Branch `lujan`, starting/unchanged HEAD `f981bdd4df55ca8339bfb7c92f21bc50802bfcca`.
Fetched main/team base `422f6b03f410c6ac049b699e13fc204a3af67743`; rebase reported
already up to date. Changes below are local and uncommitted; no new remote CI run
is claimed. Environment: Ubuntu under WSL, Python 3.12.3, uv 0.8.13,
Node 24.21.0. The Windows wrapper was not run against this Linux virtualenv;
its underlying checks were executed directly.

| Executed check | Observed result |
| --- | --- |
| Clean baseline `uv run --locked pytest -q` | 112 passed. |
| Local corpus audit using Python hashes/ZIP/CSV readers | All 24 studies present; all 123 inventory members match SHA-256; 12 extra loose files are identical metadata copies. |
| Fixed-source extractor, two fresh output directories | Byte-identical `bundle.json` and `quality.json`. PDF/CSV hashes match the inspected source versions. |
| Independent PDF visual/text audit | All 180 Table 5.1 cells match; Figure 5.2 discrepancy and section 5.4 oxygen scope retained. |
| `uv run --locked python -m flamelab.data.cli validate data/processed/bass-table51/bundle.json` | 24 studies, 20 physical tests, 43 observations; 39 known rates and 4 missing rates. |
| `uv run --locked python -m flamelab.data.cli import data/processed/bass-table51/bundle.json --database-url sqlite:///work/bass-p2.db` twice | First import `changed: true`; second `changed: false`. Persistent isolated local database is ready. |
| `FLAMELAB_BASS_BUNDLE=data/processed/bass-table51/bundle.json uv run --locked pytest -q` | **132 passed**, one existing Starlette/httpx deprecation warning. Includes real-source TestClient research, strict stage filtering, source lookup, A/B, insufficiency, saved report, corpus replacement and API reopening. |
| `uv run --locked ruff check apps/api scripts` | All checks passed. |
| `uv run --locked python scripts/export-openapi.py --check` | OpenAPI matches canonical contracts. |
| `npm run check:types` and `npm run typecheck` | Generated TypeScript matches OpenAPI; typecheck passed. |
| `npm run test:client` | **6 passed**. |
| `npm run build` | Production build passed. |
| `uv run --locked python scripts/smoke.py` | Real uvicorn HTTP with synthetic fixture: 5 trials, 4 selected points, report unchanged after restart. |
| `git diff --check` | Passed. |

The real-source test explicitly skips if `FLAMELAB_BASS_BUNDLE` is not configured;
the 132-pass run above did configure it and had no skipped tests. Ordinary CI does
not need the local PDFs. New source-cell unit fixtures are explicitly invented
test inputs and are not shipped as NASA observations.

The default demo corpus remains synthetic. BASS-II in the separately generated
bundle is `unverified`; all imported evidence retains `reviewed=false`. Eighteen
physical tests have at least one known rate. Selected test/unit counts can include
M6/M12 with zero usable rates. Saffire remains documentary. No external AI call,
PostgreSQL run, new browser walkthrough, publication, or human scientific review
was performed in this P2 increment. See [P2_DELIVERY](P2_DELIVERY.md) for commands
and [ADR 0008](adr/0008-successive-conditions-and-bass-import.md) for shared changes.

## Entorno observado

- Git 2.55.0.windows.5; Python 3.12.14; Node 24.22.1; uv 0.9.5; npm 11.6.2.
- Versiones resueltas y fijadas: FastAPI 0.162.7, Pydantic 2.14.3, SQLAlchemy 2.1.8,
  Alembic 1.20.1, uvicorn 0.54.0, httpx 0.28.1, pytest 9.2.0, Ruff 0.17.5;
  React 19.3.1, TypeScript 5.9.3, Vite 8.3.8, openapi-typescript 7.13.0.
- SQLite local en disco; fixtures sintéticos; AI_PROVIDER=demo.
- Navegador: Chrome 157.0.8103.39 y Playwright 1.62.1 ya disponibles en este equipo.

## Ejecuciones

| Comando/procedimiento | Resultado observado |
|---|---|
| `scripts/setup.ps1` | uv sync --locked, npm ci, schema/typecheck/build completados; .env preservado. |
| `scripts/check.ps1` | Proceso completo finalizado con éxito. Log local work/verification.log. |
| `python -m pytest -q` | **112 passed**, 1 aviso de deprecación, sin fallos. |
| `ruff check apps/api scripts` | All checks passed. |
| `python scripts/export-openapi.py --check` | Sin deriva respecto a Pydantic. |
| `npm run check:types` / `typecheck` | Sin deriva de TS y compilación de tipos correcta. |
| `npm run test:client` | **6/6** pruebas aprobadas. |
| `npm run build` | Compilación Vite correcta. |
| `python scripts/smoke.py` | HTTP real: 5 ensayos sintéticos, 4 puntos seleccionados, informe igual tras reinicio. |
| `npm run test:client:live` | 11 comprobaciones HTTP contra API8000: salud/perfil/investigación/procedencia/evidencia/persistencia/informe/replay/A-B/insuficiencia/404. |
| Chrome mediante Playwright | Investigar, evidencia histórica, informe, replay, A/B 3 frente a 0, lunar sin evidencia, error422; sin errores JS. |
| CLI inventory sobre ZIP original | 123 archivos+105 directorios; 276 miembros incluyendo anidados; hash intacto. |
| CLI validate/import | Catálogo/fixture válidos; repetición idempotente y reemplazo explícito comprobados. |

Los 112 casos cubren contratos estrictos, referencias/procedencia, ZIP malicioso,
ceros y ausencias, ranking y comparación, snapshots/SQLite, API y proveedor simulado.
No son ensayos científicos. Las observaciones sintéticas prueban conexiones.

## Incidencias resueltas y límites

- Ruta documental inicial tenía un nivel menos; se localizó sin mover originales.
- No había Python/uv/npm estándar accesibles. Se reutilizaron runtimes disponibles
  y herramientas locales dentro del proyecto, sin instalación global.
- npm ci con Vite abierto falló EPERM de DLL en Windows; detener Vite y repetir
  setup resolvió el problema. No se borró trabajo ajeno ni se elevó privilegios.
- Revisión cruzada corrigió IDs con slash, fuentes de observación no enlazadas,
  memoria SQLite no persistente, respuestas externas malformadas, deadline global,
  tipos bool/numéricos y estado insuficiente sin X.
- Algunas corridas de desarrollo coincidieron con edición de pruebas; el resultado
  de cierre se tomó después de estabilizar los archivos, no de esas corridas.
- Starlette emite aviso de deprecación del transporte httpx de TestClient. No se
  añadió otro cliente equivalente solo para silenciarlo; el recorrido uvicorn
  verifica además HTTP real. Revisar al actualizar dependencias.
- El script de navegador usó Playwright preinstalado; no se añadió a dependencias
  ni CI. Reproducción manual documentada en apps/web/README.md.
- Ninguna llamada real a OpenAI, prueba PostgreSQL/Docker, despliegue,
  móvil, validación semántica automática o revisión científica completa del corpus.

## Instalación limpia

Se creó `work/clean-checkout` con `git clone --no-hardlinks` desde el commit
`d9f7406` y se ejecutaron allí `scripts/setup.ps1` y `scripts/check.ps1`.
Se crearon su propia `.venv`, `node_modules`, herramientas locales y `.env`:
**112 pruebas Python, 6 de cliente, tipos/generados, build y HTTP con reinicio
aprobados**. Se reutilizaron runtimes y cachés del mismo Windows, no se probó una
máquina nueva ni otro sistema operativo. Los cambios posteriores al commit probado
solo registran estos resultados en documentación; el código y lockfiles no cambiaron.
`.gitattributes` fija LF para impedir deriva artificial de generados por CRLF.
Logs: `work/clean-checkout/work/setup.log` y `work/clean-checkout/work/verification.log`.

## Evidencia conservada

Inventario versionado en data/catalog/zip_inventory.json; documentación detallada
en DATA_INSPECTION. Logs temporales/smoke/capturas están en work, excluidos de Git.
El paquete de entrega copia los resultados relevantes sin claves, bases ni archivos
NASA originales. Las capturas son un arnés de software, no el frontend final.

## Publicación GitHub y CI Windows/Linux

Publicación autorizada por el usuario. Git local no tenía credenciales y el
conector respondió 403 `Resource not accessible by integration`; no llegó a crear
archivos. El usuario eligió autenticar Git local en Windows. Git Credential Manager
completó el inicio de sesión y el push publicó el historial completo en `main` y
el tag histórico. No se pidieron ni copiaron claves/tokens al chat o al repositorio.

Primera ejecución remota: [Verify integrated skeleton #1](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43592863296),
commit `df6e0454168f4e87844351ec32df65bd0933fe0a`, estado **success**.

| Job | Resultado observado en GitHub |
|---|---|
| `verify (ubuntu-latest)` — 132441106675 | Dependencias locked, Ruff, **112 pruebas Python**, **6 cliente**, OpenAPI/TS sin deriva, typecheck, build y HTTP con reinicio aprobados. |
| `verify (windows-latest)` — 132441106948 | Mismas comprobaciones aprobadas: **112 Python**, **6 cliente** y recorrido HTTP. |

Se consultaron estado, pasos y logs de ambos jobs, no solo la insignia del README.
El aviso Starlette/TestClient también aparece en CI. El workflow se ejecuta con
proveedor demo y SQLite; no prueba PostgreSQL ni llama a OpenAI.

Además se clonó desde la URL real de GitHub en `work/github-checkout` y se ejecutó
`scripts/setup.ps1` en ese clon con su propio entorno, herramientas, `.env` y
dependencias. El checkout remoto coincide con el contenido publicado. La referencia
de equipo incorpora esta documentación; consultar su ejecución propia en Actions.
`codex/team-start-v1` y `flamelab-team-start-v1` se fijan al mismo commit final.

Para nuevos cambios, revisar la ejecución asociada a su SHA: el éxito de #1 no
acredita automáticamente futuras modificaciones. Los permisos de colaboradores,
visibilidad y reglas de protección del repositorio no se han cambiado.

## Comprobación de integración PostgreSQL

El incremento P1 desde `422f6b03f410c6ac049b699e13fc204a3af67743` añade un job CI separado con PostgreSQL 17 y una prueba que aplica migraciones, guarda una investigación basada en fixtures sintéticos y comprueba que el informe y su snapshot se recuperen tras reconectar. Esta configuración aún no se ha ejecutado en CI ni contra un servidor local; PostgreSQL sigue pendiente hasta que termine correctamente el workflow del commit resultante. La prueba no habilita ni verifica pgvector.

## Contrato 1.1 de condiciones sucesivas

Verificado en el incremento P1: `apps/api/tests/test_contracts.py` y `test_science.py` (45 passed), Ruff de API/scripts, export OpenAPI `--check`, TypeScript generado `--check`, typecheck de cliente y 6 pruebas cliente. La suite Python completa no finalizo en este entorno: pytest no pudo crear temporales en el directorio de sistema y la reejecucion con `--basetemp work/pytest-p1` se interrumpio tras quedar sin salida. El ejemplo es totalmente sintetico. La comparacion extrae X y el `segment_id` enlazado, pero la estratificacion cientifica P3 completa sigue pendiente; PostgreSQL tampoco se verifico.

## P6 · Mission Lab A/B, hipótesis y guion (14 nov 2026, Linux)

Rama `claude/cool-edison-2okpmp`, partida `422f6b0` (`codex/team-start-v1`). Entorno
Linux del contenedor de trabajo: Python 3.13 (uv), Node 22.23; proveedor `demo`, SQLite
temporal con semilla sintética. No es una ejecución de CI ni de Windows.

- Ruff aprobado; **112 pruebas Python**; OpenAPI/TS sin deriva; typecheck y build correctos.
- `npm run test:client`: **15 pruebas** (6 existentes + 9 de `mission-lab.test.ts`).
- `scripts/smoke.py` aprobado con reinicio.
- Recorrido en Chromium (Playwright) comparado con un worktree del commit base: el
  recorrido de TEAM_START §4 da los mismos resultados; presets A/B, consulta sin
  evidencia, panel de hipótesis, API caída, teclado y 390 px sin desbordamiento revisados.
- Cifras de DEMO.md contrastadas con la API demo. Todos los datos son fixtures sintéticos.

Cambio compartido: el script `test:client` de `package.json` añade el nuevo archivo de
pruebas (coordinar con P1). Sin cambios de contrato, API ni `packages/contracts`.
