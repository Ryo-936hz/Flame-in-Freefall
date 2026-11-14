# FlameLab SI — demo integrada

> **Experimento UX exclusivo de `raul`.** La petición vigente reorganiza la interfaz
> en cinco pantallas y conserva la paleta, la ciencia y los datos. La base estable
> sigue en `main` (`4833000d98fcb9d197a01e4d7622c8639115131d`). No se fusiona una PR ni se actualiza
> `main` con este experimento; no cambia backend ni contratos. El texto de integración
> inferior conserva el historial. [Alcance y recorrido del rediseño](docs/UX_EXPERIMENT_RAUL.md).

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

## Arrancar en Windows

Requisitos: Git, Python 3.12, Node 24 con npm, PowerShell 7 y red
para la primera instalación. `setup.ps1` utiliza los lockfiles; si falta uv instala
0.9.5 dentro de `work/`. En este equipo detecta también los runtimes de Codex.

```powershell
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
Set-Location Flame-in-Freefall
# Clon nuevo: crear una rama propia desde la integración compartida.
git fetch origin
git switch --no-track -c codex/mi-tarea origin/main
git rev-parse HEAD
.\scripts\setup.ps1
.\scripts\check.ps1
.\scripts\dev-api.ps1
```

Para una rama existente: guardar los cambios propios, ejecutar `git fetch origin`,
revisar la diferencia e integrar con `git merge origin/main`. Resolver conflictos
con sus responsables y repetir las comprobaciones. No usar reset ni sustituir el
clon para actualizarlo. Los seis deben comunicar el mismo SHA base de `origin/main`
al iniciar una tarea compartida; [TEAM_START](docs/TEAM_START.md) detalla el flujo.

En otra terminal:

```powershell
Set-Location 'C:\ruta\de\tu\clon\Flame-in-Freefall'
.\scripts\dev-web.ps1
```

Abrir [interfaz integrada](http://127.0.0.1:5173), [salud](http://127.0.0.1:8000/api/v1/health)
y [documentación HTTP](http://127.0.0.1:8000/docs). Ctrl+C detiene cada servidor.
Detener Vite antes de repetir setup: Windows bloquea su módulo nativo mientras
se ejecuta. No hace falta ejecutar como administrador.

Setup crea `.env` solo si no existe. El ejemplo activa explícitamente la semilla
sintética, únicamente sobre una base vacía; nunca sustituye un corpus existente.
Sin esa configuración, la API arranca con corpus vacío. Se permiten parámetros
`-Python 'C:\ruta\python.exe'` y `-Uv 'C:\ruta\uv.exe'`.

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
