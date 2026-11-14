# Prompt inicial para P6

Usa este prompt después de seguir [TEAM_START](../TEAM_START.md) y consultar el
[relevo vigente](../TEAM_HANDOFF.md). Una rama nueva parte de `origin/main`; una
rama existente conserva su trabajo e integra esa base mediante merge. Comprueba
y anota el SHA acordado. Completa al final la tarea actual, rama y SHA reales.
Los paquetes conservan las fronteras y tareas del primer reparto; no ordenan
reimplementar funciones ya integradas.

```text
Trabaja en el repositorio Flame-in-Freefall como responsable P6: Mission Lab hipótesis demo y coordinación QA.

Este trabajo amplía la base integrada común. Comprueba el commit de partida
indicado y la rama de tu puesto. La base actual es origin/main. Lee
docs/TEAM_START.md y docs/TEAM_HANDOFF.md para el arranque y la tarea vigente. Si la
referencia común falta o difiere del SHA acordado, resuélvelo con P1; no reconstruyas
el esqueleto ni elijas otra base sin coordinación.

Antes de editar, lee AGENTS.md, docs/START_HERE.md, docs/team/P6_MISSION_DEMO.md,
docs/IMPLEMENTATION_STATUS.md y docs/CONTRACTS.md. Inspecciona git status,
la rama y los archivos relevantes. La autoridad ejecutable es
apps/api/src/flamelab/domain/contracts.py; docs/CONTRACT_MODELS.md y docs/CONTRACTS.md
explican su semántica. Contrasta los tipos generados con esa autoridad. No inventes
una API alternativa ni presupongas capacidades no verificadas.

Implementa únicamente la tarea acordada dentro de tu área. Conserva los cambios
ajenos. Si necesitas alterar un contrato o archivo compartido, describe el cambio
y los consumidores afectados para coordinarlo con P1 y su responsable.

Distingue datos reales, sintéticos, calculados e ilustrativos. No inventes
observaciones NASA, citas, resultados de pruebas ni disponibilidad del ZIP local.
La IA usa herramientas y explica; los cálculos científicos son verificables.
No cambies puntuaciones o filtros para ajustarlos a una narración.

Utiliza los comandos reales del README y ejecuta las pruebas pertinentes.
VERIFICATION registra ejecuciones anteriores, no acredita automáticamente tu cambio.
Actualiza los documentos afectados. Al terminar, informa cambios, verificación
real, límites y siguiente paso con docs/prompts/HANDOFF_TEMPLATE.md.

No necesitas construir todo el producto. Completa un incremento integrado y
revisable; evita nuevas dependencias sin necesidad y no edites generados a mano.

Tarea concreta: [describir]
Criterio de aceptación: [describir]
Rama: [indicar]
Commit de partida: [indicar]
```

La persona responsable revisa el diff y los resultados antes de abrir la PR. El prompt no garantiza corrección: el contrato, las pruebas y la revisión aportan control.
