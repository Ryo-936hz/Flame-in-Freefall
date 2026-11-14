# Evaluación inicial P3: solo regresión sintética

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
| Métrica `other` | Ensayos sintéticos 1, 2 y 3 | Sin puntos/grupos, unidad Y `unsupported`, estado insuficiente | Tener candidatos no define la semántica de una métrica desconocida. |
| Tasa no medida | Solo ensayo sintético 5 | Cero observaciones conocidas, mediana nula y estado insuficiente | Se selecciona por estudio/material/geometría conocidos; gravedad/flujo ausentes y tasa `not_measured` no se imputan. |

La suite comprueba perfil, selección/orden del ranking, cobertura y similitud,
motivos de exclusión, coordenadas/unidades, fuentes, procedencia, denominadores y
ausencia de intervalos. Ignora deliberadamente UUID, fecha e IDs internos de grupo.
Las listas de puntos/grupos se comparan en un orden normalizado; la estabilidad de
orden del servicio se prueba aparte en las pruebas científicas del módulo.

Los controles de material y gravedad son explícitos. `minimum_coverage=0.4` permite
comprobar que el ensayo 5 sigue indeterminado por faltar gravedad obligatoria aun
con cobertura 0.5. No es una recomendación de umbral científico. Los empates entre
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

P1 publicó `94989a7` con segmentos y tipos generados. Esta evaluación usa ese
contrato y la comparación adaptada por P3; no duplica tipos ni datos reales.
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

Los ensayos se seleccionan mediante el material y el O₂ inicial explícito del
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

Ranking y cobertura continúan evaluando condiciones de ensayo, y el perfil cuenta
su ausencia por ensayo. No se selecciona el mejor segmento ni se incrementa el
número de candidatos o unidades. La comparación sí usa las condiciones explícitas
de cada segmento asociado. Los avisos de ámbito impiden presentar el ranking como
filtrado por condiciones de todas sus observaciones. Extender ese contrato exige
coordinación P1/P4, no introducir campos provisionales desde una evaluación.

La serie real de P2, sus originales/unidades, licencia, asignaciones no resueltas y
comparabilidad científica siguen requiriendo revisión conjunta P2/P3. Pasar estas
regresiones de software no valida mediciones NASA ni transferencia BASS-II/Saffire.
