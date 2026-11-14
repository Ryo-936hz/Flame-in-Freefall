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
La cobertura por debajo del mínimo produce `indeterminate`, conservado en `excluded`.
Solo los elegibles tienen similitud y aparecen en `items`; se ordenan por similitud,
cobertura y finalmente ID para desempate estable.
Cada resultado conserva la unión de referencias del ensayo, sus condiciones y sus
observaciones. Así una cita de la medición puede validarse contra el ensayo seleccionado,
aunque la fuente específica no estuviera repetida en la lista de evidencia del ensayo.

| Condición | Escala v1 | Unidad |
|---|---:|---|
| oxygen_pct | 100 | % |
| pressure_kpa | 200 | kPa |
| flow_velocity_cm_s | 100 | cm/s |
| thickness_mm | 100 | mm |
| diameter_mm | 1000 | mm |
| sample_width_mm | 1000 | mm |

Son decisiones de normalización del esqueleto aprobadas por P1, no rangos medidos,
límites físicos ni validación de relevancia científica. No dependen del corpus,
filtro ni `limit`. El recorte se indica en cada contribución. P3 debe evaluar y
versionar nuevas escalas con consultas revisadas antes de usar resultados operativos.

## Comparación

`metric=other` no tiene semántica suficiente: produce puntos/grupos vacíos y advertencia.
Cada métrica soportada tiene unidad canónica; no se mezclan unidades incompatibles.
El eje X conserva `x_condition` y `x_unit`; un eje categórico queda `null` con aviso.

Se estratifica por estudio, procedencia, grado del material y todas las condiciones
excepto `vary`. Elegir un eje no autoriza por sí solo a variar esa condición: para una
serie se incluye explícitamente X en `vary`. Incógnitas de grado o control separan
ensayos en grupos individuales; `not_applicable` explícito puede coincidir. Se evita
agregar BASS-II y Saffire o sintético y publicado en un mismo grupo.

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
este incremento no cambia esa semántica ni inventa segmentos para BASS-II.

La mediana describe las observaciones del grupo, sin ponderación inferencial. Se muestran
por separado ensayos, observaciones y unidades independientes; pasos de una muestra no
crean réplicas. Un grupo sin mediciones conocidas tiene mediana nula. `interval=null`
siempre: no hay bootstrap ni incertidumbre inferida. IDs desconocidos lanzan `KeyError`.

## Perfil

Se incluyen los cinco estados, incluido `known`, para todas las claves de condición.
Una clave omitida cuenta como `not_reported`. Las unidades independientes se cuentan
por `(study_id, independent_unit_id)`; múltiples observaciones no incrementan la cuenta.
El perfil no certifica que una extracción haya sido revisada científicamente.
