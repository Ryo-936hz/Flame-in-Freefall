# P6 — Mission Lab, informes y demo completa

Copia el bloque completo en Codex con tu clon abierto. No hace falta rellenar una tarea: ya está definida. Consulta el [reparto y coordinación](DEMO_COORDINATION.md).

```text
Actúa como responsable de Mission Lab, informes y demo completa (P6) de FlameLab SI, equipo Los TTS.
Trabaja sobre el clon abierto de https://github.com/Ryo-936hz/Flame-in-Freefall.
Tu objetivo es completar tu parte de la demo integrada, no crear otro esqueleto.

ANTES DE EDITAR
Lee AGENTS.md, docs/TEAM_START.md, docs/START_HERE.md,
docs/IMPLEMENTATION_STATUS.md, docs/TEAM_HANDOFF.md, docs/WORKFLOW.md,
docs/prompts/DEMO_COORDINATION.md y docs/team/P6_MISSION_DEMO.md.
Si la guía de coordinación aún no existe en tu rama, después de git fetch origin
léela con git show origin/codex/demo-programmer-prompts:docs/prompts/DEMO_COORDINATION.md.
Puedes leer la documentación nueva sin cambiar tu base de código ni copiar encima
de cambios locales. Este prompt concreta la tarea frente a prioridades históricas.
Después lee docs/DEMO.md, docs/DESIGN_ANDURIL.md, docs/AI_SYSTEM.md y docs/CONTRACTS.md.
Inspecciona git status, rama, commit y código real de tu área. Las rutas de este
prompt son relativas al repositorio; ** indica archivos descendientes y las rutas
marcadas nuevas se pueden crear, no se presuponen implementadas.

La base inicial común es 422f6b03f410c6ac049b699e13fc204a3af67743,
origin/codex/team-start-v1 (tag flamelab-team-start-v1). Si comienzas sin rama propia
ni trabajo pendiente, crea codex/p6-mission-lab desde esa referencia verificada.
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
Completa escenarios A/B, recuperación/descarga de informes y prueba de extremo a
extremo de la demo.
1. Construye controles de dos escenarios y consume el método scenarios del cliente
   compartido. Presenta cambios en selección, cobertura y límites, explicando
   qué cambió. Es comparación de evidencia, no simulación de combustión.
2. Presenta hipótesis y siguiente medición recibidas del backend con sus etiquetas;
   no inventes experimentos como si estuvieran ejecutados.
3. Implementa vista y descarga del informe existente, y recuperación de una
   investigación guardada. Si no hay listado en API, usa selección actual o
   referencia guardada por la UI; pide a P1 cualquier endpoint adicional.
4. Acuerda con P5 exports/props/callbacks para montaje. Propón:
   features/mission-lab/MissionLabPanel.tsx y features/report/ReportPanel.tsx.
   Son rutas nuevas; acuerda la firma antes de depender de ella.
5. Prepara pruebas de navegador y guion: pregunta → evidencia → comparación →
   escenario cambiado → informe → recuperar después de reinicio.

ARCHIVOS QUE PUEDES EDITAR
- apps/web/src/features/mission-lab/**.
- Nuevo apps/web/src/features/report/**.
- Nuevos apps/web/tests/e2e/** y evals/demo/**.
- docs/DEMO.md y docs/handoffs/P6.md.
Usa estilos propios dentro de tus carpetas con clases prefijadas o módulos CSS.
No edites App.tsx, main.tsx, style.css, src/lib/** ni componentes comunes: P5 monta
tus exports y centraliza la API. P4 mantiene ai/report.py y el contenido backend.
P1 mantiene endpoints, contratos, dependencias, scripts, configuración E2E raíz y CI.
Usa tipos generados y el cliente compartido; no calcules estadística en el navegador.

PRIMER INCREMENTO
Entrega un panel A/B con los fixtures actuales y estado insuficiente, más las
props/callbacks acordadas con P5. Después añade informe y recuperación. El guion
puede avanzar desde el primer día; no esperes a los datos reales para probar UI.

CRITERIOS DE ACEPTACIÓN
- Cambiar una condición altera selección/cobertura o muestra insuficiencia con
  explicación; no basta una animación ni un texto fijo.
- Los paneles muestran hipótesis y propuestas como tales; nada afirma validación
  física, diseño inverso o IA externa cuando se usa el modo demo.
- Se visualiza y descarga el informe de la investigación correcta; sus cifras y
  fuentes concuerdan con el resultado mostrado, incluida la etiqueta sintética.
- Recuperar una investigación tras reiniciar API conserva informe y evidencia;
  el navegador no necesita mantener el resultado original en memoria.
- Prueba real de navegador del recorrido completo, caso sin evidencia y error
  recuperable. Las llamadas/API de la prueba principal usan el backend real local.
- Guion reproducible con commit, comandos, entradas esperadas y alternativa
  sintética explícita si la serie real todavía no está revisada.
- Una demo respaldada solo por fixtures no se declara validada con mediciones NASA.

VERIFICACIÓN
Ejecuta npm run typecheck y npm run build; acuerda con P1 un runner E2E y dependencia
mínimos antes de añadirlos. Guarda pruebas en tests/e2e y deja comando/documentación;
P1 integra configuración y CI. Usa base/puertos temporales y detén solo procesos
iniciados por tu prueba. No cierres servidores de compañeros. Registra el resultado
real del recorrido, no únicamente capturas ni tests simulados.

ENTREGA
Completa incrementos revisables con pruebas pertinentes; no te quedes solo en un plan.
Actualiza únicamente tu documentación asignada y docs/handoffs/P6.md usando
docs/prompts/HANDOFF_TEMPLATE.md. Incluye SHA inicial/final, rutas, comportamiento,
comandos ejecutados, resultados, pendientes, datos usados y solicitudes a otros
puestos. Los documentos globales de estado/decisiones los consolida P1; envíale
los hechos por el relevo, sin editarlos los seis a la vez.
Revisa el diff y prepara la entrega en tu rama siguiendo WORKFLOW. No merges
automáticamente en main ni fuerces pushes. No contactes a compañeros ni abras
mensajes en su nombre: deja las solicitudes listas para que la persona las comparta.
```
