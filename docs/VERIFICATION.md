# Registro de verificaciones

Los resultados vigentes aparecen primero; el resto conserva el historial.
Ninguna prueba de software equivale a validación científica.

## Cierre P6 — interfaz integrada y casos BASS-II — 14 noviembre 2026

Código **`66934638e37c1396eeab638631d54a2159ab7930`**, rama `raul`, [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3).
Base main/P2 `f8e6a01`, P6 `80ceba4` y host P5 `9f54700`; la actualización
documental posterior no altera el código comprobado. [Guion](DEMO.md) y [relevo](handoffs/P6.md).

### Puerta local y recorridos de navegador

Windows, Python 3.12.14, Node 24.22.1, PowerShell 7.6.9. Ejecutado
`scripts/check.ps1 -E2E` con ambos bundles científicos locales y el paquete BASS-II
aprobado indicados explícitamente; proveedor `demo`, sin credenciales de IA.

| Comprobación | Resultado observado |
|---|---|
| Python | 342 aprobadas, 1 omitida (PostgreSQL local); un aviso Starlette/httpx. |
| Ciencia/IA | 6 casos heredados + 6 segmentos; disponibilidad aprobada; IA 18/18; corpus local 7/7. |
| Contratos, cliente, build | Ruff y deriva OpenAPI/TypeScript correctos; 76 cliente, tipado y build aprobados. |
| HTTP real | SQLite aislado, planes, tres casos, informe y reinicio correctos. |
| Chromium con fixtures | 24 pasos y 58 comprobaciones, sin fallos. |
| Chromium con paquete BASS-II 1.1.1 | 7 pasos y 44 comprobaciones, sin fallos. |

El sintético comprueba A/B y evidencia antes de investigar, métrica/filtros/pregunta,
literalidad de fuente/informe/descarga, recuperación tras reinicio, errores/reintento
y respuestas tardías frente a Reset y una investigación nueva. Incluye ausencia de
BASS-II real en fixtures. El recorrido real coteja diez puntos, siete muestras,
segmentos/citas/M8, solicitudes exactas, caso lunar sin flujo, informe y recuperación.
No hay mocks del backend de la prueba principal; las respuestas retenidas sirven
solo para provocar carreras controladas. Capturas oscuro/claro/escritorio y móvil
390 px inspeccionadas; no se afirma prueba con lector de pantalla o teléfono físico.

Bundle real preparado con `python -m flamelab.data.p2_demo_release` desde la
extracción revisada por P3; SHA-256 de **bundle del paquete 1.1.1**:
`cb8b782fd73dbe4df0576b8047f3dea781a37d7c06c962ad2e978e607a00191d`.
El runner verifica ese hash antes de abrir Chromium y nunca modifica el archivo.
Los hashes base para ciencia siguen siendo BASS-II `a2779a6e3a2b335298408c2dc5184e4bef916ad29cf7821737e148c5e5920007`
y NASA-24 `7dc69717b4bc6151025df2993d9cf66622db3a8b7242798a1d7bfe8b8e335781`.
El paquete añade los avisos M8 y conserva datos/fuentes publicados; no se versiona.
Las pruebas comprueban software e identidad de los casos, no validan todo el corpus.

### Clon limpio y CI

Nuevo clon sin `.env`, `.venv` ni `node_modules` iniciales; setup y check -E2E
salida 0 en el SHA indicado. ROOT/sys.prefix apuntan al clon, dependencias propias,
sin junctions y Git limpio. **340 Python aprobadas, 3 omitidas**, 76 cliente,
evaluaciones y recorrido sintético correctos. Se comparten Windows/runtimes y
caché de navegador, no las dependencias del proyecto. Los bundles no se distribuyen.

[CI 43621040286](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286) del mismo SHA: `completed/success`.

| Job | Resultado |
|---|---|
| verify Windows y Linux | 340 Python/3 omisiones, 76 cliente, evaluaciones, contratos, build y HTTP/reinicio aprobados. |
| postgres | Integración real PostgreSQL 17 aprobada: migración, reemplazo y recuperación histórica. No acredita pgvector. |
| browser Windows y Linux | Recorrido sintético completo aprobado en ambos sistemas; capturas como artefactos del run. |

No se ejecutó BASS-II real en CI público: su prueba es local opt-in. No se
ejecutaron servicios de IA pagados ni validación física.

Hito previo: `16d326c` pasó el clon limpio, 70 cliente y E2E sintético 22/49,
con [CI 43618846780](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43618846780).
Se corrigieron una dependencia opcional ausente en el lockfile, un desbordamiento
móvil y la limpieza del runner antes de registrar ese éxito. El cierre de arriba
repite las puertas después de añadir BASS-II y no reutiliza aquel resultado como prueba nueva.

## Cierre conjunto P1/P3/P4 — 14 noviembre 2026

Rama `raul`, conservando P3 `321cc0b`, `main`/P2 `04baeee` y P4 `12555c1`
mediante merge. El commit de esta entrega se identifica en su PR y con
`git log -1 --format=%H -- docs/INTEGRATION_P134.md`.
Los resultados anteriores se conservan abajo como historial, no como pendientes actuales.

### Puerta completa local Windows

Entorno: Python 3.12.14 y Node 24.22.1, Windows.
Ejecutado `scripts/check.ps1` con `FLAMELAB_AI_PROVIDER=demo` y ambos bundles
reales locales opt-in. No se usaron claves ni llamadas externas de IA.

| Comprobación ejecutada | Resultado |
|---|---|
| Ruff: API, scripts y evals | Aprobada. |
| Suite Python, incluyendo integraciones BASS-II y NASA-24 | **342 aprobadas, 1 omitida**: PostgreSQL sin servidor local. Un aviso de deprecación Starlette/httpx. |
| Evaluación científica heredada | 6/6 casos aprobados. |
| Evaluación científica de segmentos | 6/6 casos aprobados. |
| Diagnóstico de disponibilidad antes de top-k | Aprobado; salida 0. |
| Evaluación IA determinista | 18/18 casos aprobados; incluye errores de proveedor esperados. |
| Auditoría ejecutable de corpus real | 7/7 comprobaciones aprobadas. |
| Deriva OpenAPI / TypeScript | Sin diferencias respecto al contrato canónico. |
| Tipado, cliente y build | Correctos; 6/6 pruebas cliente. |
| Smoke HTTP real, SQLite y reinicio | Correctos; 5 ensayos sintéticos, 4 puntos, plan persistido e informe idéntico tras reinicio. |
| Tres ejemplos de catálogo por HTTP | Flujo: completed/4 puntos; Tierra: completed/1 punto; Luna: insufficient_evidence/0 puntos. Conflicto bloqueado sin análisis. |

Los casos adversarios comprueban variable, unidad, valor, ensayo y referencia de
cada afirmación numérica, además de fuentes con instrucciones o Markdown. Son
pruebas deterministas, no una evaluación de calidad de un modelo real.

Bundles sin modificar, fuera de Git:

- BASS-II SHA-256: `a2779a6e3a2b335298408c2dc5184e4bef916ad29cf7821737e148c5e5920007`.
- NASA-24 SHA-256: `7dc69717b4bc6151025df2993d9cf66622db3a8b7242798a1d7bfe8b8e335781`.

La auditoría prueba contratos, trazabilidad y comportamiento; no aprueba la
interpretación científica. Siguen `unverified` y `reviewed=false`. Ver
[P2_INTEGRATION_REVIEW](../evals/science/P2_INTEGRATION_REVIEW.md).

### Clon limpio y CI de esta entrega — aprobados

Commit de código verificado: **`fd83a84aa24511e573a1b5f27cc859bcdddbf638`**, [PR #2](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/2).
Esta anotación posterior modifica únicamente documentación.

Clon nuevo `git clone --no-hardlinks --branch raul` desde el repositorio local,
sin `.venv`, `node_modules` ni `.env` iniciales. Se instalaron dependencias propias
con `scripts/setup.ps1` y se ejecutó `scripts/check.ps1`: ambos terminaron con
salida 0. Entorno de proceso sin variables FLAMELAB/PYTHONPATH heredadas.
Se comprobó que ROOT y sys.prefix apuntaran al clon, con directorios normales
sin junctions, SHA exacto y árbol Git limpio después.

- **340 Python aprobadas, 3 omitidas**: dos bundles reales no distribuidos y
  PostgreSQL sin servidor local. Un aviso Starlette/httpx.
- Ciencia 6+6 y disponibilidad, IA 18, cliente 6, Ruff, deriva de contratos,
  tipado/build y smoke HTTP/reinicio correctos; los tres escenarios esperados.
- Python 3.12.14, Node 24.22.1, PowerShell 7.6.9 y Git 2.55.0.windows.5.
- Fue el mismo Windows con runtimes y posibles cachés compartidas, no una máquina
  recién instalada; `.venv` y `node_modules` se crearon para este clon.

CI remoto [43614900736](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43614900736), estado `completed`, conclusión `success`,
head `fd83a84aa24511e573a1b5f27cc859bcdddbf638`:

| Trabajo | Resultado observado |
|---|---|
| Windows, Python 3.12.10 | 340 Python aprobadas, 3 omitidas; evaluaciones, 6 cliente, contratos, build y smoke/reinicio correctos. |
| Linux, Python 3.12.16 | 340 Python aprobadas, 3 omitidas; las mismas puertas correctas. |
| PostgreSQL 17, Python 3.12.16 | 1 integración aprobada sobre servidor real: migración, corpus/reemplazo, snapshots y recuperación histórica de plan/informe/fuentes. |

Las tres omisiones de cada job general son esperadas: los dos bundles locales
y PostgreSQL, que tiene su job específico aprobado. El contenedor incluye
pgvector, pero no se afirma uso ni validación de búsquedas vectoriales.
El corpus real sí se verificó localmente en la puerta de 342 pruebas anterior.

## Historial de verificaciones anteriores

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

## P6 · Montaje P5, recorrido E2E e informe (14 nov 2026, Linux)

Rama `codex/p6-mission-lab`, HEAD `c6c2c1d` (merge de `main` en `1041ff2`; partida `44a8d8e`) con el incremento
P6 sin commit en el árbol. Linux del contenedor de trabajo, Node 22, Python con uv, Playwright/Chromium instalado
globalmente (no es dependencia del proyecto). Proveedor `demo`, SQLite temporal con semilla sintética. No es CI ni Windows.

En `/home/user/Flame-in-Freefall` (arnés de esta rama):

- `npm run typecheck` sin errores; `npm run build` correcto; `npm run check:types` «TypeScript contract matches OpenAPI.»
- `npm run test:client`: **43 aprobadas** (client, mission-lab, mission-lab-state, mission-lab-panel, report).
- `uv run pytest -q`: 211 aprobadas, 3 omitidas; `uv run ruff check apps/api scripts` sin avisos.
- `uv run python scripts/smoke.py`: `"points": 4`, `"restart_persistence": "passed"`.
- `node apps/web/tests/e2e/p6-walkthrough.mjs --host=harness`: **12/12 pasos, 23 comprobaciones**. Incluye evidencia
  `record` con `research_id` y `corpus` sin él, A/B marcado como anterior al cambiar filtros, consulta
  `insufficient_evidence`, informe mostrado == `GET /report` == descargado, recarga + reinicio de API con
  recuperación del mismo informe, 404 y API parada ⇒ alerta con Retry que funciona al volver la API.
- Una ejecución con host equivocado (`--host=p5` sobre el arnés) terminó con código 1 y resumen de fallo.

Integración con P5 en worktree temporal (`HEAD` + merge sin commit de `origin/codex/p5-evidence-canvas` `c71fa13`,
App.tsx de P5, `InterimMissionTools` sustituido por los paneles P6; worktree eliminado después):

- typecheck y build correctos; `npm run test:client` 43 aprobadas; `npx tsx --test apps/web/tests/evidence/*.test.ts` 10 aprobadas.
- `p6-walkthrough.mjs --host=p5`: **12/12 pasos, 23 comprobaciones**. Capturas revisadas en tema oscuro: tras tokenizar
  `mission-lab.css` el panel es legible; la tabla A/B queda estrecha en la columna central de P5.
- El parche `docs/handoffs/P6-mount-for-P5.patch` se aplica limpiamente (`git apply --check`) sobre los archivos de `c71fa13`.

Todos los datos son fixtures sintéticos, no mediciones NASA. Sin cambios de contrato, API ni `packages/contracts`.
Cambio compartido: `test:client` en `package.json` añade `mission-lab-state`, `mission-lab-panel` y `report` (anotar P1).
