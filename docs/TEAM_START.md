# Arranque común de los seis puestos — Los TTS

Repositorio: [Ryo-936hz/Flame-in-Freefall](https://github.com/Ryo-936hz/Flame-in-Freefall).
La rama de integración es `main`. Para el primer reparto, los seis parten de
**`origin/codex/team-start-v1`**, aunque `main` avance después. Esta rama de referencia
identifica el commit común: el equipo acuerda no moverla y utilizar otro nombre
para el próximo hito. Es una convención de trabajo, no una protección técnica
configurada. La etiqueta `flamelab-team-start-v1` identifica el mismo commit común;
conservar también esa etiqueta sin mover. El SHA definitivo se comunica en la entrega.
El tag anterior `flamelab-skeleton-2026-11-14` conserva la entrega histórica publicada.

Cada persona tiene su clon y su rama de trabajo. No hace falta el ZIP NASA, una
clave de IA, Docker ni PostgreSQL para instalar y ejecutar esta base.

## 1. Preparar Windows

Instalar Git para Windows, Python **3.12**, Node.js **24 LTS con npm** y
PowerShell **7**. Abrir PowerShell 7 en la carpeta donde se guardarán los proyectos
y comprobar:

```powershell
git --version
python --version
node --version
npm.cmd --version
$PSVersionTable.PSVersion
```

Se probaron Python 3.12.14 y Node 24.22.1. Setup también admite Python 3.13 y Node
desde 22.12, pero para empezar juntos usad las versiones principales indicadas
arriba. La primera instalación necesita red para descargar dependencias fijadas
en los lockfiles. No depende de tener Codex instalado.

Si `python` abre Microsoft Store o apunta a otra versión, proporcionar después
la ruta del Python 3.12 instalado mediante `setup.ps1 -Python 'C:\ruta\python.exe'`.
No es necesario activar manualmente el entorno virtual.

## 2. Clonar y fijar el mismo commit

Estos comandos son para un destino nuevo. Antes de ejecutarlos, elegid el puesto
de cada persona en la tabla del apartado 5.

```powershell
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
Set-Location .\Flame-in-Freefall
git fetch origin

# Cambiar solo este nombre por la rama de vuestro puesto.
$taskBranch = 'codex/p1-integracion'
git switch --no-track -c $taskBranch origin/codex/team-start-v1
if ($LASTEXITCODE -ne 0) { throw 'No se creó la rama desde la referencia común. Revisad el error de Git.' }

$baseCommit = git rev-parse origin/codex/team-start-v1
$currentCommit = git rev-parse HEAD
if ($currentCommit -ne $baseCommit) { throw 'HEAD no coincide con la base común.' }
Write-Output "Base común: $baseCommit"
git status --short --branch
```

Los seis debéis obtener el mismo SHA completo en `Base común`. Guardadlo en el
primer relevo de vuestra tarea. Si la referencia no aparece, comprobad que `origin` es
este repositorio y que su publicación ha terminado; no elijáis otro commit por
vuestra cuenta. `--no-track` evita configurar vuestra rama para seguir la referencia
congelada; el primer push configurará su propia rama remota. No hace falta crear
seis ramas vacías en el remoto.

**Si ya tenéis un clon:** ejecutad primero `git status` y `git remote -v`.
Conservad los cambios existentes antes de cambiar de rama. `git fetch origin`
descarga referencias sin reemplazar esos archivos. Si hay trabajo pendiente,
guardadlo en vuestra rama o utilizad otro clon en una carpeta nueva; no uséis
`reset --hard`, limpieza masiva ni sustituyáis la carpeta para seguir esta guía.

## 3. Instalar y comprobar

Desde la raíz del clon:

```powershell
.\scripts\setup.ps1
.\scripts\check.ps1
```

Setup crea `.venv`, instala las dependencias de `uv.lock` y `package-lock.json`,
comprueba tipos y compila el arnés. Si falta uv, lo instala dentro de `work/`.
Crea `.env` desde el ejemplo solo si no existe; no reemplaza configuración local.

Check ejecuta pruebas Python/cliente, Ruff, detección de deriva OpenAPI/TypeScript,
tipado, compilación y un recorrido HTTP con SQLite aislado y reinicio. Los
resultados ejecutados y sus límites están en [VERIFICATION](VERIFICATION.md);
no se debe dar por aprobada una ejecución nueva sin comprobar su salida.

La configuración inicial usa `FLAMELAB_AI_PROVIDER=demo` y semilla sintética explícita
solo sobre un almacén vacío. Las claves de proveedores no forman parte de esta
preparación. No hay que copiar `.env`, bases ni credenciales de otra persona.

## 4. Arrancar y recorrer la demo

Mantener dos terminales abiertas en la raíz del mismo clon.

Terminal 1 — API:

```powershell
.\scripts\dev-api.ps1
```

Terminal 2 — arnés técnico:

```powershell
.\scripts\dev-web.ps1
```

Abrir [http://127.0.0.1:5173](http://127.0.0.1:5173). La salud de la API está en
[8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) y el contrato interactivo
en [8000/docs](http://127.0.0.1:8000/docs). Son servicios locales de desarrollo.

1. Pulsar **Investigar** con los filtros iniciales.
2. Abrir una evidencia y comprobar su etiqueta sintética y localizador.
3. Abrir el informe persistido y reproducir los eventos guardados.
4. Comparar A/B: el cambio a gravedad lunar debe alterar la selección y mostrar
   ausencia de evidencia aplicable. No es una simulación física.
5. Desactivar `allow_synthetic` en el JSON para comprobar que los fixtures no se
   cuelan como mediciones reales.

La demo contiene **2 estudios, 5 ensayos y 6 observaciones sintéticas**. El catálogo
real contiene **24 estudios `metadata_only`**, sin observaciones científicas
importadas. BASS-II/Saffire siguen pendientes de revisión cuantitativa. La pregunta
libre acompaña la síntesis; los filtros explícitos controlan el análisis.

Ctrl+C detiene cada servidor. Detener Vite antes de repetir setup o `npm ci`:
Windows puede bloquear el módulo nativo mientras está abierto. Si 8000/5173 están
ocupados, identificar primero el proceso propio; no detener servicios ajenos ni
cambiar un puerto sin coordinar también el proxy del cliente.

## 5. Reparto y primera entrega

P1–P6 son puestos. Los TTS asignan nombres y usuarios GitHub; esta guía no presupone
quién ocupa cada uno. Las ramas son ejemplos concretos para la primera tarea.

| Puesto y rama | Primera entrega concreta | Rutas propias y coordinación | Criterio de aceptación y revisión | Contexto |
|---|---|---|---|---|
| **P1** `codex/p1-integracion` | Mantener el recorrido común y verificar migraciones/recuperación en PostgreSQL antes de habilitarlo al equipo. | `apps/api/src/flamelab/{domain,storage}`, `main.py`, `config.py`, `apps/api/alembic`, `scripts`, `.github/workflows`; contratos y lockfiles compartidos. | Prueba real del motor y conservación del informe, sin deriva del cliente; revisión P2/P4/P5. | [Paquete](team/P1_INTEGRATION.md) · [Prompt](prompts/P1_START.md) |
| **P2** `codex/p2-datos-bass` | Preparar transcripción revisable de la tabla 5.1 BASS-II y resolver identidad, O2 inicial/final, caras, unidades y licencia. | `apps/api/src/flamelab/data`, `data/catalog`, pruebas de ingesta; originales en carpetas locales excluidas. | Cada cifra con original/unidad/localizador; ninguna meseta cuenta como réplica; revisión P3 y cambio de contrato con P1. | [Paquete](team/P2_DATA.md) · [Prompt](prompts/P2_START.md) |
| **P3** `codex/p3-ciencia` | Acordar con P2 condiciones sucesivas y construir casos etiquetados para evaluar ranking/comparabilidad. | `apps/api/src/flamelab/science`, pruebas científicas; `evals` coordinado con P6. | Reglas reproducibles, ausencias y unidad experimental respetadas; evaluación separada de fixtures; revisión P1/P2/P4. | [Paquete](team/P3_SCIENCE.md) · [Prompt](prompts/P3_START.md) |
| **P4** `codex/p4-ia` | Preparar evaluación de planificación y citas; ampliar el coordinador sin alterar cálculos deterministas. | `apps/api/src/flamelab/ai`, pruebas de proveedor/coordinador. | Mantener demo sin clave, rechazar citas falsas y medir fidelidad; llamadas reales solo con configuración/presupuesto acordados; revisión P1/P3/P5. | [Paquete](team/P4_AI.md) · [Prompt](prompts/P4_START.md) |
| **P5** `codex/p5-evidence-canvas` | Construir tabla/gráfico/fuente enlazados por identidad usando el cliente tipado existente. | `apps/web/src/features/evidence`, `src/lib` y marco común; acordar montaje/estilos con P6. | Selección coherente entre punto/fila/evidencia, unidades, procedencia y teclado; revisión P1/P3/P6. | [Paquete](team/P5_FRONTEND.md) · [Prompt](prompts/P5_START.md) |
| **P6** `codex/p6-mission-lab` | Construir experiencia A/B y guion con una consulta respondida y otra sin evidencia, mostrando la siguiente prueba propuesta. | `apps/web/src/features/mission-lab`, `docs/DEMO.md`, evaluación/recorrido coordinados. | Cambios observables de selección, hipótesis rotuladas, sin presentarlas como física validada; revisión P3/P4/P5. | [Paquete](team/P6_MISSION_DEMO.md) · [Prompt](prompts/P6_START.md) |

P2/P3 pueden avanzar con revisión y casos propuestos antes de cambiar el contrato.
P4/P5/P6 consumen mientras tanto la base sintética existente. Nadie necesita crear
otro backend o tipos alternativos. [DESIGN_ANDURIL](DESIGN_ANDURIL.md) conserva la
dirección del frontend futuro; el arnés actual no es el diseño final.

## 6. Trabajar, compartir e integrar

Antes de editar: leer [AGENTS](../AGENTS.md), [estado actual](IMPLEMENTATION_STATUS.md),
el paquete del puesto y sus archivos; comprobar rama y cambios con Git. Dar al
asistente la tarea concreta de la tabla, sus rutas y criterio de aceptación.

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

## Qué queda fuera de esta base

No se declara validado el proveedor externo real, PostgreSQL/pgvector ni la
comparación cuantitativa NASA por disponer de configuración o pruebas simuladas.
El estado de CI se consulta en [Actions](https://github.com/Ryo-936hz/Flame-in-Freefall/actions)
y se registra en VERIFICATION. La base no certifica seguridad, no ejecuta CFD y no
implementa todavía diseño inverso ni autonomía experimental.
