# P4 — Planificación de IA y respuestas con evidencia

Copia el bloque completo en Codex con tu clon abierto. No hace falta rellenar una tarea: ya está definida. Consulta el [reparto y coordinación](DEMO_COORDINATION.md).

```text
Actúa como responsable de Planificación de IA y respuestas con evidencia (P4) de FlameLab SI, equipo Los TTS.
Trabaja sobre el clon abierto de https://github.com/Ryo-936hz/Flame-in-Freefall.
Tu objetivo es completar tu parte de la demo integrada, no crear otro esqueleto.

ANTES DE EDITAR
Lee AGENTS.md, docs/TEAM_START.md, docs/START_HERE.md,
docs/IMPLEMENTATION_STATUS.md, docs/TEAM_HANDOFF.md, docs/WORKFLOW.md,
docs/prompts/DEMO_COORDINATION.md y docs/team/P4_AI.md.
Si la guía de coordinación aún no existe en tu rama, después de git fetch origin
léela con git show origin/codex/demo-programmer-prompts:docs/prompts/DEMO_COORDINATION.md.
Puedes leer la documentación nueva sin cambiar tu base de código ni copiar encima
de cambios locales. Este prompt concreta la tarea frente a prioridades históricas.
Después lee docs/AI_SYSTEM.md, docs/EVALUATION.md, docs/SCIENTIFIC_RULES.md y docs/CONTRACTS.md.
Inspecciona git status, rama, commit y código real de tu área. Las rutas de este
prompt son relativas al repositorio; ** indica archivos descendientes y las rutas
marcadas nuevas se pueden crear, no se presuponen implementadas.

La base inicial común es 422f6b03f410c6ac049b699e13fc204a3af67743,
origin/codex/team-start-v1 (tag flamelab-team-start-v1). Si comienzas sin rama propia
ni trabajo pendiente, crea codex/p4-ia desde esa referencia verificada.
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
Convierte las preguntas soportadas de la demo en análisis verificables y una
explicación con citas, manteniendo funcionamiento sin credenciales.
1. Define un catálogo pequeño de intenciones: comparar propagación al variar
   flujo con controles compatibles, cambiar escenario y reconocer insuficiencia.
   Documenta frases admitidas, ambigüedades y restricciones no soportadas.
2. Implementa un planificador acotado y determinista para ese catálogo en modo demo.
   Devuelve intención, filtros, variable, métrica y límites interpretados para
   mostrarlos en UI. Lo no reconocido requiere aclaración o formulario explícito;
   no respondas como si hubieras aplicado un filtro que has ignorado.
3. Acuerda con P1 el contrato de plan/entrada/salida y con P5 su presentación.
   Define qué ocurre al combinar pregunta y filtros explícitos: un conflicto debe
   hacerse visible antes de ejecutar, sin sobrescribir silenciosamente.
4. Usa las herramientas existentes de ciencia para cálculos/selección; sintetiza
   resultados con citas verificables, límites, hipótesis y siguiente medición.
5. Mantén el proveedor opcional y el modo sin clave claramente rotulados.
   No necesitas activar llamadas pagadas para completar esta entrega.

ARCHIVOS QUE PUEDES EDITAR
- apps/api/src/flamelab/ai/**, incluidos engine.py, provider.py y report.py.
- apps/api/tests/test_provider.py; nuevos test_planner.py y test_ai_reports.py.
- Nuevo evals/ai/**, docs/AI_SYSTEM.md y docs/handoffs/P4.md.
P1 es dueño de rutas HTTP/configuración/contratos/test_api.py/test_review.py.
P3 es dueño de cálculos; P5/P6 de UI. P6 te solicita cambios de contenido del informe;
P6 NO modifica report.py. Solicita a P1 dependencias/configuración compartidas.

PRIMER INCREMENTO
Entrega el catálogo de preguntas y casos entrada → plan esperado, incluida una
petición ambigua y otra no soportada. Implementa el planificador con pruebas propias;
P1 publica su contrato y P5 consume el resultado.

CRITERIOS DE ACEPTACIÓN
- Preguntas soportadas distintas cambian el plan y los parámetros enviados a las
  herramientas; no basta cambiar el párrafo de respuesta.
- El usuario puede ver qué restricciones se aplicaron. Preguntas ambiguas o
  incompatibles no producen una interpretación silenciosa.
- Ningún LLM determina valores, modifica ranking ni ejecuta código arbitrario.
- Las citas pertenecen a evidencia recuperada y respaldan la afirmación concreta;
  prueba IDs falsos y también una cita existente pero irrelevante.
- Insuficiencia, inferencia, hipótesis, datos sintéticos y síntesis demo aparecen
  diferenciados en respuesta e informe, sin conclusiones más fuertes que los datos.
- Timeout, error de proveedor y respuesta malformada producen un resultado/error
  explícito. Una síntesis fallida no se oculta como llamada real exitosa.
- Todo el recorrido demo funciona sin clave; las pruebas simuladas se identifican.

VERIFICACIÓN
Ejecuta .venv\Scripts\python.exe -m pytest apps/api/tests/test_provider.py
apps/api/tests/test_planner.py apps/api/tests/test_ai_reports.py -q (una línea),
Ruff y los casos de evals/ai. Incluye lenguaje no soportado, conflicto pregunta/
filtros, ausencia de evidencia e instrucciones maliciosas dentro de una fuente.
Documenta por separado revisión de citas y resultados automatizados.

ENTREGA
Completa incrementos revisables con pruebas pertinentes; no te quedes solo en un plan.
Actualiza únicamente tu documentación asignada y docs/handoffs/P4.md usando
docs/prompts/HANDOFF_TEMPLATE.md. Incluye SHA inicial/final, rutas, comportamiento,
comandos ejecutados, resultados, pendientes, datos usados y solicitudes a otros
puestos. Los documentos globales de estado/decisiones los consolida P1; envíale
los hechos por el relevo, sin editarlos los seis a la vez.
Revisa el diff y prepara la entrega en tu rama siguiendo WORKFLOW. No merges
automáticamente en main ni fuerces pushes. No contactes a compañeros ni abras
mensajes en su nombre: deja las solicitudes listas para que la persona las comparta.
```
