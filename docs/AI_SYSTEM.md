# Sistema de IA

La base local incluye un coordinador ejecutable y un modo demo determinista sin credenciales. También
incluye un adaptador externo configurable, probado con transporte HTTP simulado: no se han realizado
llamadas reales ni medido calidad, coste o latencia de un proveedor. Resultados en VERIFICATION.

## Qué controla la IA

En la base actual, el coordinador ejecuta un plan fijo: perfil, ranking sobre filtros explícitos, comparación,
recuperación de evidencia, validación de referencias y respuesta. La pregunta participa en la síntesis;
no se infieren automáticamente sus restricciones. Los cálculos científicos no los realiza ni modifica el modelo.
El expediente conserva escenario, evidencia, candidatos, comparación, propuestas y límites.

Los roles investigador, analista, revisor y diseñador son responsabilidades lógicas. No requieren cuatro
servicios ni cuatro modelos. LangGraph fue una propuesta; ADR 0007 acepta un flujo Python acotado sin
esa dependencia para la base. Un director que interprete lenguaje natural y elija planes dinámicos permanece
pendiente de implementación y evaluación.

## Herramientas

El catálogo implementado identifica `profile_dataset`, `rank_trials`, `compare_trials` y
`retrieve_evidence`; la recuperación selecciona las fuentes enlazadas a ensayos, condiciones y observaciones.
La API también consulta estudios/ensayos. Los paneles pertenecen a un catálogo cerrado. Nombres y argumentos
se consultan en CONTRACTS y el contrato ejecutable; este documento no define una API paralela.

Cada herramienta valida entradas y devuelve datos estructurados con procedencia y estado. El modelo no ejecuta SQL libre, shell, Python arbitrario ni JavaScript en el navegador. Las operaciones de cálculo son funciones controladas.

## Modo de demostración

El modo sin credenciales realiza un recorrido determinista identificable. Verifica conexiones y permite desarrollar el resto del sistema. No se describe como una llamada a un modelo externo. Si usa fixtures, toda la respuesta conserva esa condición.

## Proveedor externo

El adaptador externo utiliza configuración del servidor y salida estructurada. El nombre del modelo se configura explícitamente según disponibilidad de la cuenta. Nunca se deduce que una suscripción individual garantiza acceso a una API, un modelo o un presupuesto. El acceso y posibles créditos vinculados deben verificarse en la cuenta correspondiente.

La implementación realiza como máximo una petición de síntesis cuando existen datos suficientes, con
`store=false`. Solo acepta resumen y afirmaciones tipadas; ranking, comparación, paneles e hipótesis preparadas
se conservan bajo control del programa. La validación de citas detecta IDs inventados o enlaces entre ensayos
incorrectos; no demuestra que el texto de una afirmación esté científicamente respaldado.

No guardar una clave en el repositorio. No compartir la clave individual de una persona por chat de equipo. El modo externo no se activa silenciosamente por detectar una variable de entorno: debe existir una configuración clara.

## Contrato de respuesta y revisión

La respuesta estructurada expresa conclusiones, referencias, limitaciones y acciones visuales según el contrato. El backend comprueba que los identificadores citados pertenecen a la evidencia recuperada y que las acciones utilizan tipos permitidos. No aceptar un identificador inventado aunque tenga formato válido.

Los datos recuperados son contenido no fiable: pueden contener texto que intente cambiar instrucciones. El sistema separa instrucciones y evidencia, delimita el corpus y no otorga autoridad a instrucciones dentro de documentos.

## Límites de ejecución

Se configuran tiempo máximo global y tamaño de contexto (`ai_timeout_seconds`, `ai_max_context_chars`).
El transporte tiene además límites de lectura y la salida un tope de tamaño. Timeout, rechazo, respuesta
incompleta, forma inválida y citas inválidas devuelven errores explícitos. No hay fallback que convierta
silenciosamente un fallo externo en una respuesta demo. Si falta evidencia, no se llama al proveedor y se
indica en los límites. El campo `provider` identifica la configuración, no acredita por sí solo una llamada.

## Hipótesis

Una hipótesis incluye evidencia que la motiva, objeciones, condiciones, variables por controlar y observación que la refutaría. No se etiqueta como descubrimiento validado. Las propuestas de diseño son investigación, no certificación de seguridad.

La base devuelve una propuesta preparada con `label=prepared_demo_hypothesis` cuando hay evidencia
suficiente y el usuario lo solicita. No es descubrimiento autónomo ni una hipótesis nueva generada por el
proveedor. Un eje solicitado completamente ausente produce `insufficient_evidence`, sin hipótesis preparada.

## Evaluación

Medir citas válidas y pertinentes, respeto de filtros, uso correcto de herramientas, estados de evidencia insuficiente, latencia y coste observado. No usar exclusivamente un segundo LLM para certificar al primero. Detalles en [EVALUATION](EVALUATION.md).
