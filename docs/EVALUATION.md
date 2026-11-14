# Evaluación de ciencia e IA

## Objetivo

Determinar si la aplicación encuentra evidencia pertinente y explica sus límites. No optimizar únicamente apariencia, longitud de respuesta o coincidencia con un texto redactado por otro LLM.

## Conjunto de consultas

P2 y P3 preparan consultas con evidencia esperada y razones de relevancia. P4 añade preguntas adversarias y de evidencia insuficiente. Reservar consultas para evaluación que no se utilicen al ajustar pesos o prompts.

Incluir: búsqueda de un escenario similar; estudio del efecto de una variable; condiciones críticas ausentes; diferencias de material/geometría; contraste de escala con Saffire; una afirmación no respaldada; pregunta fuera del corpus; petición de tratar datos sintéticos como reales.

## Ranking

Revisar el top 3 contra etiquetas humanas. Registrar qué ensayo era pertinente, qué restricciones debía respetar y por qué se excluían otros. Puede medirse precisión entre los resultados devueltos y relevancia graduada si se acuerda la escala. No inventar un porcentaje con tres consultas ni presentarlo como rendimiento general.

Las métricas de relevancia no sustituyen a comprobar cobertura, incompatibilidades y ausencias. Comparar con una base sencilla para saber si ponderaciones o recuperación adicional aportan valor.

## Extracción

Comparar valores, unidades, identidad y localizador con el original. Separar error de extracción, error de normalización, error de asociación al ensayo y error de interpretación. Revisar todos los datos de la demo aunque el resto del corpus se evalúe por muestra.

## Respuestas de IA

- La cita existe y corresponde a la evidencia recuperada.
- La fuente sostiene la afirmación.
- La conclusión conserva condiciones y límites.
- El modelo no altera puntuaciones o datos de las herramientas.
- Una hipótesis permanece etiquetada como hipótesis.
- El sistema reconoce evidencia insuficiente cuando procede.

### Regresiones deterministas del coordinador

`apps/api/tests/test_ai_evaluation.py` conserva una pequeña evaluación automatizada
del comportamiento que ya promete la base, sin invocar un proveedor ni usar datos
reales:

- La misma solicitud estructurada produce el mismo ranking aunque la pregunta pida
  ignorar los filtros y elegir otro escenario. La pregunta no es un planificador.
- Una pregunta que pide presentar fixtures como NASA no elimina su etiqueta
  sintética ni permite citas fuera de la evidencia devuelta.
- Si falta el eje X comparable, la investigación termina como
  `insufficient_evidence` y no llama al proveedor externo.
- `apps/api/tests/test_review.py` y `test_provider.py` cubren citas inventadas,
  asociaciones cruzadas entre ensayos y fallos explícitos del proveedor.

Estos casos son controles de integración y límites de seguridad, no una puntuación
de precisión de citas, pertinencia semántica ni calidad de planificación. No prueban
que una fuente respalde el texto de una afirmación. Para esa evaluación hacen falta
consultas etiquetadas y revisión humana independiente; los casos deben quedar fuera
de cualquier ajuste si luego se usan como conjunto de evaluación.

## Registro de resultados

Guardar versión de corpus, configuración de pesos, prompt/modelo cuando corresponda, commit, consulta, resultado y evaluación. No almacenar claves. Si una observación se usa para ajustar el sistema, deja de ser una evaluación independiente de ese cambio.

## Ampliaciones

Una regresión se evalúa separando unidades experimentales relacionadas. Una selección activa se puede estudiar retrospectivamente ocultando datos conocidos. Estas capacidades no se marcan como implementadas o validadas hasta ejecutar la evaluación correspondiente.
