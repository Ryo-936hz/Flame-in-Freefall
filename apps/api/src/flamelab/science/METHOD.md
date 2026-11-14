# Herramientas científicas de la base 0.1

Las funciones aceptan los contratos Pydantic canónicos. No consultan proveedores, no
ejecutan instrucciones de documentos y no convierten fixtures en datos NASA.

## Ranking `compatibility_then_weighted_gower_v1`

Primero se aplican estudio, permiso de sintéticos y `required_match`. Una diferencia
obligatoria excluye; una condición obligatoria ausente produce `indeterminate`. Estas
restricciones también se comprueban con peso cero. La elegibilidad solo acredita los
filtros explícitos: no es una certificación de compatibilidad física.

Se evalúan las claves de `target`, con peso 1 salvo configuración. `vary` queda fuera
del numerador y denominador; peso cero también. No hay interpretación automática de
restricciones verbales. `target` vacío o sin pesos activos no produce similitud perfecta.

La distancia numérica es `min(1, abs(objetivo-candidato)/escala)` y la categórica es
0 para igualdad exacta, 1 para desigualdad. No se normalizan nombres libremente.
La similitud es `1 - suma(peso*distancia)/suma(pesos conocidos)`; cobertura es
`suma(pesos conocidos)/suma(pesos activos)`. Ausencia no equivale a coincidencia.
Las sumas, distancias y cocientes intermedios se calculan con `Fraction` de la
biblioteca estándar sobre los valores ya validados; solo el resultado se convierte
a float. Esto conserva la fórmula v1 y evita desbordamiento al sumar pesos finitos
grandes. Los pesos originales siguen visibles en las contribuciones. Un peso
conocido diminuto no se clasifica como ausencia aunque la cobertura final pueda
redondearse a cero por los límites de float. No se afirma precisión experimental
adicional por utilizar aritmética racional para operaciones internas.
La elegibilidad compara la cobertura interna con la representación decimal del
umbral (por ejemplo 0.1 significa 1/10). Un peso positivo ausente impide cumplir
el umbral 1.0 aunque el float de salida redondee a 1; en ese caso se añade
`coverage_rounded_to_threshold` para explicar la diferencia de presentación.
La cobertura por debajo del mínimo produce `indeterminate`, conservado en `excluded`.
Solo los elegibles tienen similitud y aparecen en `items`; se ordenan por similitud,
cobertura y finalmente ID para desempate estable.
Cada resultado conserva la unión de referencias del ensayo, sus condiciones, segmentos, condiciones de segmentos y sus
observaciones (referencias deduplicadas y ordenadas). Así una cita de la medición puede validarse contra el ensayo seleccionado,
aunque la fuente específica no estuviera repetida en la lista de evidencia del ensayo.

| Condición | Escala v1 | Unidad |
|---|---:|---|
| oxygen_pct | 100 | % |
| oxygen_initial_pct / oxygen_final_pct | 100 | % |
| pressure_kpa | 200 | kPa |
| flow_velocity_cm_s | 100 | cm/s |
| thickness_mm | 100 | mm |
| diameter_mm | 1000 | mm |
| sample_width_mm | 1000 | mm |
| burning_faces | 2 | count |
| burn_duration_s / ignition_duration_s | 600 | s |
| aging_duration_s | 3600 | s |
| ignition_power_w | 100 | W |

Son decisiones de normalización del esqueleto integradas desde `main`, no rangos medidos,
límites físicos ni validación de relevancia científica. No dependen del corpus,
filtro ni `limit`. El recorte se indica en cada contribución. P3 debe evaluar y
versionar nuevas escalas con consultas revisadas antes de usar resultados operativos.

## Comparación

`metric=other` no tiene semántica suficiente: produce puntos/grupos vacíos y advertencia.
Cada métrica soportada tiene unidad canónica; no se mezclan unidades incompatibles.
El eje X conserva `x_condition` y `x_unit`; un eje categórico queda `null` con aviso.

Se estratifica por estudio, procedencia, grado del material y todas las condiciones
excepto `vary` y `burn_duration_s` (duración total reportada, no control de entrada). Elegir un eje no autoriza por sí solo a variar esa condición: para una
serie se incluye explícitamente X en `vary`. Incógnitas de grado o control separan
ensayos en grupos individuales; `not_applicable` explícito puede coincidir. Se evita
agregar BASS-II y Saffire o sintético y publicado en un mismo grupo.

Cada control incluido en el estrato expone además `<variable>_status` dentro del
mapa `conditions` ya existente. El estado forma parte de la identidad del grupo:
un literal categórico conocido llamado `not_applicable` no es igual a un control
ausente con estado `not_applicable`. Los números equivalentes 21 y 21.0 conservan
la misma identidad. Un grado material vacío o solo espacios se considera sin
resolver, sin modificar el corpus de origen. Las advertencias detallan grado y
variables ausentes (`material_grade_unresolved`, `control_unresolved:variable:estado`).
Esta dimensión adicional cambia los IDs de nuevos grupos; no se recalculan los
snapshots anteriores ni se añade ningún campo al contrato público.

La estratificación incluye además la procedencia de **cada observación**, expuesta
en `ComparisonGroup.conditions.observation_provenance`. El contrato permite que
un ensayo publicado contenga observaciones publicadas, digitalizadas y derivadas;
estas representaciones no comparten mediana. `conditions.provenance` sigue siendo
la procedencia del ensayo. Si no existe observación de la métrica se conserva un
grupo sin valores con `observation_provenance=not_reported`; este marcador es una
condición descriptiva del grupo, no una nueva enumeración del contrato.

Cada grupo cuenta sus propios ensayos/unidades: un mismo ensayo puede aparecer en
varios estratos de procedencia, por lo que **no se suman sus cuentas para inferir
replicación global**. El perfil del corpus cuenta las unidades físicas por identidad.
Las observaciones repetidas se conservan y la mediana sigue siendo descriptiva por
observación, no un promedio ponderado por unidad independiente.

La selección se deduplica y ordena por ID; observaciones, referencias y grupos
tienen orden determinista. Cambiar el orden del bundle o la selección no modifica
la respuesta. La dimensión de procedencia añadida cambia los IDs calculados de
grupo para nuevas comparaciones; los snapshots históricos no se recalculan.

Se conserva el contrato 1.0 de `x=null` cuando falta X o es categórico: esos registros
no son pares cuantitativos válidos. La coordinación IA ya devuelve insuficiencia si
no queda ningún X conocido. Retirar esos registros de la API requerirá acuerdo P1/P5;
el soporte 1.1 conserva esa semántica. La mediana describe Y disponible,
no una relación X→Y cuando falta X; no se imputan coordenadas.

La mediana describe las observaciones del grupo, sin ponderación inferencial. Se muestran
por separado ensayos, observaciones y unidades independientes; pasos de una muestra no
crean réplicas. Un grupo sin mediciones conocidas tiene mediana nula. `interval=null`
siempre: no hay bootstrap ni incertidumbre inferida. IDs desconocidos lanzan `KeyError`.

Para una cantidad par de observaciones, el punto medio se calcula racionalmente
antes de convertirlo al tipo de salida: evita obtener infinito de dos valores
finitos grandes. Un punto medio que no se puede representar como número de salida
queda en null con `median_unrepresentable`, conservando puntos y conteos. Este
aviso es un límite numérico, no un estado de ausencia de la medición original.

## Perfil

Se incluyen los cinco estados, incluido `known`, para todas las claves de condición.
Una clave omitida cuenta como `not_reported`. Las unidades independientes se cuentan
por `(study_id, independent_unit_id)`; múltiples observaciones no incrementan la cuenta.
El perfil no certifica que una extracción haya sido revisada científicamente.

## Condiciones sucesivas: contrato 1.1 integrado desde P1

Base contractual: `94989a76438f530612107c482d539007d3a98534`. La autoridad y los
generados son los de P1; P3 no introduce modelos alternativos ni modifica sus campos.
La comparación resuelve el ámbito de condiciones **por observación**:

- Con `segment_id`, utiliza solo `ConditionSegment.conditions`, sin completar
  ausencias con condiciones del ensayo. Geometría y cara de combustión participan
  como controles, salvo que se hayan declarado explícitamente en `vary`.
- Sin `segment_id`, conserva las condiciones explícitas del ensayo, como el código
  P1. Si el ensayo tiene segmentos, avisa `segment_unassigned`, identifica el
  ámbito `trial_unassigned` y aísla esa observación; no adivina su segmento.
- Los extremos O₂ inicial/final se conservan como contexto del ensayo, con
  `<variable>_scope=trial`. Nunca sustituyen `oxygen_pct` ni sirven de X para una
  observación asignada a un segmento. El contrato integrado desde `main` ya rechaza
  extremos en segmentos y exige valores de O₂ entre 0 y 100; las solicitudes
  anteriores a P1 sobre esos dos huecos están resueltas.
- Condiciones no resueltas aíslan por ensayo y segmento. Compartir una muestra no
  demuestra que dos condiciones desconocidas sean compatibles. `not_applicable`
  explícito conserva su significado y puede coincidir con el mismo estado.
- Los controles nuevos opcionales ausentes de toda una selección legacy no cambian
  su agrupación. Cuando alguno está informado, una contraparte ausente se marca
  sin resolver. `combustion_face` se exige como control en selecciones con segmentos,
  aunque solo se haya informado dentro de ellos o falte en todos.

Los puntos se ordenan por ID de ensayo, `sequence` y ID de observación; los no
asignados quedan al final del ensayo. Se permiten huecos en `sequence`: es orden de
fuente, no tiempo, distancia, duración, condición comparable ni réplica independiente.
El ID de segmento se conserva en cada punto. Dos observaciones del mismo segmento
siguen siendo dos mediciones de la misma unidad, no dos réplicas.

Cada grupo deduplica sus ensayos y sus unidades `(study_id, independent_unit_id)`.
Un ensayo puede aparecer en varios grupos por controles o procedencia; sus cuentas
no se suman para obtener el tamaño muestral global. La mediana permanece descriptiva
por observación, con intervalo nulo. Las fuentes de cada punto incluyen medición,
ensayo, segmento, condiciones explícitas y extremos del ensayo. No se modifica el
bundle: conserva valores/unidades originales, localizadores y referencias.

**Selección:** por defecto `required_match`, Gower y cobertura usan
`Trial.conditions`. El ranking recupera las fuentes de los segmentos y emite
`trial_level_ranking`. Un filtro de ensayo no garantiza que cada segmento lo cumpla.
El modo explícito `condition_scope=segment` evalúa únicamente las condiciones
de cada segmento y devuelve una fila por ensayo con la puntuación de su mejor
segmento elegible. Los empates de puntuación y cobertura conservan el orden de
la fuente. `eligible_segment_ids` delimita los puntos en investigación y un
`ComparisonRequest.segment_ids` no vacío restringe **todas** las observaciones
a esos segmentos: también excluye observaciones sin asignación y ensayos sin
segmentos. Una lista vacía conserva la comparación sin ese filtro. Los ensayos
sin segmento quedan fuera del ranking por segmento.

El perfil muestra la ausencia a nivel de ensayo y de segmento por separado.
`n_independent_units` cuenta las unidades identificadas.
`n_trials_with_unresolved_independence` contabiliza los registros pendientes de
resolver. Las métricas específicas de una campaña solo admiten observaciones
del estudio correspondiente. El número de caras (`burning_faces`) y la identidad
de la cara de combustión (`combustion_face`) se mantienen como controles distintos.

Ver `test_condition_segments.py` y `evals/science/segment_run.py`: software sintético,
sin datos NASA, llamadas externas, estimación física ni certificación de seguridad.
La lectura de bundles 1.0 y las seis evaluaciones anteriores se conservan.


## Integración P2 revisada en P3 (main `04baeee`)

Los controles opcionales se activan únicamente desde los ámbitos representados
tras aplicar campaña y selección de segmentos. Añadir una condición a un segmento
no seleccionado, a un ensayo descartado por campaña o a condiciones de ensayo que
no se heredan no cambia los grupos ni sus medianas. Los extremos de ensayo siguen
aportando su contexto explícito. Las pruebas metamórficas están en
`test_science_selection.py`.

El ranking sin métrica sigue ordenando condiciones, sin prometer disponibilidad
de resultados. Su argumento Python opcional `metric` comprueba observaciones
conocidas, unidad canónica, campaña y procedencia permitida **antes** de puntuar y
aplicar `limit`. En modo segmento, exige una observación de esa métrica vinculada
al propio segmento: una medida de otro segmento o sin asignación no basta.
Una fila por ensayo conserva su mejor segmento elegible; no crea réplicas.
El argumento anterior `metric_trial_ids` se conserva por compatibilidad, pero no
puede acreditar disponibilidad por segmento y emite un aviso en ese modo.

**Conexión pendiente P1/P4:** `ai/engine.py` aún pasa solo `metric_trial_ids` para
algunas métricas. Debe pasar `metric=request.metric` para todas las investigaciones
y probar la selección antes del top-k. `evals/science/metric_availability_run.py`
reproduce la carencia con datos sintéticos y devuelve 1 hasta que se conecte.
Esto no afecta la ausencia explícita de resultados en el catálogo ni autoriza
inferir tasas para configuraciones de Flame Design.

La auditoría real y sus límites están en `evals/science/P2_INTEGRATION_REVIEW.md`.
No se han cambiado importadores ni marcado evidencia NASA como revisada. Duraciones
censuradas, anchuras nominales/efectivas y estimaciones de O₂ requieren revisión
P2 y, si necesitan campos nuevos, acuerdo contractual P1.
