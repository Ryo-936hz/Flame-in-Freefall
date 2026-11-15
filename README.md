# FlameLab SI — demo integrada

> **AI Research** presenta un caso preparado BASS-II con agentes animados, fuentes
> publicadas y una pausa para aceptar el alcance de la comparación. Abrir
> `#/dashboard/ai-research` y pulsar **Start research**. La actividad de agentes es
> coreografiada; no llama a modelos. [Guion, fuentes y límites](docs/AI_RESEARCH_CASE.md).
> Ask SI usa Qwen para seleccionar fuentes cuando se arranca con Docker Compose.
> El buscador y Ask SI también abren la [referencia publicada M13](docs/FILMING_M13.md).

La [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3) está fusionada en
`main` mediante `0b732cb`: P1/P3/P4, la ingesta y los contratos de P2, Mission Lab
y recuperación P6, sobre el host P5 `9f54700`. La referencia de arranque del equipo
es **`origin/main`**; cada persona conserva su propia rama.

El cierre adicional P2 está implementado y **verificado localmente** en `raul`,
código **`20aab80404fc2f0fc188d718cac47d0d4bf31d54`**: tarjeta documental Saffire, reintentos e
identidades del catálogo y selector de las 14 métricas. El cierre se entrega mediante la PR #4 sobre `main`; la PR #3 anterior ya está fusionada. Consultar
[estado](docs/IMPLEMENTATION_STATUS.md), [verificación](docs/VERIFICATION.md) y
[guía P2](docs/INTEGRATION_P2_MAIN.md) para distinguir ambas entregas.

Los TTS · 14 de noviembre de 2026.

[![Verificación Windows y Linux](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/workflows/verify.yml)

Demo integrada: FastAPI/Pydantic, SQLite con migraciones y snapshots, ingesta,
ranking y comparación científica, coordinación determinista y cliente React/TypeScript.
La interfaz de P5 monta **Mission Lab, informe y recuperación de P6**, con tabla,
gráfico y fuentes conectados por identificadores.

**Guías:** [demo y arranque](docs/DEMO.md), [integración P2 y carga real en Windows](docs/INTEGRATION_P2_MAIN.md),
[relevo del equipo](docs/TEAM_HANDOFF.md) y [estado real](docs/IMPLEMENTATION_STATUS.md). El [hito P6](docs/handoffs/P6.md)
verificó el código `66934638e37c1396eeab638631d54a2159ab7930` antes del merge.
Las etiquetas `flamelab-p6-demo-2026-11-14-r2` y anteriores conservan ese historial;
no se mueven ni sustituyen `origin/main` como base del trabajo nuevo.
La [entrega de backend P1/P3/P4](docs/INTEGRATION_P134.md) y
`codex/team-start-v1` también se conservan como antecedentes.

La demo predeterminada y el CI usan **datos sintéticos**, no mediciones NASA. El corpus local
P2 contiene 24 estudios: seis campañas con resultados, una con configuraciones
y 17 documentales. P3 aprobó el uso **descriptivo de diez puntos BASS-II** (siete
muestras), conservando el aviso M8 y el caso lunar corregido. Esta conformidad
limitada no valida el corpus completo ni cambia su estado `scientific_unverified`.
Ver [paquete P2](docs/handoffs/P2_DEMO.md) y [dictamen P3](docs/handoffs/P3_BASS_II_DECISION_DEMO.md).

El recorrido conecta filtros y métrica → herramientas científicas → evidencia,
A/B e informe persistido. La interfaz usa filtros explícitos y presets BASS-II fijos; la API también
ofrece el catálogo acotado de preguntas y la previsualización de planes.
Mission Lab muestra el plan guardado de su consulta. No hacen falta credenciales.

El cierre se publica en la [PR #4](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/4); el CI de cada revisión puede consultarse allí. La base compartida es `origin/main`.

## Instalación y arranque

Tres vías, con la misma aplicación y los mismos datos:

| Vía | Sistemas | Requisitos | URL de la interfaz | Estado |
| --- | --- | --- | --- | --- |
| [A. Docker](#a-docker-linux-windows-y-macos) | Linux, Windows, macOS | Docker con Compose (Docker Desktop en Windows y macOS) | http://127.0.0.1:8080 | Verificada en Linux; Docker Desktop sin probar |
| [B. Windows nativo](#b-windows-nativo) | Windows 10/11 | Git, Python 3.12, Node 24 con npm, PowerShell 7 | http://127.0.0.1:5173 | Vía documentada del equipo (`setup.ps1`); sin ejecutar en esta revisión |
| [C. Linux nativo](#c-linux-nativo) | Linux | Git, Python 3.12, Node 24 con npm, pipx | http://127.0.0.1:5173 | Verificada en Linux Mint 22.3 |

Docker sirve para usar la demo sin instalar Python ni Node. Para desarrollar y
ejecutar las comprobaciones (`check.ps1`, E2E) se usan las vías nativas. Los datos
que se cargan se eligen igual en las tres: ver [Cargar datos](#cargar-datos).

### Clonar

```bash
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
cd Flame-in-Freefall
# Para trabajar: crear una rama propia desde la integración compartida.
git fetch origin
git switch --no-track -c codex/mi-tarea origin/main
git rev-parse HEAD
```

Para una rama existente: guardar los cambios propios, ejecutar `git fetch origin`,
revisar la diferencia e integrar con `git merge origin/main`. Resolver conflictos
con sus responsables y repetir las comprobaciones. No usar reset ni sustituir el
clon para actualizarlo. Los seis deben comunicar el mismo SHA base de `origin/main`
al iniciar una tarea compartida; [TEAM_START](docs/TEAM_START.md) detalla el flujo.

### A. Docker (Linux, Windows y macOS)

```bash
docker compose up -d --build     # mismo comando en bash y en PowerShell
```

- Interfaz: http://127.0.0.1:8080 · salud: http://127.0.0.1:8080/api/v1/health ·
  documentación HTTP: http://127.0.0.1:8080/docs
- nginx sirve la web compilada y redirige `/api`, `/openapi.json` y `/docs` a la
  API, que no publica puerto propio. Solo se escucha en `127.0.0.1`.
- Por defecto carga el catálogo real (`FLAMELAB_DATA=catalog`).
- **Ask SI usa Qwen local por defecto.** Compose arranca Ollama dentro de Docker y
  descarga `qwen3:0.6b` (523 MB) la primera vez. El modelo se conserva en un volumen.
  Basta con CPU, sin instalar Ollama en el equipo ni configurar una cuenta o una clave.
  El primer arranque requiere Internet y espacio libre para las imágenes y el modelo.
  La imagen de Ollama ocupa unos 8,5 GB en Docker para Linux x86-64.
- Si tu `.env` ya contiene `FLAMELAB_AI_PROVIDER=demo`, quita esa línea o cámbiala a
  `FLAMELAB_AI_PROVIDER=qwen` para activar Qwen. `demo` conserva el modo de catálogo
  y omite la descarga del modelo. `FLAMELAB_WEB_PORT` permite cambiar el puerto 8080.
- Qwen selecciona fragmentos cuando Ask SI encuentra varias fuentes candidatas. Para
  probarlo con el catálogo predeterminado, pregunta `Show evidence about microgravity`.
  El JSON de `/api/v1/chat` indica `provider: "qwen"` cuando el modelo selecciona fuentes.
  Las respuestas directas y la recuperación ante fallos de Ollama muestran `catalog`.

**Primer arranque.** La descarga de la imagen de Ollama puede tardar más de diez
minutos y `docker compose up` no muestra progreso mientras tanto. El orden es:
`ollama` pasa a *healthy* → `ollama-model` descarga el modelo y termina con
`Exited (0)` → `api` pasa a *healthy* → arranca `web`. Si ya tenías contenedores
de una versión anterior sin Ollama, el mismo comando los reconstruye y sustituye.
Los arranques siguientes reutilizan imágenes y modelo y tardan segundos.

```bash
docker compose ps -a         # ollama/api "healthy", ollama-model "Exited (0)", web "Up"
docker compose logs ollama-model  # progreso o error de la descarga inicial
docker compose logs -f api
docker compose down          # parar; con -v borra también las bases y el modelo
```

**Comprobar que Qwen responde** (bash; en PowerShell usa `curl.exe` y comillas
simples alrededor del JSON):

```bash
curl -s http://127.0.0.1:8080/api/v1/health      # "ai_provider":"qwen"
curl -s -X POST http://127.0.0.1:8080/api/v1/chat -H 'Content-Type: application/json' \
  -d '{"question":"Show evidence about microgravity"}'   # "provider":"qwen"
docker compose logs ollama | grep '/api/chat'   # llamada al modelo con código 200
```

La primera respuesta con Qwen tarda unos segundos mientras Ollama carga el modelo
en memoria (unos 5 s en CPU en la comprobación del 15/11/2026, Docker 29.9 y
Compose 5.6, Linux x86-64).

Decisión y alcance: [ADR 0011](docs/adr/0011-docker-local-deployment.md).
Tamaño y ficha del modelo: [Qwen3 0.6B en Ollama](https://ollama.com/library/qwen3:0.6b).

### B. Windows nativo

```powershell
.\scripts\setup.ps1      # .venv desde uv.lock y node_modules desde package-lock.json
.\scripts\check.ps1      # comprobaciones sin credenciales (ver más abajo)
.\scripts\dev-api.ps1    # terminal 1: API en http://127.0.0.1:8000
```

En otra terminal, desde la raíz del clon:

```powershell
.\scripts\dev-web.ps1    # terminal 2: interfaz en http://127.0.0.1:5173
```

`setup.ps1` usa los lockfiles; si falta uv instala 0.9.5 dentro de `work/`, y
detecta también los runtimes de Codex. Admite `-Python 'C:\ruta\python.exe'` y
`-Uv 'C:\ruta\uv.exe'`. Crea `.env` desde `.env.example` solo si no existe; ese
ejemplo activa la **demo sintética** sobre una base vacía (`work/flamelab.db`).

Abrir [interfaz](http://127.0.0.1:5173), [salud](http://127.0.0.1:8000/api/v1/health)
y [documentación HTTP](http://127.0.0.1:8000/docs). Ctrl+C detiene cada servidor.
Detener Vite antes de repetir setup: Windows bloquea su módulo nativo mientras
se ejecuta. No hace falta ejecutar como administrador.

### C. Linux nativo

Los scripts `scripts/*.ps1` son para PowerShell; en Linux se ejecutan a mano los
mismos comandos que contienen:

```bash
pipx install uv==0.9.5                 # misma versión que setup.ps1
~/.local/bin/uv sync --locked          # .venv desde uv.lock
npm ci --no-audit --no-fund            # node_modules desde package-lock.json
cp -n .env.example .env                # opcional: igual que setup.ps1 (demo sintética)

# terminal 1: API en http://127.0.0.1:8000
.venv/bin/python -m uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
# terminal 2: interfaz en http://127.0.0.1:5173
npm run dev:web -- --host 127.0.0.1
```

Sin `.env` ni variables, la API arranca con `work/flamelab.db` vacía
(`data_mode: empty`). Vite redirige `/api`, `/openapi.json` y `/docs` a la API.

Para usar Qwen con la API nativa de Windows o Linux, instala y arranca Ollama,
ejecuta `ollama pull qwen3:0.6b` y pon `FLAMELAB_AI_PROVIDER=qwen` en `.env`
antes de arrancar la API. El valor inicial de `FLAMELAB_OLLAMA_BASE_URL` es
`http://127.0.0.1:11434`. [Instalación de Ollama](https://ollama.com/download).

### Cargar datos

La API sirve **un corpus por base de datos**. Cada corpus va en su propia base
SQLite para no mezclar datos sintéticos con estudios reales. `/api/v1/health`
indica qué hay cargado en `data_mode`.

| Corpus | Contenido | `data_mode` | Qué funciona |
| --- | --- | --- | --- |
| Demo sintética | `data/fixtures/demo.json`: 2 estudios, 5 ensayos y 6 observaciones **sintéticas**, no mediciones NASA | `synthetic` | Todo el recorrido: Investigate, A/B, informe |
| Catálogo real | `data/catalog/psi_metadata.json`: 24 estudios, solo metadatos, sin ensayos | `metadata_only` | Study catalog; investigación y A/B devuelven evidencia insuficiente |
| Corpus NASA P2 | `bundle.json` o ZIP del paquete interno 1.1.1, **no incluido en el repositorio** | `scientific_unverified` | Guion BASS-II de [DEMO](docs/DEMO.md), catálogo con series |
| Vacío | sin datos | `empty` | Solo la estructura de la interfaz |

**Docker:** elegir con `FLAMELAB_DATA` (`catalog` por defecto, `demo`, `bundle` o
`empty`). La importación es automática al arrancar la API, valida antes de escribir y
es idempotente.

```bash
FLAMELAB_DATA=demo docker compose up -d                 # Linux
```

```powershell
$env:FLAMELAB_DATA = 'demo'; docker compose up -d       # Windows PowerShell
```

Para cargar un corpus propio (p. ej. el paquete P2), copiarlo a `data/local/` y
arrancar con `FLAMELAB_DATA=bundle`. Se acepta un `bundle.json` o el ZIP del paquete
(`flamelab-p2-demo-v1.1.1.zip`): de este se lee `bundle.json` **sin extraer** y se
coteja con su `SHA256SUMS`; si no coincide, la API no arranca.

```bash
cp ~/flamelab-p2-demo-v1.1.1.zip data/local/
FLAMELAB_DATA=bundle FLAMELAB_BUNDLE=flamelab-p2-demo-v1.1.1.zip docker compose up -d
docker compose logs api | grep -E 'Bundle|changed|datos='   # SHA-256, recuentos y base
```

```powershell
Copy-Item C:\ruta\flamelab-p2-demo-v1.1.1.zip data\local\
$env:FLAMELAB_DATA = 'bundle'; $env:FLAMELAB_BUNDLE = 'flamelab-p2-demo-v1.1.1.zip'
docker compose up -d
```

- `data/local/` se monta en solo lectura y no se versiona ni entra en la imagen. Otra
  carpeta: `FLAMELAB_IMPORT_DIR=/ruta`. Si solo hay un `.json`/`.zip`, `FLAMELAB_BUNDLE`
  es opcional.
- Cada contenido va a su propia base `bundle-<sha256[:12]>.db` del volumen: cambiar de
  bundle nunca sustituye otro corpus ni usa `--replace`, y volver a uno anterior
  reutiliza su base (`changed: false`).
- Para volver al catálogo: `docker compose up -d` sin esas variables.

**Nativo:** importar en una base dedicada y arrancar la API apuntando a ella. La
validación precede a la escritura; repetir el mismo contenido es idempotente y
sustituir un corpus distinto exige `--replace` explícito.

```bash
# Linux — catálogo real
.venv/bin/python -m flamelab.data.cli validate data/catalog/psi_metadata.json
.venv/bin/python -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
FLAMELAB_DATABASE_URL=sqlite:///work/catalog.db FLAMELAB_SEED_DEMO=false \
  .venv/bin/python -m uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
```

```powershell
# Windows — catálogo real
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
$env:FLAMELAB_DATABASE_URL = 'sqlite:///work/catalog.db'
$env:FLAMELAB_SEED_DEMO = 'false'
.\scripts\dev-api.ps1
```

Resultado esperado de la importación: `"studies": 24, "trials": 0, "observations": 0`.
Las variables de entorno tienen prioridad sobre `.env` y solo duran en esa terminal.

- **Demo sintética:** `FLAMELAB_SEED_DEMO=true` sobre una base vacía (es lo que hace
  el `.env` de ejemplo). Nunca sustituye un corpus existente.
- **BASS-II:** mismo procedimiento con la ruta del `bundle.json` y otra base
  (`sqlite:///work/p2-demo-v1.1.1.db`); ver [DEMO](docs/DEMO.md#guion-real-bass-ii-separado-del-fixture).
  En Docker: `FLAMELAB_DATA=bundle` (arriba). El paquete no se distribuye con el repositorio.

Registro de la verificación en Linux, con salidas reales: [DESPLIEGUE_LOCAL_LINUX](docs/DESPLIEGUE_LOCAL_LINUX.md).

## Verificar sin credenciales

```powershell
.\scripts\check.ps1
.\.venv\Scripts\python.exe scripts/smoke.py
```

Para comprobar además el navegador real, instalar Chromium una vez y ejecutar:

```powershell
node node_modules/playwright/cli.js install chromium
.\scripts\check.ps1 -E2E
```

El E2E usa Playwright fijado por el lockfile, puertos libres y una base desechable;
no requiere API/Vite previamente abiertos. El [guion](docs/DEMO.md) explica las
el recorrido de navegador, la recuperación tras reinicio y el respaldo sintético.

La prueba HTTP inicia una API temporal con SQLite aislado: consulta, ranking,
investigación, evidencia, A/B, insuficiencia lunar, informe y eventos. Reinicia el
servidor y comprueba el mismo informe. No modifica la base del usuario ni llama a
IA externa. Resultado: `work/smoke-result.json`.

En la interfaz: **Investigate**, abrir una fuente desde tabla/gráfico/hipótesis,
comparar A/B y ejecutar el caso sin evidencia. Los cambios de filtros o métrica
marcan el resultado anterior. «Report and recovery» descarga el informe recibido,
reproduce eventos guardados y recupera expedientes. «Reset» descarta respuestas
pendientes sin borrar la base. La ilustración de llama es conceptual, no una simulación.

## Ingesta local

```powershell
.\.venv\Scripts\python.exe -m flamelab.data.cli inventory '..\Documents\datasets_lujan.zip' --output work/inventory.json
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
```

La última orden usa un almacén separado para conservar la demo. Sustituir un corpus
activo distinto exige `--replace`; mismo contenido es idempotente. La validación
precede a la escritura. Originales/ZIP no se versionan. No hay subida pública de PDF.

## Una autoridad de contrato

`apps/api/src/flamelab/domain/contracts.py` → `packages/contracts/openapi.json` →
`packages/contracts/schema.d.ts`. No editar generados. Tras un cambio ejecutar
`python scripts/export-openapi.py` con el entorno del proyecto y `npm run generate:types`;
`check.ps1` detecta deriva. Los scripts PowerShell usan npm local si no existe global.

Código: `apps/api/src/flamelab/{data,science,ai,storage}` y `apps/web`. Migraciones:
`apps/api/alembic`. Escalas científicas: `science/METHOD.md`. Fixtures: 2 estudios,
5 ensayos y 6 observaciones sintéticas, incluido cero conocido y valor ausente.
Repetir observaciones no crea réplicas independientes.

## AI disclosure

Este repositorio se ha desarrollado con asistencia de herramientas de IA generativa.
Parte del código, las pruebas y la documentación se generó o editó con asistentes de
programación (Codex y Claude Code) bajo la dirección del equipo. Los commits asistidos
por Claude Code lo indican con el trailer `Co-Authored-By`; el resto del historial no
marca de forma sistemática qué commits contaron con asistencia.

- **Revisión:** los cambios llegan a `main` mediante pull request y se comprueban con
  las pruebas y el CI descritos en [VERIFICATION](docs/VERIFICATION.md). La
  responsabilidad sobre el código y las afirmaciones científicas es del equipo.
- **IA en el producto:** Ask SI usa Qwen (`qwen3:0.6b`, local mediante Ollama en Docker
  Compose) para seleccionar fuentes y redactar explicaciones. Los cálculos, filtros y
  rankings se ejecutan en código verificable de la API, no en el modelo.
- **AI Research** es una secuencia preparada: su actividad de agentes es animada y no
  acredita la ejecución de modelos ni de agentes autónomos.
- Los fixtures sintéticos no son mediciones NASA, y ningún texto generado por IA
  sustituye a las fuentes citadas.

## Estado y relevo

[Estado real](docs/IMPLEMENTATION_STATUS.md), [verificaciones](docs/VERIFICATION.md),
[Windows](docs/SETUP_WINDOWS.md), [seis puestos](docs/TEAM_HANDOFF.md) y [ADR de
inspección](docs/adr/0007-inspection-and-integrated-base.md).

Cierre P2, código **`20aab80404fc2f0fc188d718cac47d0d4bf31d54`**: `check.ps1` terminó con
salida 0; **342 Python aprobadas, 1 omisión PostgreSQL y 77 pruebas cliente**.
Ruff, contratos, tipado/build, ciencia (6 heredadas + 6 segmentos y disponibilidad),
IA 18, corpus 7/7 y HTTP/reinicio correctos. Navegador sintético **25 pasos / 64
comprobaciones** y real P2 **17 pasos / 101 comprobaciones**, ambos sin fallos.
Clon limpio Windows: setup y check -E2E con salida 0, 340 Python/3 omisiones,
77 cliente y navegador 25/64. [VERIFICATION](docs/VERIFICATION.md) registra
el entorno, el SHA y el CI de esta entrega.

Hito P6 anterior al cierre P2, código `66934638e37c1396eeab638631d54a2159ab7930`, comprobado en Windows: **342 pruebas Python aprobadas**
con los bundles reales locales y una omisión PostgreSQL; **76 pruebas cliente**,
tipos/build, ciencia/IA, auditoría del corpus 7/7 y HTTP/reinicio correctos.
Clon limpio sin bundles: **340 Python aprobadas, 3 omisiones esperadas**,
setup/check correctos y E2E **24 pasos / 58 comprobaciones**. El recorrido BASS-II local añade
**7 pasos / 44 comprobaciones** con el paquete aprobado 1.1.1.

[CI del hito P6](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286) aprobado: comprobaciones generales Windows/Linux,
PostgreSQL 17 y navegador Chromium en Windows/Linux. El registro por entorno y
SHA está en [VERIFICATION](docs/VERIFICATION.md). Estos resultados corresponden al SHA indicado; los cambios posteriores requieren
su propia verificación.

El proveedor externo se probó con HTTP simulado, sin llamadas reales ni claves.
Quedan fuera de esta demo la validación científica global, pgvector, CFD, diseño
inverso y despliegue público. El catálogo no interpreta lenguaje natural general.
La [dirección visual](docs/DESIGN_ANDURIL.md) se conserva; no se ha evaluado con
lector de pantalla ni móvil físico. No necesitas el ZIP NASA para arrancar.

## Comprobación de integración PostgreSQL

El workflow incluye un job independiente con PostgreSQL 17 y el driver opcional. Para ejecutarlo localmente, instala `uv sync --locked --extra postgres`, define `FLAMELAB_TEST_POSTGRES_URL` con una base desechable de prueba y ejecuta `uv run pytest -q apps/api/tests/test_postgres_integration.py`. La prueba aplica migraciones y comprueba la recuperación de un informe sintético tras reconectar. La base anterior pasó PostgreSQL en CI; la prueba ampliada de esta entrega también exige recuperación tras reemplazo del corpus. Consultar el run del commit antes de atribuirle éxito.

## Ejemplo de condiciones sucesivas

`docs/examples/sequential_conditions.json` es un ejemplo totalmente sintetico: un ensayo y una unidad experimental, dos segmentos en orden reportado, O2 inicial/final en el ensayo y observaciones enlazadas a cada segmento. No representa mediciones NASA ni tiempos medidos.
