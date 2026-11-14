# Prompt inicial para P2

Usa este prompt después de construir y verificar la base común con el [prompt maestro local](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Si aún no existe la base, vuelve a ese flujo; no crees otro esqueleto independiente. Completa al final tarea, rama y commit de partida.

```text
Trabaja en el repositorio Flame-in-Freefall como responsable P2: Datos extracción y procedencia.

Este trabajo de puesto comienza después de verificar una única base común.
Comprueba que existe el commit de partida indicado. Si todavía no hay base,
sigue docs/LOCAL_CODEX_MASTER_PROMPT.md con P1 antes de desarrollar en paralelo.

Antes de editar, lee AGENTS.md, docs/START_HERE.md, docs/team/P2_DATA.md,
docs/IMPLEMENTATION_STATUS.md y docs/CONTRACTS.md. Inspecciona git status,
la rama y los archivos relevantes. Los modelos propuestos están en docs/CONTRACT_MODELS.md y docs/CONTRACTS.md.
Si la base ya está implementada, contrasta esos documentos con la autoridad
apps/api/src/flamelab/domain/contracts.py y los tipos generados. No inventes
una API alternativa ni presupongas capacidades no verificadas.

Implementa únicamente la tarea acordada dentro de tu área. Conserva los cambios
ajenos. Si necesitas alterar un contrato o archivo compartido, describe el cambio
y los consumidores afectados para coordinarlo con P1 y su responsable.

Distingue datos reales, sintéticos, calculados e ilustrativos. No inventes
observaciones NASA, citas, resultados de pruebas ni disponibilidad del ZIP local.
La IA usa herramientas y explica; los cálculos científicos son verificables.
No cambies puntuaciones o filtros para ajustarlos a una narración.

Implementa o utiliza los comandos del README cuando existan y ejecuta las pruebas pertinentes. Esta entrega documental no acredita ninguna ejecución.
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
