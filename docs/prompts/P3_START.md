# P3 — Comparación y reglas científicas

Copia el bloque completo en Codex con tu clon abierto. No hace falta rellenar una tarea: ya está definida. Consulta el [reparto y coordinación](DEMO_COORDINATION.md).

```text
Actúa como responsable de Comparación y reglas científicas (P3) de FlameLab SI, equipo Los TTS.
Trabaja sobre el clon abierto de https://github.com/Ryo-936hz/Flame-in-Freefall.
Tu objetivo es completar tu parte de la demo integrada, no crear otro esqueleto.

ANTES DE EDITAR
Lee AGENTS.md, docs/TEAM_START.md, docs/START_HERE.md,
docs/IMPLEMENTATION_STATUS.md, docs/TEAM_HANDOFF.md, docs/WORKFLOW.md,
docs/prompts/DEMO_COORDINATION.md y docs/team/P3_SCIENCE.md.
Si la guía de coordinación aún no existe en tu rama, después de git fetch origin
léela con git show origin/codex/demo-programmer-prompts:docs/prompts/DEMO_COORDINATION.md.
Puedes leer la documentación nueva sin cambiar tu base de código ni copiar encima
de cambios locales. Este prompt concreta la tarea frente a prioridades históricas.
Después lee docs/SCIENTIFIC_RULES.md, docs/DATA_INSPECTION.md, docs/EVALUATION.md, docs/CONTRACTS.md y apps/api/src/flamelab/science/METHOD.md.
Inspecciona git status, rama, commit y código real de tu área. Las rutas de este
prompt son relativas al repositorio; ** indica archivos descendientes y las rutas
marcadas nuevas se pueden crear, no se presuponen implementadas.

La base inicial común es 422f6b03f410c6ac049b699e13fc204a3af67743,
origin/codex/team-start-v1 (tag flamelab-team-start-v1). Si comienzas sin rama propia
ni trabajo pendiente, crea codex/p3-ciencia desde esa referencia verificada.
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
Haz que ranking, perfiles y comparación soporten la serie revisada de P2 sin
confundir condiciones sucesivas con réplicas.
1. Revisa con P2 las unidades, controles, secuencias, caras, geometría y oxígeno.
   Entrega a P1 requisitos semánticos y ejemplos para el contrato.
2. Tras integrar el contrato, adapta elegibilidad, Gower, agrupación y extracción
   de pares X/Y. Conserva filtros obligatorios y excluye vary de la distancia.
3. Distingue observaciones, condiciones, ensayos y unidades independientes.
   Agrupa solo controles compatibles y muestra motivos de exclusión/ausencia.
4. Devuelve puntos, grupos, unidades, cobertura y límites reproducibles. No
   inventes intervalos, confianza estadística o un índice de riesgo.
5. Prepara tres casos con resultado esperado: comparación válida, cambio de
   condición que altera evidencia y consulta sin evidencia suficiente. Separa
   pruebas sintéticas de evaluación de la serie real revisada.

ARCHIVOS QUE PUEDES EDITAR
- apps/api/src/flamelab/science/**, incluido METHOD.md.
- apps/api/tests/test_science.py y nuevo test_condition_segments.py.
- Nuevo evals/science/** y docs/handoffs/P3.md.
P2 mantiene data/** y su documentación; solicita sus correcciones con una fila/
localizador concreto. P1 mantiene domain/** y test_contracts.py. P4 mantiene ai/**.
Los casos auxiliares propios pueden vivir en evals/science; identifica explícitamente
los sintéticos. No añadas una segunda copia independiente del corpus real.

PRIMER INCREMENTO
Entrega casos de comparabilidad y pseudorreplicación con expectativas explicadas.
Pueden comenzar con modelos actuales/fixtures; el soporte de secuencias espera
el contrato integrado por P1. No ocultes esa dependencia con tipos duplicados.

CRITERIOS DE ACEPTACIÓN
- Un ensayo con tres mesetas sigue siendo una unidad experimental; informa por
  separado números de puntos y de unidades independientes.
- No se mezclan estudios, procedencias, métricas, unidades o controles incompatibles;
  las exclusiones se explican con datos del contrato.
- Un cero válido se conserva, los valores ausentes no se imputan silenciosamente,
  y no se crea un punto sin par X/Y válido.
- Los filtros required_match se aplican incluso con peso cero; resultados
  deterministas con orden estable para empates.
- Las tres consultas tienen entradas, salidas esperadas, justificación y pruebas.
  La salida insuficiente explica qué evidencia falta.
- La serie real se revisa con P2 y queda un registro; pasar pytest no equivale
  a validar predicción física ni a certificar transferencia BASS-II/Saffire.

VERIFICACIÓN
Ejecuta .venv\Scripts\python.exe -m pytest apps/api/tests/test_science.py
apps/api/tests/test_condition_segments.py -q (una línea), Ruff sobre tu módulo y
los casos de evals/science con el runner que documentes. Si necesitas integrarlo
en check/CI, entrega a P1 el comando, dependencia y resultado.

ENTREGA
Completa incrementos revisables con pruebas pertinentes; no te quedes solo en un plan.
Actualiza únicamente tu documentación asignada y docs/handoffs/P3.md usando
docs/prompts/HANDOFF_TEMPLATE.md. Incluye SHA inicial/final, rutas, comportamiento,
comandos ejecutados, resultados, pendientes, datos usados y solicitudes a otros
puestos. Los documentos globales de estado/decisiones los consolida P1; envíale
los hechos por el relevo, sin editarlos los seis a la vez.
Revisa el diff y prepara la entrega en tu rama siguiendo WORKFLOW. No merges
automáticamente en main ni fuerces pushes. No contactes a compañeros ni abras
mensajes en su nombre: deja las solicitudes listas para que la persona las comparta.
```
