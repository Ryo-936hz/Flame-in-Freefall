# Sistema de IA implementado

La demo ejecuta planificación, selección, comparación, revisión y explicación sin
credenciales. El planificador es un catálogo determinista acotado. El proveedor
externo es opcional: su protocolo y fallos se prueban con simulación; no se han
realizado llamadas reales ni medido calidad, coste o latencia de un modelo real.

## Plan visible y precedencia de filtros

`ResearchRequest.planning_mode` tiene dos valores:

- `explicit` (predeterminado, compatible con clientes anteriores): se aplican
  únicamente los filtros estructurados. La pregunta es una descripción y no
  modifica restricciones. El plan y sus límites lo indican expresamente.
- `catalog`: reconoce las frases del catálogo inferior. Una pregunta ambigua,
  no admitida o contradictoria detiene el análisis antes de herramientas o modelo.
  No se relaja un filtro para producir resultados.

`POST /api/v1/research/plan` recibe el mismo `ResearchRequest` que la investigación
y devuelve `ResearchPlan`, sin leer datos, guardar un expediente ni llamar a un
proveedor. El plan incluye modo, intención, filtros efectivos, métrica, eje X,
mensaje, `blocked` y límites. La investigación utiliza ese mismo planificador y
conserva el resultado en `ResearchResponse.plan` y el informe persistido. Un plan
no bloqueado todavía puede encontrar evidencia insuficiente al ejecutar ciencia.
Expedientes antiguos pueden tener `plan=null`; no se inventa su interpretación.

La vista previa no reserva el corpus: el catálogo puede cambiar entre vista previa
y ejecución. El expediente final contiene el plan realmente ejecutado y su snapshot.
P5/P6 pueden mostrar el plan antes de investigar usando los tipos generados de P1;
no necesitan analizar textos de eventos ni copiar contratos.

## Catálogo de preguntas

| Intención | Frases de ejemplo | Efecto comprobable |
|---|---|---|
| `compare_varying_flow` | «Compara ensayos variando el flujo.» / «Compare trials while varying flow velocity.» | Añade flujo a `vary`, lo usa como X y mantiene los demás filtros. |
| `scenario_change` | «Cambia el escenario a gravedad lunar.» / «Change the scenario to lunar gravity.» | Añade gravedad como coincidencia obligatoria; admite también terrestre/earth y microgravedad/microgravity. |
| `assess_evidence` | «Evalúa la evidencia disponible.» / «Assess evidence.» | Ejecuta los filtros explícitos y reconoce insuficiencia cuando faltan datos. |
| `ambiguous` | «Compara ensayos.»; dos gravedades; cantidades o restricciones adicionales no interpretadas | Bloquea; solicita aclaración o uso del formulario explícito. |
| `unsupported` | «Run CFD and predict fire risk.» | Bloquea; no simula una capacidad ausente. |

El catálogo no es un intérprete general: valores numéricos, rangos, exclusiones,
negaciones, otros idiomas y condiciones adicionales deben declararse en el
formulario explícito. No se ignoran silenciosamente. Por ejemplo, «compara flujo
con oxígeno de 21%» queda bloqueado; el O₂ se especifica en `ranking.target` y
`required_match` para ejecutar ese filtro. Los textos fuente no modifican el plan.

Pedir variar flujo cuando un filtro lo exige fijo produce conflicto. Un flujo ya
declarado en `vary` no se trata como objetivo fijo. Pedir otro escenario de gravedad
cuando existe un objetivo distinto, o cuando gravedad está declarada variable,
también produce conflicto. Los pesos, estudios, permiso de sintéticos, ámbito
ensayo/segmento y límite se conservan.

## Ejecución y evidencia

Las herramientas reales son `profile_dataset`, `rank_trials`, `compare_trials`
y recuperación de evidencia enlazada. P3 realiza cálculos y filtros verificables;
el modelo no determina valores ni reordena resultados. `rank_trials` recibe la
métrica solicitada: exige una observación conocida, unidad compatible y procedencia
permitida antes del límite; en modo segmento exige asociación al propio segmento.
Una medición de otro tramo o sin asignación no acredita disponibilidad en el elegido.

La recuperación reúne fuentes del ranking y de los puntos comparados. No vuelve
a añadir indiscriminadamente todos los segmentos del ensayo. Una fuente recuperada
es contexto, no respaldo automático de cualquier cifra: la revisión numérica usa
las referencias del campo concreto. Se conservan identidad, unidades y ausencia.
Sin candidatos o pares X/Y utilizables se devuelve `insufficient_evidence`, sin
llamada externa ni hipótesis preparada. El estado no es una predicción física.

## Proveedor opcional y catálogo de afirmaciones

El adaptador Responses usa configuración del servidor, salida estructurada,
`store=false`, una petición como máximo, tamaño de contexto/salida acotado y
deadline global. Timeout, rechazo, error HTTP, forma inválida o afirmación rechazada
produce un error explícito: nunca se convierte silenciosamente en éxito demo.
El campo `provider` identifica configuración, no demuestra por sí solo una llamada.

El resumen externo siempre se sustituye por la síntesis del programa. Las
afirmaciones del proveedor solo pueden usar el catálogo cuantitativo, por ejemplo:

```text
The trial reports a flame spread rate of 0.05 mm/s.
El ensayo reporta una tasa de propagación de 0,05 mm/s.
The trial reports a flow velocity of 2 cm/s.
```

Cada afirmación representa una magnitud del eje o métrica activa y cita un único
ensayo. Su valor se comprueba contra un punto seleccionado de ese ensayo. Para Y,
las citas deben pertenecer a `Observation.evidence_ids`; para X, a la condición
efectiva del segmento/ensayo. La unión de fuentes del punto no basta: citar una
fuente de geometría no respalda la tasa. Tampoco se puede usar un valor de otro
ensayo, otra métrica o el flujo como si fuera propagación, aunque comparta dimensión.

Se admiten conversiones explícitas de unidades del catálogo, incluidas s/min,
mg/min, mg/s y K/°C. La tolerancia cubre únicamente redondeo numérico del software;
cero y conteos se comprueban exactamente. Cifras sin unidad, comparativos, inferencias
libres, causalidad, seguridad y prosa fuera de la gramática se rechazan. No se usa
coincidencia léxica como prueba de respaldo semántico. Los límites pueden copiarse
solo de `allowed_limitations`, generado por constantes y límites del plan: las
notas `source_note` del corpus no autorizan afirmaciones. Si el proveedor devuelve
cero afirmaciones, se conservan las afirmaciones deterministas del programa.

Estas guardas acreditan correspondencia con campos estructurados, no verdad física,
calidad de extracción ni interpretación científica de la fuente. El corpus real
sigue `unverified` hasta su revisión científica. La evaluación del proveedor real
requiere configuración y autorización de cuenta/presupuesto separadas.

## Informe e hipótesis

El informe conserva pregunta, plan, filtros efectivos, resultados, citas con ensayo,
procedencia, controles, recuentos de independencia, propuestas y límites. Texto
fuente, títulos, localizadores, notas y contenido histórico se muestran como datos
literales escapados o en fences más largos que cualquier secuencia del contenido.
Una fuente no puede crear una sección Markdown de conclusión ni enlaces/HTML activos.
Los originales no se borran ni se ejecutan.

La hipótesis disponible está etiquetada `prepared_demo_hypothesis`. Incluye motivo,
explicación alternativa, siguiente medición, refutación y fuentes. No es descubrimiento
autónomo, diseño inverso ni resultado nuevo de un modelo. Los paneles proceden del
catálogo tipado, sin código ejecutable libre. Los roles son responsabilidades del
mismo flujo Python; no hay agentes autónomos ni dependencia de LangGraph.

## Verificación reproducible

```powershell
.venv\Scripts\python.exe -m pytest apps/api/tests/test_provider.py apps/api/tests/test_planner.py apps/api/tests/test_ai_reports.py apps/api/tests/test_ai_evaluation.py apps/api/tests/test_ai_runner.py apps/api/tests/test_review.py -q
.venv\Scripts\python.exe evals/ai/run.py
```

El runner ejecuta 18 casos con expectativas explícitas, datos sintéticos y proveedor
simulado. Devuelve 0 si pasan, 1 ante discrepancia y 2 ante entrada inválida. Registra
hashes de casos/fixture/runner. [README de evaluación](../evals/ai/README.md) y
[relevo P4](handoffs/P4.md) detallan resultados y límites. No es un benchmark reservado
de interpretación humana ni una evaluación de modelo real.
