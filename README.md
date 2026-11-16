# FlameLab SI

FlameLab SI is a publicly deployed application for exploring microgravity
combustion research, consulting evidence and comparing results.
It addresses NASA Space Apps' **Flame in Freefall** challenge through a workspace
that connects scientific data, analytical tools and artificial intelligence.

[![Windows and Linux verification](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/workflows/verify.yml)

## Main features

- **Study catalog:** explore 24 studies, their sources and the data available
  for each study.
- **Ask SI:** query evidence using information retrieval and Qwen served locally
  through Ollama; results retain their source references.
- **AI Research:** a research lab with an operational multi-agent system.
  Coordinator organizes the investigation; Scout retrieves evidence; Analyst
  performs analysis; Critic reviews results and references; Writer prepares the
  report. The workflow preserves scientific context between stages and includes
  human review before the final report. Open `#/dashboard/ai-research`.
- **Investigate and Mission Lab:** experimental filters, evidence ranking,
  A/B comparisons, tables and charts linked to their sources.
- **Reports and recovery:** persist investigations and their snapshots,
  retrieve previous results and export reports.

## Architecture and data

FastAPI and Pydantic define the API and its contracts; SQLAlchemy and Alembic
handle persistence and migrations. The React/TypeScript client consumes types
built from OpenAPI. Docker makes local deployment reproducible.
The AI works with retrieved evidence and scientific tools with validated inputs;
numerical calculations run in deterministic code.

The scientific data model preserves original values and units, provenance and
segment-level conditions. It distinguishes trials, samples and observations:
segments from the same sample are not counted as independent replicates.
Comparisons account for geometry, oxygen and combustion faces.

The catalog contains 24 studies: six campaigns with results, one with
configurations and 17 providing documentary context. Numerical analysis depends
on the loaded corpus. Test fixtures are **synthetic**, not NASA measurements.
The installation instructions below explain how to select a local corpus;
they do not necessarily describe the public service's configuration.

The documented scientific review of BASS-II covers descriptive use of ten
points from seven samples, retaining the M8 discrepancy. This does not amount
to scientific validation of the entire corpus. See the [data package](docs/handoffs/P2_DEMO.md)
and [scientific assessment](docs/handoffs/P3_BASS_II_DECISION_DEMO.md).

**Guides:** [startup and walkthroughs](docs/DEMO.md),
[loading data on Windows](docs/INTEGRATION_P2_MAIN.md) and
[verification by version](docs/VERIFICATION.md).
Handoff documents, integration PRs and the original prepared AI Research case
preserve the development history; their dated limitations do not describe the
current state of the deployed multi-agent system.

## Installation and startup

Three options, using the same application and data:

| Option | Systems | Requirements | Web interface URL | Status |
| --- | --- | --- | --- | --- |
| [A. Docker](#a-docker-linux-windows-and-macos) | Linux, Windows, macOS | Docker with Compose (Docker Desktop on Windows and macOS) | http://127.0.0.1:8080 | Verified on Linux; Docker Desktop untested |
| [B. Native Windows](#b-native-windows) | Windows 10/11 | Git, Python 3.12, Node 24 with npm, PowerShell 7 | http://127.0.0.1:5173 | Documented team setup (`setup.ps1`); not run in this revision |
| [C. Native Linux](#c-native-linux) | Linux | Git, Python 3.12, Node 24 with npm, pipx | http://127.0.0.1:5173 | Verified on Linux Mint 22.3 |

Docker runs the application locally without installing Python or Node. Use a
native setup for development and checks (`check.ps1`, E2E). Data selection is
the same for all three options: see [Loading data](#loading-data).

### Clone

```bash
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
cd Flame-in-Freefall
# For development: create your own branch from the shared integration branch.
git fetch origin
git switch --no-track -c codex/mi-tarea origin/main
git rev-parse HEAD
```

For an existing branch: save your changes, run `git fetch origin`, review the
diff and integrate with `git merge origin/main`. Resolve conflicts with the
relevant owners and rerun checks. Do not reset or replace the clone to update it.
All six contributors should report the same `origin/main` base SHA when starting
a shared task; [TEAM_START](docs/TEAM_START.md) describes the workflow.

### A. Docker (Linux, Windows and macOS)

```bash
docker compose up -d --build     # same command in bash and PowerShell
```

- Web interface: http://127.0.0.1:8080 · health: http://127.0.0.1:8080/api/v1/health ·
  HTTP documentation: http://127.0.0.1:8080/docs
- nginx serves the built web application and proxies `/api`, `/openapi.json` and
  `/docs` to the API, which does not expose its own port. Only `127.0.0.1` is bound.
- The real catalog is loaded by default (`FLAMELAB_DATA=catalog`).
- **Ask SI uses local Qwen by default.** Compose starts Ollama inside Docker and
  downloads `qwen3:0.6b` (523 MB) on first use. The model is retained in a volume.
  A CPU is sufficient; no host Ollama installation, account or API key is needed.
  First startup requires Internet access and free space for the images and model.
  The Ollama image uses approximately 8.5 GB in Docker for Linux x86-64.
- If your `.env` already contains `FLAMELAB_AI_PROVIDER=demo`, remove that line or
  change it to `FLAMELAB_AI_PROVIDER=qwen` to enable Qwen. `demo` keeps catalog mode
  and skips the model download. `FLAMELAB_WEB_PORT` changes the default port, 8080.
- Qwen selects excerpts when Ask SI finds multiple candidate sources. To test it
  with the default catalog, ask `Show evidence about microgravity`.
  The `/api/v1/chat` JSON reports `provider: "qwen"` when the model selects sources.
  Direct responses and fallback responses after Ollama failures report `catalog`.

**First startup.** Downloading the Ollama image can take more than ten minutes,
and `docker compose up` does not display progress during that time. The sequence is:
`ollama` becomes *healthy* → `ollama-model` downloads the model and finishes with
`Exited (0)` → `api` becomes *healthy* → `web` starts. If you have containers from
an earlier version without Ollama, the same command rebuilds and replaces them.
Subsequent starts reuse the images and model and take seconds.

```bash
docker compose ps -a         # ollama/api "healthy", ollama-model "Exited (0)", web "Up"
docker compose logs ollama-model  # initial download progress or errors
docker compose logs -f api
docker compose down          # stop; adding -v also deletes the databases and model
```

**Check that Qwen responds** (bash; in PowerShell use `curl.exe` and single quotes
around the JSON):

```bash
curl -s http://127.0.0.1:8080/api/v1/health      # "ai_provider":"qwen"
curl -s -X POST http://127.0.0.1:8080/api/v1/chat -H 'Content-Type: application/json' \
  -d '{"question":"Show evidence about microgravity"}'   # "provider":"qwen"
docker compose logs ollama | grep '/api/chat'   # model call with status 200
```

The first Qwen response takes a few seconds while Ollama loads the model into
memory (about 5 seconds on CPU in the November 15, 2026 check, using Docker 29.9
and Compose 5.6 on Linux x86-64).

Decision and scope: [ADR 0011](docs/adr/0011-docker-local-deployment.md).
Model size and details: [Qwen3 0.6B on Ollama](https://ollama.com/library/qwen3:0.6b).

### B. Native Windows

```powershell
.\scripts\setup.ps1      # .venv from uv.lock and node_modules from package-lock.json
.\scripts\check.ps1      # checks without credentials (see below)
.\scripts\dev-api.ps1    # terminal 1: API at http://127.0.0.1:8000
```

In another terminal, from the clone's root directory:

```powershell
.\scripts\dev-web.ps1    # terminal 2: web interface at http://127.0.0.1:5173
```

`setup.ps1` uses the lockfiles; if uv is missing, it installs version 0.9.5 under
`work/`. It also detects Codex runtimes. It accepts `-Python 'C:\ruta\python.exe'`
and `-Uv 'C:\ruta\uv.exe'`. It creates `.env` from `.env.example` only when it does
not already exist; that example enables the **synthetic demo** on an empty database
(`work/flamelab.db`).

Open the [web interface](http://127.0.0.1:5173), [health endpoint](http://127.0.0.1:8000/api/v1/health)
and [HTTP documentation](http://127.0.0.1:8000/docs). Ctrl+C stops each server.
Stop Vite before running setup again: Windows locks its native module while it
is running. Administrator privileges are not required.

### C. Native Linux

The `scripts/*.ps1` scripts are for PowerShell; on Linux, run their equivalent
commands manually:

```bash
pipx install uv==0.9.5                 # same version as setup.ps1
~/.local/bin/uv sync --locked          # .venv from uv.lock
npm ci --no-audit --no-fund            # node_modules from package-lock.json
cp -n .env.example .env                # optional: same as setup.ps1 (synthetic demo)

# terminal 1: API at http://127.0.0.1:8000
.venv/bin/python -m uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
# terminal 2: web interface at http://127.0.0.1:5173
npm run dev:web -- --host 127.0.0.1
```

Without `.env` or environment variables, the API starts with an empty
`work/flamelab.db` (`data_mode: empty`). Vite proxies `/api`, `/openapi.json` and
`/docs` to the API.

To use Qwen with the native Windows or Linux API, install and start Ollama,
run `ollama pull qwen3:0.6b` and set `FLAMELAB_AI_PROVIDER=qwen` in `.env`
before starting the API. The default `FLAMELAB_OLLAMA_BASE_URL` is
`http://127.0.0.1:11434`. [Install Ollama](https://ollama.com/download).

### Loading data

The API serves **one corpus per database**. Each corpus uses its own SQLite
database to avoid mixing synthetic data with real studies. `/api/v1/health`
reports the loaded content through `data_mode`.

| Corpus | Content | `data_mode` | Supported functionality |
| --- | --- | --- | --- |
| Synthetic demo | `data/fixtures/demo.json`: 2 studies, 5 trials and 6 **synthetic** observations, not NASA measurements | `synthetic` | Full workflow: Investigate, A/B, report |
| Real catalog | `data/catalog/psi_metadata.json`: 24 studies, metadata only, no trials | `metadata_only` | Study catalog; investigations and A/B return insufficient evidence |
| NASA P2 corpus | `bundle.json` or ZIP from internal package 1.1.1, **not included in the repository** | `scientific_unverified` | BASS-II walkthrough in [DEMO](docs/DEMO.md), catalog with data series |
| Empty | No data | `empty` | Interface shell only |

**Docker:** select with `FLAMELAB_DATA` (`catalog` by default, `demo`, `bundle` or
`empty`). Import runs automatically when the API starts, validates before writing
and is idempotent.

```bash
FLAMELAB_DATA=demo docker compose up -d                 # Linux
```

```powershell
$env:FLAMELAB_DATA = 'demo'; docker compose up -d       # Windows PowerShell
```

To load your own corpus (for example, the P2 package), copy it to `data/local/`
and start with `FLAMELAB_DATA=bundle`. Either `bundle.json` or the package ZIP
(`flamelab-p2-demo-v1.1.1.zip`) is accepted. The latter's `bundle.json` is read
**without extraction** and checked against its `SHA256SUMS`; if it does not match,
the API will not start.

```bash
cp ~/flamelab-p2-demo-v1.1.1.zip data/local/
FLAMELAB_DATA=bundle FLAMELAB_BUNDLE=flamelab-p2-demo-v1.1.1.zip docker compose up -d
docker compose logs api | grep -E 'Bundle|changed|datos='   # SHA-256, counts and database
```

```powershell
Copy-Item C:\ruta\flamelab-p2-demo-v1.1.1.zip data\local\
$env:FLAMELAB_DATA = 'bundle'; $env:FLAMELAB_BUNDLE = 'flamelab-p2-demo-v1.1.1.zip'
docker compose up -d
```

- `data/local/` is mounted read-only, excluded from version control and not included
  in the image. For another directory, use `FLAMELAB_IMPORT_DIR=/ruta`. If there is
  only one `.json`/`.zip` file, `FLAMELAB_BUNDLE` is optional.
- Each content version gets its own `bundle-<sha256[:12]>.db` database in the volume:
  switching bundles never replaces another corpus or uses `--replace`. Returning
  to an earlier bundle reuses its database (`changed: false`).
- To return to the catalog, run `docker compose up -d` without those variables.

**Native setup:** import into a dedicated database and point the API to it.
Validation precedes writing; repeating the same content is idempotent, and
replacing a different corpus requires an explicit `--replace`.

```bash
# Linux — real catalog
.venv/bin/python -m flamelab.data.cli validate data/catalog/psi_metadata.json
.venv/bin/python -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
FLAMELAB_DATABASE_URL=sqlite:///work/catalog.db FLAMELAB_SEED_DEMO=false \
  .venv/bin/python -m uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
```

```powershell
# Windows — real catalog
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
$env:FLAMELAB_DATABASE_URL = 'sqlite:///work/catalog.db'
$env:FLAMELAB_SEED_DEMO = 'false'
.\scripts\dev-api.ps1
```

Expected import result: `"studies": 24, "trials": 0, "observations": 0`.
Environment variables take precedence over `.env` and last only for that terminal session.

- **Synthetic demo:** `FLAMELAB_SEED_DEMO=true` on an empty database (as in the
  example `.env`). It never replaces an existing corpus.
- **BASS-II:** use the same procedure with the `bundle.json` path and a separate
  database (`sqlite:///work/p2-demo-v1.1.1.db`); see [DEMO](docs/DEMO.md#guion-real-bass-ii-separado-del-fixture).
  In Docker, use `FLAMELAB_DATA=bundle` (above). The package is not distributed with the repository.

Linux verification log, including actual output: [DESPLIEGUE_LOCAL_LINUX](docs/DESPLIEGUE_LOCAL_LINUX.md).

## Verification without credentials

```powershell
.\scripts\check.ps1
.\.venv\Scripts\python.exe scripts/smoke.py
```

To also check the real browser, install Chromium once and run:

```powershell
node node_modules/playwright/cli.js install chromium
.\scripts\check.ps1 -E2E
```

The E2E test uses Playwright pinned by the lockfile, free ports and a disposable
database; it does not require API/Vite servers to be running beforehand. The
[walkthrough](docs/DEMO.md) describes the browser flow, recovery after restart and
the synthetic fallback.

The HTTP test starts a temporary API with isolated SQLite: query, ranking,
investigation, evidence, A/B, insufficient lunar evidence, report and events.
It restarts the server and checks the same report. It does not modify the user's
database or call external AI. Output: `work/smoke-result.json`.

In the interface: open **Investigate**, follow a source from a table, chart or
hypothesis, compare A/B and run the no-evidence case. Changing filters or the metric
marks the previous result as outdated. “Report and recovery” downloads the returned
report, replays saved events and retrieves investigations. “Reset” discards pending
responses without deleting the database. The flame illustration is conceptual,
not a simulation.

## Local ingestion

```powershell
.\.venv\Scripts\python.exe -m flamelab.data.cli inventory '..\Documents\datasets_lujan.zip' --output work/inventory.json
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
```

The last command uses a separate store to preserve the demo. Replacing a different
active corpus requires `--replace`; importing identical content is idempotent.
Validation precedes writing. Originals/ZIP files are not versioned. There is no
public PDF upload.

## Single source of truth for contracts

`apps/api/src/flamelab/domain/contracts.py` → `packages/contracts/openapi.json` →
`packages/contracts/schema.d.ts`. Do not edit generated files. After a change, run
`python scripts/export-openapi.py` in the project environment and `npm run generate:types`;
`check.ps1` detects drift. PowerShell scripts use local npm if no global npm is available.

Code: `apps/api/src/flamelab/{data,science,ai,storage}` and `apps/web`. Migrations:
`apps/api/alembic`. Scientific scales: `science/METHOD.md`. Fixtures: 2 studies,
5 trials and 6 synthetic observations, including a known zero and a missing value.
Repeated observations do not create independent replicates.

## AI disclosure

This repository was developed with assistance from generative AI tools.
Some code, tests and documentation were generated or edited using coding assistants
(Codex and Claude Code) under the team's direction. Claude Code-assisted commits
include a `Co-Authored-By` trailer; the rest of the history does not systematically
identify which commits involved AI assistance.

- **Review:** changes reach `main` through pull requests and are checked with the
  tests and CI described in [VERIFICATION](docs/VERIFICATION.md). The team is
  responsible for the code and scientific claims.
- **AI in the product:** Ask SI uses Qwen (`qwen3:0.6b`, locally through Ollama in Docker
  Compose) to select sources and write explanations. Calculations, filters and
  rankings run in verifiable API code, not in the model.
- **AI Research:** the multi-agent system coordinates Coordinator, Scout, Analyst,
  Critic and Writer for evidence-based investigations with human review before the
  report. Human review does not replace scientific validation of the data.
- Synthetic fixtures are not NASA measurements, and AI-generated text does not
  replace the cited sources.

## Verification history and handoff

[Implementation status](docs/IMPLEMENTATION_STATUS.md), [verification](docs/VERIFICATION.md),
[Windows](docs/SETUP_WINDOWS.md), [six contributor roles](docs/TEAM_HANDOFF.md) and
[inspection ADR](docs/adr/0007-inspection-and-integrated-base.md).

P2 completion, commit **`20aab80404fc2f0fc188d718cac47d0d4bf31d54`**: `check.ps1`
finished with exit code 0; **342 Python tests passed, 1 PostgreSQL skip and 77 client tests**.
Ruff, contracts, type checking/build, science (6 legacy + 6 segment and availability
checks), AI 18, corpus 7/7 and HTTP/restart checks passed. Synthetic browser run:
**25 steps / 64 checks**; real P2 browser run: **17 steps / 101 checks**, both without
failures. Clean Windows clone: setup and check -E2E exited with code 0, 340 Python
passes/3 skips, 77 client tests and browser 25/64. [VERIFICATION](docs/VERIFICATION.md)
records the environment, SHA and CI for this release.

P6 milestone before P2 completion, commit `66934638e37c1396eeab638631d54a2159ab7930`,
verified on Windows: **342 Python tests passed** with local real-data bundles and
one PostgreSQL skip; **76 client tests**, types/build, science/AI, corpus audit 7/7
and HTTP/restart checks passed. Clean clone without bundles: **340 Python tests
passed, 3 expected skips**, successful setup/check and E2E **24 steps / 58 checks**.
The local BASS-II walkthrough adds **7 steps / 44 checks** with approved package 1.1.1.

[P6 milestone CI](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286)
passed: general Windows/Linux checks, PostgreSQL 17 and Chromium on Windows/Linux.
The record by environment and SHA is in [VERIFICATION](docs/VERIFICATION.md).
These results apply to the specified SHA; subsequent changes require their own verification.

In the historical checks above, the external provider was tested using mocked
HTTP, without live calls or keys. Those results belong to the specified commits
and do not evaluate the current public deployment. Global scientific validation,
CFD and inverse design are outside the scope described here.
The [visual direction](docs/DESIGN_ANDURIL.md) documents the interface.
You do not need the NASA ZIP to start with the catalog or synthetic fixtures.

## PostgreSQL integration check

The workflow includes a separate job with PostgreSQL 17 and the optional driver.
To run it locally, install with `uv sync --locked --extra postgres`, set
`FLAMELAB_TEST_POSTGRES_URL` to a disposable test database and run
`uv run pytest -q apps/api/tests/test_postgres_integration.py`. The test applies
migrations and checks recovery of a synthetic report after reconnecting.
The previous baseline passed PostgreSQL in CI; this release's expanded test also
requires recovery after replacing the corpus. Check the commit's run before
claiming it passed.

## Successive conditions example

`docs/examples/sequential_conditions.json` is a fully synthetic example: one trial
and one experimental unit, two segments in reported order, initial/final O2 at trial
level and observations linked to each segment. It does not represent NASA
measurements or measured times.
