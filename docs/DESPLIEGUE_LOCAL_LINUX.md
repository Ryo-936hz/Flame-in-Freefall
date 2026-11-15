# Despliegue local en Linux y Windows con catálogo real

Alternativa sin instalar Python/Node: ver la sección Docker al final.

Registro de los pasos seguidos el 2026-11-15 para lanzar FlameLab SI en local
sin PowerShell. Los scripts `scripts/*.ps1` del README están pensados para Windows;
aquí se ejecutan a mano los mismos comandos que contienen.

## Entorno

| Elemento | Valor |
| --- | --- |
| Sistema operativo | Linux Mint 22.3 (kernel 6.17.0-35-generic, x86_64) |
| Python | 3.12.3 (`/usr/bin/python3.12`) |
| Node / npm | Node v24.16.0 con npm local |
| uv | 0.9.5 (instalado con pipx; misma versión que usa `setup.ps1`) |
| Commit | `88f1922` (rama `main`) |
| IA | modo `demo`, sin clave de proveedor externo |

## 1. Dependencias

Desde la raíz del repositorio, usando los lockfiles:

```bash
pipx install uv==0.9.5
~/.local/bin/uv sync --locked      # crea .venv desde uv.lock
npm ci --no-audit --no-fund        # instala node_modules desde package-lock.json
```

## 2. Base de datos con el catálogo real

`data/catalog/psi_metadata.json` contiene 24 estudios `metadata_only` (sin ensayos
ni observaciones). Se importa en una base SQLite dedicada, separada de la base por
defecto `work/flamelab.db`:

```bash
.venv/bin/python -m flamelab.data.cli validate data/catalog/psi_metadata.json
# {"dataset_id": "psi:local-catalog-v1", "studies": 24, "trials": 0, "observations": 0}

.venv/bin/python -m flamelab.data.cli import data/catalog/psi_metadata.json \
  --database-url sqlite:///work/catalog.db
# {"dataset_id": "psi:local-catalog-v1", "studies": 24, "trials": 0, "observations": 0, "changed": true}
```

## 3. API (terminal 1)

```bash
FLAMELAB_DATABASE_URL=sqlite:///work/catalog.db \
FLAMELAB_SEED_DEMO=false \
.venv/bin/python -m uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
```

Sin `FLAMELAB_DATABASE_URL` la API usa `work/flamelab.db`, que empieza vacía
(`data_mode: empty`).

## 4. Web (terminal 2)

```bash
npm run dev:web -- --host 127.0.0.1
```

Vite sirve en el puerto 5173 y redirige `/api`, `/openapi.json` y `/docs` a la API.

## 5. Comprobación

```bash
curl -s http://127.0.0.1:8000/api/v1/health
# {"status":"ok",...,"database":"sqlite","ai_provider":"demo","data_mode":"metadata_only"}
curl -s http://127.0.0.1:5173/api/v1/studies   # 24 estudios a través del proxy de Vite
```

- Interfaz: http://127.0.0.1:5173
- Documentación HTTP: http://127.0.0.1:8000/docs

Solo se comprobó que los servidores responden y que el catálogo se sirve. No se
ejecutaron `check.ps1`, pruebas ni el recorrido E2E.

## Limitaciones y alternativas

- El catálogo no tiene ensayos ni mediciones: **Study catalog** funciona, pero las
  vistas de investigación y A/B devuelven evidencia insuficiente.
- Demo sintética: arrancar la API con `FLAMELAB_SEED_DEMO=true` (sin
  `FLAMELAB_DATABASE_URL`) carga `data/fixtures/demo.json`. Son datos de prueba, no
  mediciones NASA; no mezclarlos con el catálogo real.
- Corpus BASS-II de P2: requiere el `bundle.json` del paquete 1.1.1, que no está en
  el repositorio. Importarlo en una base dedicada como indica `docs/DEMO.md`.
- Detener cada servidor con Ctrl+C.

## Windows

Equivalente en Windows 10/11 de la sección anterior (Linux), con PowerShell 7 y los scripts
del repositorio. **No se ha ejecutado en Windows**: los comandos se derivan de
`scripts/setup.ps1`, `scripts/dev-api.ps1`, `scripts/dev-web.ps1` y `docs/DEMO.md`;
el resultado esperado procede de la ejecución en Linux.

Requisitos: Git, Python 3.12, Node 24 con npm y PowerShell 7.

### 1. Dependencias

```powershell
Set-Location 'C:\ruta\de\tu\clon\Flame-in-Freefall'
.\scripts\setup.ps1     # usa uv.lock y package-lock.json; instala uv 0.9.5 en work\ si falta
```

`setup.ps1` crea `.env` desde `.env.example` si no existe, con
`FLAMELAB_SEED_DEMO=true`. Las variables de entorno del paso 3 tienen prioridad
sobre `.env`.

### 2. Base de datos con el catálogo real

```powershell
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
```

Resultado esperado: `"studies": 24, "trials": 0, "observations": 0`.

### 3. API (terminal 1)

```powershell
$env:FLAMELAB_DATABASE_URL = 'sqlite:///work/catalog.db'
$env:FLAMELAB_SEED_DEMO = 'false'
$env:FLAMELAB_AI_PROVIDER = 'demo'
.\scripts\dev-api.ps1
```

Las variables solo duran en esa terminal. Sin ellas, la API usa
`work\flamelab.db` y, con el `.env` de `setup.ps1`, carga la demo sintética.

### 4. Web (terminal 2)

```powershell
Set-Location 'C:\ruta\de\tu\clon\Flame-in-Freefall'
.\scripts\dev-web.ps1
```

### 5. Comprobación

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health      # data_mode: metadata_only
(Invoke-RestMethod http://127.0.0.1:5173/api/v1/studies)    # 24 estudios vía Vite
```

Abrir http://127.0.0.1:5173. Detener cada servidor con Ctrl+C y Vite antes de
repetir `setup.ps1`. Las limitaciones y alternativas de la sección anterior son
las mismas.

## Docker (Linux y Windows)

Requisitos: Docker Engine con Compose v2 en Linux, o Docker Desktop (WSL 2) en
Windows. No hace falta Python, uv ni Node en el equipo. Decisión: [ADR 0011](adr/0011-docker-local-deployment.md).

```bash
docker compose up -d --build     # mismo comando en bash y en PowerShell
```

Abrir http://127.0.0.1:8080 (documentación HTTP en http://127.0.0.1:8080/docs).
La API no publica puerto propio; nginx redirige `/api`, `/openapi.json` y `/docs`.

Corpus con `FLAMELAB_DATA`, cada uno en su propia base del volumen `flamelab-work`:

| Valor | Datos | `data_mode` |
| --- | --- | --- |
| `catalog` (por defecto) | `data/catalog/psi_metadata.json`, 24 estudios reales sin ensayos | `metadata_only` |
| `demo` | `data/fixtures/demo.json`, sintético: no son mediciones NASA | `synthetic` |
| `bundle` | `FLAMELAB_BUNDLE` de `data/local/`: `bundle.json` o ZIP del paquete P2 (cotejado con `SHA256SUMS`) | el del bundle, p. ej. `scientific_unverified` |
| `empty` | base vacía | `empty` |

```bash
FLAMELAB_DATA=demo docker compose up -d          # Linux/macOS
```

```powershell
$env:FLAMELAB_DATA = 'demo'; docker compose up -d  # Windows PowerShell
```

Otras variables: `FLAMELAB_WEB_PORT` (8080) y `FLAMELAB_AI_PROVIDER` (`demo`). Un
`.env` local, si existe, se pasa a la API (p. ej. proveedor de IA externo); nunca
se copia a la imagen. Comprobación:

```bash
curl -s http://127.0.0.1:8080/api/v1/health    # Windows: Invoke-RestMethod <url>
docker compose ps                              # api "healthy", web "Up"
docker compose logs -f api
docker compose down          # parar; añadir -v borra también las bases del volumen
```

Verificado en Linux Mint 22.3 (Docker 29.9.2, Compose v5.6.1): build, `catalog`
(24 estudios, `metadata_only`), `demo` (`synthetic`), reinicio sin reimportar
(`"changed": false`), SPA y `/docs` vía nginx. **No probado aún en Windows.**

Modo `bundle`, verificado el 15-11-2026 en el mismo equipo con el fixture
**sintético** `demo.json` como bundle (el paquete P2 real no está en este equipo, así
que su carga en Docker queda pendiente de comprobar con el ZIP 1.1.1):

- `.json` → `changed: true`, base `bundle-516986db74fc.db`, `data_mode: synthetic`, 2 estudios.
- ZIP con el mismo `bundle.json` y `SHA256SUMS` correcto → misma base, `changed: false`.
- ZIP con `SHA256SUMS` que no coincide → la API no arranca: «bundle.json de … no coincide con su SHA256SUMS».
- Sin `FLAMELAB_BUNDLE` y varios archivos → lista los candidatos y no arranca.
- `FLAMELAB_BUNDLE=../data/fixtures/demo.json` → rechazado (fuera de la carpeta de importación).
PostgreSQL sigue opcional y sin verificar: `docker compose --profile postgres up -d postgres`
con `FLAMELAB_POSTGRES_PASSWORD` definida.
