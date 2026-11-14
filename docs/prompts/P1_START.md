# P1 — API, contratos e integración

Copia el bloque completo en Codex con tu clon abierto. No hace falta rellenar una tarea: ya está definida. Consulta el [reparto y coordinación](DEMO_COORDINATION.md).

```text
Actúa como responsable de API, contratos e integración (P1) de FlameLab SI, equipo Los TTS.
Trabaja sobre el clon abierto de https://github.com/Ryo-936hz/Flame-in-Freefall.
Tu objetivo es completar tu parte de la demo integrada, no crear otro esqueleto.

ANTES DE EDITAR
Lee AGENTS.md, docs/TEAM_START.md, docs/START_HERE.md,
docs/IMPLEMENTATION_STATUS.md, docs/TEAM_HANDOFF.md, docs/WORKFLOW.md,
docs/prompts/DEMO_COORDINATION.md y docs/team/P1_INTEGRATION.md.
Si la guía de coordinación aún no existe en tu rama, después de git fetch origin
léela con git show origin/codex/demo-programmer-prompts:docs/prompts/DEMO_COORDINATION.md.
Puedes leer la documentación nueva sin cambiar tu base de código ni copiar encima
de cambios locales. Este prompt concreta la tarea frente a prioridades históricas.
Después lee docs/CONTRACTS.md, docs/CONTRACT_MODELS.md, docs/DATA_INSPECTION.md, docs/ARCHITECTURE.md y docs/TESTING.md.
Inspecciona git status, rama, commit y código real de tu área. Las rutas de este
prompt son relativas al repositorio; ** indica archivos descendientes y las rutas
marcadas nuevas se pueden crear, no se presuponen implementadas.

La base inicial común es 422f6b03f410c6ac049b699e13fc204a3af67743,
origin/codex/team-start-v1 (tag flamelab-team-start-v1). Si comienzas sin rama propia
ni trabajo pendiente, crea codex/p1-integracion desde esa referencia verificada.
Si ya tienes trabajo, consérvalo y comprueba su base antes de continuar; no hagas
reset, no cambies ramas de otra persona y no muevas la referencia común.
Incorpora después los cambios compartidos de main acordados; no vuelvas a la base
antigua tras cada entrega. Sigue TEAM_START para setup y arranque en Windows.

LÍMITES COMUNES
La demo actual usa fixtures sintéticos; el catálogo real es metadata_only.
El planificador de lenguaje natural y la interfaz de producto están pendientes.
No conviertas una propuesta/documento en capacidad implementada ni un test simulado
en validación real. Mantén modo sin credenciales, procedencia y fuentes verificables.
No publiques originales, claves ni bases. La autoridad es domain/contracts.py;
packages/contracts se genera desde API y no se edita a mano.
Trabaja únicamente en las rutas asignadas abajo. Para otra ruta, entrega al dueño
una solicitud con motivo, ejemplo entrada/salida y prueba esperada. Continúa las
partes independientes; no inventes contratos ni ocultes el bloqueo con casts.
No necesitas permiso para ediciones rutinarias dentro de tu tarea.

TAREA
Termina la conexión de la demo y prepara el contrato que necesitan los datos reales.
1. Revisa con P2/P3 una propuesta de representación de condiciones sucesivas,
   caras de combustión, unidad experimental y O2 inicial/final. Define migración
   y compatibilidad con fixtures e investigaciones históricas. Los nombres nuevos
   se acuerdan: no están implementados por aparecer en este prompt.
2. Implementa el contrato acordado y su validación; adapta API y almacenamiento.
   Conserva snapshots y referencias de evidencia al reimportar y reiniciar.
3. Acuerda con P4 cómo exponer el plan/filtros interpretados y con P5/P6 sus
   consumidores. Regenera OpenAPI y TypeScript desde la API.
4. Integra incrementos revisados de los demás; incorpora sus dependencias y
   comandos de pruebas una sola vez. Mantén el arranque Windows sin claves.
SQLite basta para esta demo. PostgreSQL, pgvector, autenticación de producción,
CFD y diseño inverso quedan fuera del camino crítico.

ARCHIVOS QUE PUEDES EDITAR
- apps/api/src/flamelab/domain/** y apps/api/src/flamelab/storage/**.
- apps/api/src/flamelab/main.py y apps/api/src/flamelab/config.py.
- apps/api/alembic/**, alembic.ini y compose.yaml solo si es necesario.
- apps/api/tests/test_api.py, test_contracts.py, test_storage.py y test_review.py.
- Nuevo apps/api/tests/test_demo_integration.py; fixtures de pruebas compartidos.
- scripts/**, .github/workflows/** y configuración/dependencias/lockfiles raíz.
- apps/web/package.json, apps/web/tsconfig.json y apps/web/vite.config.ts.
- packages/contracts/** SOLO mediante generación.
- README.md, AGENTS.md y documentos globales de contrato, estado, arranque,
  decisiones y verificación; docs/handoffs/P1.md.
No edites ingesta, ciencia, IA ni componentes React de otros puestos: solicita
un cambio concreto al propietario. Ser integrador no convierte todas las rutas
en edición simultánea autorizada.

PRIMER INCREMENTO
Entrega una propuesta pequeña de contrato con ejemplo antes/después, compatibilidad,
consumidores y pruebas de aceptación. P2/P3 revisan la semántica; después implementa.
Mientras llega su revisión, verifica persistencia y arranque actuales.

CRITERIOS DE ACEPTACIÓN
- Un ensayo con varias condiciones conserva identidad e independencia; valores,
  unidades y ausencias inválidos se rechazan sin coerciones silenciosas.
- Fixtures actuales y nuevas series revisadas se validan con la versión acordada;
  cualquier cambio incompatible tiene una migración o rechazo explícito.
- API y tipos generados concuerdan; ningún consumidor mantiene un modelo paralelo.
- La investigación recuperada tras reinicio y reimportación conserva el informe,
  snapshot y localizadores originales.
- Demo de principio a fin sin credenciales y sin editar JSON manualmente después
  de integrar P5/P6. Se distingue corpus real, sintético y ausencia de evidencia.
- Clon limpio Windows: setup y check pasan; registra commit, comandos y resultados.
  Integra las nuevas pruebas de los seis en la verificación antes del cierre.

VERIFICACIÓN
Ejecuta .\scripts\check.ps1, que incluye Python, Ruff, deriva de contratos,
tipado, pruebas cliente, build y smoke con reinicio. Prueba migración/recuperación
con una base temporal; no uses una base de un compañero. Comprueba las nuevas
pruebas E2E de P6 tras integrar UI, sin atribuirles éxito antes de ejecutarlas.

ENTREGA
Completa incrementos revisables con pruebas pertinentes; no te quedes solo en un plan.
Actualiza únicamente tu documentación asignada y docs/handoffs/P1.md usando
docs/prompts/HANDOFF_TEMPLATE.md. Incluye SHA inicial/final, rutas, comportamiento,
comandos ejecutados, resultados, pendientes, datos usados y solicitudes a otros
puestos. Los documentos globales de estado/decisiones los consolida P1; envíale
los hechos por el relevo, sin editarlos los seis a la vez.
Revisa el diff y prepara la entrega en tu rama siguiendo WORKFLOW. No merges
automáticamente en main ni fuerces pushes. No contactes a compañeros ni abras
mensajes en su nombre: deja las solicitudes listas para que la persona las comparta.
```
