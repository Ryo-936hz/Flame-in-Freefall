# Arranque común de los seis puestos — Los TTS

Repositorio: [Ryo-936hz/Flame-in-Freefall](https://github.com/Ryo-936hz/Flame-in-Freefall).
La referencia actual es **`origin/main`**. Incluye la PR #3 mediante `0b732cb` y
la integración previa de P2. Cada persona trabaja en su propio clon y rama;
antes de empezar juntos, acordad y anotad el SHA completo de esa base.
El cierre adicional P2 está verificado localmente en `raul`, código `20aab80404fc2f0fc188d718cac47d0d4bf31d54`;
El cierre se entrega mediante la PR #4 sobre `main`. [Estado](IMPLEMENTATION_STATUS.md),
[relevo](TEAM_HANDOFF.md) y [guía P2](INTEGRATION_P2_MAIN.md) distinguen ese cierre
de la PR #3 ya fusionada y registran las comprobaciones por SHA.

No hacen falta el ZIP NASA, una clave de IA, Docker ni PostgreSQL para la demo
sintética. Para importar el corpus real en Windows, seguir
[INTEGRATION_P2_MAIN](INTEGRATION_P2_MAIN.md), [DEMO](DEMO.md) y el [paquete P2](handoffs/P2_DEMO.md).

## Preparar Windows

Instalar Git, Python **3.12**, Node.js **24 con npm** y PowerShell **7**.
La primera instalación necesita red para las dependencias fijadas por lockfiles.
No depende de tener Codex instalado. Comprobar:

```powershell
git --version
python --version
node --version
npm.cmd --version
$PSVersionTable.PSVersion
```

Si `python` abre Microsoft Store o apunta a otra versión, proporcionar la ruta
instalada con `setup.ps1 -Python 'C:\ruta\python.exe'`. No hace falta activar `.venv`.

## Clon nuevo: misma base, rama propia

```powershell
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
Set-Location .\Flame-in-Freefall
git fetch origin
$taskBranch = 'codex/mi-tarea' # Usar un nombre propio que todavía no exista.
git switch --no-track -c $taskBranch origin/main
if ($LASTEXITCODE -ne 0) { throw 'No se creó la rama; revisar el error de Git.' }
$baseCommit = git rev-parse origin/main
$currentCommit = git rev-parse HEAD
if ($currentCommit -ne $baseCommit) { throw 'HEAD no coincide con la base común.' }
Write-Output "Base común: $baseCommit"
git status --short --branch
```

Los seis deben comparar `Base común` y anotarlo en sus relevos. Si `main` avanza
entre clones, coordinar el mismo SHA antes de comenzar. `--no-track` evita que la
rama propia siga a `main`; su primer push configura su rama remota.

## Clon existente: conservar e integrar

Primero comprobar `git status` y `git remote -v`. Guardar los cambios propios en
la rama actual; no cambiar de rama ni intentar el merge con trabajo sin preservar.
Cuando el árbol esté limpio:

```powershell
git fetch origin
git diff HEAD...origin/main --stat
git merge origin/main
```

Resolver posibles conflictos con los responsables de los archivos y repetir
las comprobaciones. No usar `reset --hard`, limpieza masiva ni reemplazar el clon.
No mover las etiquetas históricas para actualizar una rama.

## Instalar, comprobar y arrancar

Desde la raíz del clon:

```powershell
.\scripts\setup.ps1
.\scripts\check.ps1
node node_modules/playwright/cli.js install chromium
.\scripts\check.ps1 -E2E
```

Setup crea dependencias propias desde los lockfiles y `.env` solo si no existe;
si falta uv lo instala en `work/`. Check prueba API, cliente, contratos y persistencia.
El E2E inicia API/Vite y SQLite aislados. Consultar los resultados realmente ejecutados
en [VERIFICATION](VERIFICATION.md); estas órdenes no presuponen una ejecución aprobada.

Para la presentación manual, mantener dos terminales desde la raíz:

```powershell
# Terminal 1
.\scripts\dev-api.ps1
```

```powershell
# Terminal 2
.\scripts\dev-web.ps1
```

Abrir [interfaz](http://127.0.0.1:5173), [salud](http://127.0.0.1:8000/api/v1/health)
y [contrato HTTP](http://127.0.0.1:8000/docs). Seguir [DEMO](DEMO.md): Investigate,
evidencia, A/B, insuficiencia, informe y recuperación. El modo inicial usa dos
estudios, cinco ensayos y seis observaciones **sintéticas**. El corpus P2 completo
contiene 24 estudios y requiere importar el paquete local; su mera presencia en
la documentación no instala mediciones NASA. No copiar bases, `.env` ni credenciales
de otra persona.

Ctrl+C detiene cada servidor. Detener Vite antes de repetir setup: Windows puede
bloquear su módulo nativo. Si un puerto está ocupado, identificar primero el proceso
propio; no detener servicios ajenos. Los puertos del proxy y API deben concordar.

## Continuidad de los seis puestos

| Puesto | Trabajo compartido a mantener o ampliar |
|---|---|
| P1 | Contratos, integración, migraciones y puertas de verificación. |
| P2 | Importación, catálogo y procedencia de los 24 estudios; fuentes y licencias. |
| P3 | Comparabilidad, identidad/unidades y evaluaciones; preservar límites del dictamen BASS-II. |
| P4 | Planificación acotada, herramientas y citas; demo determinista sin credenciales. |
| P5 | Conservar AskSI/CSS de su rama al integrar main; corregir citas históricas y guardas antes de dar ese incremento por cerrado. |
| P6 | Escenarios, presets, informe y recuperación; mantener los recorridos sintético y real opt-in. |

Las tareas concretas y los responsables de archivos se acuerdan desde
[TEAM_HANDOFF](TEAM_HANDOFF.md); los paquetes `docs/team` delimitan las áreas.
Las implementaciones ya integradas no se vuelven a construir desde cero.

## Trabajar, compartir e integrar

Antes de editar: leer [AGENTS](../AGENTS.md), [estado actual](IMPLEMENTATION_STATUS.md),
el paquete del puesto y sus archivos; comprobar rama y cambios con Git. Dar al
asistente la tarea vigente del relevo, sus rutas y criterios de aceptación.

Al terminar un incremento, ejecutar las verificaciones pertinentes y actualizar
su documentación. Revisar `git diff` y añadir solo archivos de la tarea:

```powershell
git status --short --branch
git diff
# Añadir rutas concretas y revisadas; sustituir los ejemplos por vuestra entrega.
# git add <archivo-1> <archivo-2>
# git commit -m "Describe el comportamiento implementado"
git push -u origin HEAD
```

El push publica únicamente vuestra rama. Abrir una Pull Request hacia `main` con
alcance, pruebas ejecutadas, modo de datos/IA y pendientes; solicitar revisión al
puesto indicado. No trabajar directamente en `main`, no hacer force push y no
mezclar ramas ajenas sin leer conflictos. Tener permiso para clonar el repositorio
público no implica permiso de push: el propietario coordina el acceso de cada
integrante; esta guía no cambia colaboradores ni permisos.

Cambios de contrato/API/migración se acuerdan con P1 y sus consumidores antes de
implementar. La autoridad es `apps/api/src/flamelab/domain/contracts.py`.
OpenAPI y TypeScript se regeneran juntos; **no editar `packages/contracts/` a mano**.
P5/P6 coordinan `App.tsx`, componentes comunes y estilos para evitar pisarse.

Después de que P1 integre un cambio compartido, guardar el trabajo propio y
actualizar la rama mediante el flujo acordado en [WORKFLOW](WORKFLOW.md). La rama de
referencia inicial se conserva: no actualizarla para seguir el avance de `main`. Cada relevo
indica SHA inicial/final, archivos y resultados con la [plantilla](prompts/HANDOFF_TEMPLATE.md).

## Límites y pruebas

PostgreSQL 17 fue probado en CI en el hito P6; eso no acredita pgvector.
El proveedor externo solo se probó con mocks. La aprobación descriptiva de diez
puntos BASS-II no valida el corpus completo ni una comparación numérica con Saffire.
La demo no certifica seguridad ni ejecuta CFD; tampoco implementa diseño inverso
o autonomía experimental. Ver [estado](IMPLEMENTATION_STATUS.md) y [Actions](https://github.com/Ryo-936hz/Flame-in-Freefall/actions).

## Historial del primer reparto

`origin/codex/team-start-v1` y `flamelab-team-start-v1` identifican la primera base;
`flamelab-skeleton-2026-11-14` y las etiquetas P6, incluida
`flamelab-p6-demo-2026-11-14-r2`, conservan entregas posteriores. Se mantienen sin mover.
El reparto siguiente describe aquel primer incremento; no es una lista de pendientes actuales:

| Puesto y rama | Primera entrega concreta | Rutas propias y coordinación | Criterio de aceptación y revisión | Contexto |
|---|---|---|---|---|
| **P1** `codex/p1-integracion` | Mantener el recorrido común y verificar migraciones/recuperación en PostgreSQL antes de habilitarlo al equipo. | `apps/api/src/flamelab/{domain,storage}`, `main.py`, `config.py`, `apps/api/alembic`, `scripts`, `.github/workflows`; contratos y lockfiles compartidos. | Prueba real del motor y conservación del informe, sin deriva del cliente; revisión P2/P4/P5. | [Paquete](team/P1_INTEGRATION.md) · [Prompt](prompts/P1_START.md) |
| **P2** `codex/p2-datos-bass` | Preparar transcripción revisable de la tabla 5.1 BASS-II y resolver identidad, O2 inicial/final, caras, unidades y licencia. | `apps/api/src/flamelab/data`, `data/catalog`, pruebas de ingesta; originales en carpetas locales excluidas. | Cada cifra con original/unidad/localizador; ninguna meseta cuenta como réplica; revisión P3 y cambio de contrato con P1. | [Paquete](team/P2_DATA.md) · [Prompt](prompts/P2_START.md) |
| **P3** `codex/p3-ciencia` | Acordar con P2 condiciones sucesivas y construir casos etiquetados para evaluar ranking/comparabilidad. | `apps/api/src/flamelab/science`, pruebas científicas; `evals` coordinado con P6. | Reglas reproducibles, ausencias y unidad experimental respetadas; evaluación separada de fixtures; revisión P1/P2/P4. | [Paquete](team/P3_SCIENCE.md) · [Prompt](prompts/P3_START.md) |
| **P4** `codex/p4-ia` | Preparar evaluación de planificación y citas; ampliar el coordinador sin alterar cálculos deterministas. | `apps/api/src/flamelab/ai`, pruebas de proveedor/coordinador. | Mantener demo sin clave, rechazar citas falsas y medir fidelidad; llamadas reales solo con configuración/presupuesto acordados; revisión P1/P3/P5. | [Paquete](team/P4_AI.md) · [Prompt](prompts/P4_START.md) |
| **P5** `codex/p5-evidence-canvas` | Construir tabla/gráfico/fuente enlazados por identidad usando el cliente tipado existente. | `apps/web/src/features/evidence`, `src/lib` y marco común; acordar montaje/estilos con P6. | Selección coherente entre punto/fila/evidencia, unidades, procedencia y teclado; revisión P1/P3/P6. | [Paquete](team/P5_FRONTEND.md) · [Prompt](prompts/P5_START.md) |
| **P6** `codex/p6-mission-lab` | Construir experiencia A/B y guion con una consulta respondida y otra sin evidencia, mostrando la siguiente prueba propuesta. | `apps/web/src/features/mission-lab`, `docs/DEMO.md`, evaluación/recorrido coordinados. | Cambios observables de selección, hipótesis rotuladas, sin presentarlas como física validada; revisión P3/P4/P5. | [Paquete](team/P6_MISSION_DEMO.md) · [Prompt](prompts/P6_START.md) |
