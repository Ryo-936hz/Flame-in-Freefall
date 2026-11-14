# Evaluaciones P3: regresión sintética e integración del corpus

Los seis casos usan `data/fixtures/demo.json` sin modificarlo. Sus expectativas
se escribieron a partir de los valores/identidades explícitos del fixture, antes
de ejecutar el evaluador. No se regeneran automáticamente desde su salida.
No constituyen validación de NASA, benchmark científico independiente ni prueba
de predicción física. Tampoco son una evaluación de lenguaje natural: mandan los
filtros estructurados y el proveedor está fijado explícitamente a `demo`.

## Ejecutar desde la raíz del clon

```powershell
.venv\Scripts\python.exe evals/science/run.py
.venv\Scripts\python.exe -m pytest apps/api/tests/test_science_evaluation.py -q
```

El runner imprime JSON: código 0 cuando todas las expectativas coinciden, 1 si
hay discrepancia y 2 ante una entrada inválida. No escribe en SQLite, modifica
fixtures ni requiere credenciales. Los parámetros `--cases` y `--fixture` permiten
señalar rutas explícitas; esta suite rechaza un corpus con procedencia no sintética.
Se invocan los módulos reales de perfil y coordinación, y esta última llama al
ranking/comparación del proyecto; no hay implementación paralela de los cálculos.

## Casos y expectativas independientes

| Caso | Selección esperada | Comparación esperada | Motivo |
|---|---|---|---|
| Microgravedad | Ensayos sintéticos 1, 2 y 3 | Cuatro observaciones, tres unidades independientes; mediana descriptiva 0.0775 mm/s | Las dos observaciones del ensayo 1 no son réplicas nuevas. |
| Cambio a gravedad terrestre | Solo ensayo sintético 4 | Una observación de valor cero; una unidad independiente | Cero conocido se conserva. Cambia la selección, no se simula un cambio físico. |
| Gravedad lunar | Ninguno | Estado `insufficient_evidence`, sin comparación | No hay ensayo lunar; gravedad desconocida no equivale a coincidencia. |
| Sintéticos deshabilitados | Ninguno | Estado `insufficient_evidence`, sin comparación ni fuentes recuperadas | Todos los ensayos del fixture son sintéticos; el permiso explícito se respeta. |
| Métrica `other` | Ninguno | Sin comparación, estado insuficiente | La métrica carece de unidad semántica; no acredita disponibilidad antes del ranking. |
| Tasa no medida | Ninguno | Sin comparación, estado insuficiente | El ensayo 5 cumple condiciones, pero su tasa `not_measured` lo excluye antes de top-k. |

La suite comprueba perfil, selección/orden del ranking, cobertura y similitud,
motivos de exclusión, coordenadas/unidades, fuentes, procedencia, denominadores y
ausencia de intervalos. Ignora deliberadamente UUID, fecha e IDs internos de grupo.
Las listas de puntos/grupos se comparan en un orden normalizado; la estabilidad de
orden del servicio se prueba aparte en las pruebas científicas del módulo.

Los controles de material y gravedad son explícitos. `minimum_coverage=0.4` permite
comprobar la cobertura 0.5 del ensayo 5 y el motivo de gravedad obligatoria ausente.
La investigación lo excluye además por no tener la métrica conocida; el ranking
directo sin métrica conserva el estado indeterminado por esa condición. No es una recomendación de umbral científico. Los empates entre
los tres ensayos de microgravedad se resuelven por ID. La igualdad numérica permite
solo tolerancia de redondeo software (`1e-12` relativa/absoluta), no incertidumbre
experimental ni una cifra de precisión de medidas reales.

Las pruebas alteran intencionalmente el número esperado de unidades independientes:
el runner debe fallar. También rechazan una suite vacía. Un resultado verde acredita
estas expectativas concretas y no sustituye una reserva de consultas revisadas por
personas independientes para evaluar futura ciencia real. También se comprueba
que un corpus de metadatos no sintético sea rechazado por esta suite.

## Huellas de entrada

El informe incluye `inputs.suite_sha256` y `inputs.fixture_sha256`: hashes SHA256
de los bytes exactos de los archivos evaluados. La suite se parsea desde los mismos
bytes que se firman; el fixture se valida con el cargador existente y se comprueba
su hash antes/después de cargarlo para detectar un cambio concurrente. Estas
huellas no acreditan validez científica, licencia ni integridad de una fuente NASA.

Las huellas cambian incluso al alterar espacios o finales de línea conservando
el mismo JSON. Por eso se deben registrar junto con el commit, el resultado y el
comando ejecutado. Las pruebas comprueban que esos cambios de bytes alteran las
huellas manteniendo las mismas respuestas semánticas. No se escriben datos ni
informes automáticamente: redirigir la salida a `work/` si se quiere conservarla.

## Condiciones sucesivas: evaluación del contrato 1.1

P1 publicó `94989a7` con segmentos y tipos generados; la integración P2 en
`main` (`04baeee`) añade selección explícita por segmento. Esta evaluación usa
el contrato existente y la comparación de P3; no duplica tipos ni datos reales.
El caso antiguo de ausencia de segmentos se conserva en los seis casos anteriores.

```powershell
.venv\Scripts\python.exe evals/science/segment_run.py
```

`segment_fixture.json` contiene tres ensayos, seis observaciones y tres unidades
independientes, todos explícitamente sintéticos. Cada segmento enumera sus
condiciones efectivas, sin heredar del ensayo. `segment_cases.json` fija expectativas
manuales; el runner usa perfil, ranking, coordinador demo y comparación del producto.
No requiere claves, no llama a proveedores externos y no escribe en SQLite.
Devuelve 0 si coinciden todas las expectativas, 1 ante discrepancia y 2 ante entrada
inválida. `--cases` y `--fixture` permiten rutas explícitas. Los hashes identifican
los bytes exactos parseados de ambas entradas; un corpus no sintético se rechaza.

| Caso | Expectativa | Qué comprueba |
|---|---|---|
| `reference` | Flujos 0, 5 y 10 cm/s; tasas 1, 2 y 3 mm/s; mediana 2; un ensayo, tres observaciones y una unidad | El cero es conocido. Tres segmentos no crean tres réplicas. |
| `changed` | Dos grupos: lámina/cara A y cilindro/cara B; tasas 4 y 8 mm/s | Los controles efectivos separan incluso observaciones del mismo ensayo. La unidad global sigue siendo una y las cuentas de los grupos no se suman. |
| `missing` | Y=7 mm/s conservada con X nula; `insufficient_evidence` | El flujo 99 cm/s del ensayo no rellena el flujo `not_measured` del segmento. No se crea un par cuantitativo válido. |
| `segment_effective_geometry_and_face` | Solo el segmento cilindro/cara B del ensayo `changed`; Y=8 mm/s | El modo segmento utiliza controles efectivos aunque el ensayo declare lámina/cara A. La comparación recibe solo su ID elegible. |
| `segment_order_and_trial_identity` | Seis segmentos, tres candidatos y tres unidades; desempate por la primera secuencia | `scored_segment_id` y `eligible_segment_ids` conservan identidad y orden; un segmento adicional no crea un ensayo ni una réplica. |
| `segment_required_flow_not_inherited` | Ningún candidato; `insufficient_evidence` | Requerir flujo 99 cm/s en segmento no hereda ese valor de los ensayos; un flujo no medido no coincide. |

Los tres casos originales seleccionan ensayos mediante el material y el O₂ inicial explícito del
ensayo (21, 22 o 23 %). Es una selección entre registros sintéticos, no una
simulación de cambios físicos. El O₂ final es 18 % y ambos extremos siguen siendo
contexto del ensayo; no se convierten en O₂ medido dentro de cada segmento.
Los segmentos declaran su propio O₂ de 20 % únicamente como dato artificial.

Se comprueban identidad y orden de los puntos, unidades, fuentes de medición y
condición, geometría/cara, extremos del ensayo, medianas y conteos separados.
Las secuencias tienen huecos (30, 50, 80) y los IDs y listas van en orden contrario:
el resultado debe seguir el orden reportado; esos números no son tiempos.
Los IDs de grupo se omiten deliberadamente de las expectativas porque son detalles
internos; los controles y los miembros de cada grupo sí se comprueban.

El ranking mantiene `condition_scope=trial` como valor predeterminado. Los tres
casos nuevos usan `condition_scope=segment`: cada ensayo obtiene la puntuación
de su mejor segmento elegible, con empate por orden reportado, y la comparación
recibe `eligible_segment_ids`. No se incrementa el número de ensayos o unidades.
El perfil distingue ausencias por ensayo y segmento. El resumen comprueba seis
segmentos, tres unidades identificadas y cero ensayos con independencia no
resuelta; los grupos también exponen ambos conteos por separado.

Las pruebas del runner alteran intencionalmente el segmento puntuado y la lista
elegible esperados: ambas discrepancias deben fallar. Las expectativas de los
seis casos se especifican desde el fixture y no se regeneran desde los resultados.
Este control del evaluador no constituye una validación científica independiente.

La serie real de P2, sus originales/unidades, licencia, asignaciones no resueltas y
comparabilidad científica siguen requiriendo revisión conjunta P2/P3. Pasar estas
regresiones de software no valida mediciones NASA ni transferencia BASS-II/Saffire.


## Revisión opt-in de la integración real P2

`corpus_run.py` ejecuta siete comprobaciones de software sobre el bundle local
`psi:nasa-local-corpus-v1` 1.1, sin importar en SQLite ni llamar a proveedores:

```powershell
.venv\Scripts\python.exe evals/science/corpus_run.py --bundle 'C:\ruta\corpus\bundle.json'
```

Comprueba los recuentos revisados, BASS (20 ensayos, 43 segmentos, 39 tasas conocidas),
selección de sus cuatro segmentos a 6 cm/s, insuficiencia de O₂ efectivo/lunar,
aislamiento de FLEX por campaña e independencia no resuelta, originales, unidades
y referencias. Las expectativas se fijan explícitamente; no se regeneran desde
el resultado. La salida incluye hashes del bundle y del evaluador, sin texto
de las fuentes ni valores brutos de observaciones.

Devuelve 0 si pasan las siete comprobaciones, 1 ante discrepancias y 2 ante entrada
inválida. Se verificó que eliminar una observación en una copia local produce 1,
y un corpus sintético o ajeno produce 2. Las fuentes originales quedaron intactas.
Los IDs no autentican el corpus: el hash identifica los bytes concretos revisados.
Los detalles de extracción y las dudas científicas están en
[P2_INTEGRATION_REVIEW.md](P2_INTEGRATION_REVIEW.md). Todas las evidencias siguen
sin revisión científica aprobada; pasar estos checks no acredita comparabilidad.

## Regresión integrada de disponibilidad antes del límite

```powershell
.venv\Scripts\python.exe evals/science/metric_availability_run.py
```

Usa únicamente datos sintéticos y el coordinador demo. Comprueba que el límite
no descarte el único ensayo que tiene la métrica en su segmento elegible. P4 ya
pasa `metric=request.metric` al ranking y conserva el plan resuelto. El caso
**devuelve 0**: tanto `limit=1` como `limit=2` conservan únicamente el ensayo con
medición en el segmento elegible, con identidad de ensayo/segmento y coordenadas
exactas comprobadas. La prueba se ejecuta también en `test_science_evaluation.py`;
desconectar el gate vuelve a producir un fallo, no un aprobado vacío.
Resultados y límites en [relevo P3](../../docs/handoffs/P3.md).


## Pares X/Y válidos y coherencia de selección

Las suites sintéticas exponen `n_quantitative_pairs`: se cuentan únicamente los
puntos cuyo X es conocido. El caso de flujo ausente conserva la observación Y
con `x=null` por compatibilidad, pero cuenta **cero pares** y devuelve insuficiencia.
La selección combinada conserva seis observaciones y solo cinco pares válidos.
Esto evita equiparar registros mostrados con puntos utilizables en un gráfico.

Las expectativas de disponibilidad de métrica se revisaron desde el fixture:
los ensayos 1–4 tienen una tasa conocida (incluido cero en el 4); el 5 no la tiene.
Sin permiso sintético ninguna medida es elegible, y `other` no define una unidad
semántica. No se regeneraron resultados esperados automáticamente desde el motor.
La prueba de disponibilidad antes del límite usa el coordinador real en modo demo.

Las reglas de procedencia, unidades y campaña se comprueban también en
`test_science.py`, `test_condition_segments.py`, `test_science_selection.py` y
`corpus_run.py`: representaciones publicadas/digitalizadas/derivadas no comparten
mediana; valores incompatibles no se mezclan; un registro de otra campaña no altera
el grupo de la métrica solicitada. Son pruebas de esas reglas, no etiquetas humanas
de relevancia ni una reserva independiente para ajustar pesos o prompts.
