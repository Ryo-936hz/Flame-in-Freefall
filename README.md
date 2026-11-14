# FlameLab SI — base integrada 0.1

Los TTS · 14 de noviembre de 2026.

Esqueleto local conectado: FastAPI/Pydantic, SQLite con migraciones y snapshots,
ingesta CLI, perfil, ranking Gower, comparación, coordinador determinista, adaptador
externo configurable y cliente React/TypeScript generado desde OpenAPI.
El frontend entregado es un **arnés técnico**, no el diseño final.

**Equipo: empezar por [la guía de los seis puestos](docs/TEAM_START.md).** La base
compartida se publica en [GitHub](https://github.com/Ryo-936hz/Flame-in-Freefall).
`main` integra cambios; `codex/team-start-v1` conserva el punto de partida común.
Cada persona crea su propia rama desde esa referencia, aunque `main` avance.

El recorrido numérico utiliza **datos sintéticos**, no mediciones NASA. El ZIP real
se inventarió: 24 investigaciones, 22 CSV y 27 PDF, sin vídeos. El catálogo real se
importa como `metadata_only`, sin observaciones numéricas. La serie BASS-II candidata
y los problemas de Saffire están en [inspección](docs/DATA_INSPECTION.md).

## Arrancar en Windows

Requisitos: Git, Python 3.12, Node 24 con npm, PowerShell 7 y red
para la primera instalación. `setup.ps1` utiliza los lockfiles; si falta uv instala
0.9.5 dentro de `work/`. En este equipo detecta también los runtimes de Codex.

```powershell
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
Set-Location Flame-in-Freefall
# Ejemplo P1; elegir la rama del puesto en docs/TEAM_START.md.
git switch --no-track -c codex/p1-integracion origin/codex/team-start-v1
git rev-parse HEAD
.\scripts\setup.ps1
.\scripts\check.ps1
.\scripts\dev-api.ps1
```

En otra terminal:

```powershell
Set-Location 'C:\ruta\de\tu\clon\Flame-in-Freefall'
.\scripts\dev-web.ps1
```

Abrir [arnés](http://127.0.0.1:5173), [salud](http://127.0.0.1:8000/api/v1/health)
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

La prueba HTTP inicia una API temporal con SQLite aislado: consulta, ranking,
investigación, evidencia, A/B, insuficiencia lunar, informe y eventos. Reinicia el
servidor y comprueba el mismo informe. No modifica la base del usuario ni llama a
IA externa. Resultado: `work/smoke-result.json`.

En el arnés: **Investigar**, abrir referencia, informe y eventos guardados; comparar
A/B cambiando gravedad. Desactivar `allow_synthetic` demuestra ausencia de evidencia.
Los filtros explícitos mandan; la demo no interpreta restricciones verbales.

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

SQLite y demo comprobados. Adaptador OpenAI probado con HTTP simulado, sin llamadas
reales ni claves. PostgreSQL/pgvector preparados, no ejecutados. El estado de CI
se registra en VERIFICATION. Pendientes: planificador de lenguaje natural, corpus numérico
revisado, embeddings, bootstrap, regresión, CFD, diseño inverso y frontend final.

Código compartido en GitHub; comprobar las ejecuciones de [Actions](https://github.com/Ryo-936hz/Flame-in-Freefall/actions)
y VERIFICATION antes de atribuir un resultado a CI. El historial de construcción
local y su bundle se conservan como referencia histórica. Documents y el paquete
original permanecen intactos. No necesitas el ZIP para arrancar la demo.
[Dirección visual](docs/DESIGN_ANDURIL.md).
