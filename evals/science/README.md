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

## Criterios de condiciones sucesivas pendientes de P1/P2/P3

La rama P1 `aeeb331d826169655dee10149828839b54eb4db7` añade comprobación PostgreSQL;
no implementa segmentos. El contrato efectivo 1.0 conserva condiciones por ensayo.
No introducimos tipos provisionales ni campos falsos para simular soporte.

Antes de ampliar los casos a datos reales se necesita acordar e implementar:

1. Un ensayo con varias condiciones conserva su `trial_id` y unidad experimental;
   cada observación apunta a su condición efectiva sin duplicar el ensayo.
2. El orden de reporte de condiciones no inventa tiempos ni independencia.
3. Caras, geometría y formulación participan como controles de comparabilidad;
   un control esencial ausente produce aislamiento/indeterminación explícita.
4. Oxígeno inicial/final describe extremos del ensayo y no se aplica como valor
   medido a cada condición; cualquier estimación conserva procedencia derivada.
5. Hay localizadores y originales/unidades para cada medición; el estado de una
   ausencia se acuerda con P2/P3 a partir de lo que realmente afirma la fuente.
6. Conteos de ensayos, observaciones y unidades independientes se mantienen
   separados y la evaluación impide pseudorreplicación.

P1 mantiene el contrato y sus generados; P2 aporta la serie y trazabilidad; P3
adapta las herramientas y revisa las expectativas científicas una vez integrado
el contrato. Esta lista es una solicitud de aceptación futura, no capacidad actual.
