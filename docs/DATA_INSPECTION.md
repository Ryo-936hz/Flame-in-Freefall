# Inspección local del corpus NASA

This document records the historical inspection. The subsequent P2 increment
implements local Table 5.1 extraction, successive conditions and canonical import;
see [P2_DELIVERY](P2_DELIVERY.md), [source audit](P2_SOURCE_AUDIT.md) and current
[verification](VERIFICATION.md). The scientific review status remains unverified.

Fecha: 14 de noviembre de 2026. Inspección previa a la implementación. Fuente: archivos locales indicados por el usuario. No se ejecutó contenido del archivo ni se modificó `NASA/Documents`. La presencia de un dato en el ZIP no valida automáticamente su interpretación científica ni su licencia de redistribución.

## Archivo e integridad

- `Documents/datasets_lujan.zip`: 130.464.918 bytes; SHA-256 `5fcfa48e95a7c9ff84462c9fb498e144fc401bb22c0b09e18ff36d582e61c644`.
- 228 miembros: 123 archivos y 105 directorios; suma de tamaños descomprimidos 143.527.168 bytes.
- 24 investigaciones/carpetas PSI; 22 CSV; 27 PDF; 48 TXT ISA; 24 ZIP de metadatos; 2 DOC binarios. No hay archivos de vídeo, imágenes independientes, XLSX ni registros de sensores adicionales en este ZIP. Existen referencias a cámaras, vídeos y fotografías en tablas/documentos; esos medios no están incluidos.
- Los 24 ZIP internos contienen dos TXT cada uno: los 48 contenidos son idénticos por SHA-256 a TXT ya presentes fuera de los ZIP internos. No contarlos como 48 fuentes independientes nuevas.
- Se comprobaron rutas relativas, ausencia de `..`, rutas Windows/absolutas, enlaces y límites de expansión antes de leer. No se detectaron rutas inseguras ni enlaces. Ningún miembro superó 100 MB ni factor de expansión 100:1. La lectura segura no equivale a un análisis antivirus.
- Se leyó cada miembro para calcular su hash y validar CRC mediante `zipfile`; los ZIP internos se inspeccionaron en memoria. Solo se copió el PDF BASS-II a `work/data-inspection` para lectura/renderizado. No se ejecutaron DOC, scripts, macros o adjuntos.
- Archivo adicional fuera del ZIP: `Investigacion_Flame_in_Freefall_Los_TTS.docx`, 47.634 bytes, SHA-256 `7be4d1276691f1c562df5337a339d2f733590cae840629628fecfd4ae52d1377`. Es el documento del proyecto, no una tabla de resultados científicos. No se analizó su contenido en esta inspección de datos.

El inventario mecanizable `data/catalog/zip_inventory.json` contiene nombres, tamaños, hashes individuales, cabeceras CSV, filas, investigaciones y duplicados de metadatos. No incluye el texto completo de los documentos ni contactos personales del ISA. `data/catalog/psi_metadata.json` implementa el catálogo con 24 estudios `metadata_only`, 24 evidencias documentales no revisadas y cero ensayos/observaciones. Contiene títulos, acrónimos, DOI y localizadores; la licencia de los originales sigue pendiente.

## Qué contienen las tablas

Los 22 CSV tienen 2.870 registros tras cabecera, de los cuales 2.009 son no vacíos. **No son 2.009 ensayos independientes**: hay resúmenes diarios, notas, rangos, repeticiones, condiciones sucesivas y referencias bibliográficas.

| Investigación | CSV / registros no vacíos tras cabecera | Variables principales y límites |
|---|---:|---|
| PSI-10, ACME Flame Design | Inverse 120; Normal 207 | Tipo/día/test, combustible, fracciones molares, flujos mg/s, presión atm inicial/final/media, temperatura adiabática K, Zst. Hay valores `RAMPED`. |
| PSI-20, ACME BRE | 18 | Día, tamaño de quemador mm, botella, conjunto de concentraciones O2, número de llamas. Resumen diario; no una fila por llama. |
| PSI-21, ACME CLD | 32 | Día, MFC, botella, rango de concentración, llamas encendidas. Los MFC son máximos del controlador (slpm en base nitrógeno), no velocidades cm/s. |
| PSI-22, ACME E-FIELD | 32 | Día, polaridad, botella, concentración, número de llamas, notas. Ocho repeticiones idénticas excedentes. |
| PSI-23, ACME s-Flame | 18 | Día, atmósfera, botella y número de llamas; contiene textos/rangos. |
| PSI-25, BASS-II | 129 | PI, Test #, fecha, Sample #, material, restricciones/lecturas de flujo, radiometría, fotogramas, O2/CO2 inicial/final vol%, CO ppm. Sin columna de tasa de propagación. |
| PSI-26, BASS | 122 | Fecha, as-run/test/sample y descripción del material. Sin magnitud objetivo de propagación. |
| PSI-39, CFI | 87 | Test/fecha/CIR, presión textual atm, fracciones O2/N2/He, fibra y combustible. Ocho filas idénticas excedentes; no eliminarlas automáticamente sin revisar identidad. |
| PSI-47, DAFT | 2 | Sesión, hardware, material y localización de muestreo; descriptivo. |
| PSI-68, FLEX-2 | 8 | Combustible y conjuntos/rangos de diámetro mm, fracción O2, presión atm, temperatura C y flujo cm/s. Matriz de condiciones, no ensayos individuales. |
| PSI-69, FLEX | 274 | Test/identificador, combustible, presión mmHg, fracciones, diámetro inicial/extinción mm, tiempo s y final del ensayo. La cabecera `Burning rate; mm` exige verificar semántica/unidad; no convertir a flame_spread_rate. |
| PSI-98, Saffire I | 4 | Dos muestras SIBAL y dos referencias de visualización previa; dimensiones cm, flujo cm/s, O2 aproximado/rango, ignición W/s, burn time s, dirección y cámaras. |
| PSI-99, Saffire II | 15 | Nueve filas nominales de muestra, dos referencias de visualización y cuatro notas; mezcla resultados microgravedad/1g, valores y textos, dimensiones, flujo, ignición, cámaras. |
| PSI-100, Saffire III | 2 | SIBAL, dimensiones cm, flujo 30 cm/s, dirección, cámaras. Sin tasa de propagación. |
| PSI-101, SAME-R | 109 | Test y sufijos, material, velocidad cm/s, Rt/R0, duración/tiempos de envejecimiento s. Requiere reconstruir relaciones entre muestras. |
| PSI-102, SAME | 8 | Muestra, material, flujo cm/s, pérdida de peso mg/min, envejecimiento min. |
| PSI-106, SLICE | 12 | Fecha y combustible; algunas filas incluyen calibraciones. |
| PSI-107, SPICE | 469 | GMT inicio/fin, combustible, boquilla mm, caudal sccm/mg/s y aire cm/s. 34 repeticiones idénticas excedentes; varias filas comparten evento de ignición. |
| PSI-142 | 8 | Índice de figuras y DOI, no valores experimentales. |
| PSI-159, ACME CFI-G | Inverse 154 (861 vacíos); Normal 179 | Test, combustible, fracciones, presión bar, flujos mg/s, TFP, Tad K, ignición, tiempo s, temperatura pico C/K, terminación y comentarios. |

PSI-60, PSI-62, PSI-115 y PSI-117 no tienen CSV experimental en el ZIP. El inventario enumera sus metadatos y PDFs cuando existen. El título del estudio se encuentra en `Study Title` de ISA; `Investigation Title` está vacío en estos archivos. DOI se obtiene de `Comment[DOI]`. No inferir título a partir del nombre truncado del directorio.

## BASS-II: serie candidata identificada, no importada todavía

Se extrajo texto del PDF **Burning and Suppression of Solids–II (BASS–II) Summary Report**, NASA/TM-20210011385, octubre de 2021, 144 páginas. Se revisó visualmente la **tabla 5.1, página PDF 65 (página impresa 57)**. Contexto leído en páginas PDF 63–68 y apéndice A.4 en PDF 116–117.

La tabla 5.1 resume 20 ensayos Miller M1–M20 de PMMA cast clear, con espesor 1–5 mm, ancho 1,2/2,2 cm, una/dos caras de combustión, flujo opuesto y microgravedad. Las columnas son test, espesor mm, ancho cm, caras, velocidad cm/s, tasa mm/s, tiempo min, O2 inicial y final vol%. M6 y M12 muestran `Not tracked` para propagación. Las otras filas contienen una o varias parejas velocidad–tasa; por ejemplo M8 contiene tres condiciones sucesivas (10, 6 y 5 cm/s), **no tres réplicas**. El texto de la página PDF 68 explica que el oxígeno solo se midió al inicio/final y que su perfil temporal se estimó asumiendo linealidad. No asignar automáticamente O2 inicial o final a cada condición, ni presentar la interpolación como medición.

El CSV posee los mismos IDs Miller y Sample #, útil para relacionar el ensayo con su muestra, pero sus descripciones usan a menudo anchos nominales 1/2 cm mientras la tabla cuantitativa usa 1,2/2,2 cm. El CSV contiene además lecturas múltiples de Fan/Air display; el PDF describe calibración y cambios durante ensayos. La tabla 5.1 debe prevalecer como fuente específica de las velocidades/tasas de ese análisis, preservando la discrepancia con el registro operativo. No se ha creado una observación científica a partir de esta inspección.

La página PDF 13 explica que Fan display corresponde a tensión del ventilador y Air display a lectura del transductor, con calibración diaria; no son columnas intercambiables. La tabla 5.1 y la matriz de apéndice no contienen exactamente la misma selección de mesetas de flujo. El inventario de fotogramas del CSV no implica que las imágenes estén dentro del ZIP.

## Saffire: contraste de configuración, pendiente revisión

Saffire I/III tienen configuraciones grandes SIBAL y registros de dirección concurrente/opuesta. Saffire II mezcla nueve muestras, notas y datos 1g y microgravedad. La columna literal `?-g Spread Length` contiene valores con unidad mm/s: exige resolver la etiqueta/codificación contra una publicación o fuente original antes de normalizar. La columna 1g contiene tanto cifras como `Acceleratory`, que no es un número. `037 mm` no debe corregirse silenciosamente a 0,37 mm. Las celdas de material vacías de algunas muestras tampoco deben rellenarse por arrastre sin evidencia. `Note 4` describe regresión muy lenta de llama anclada, no necesariamente la misma magnitud que propagación.

**Decisión de integración acordada con P1:** registrar el corpus real como metadatos/evidencia documental y mantenerlo separado de fixtures sintéticos. No publicar todavía una comparación cuantitativa BASS-II/Saffire ni introducir datos sintéticos bajo sus identificadores. La tabla 5.1 ofrece una siguiente serie real viable, pero requiere transcripción revisada, modelo de condiciones sucesivas y revisión de comparabilidad. El contraste de escala/configuración puede describirse cualitativamente con citas pertinentes; no agrupar sus puntos automáticamente.

## Consecuencias para contratos e ingesta

1. La base inicial puede mantener los contratos propuestos si el corpus real permanece `metadata_only` sin ensayos ni observaciones inventados.
2. Antes de importar tabla 5.1, añadir una representación de condición sucesiva relacionada con un ensayo físico (o condiciones por observación con secuencia estable), y conservar `independent_unit_id` del ensayo/muestra. No duplicar Trial por cada meseta fingiendo independencia.
3. Añadir/representar explícitamente número de caras de combustión y geometría/configuración cuando se normalice BASS-II: alteran comparabilidad. No esconderlas en un material genérico.
4. Preservar O2 inicial/final como valores distintos, con el ámbito temporal correcto. El rango completo no es una única medición exacta. Un scalar `oxygen_pct` no representa fielmente una serie temporal o un intervalo.
5. Conservar texto/unidad originales y localizadores (ZIP hash, miembro, fila CSV o página PDF/tabla), incluyendo celdas `Not tracked`, `n/a`, `none`, `RAMPED` y aproximaciones. Los signos negativos de sensores no se eliminan por plausibilidad.
6. No usar `Metric.other` para mezclar velocidad de propagación, regresión, burning-rate de gotas, pérdida de masa o potencia. Necesitan identificador semántico y unidades revisados antes de compararse.
7. Registros repetidos y rangos de condiciones no son réplicas. Identidad experimental requiere reconstrucción por test/sample y contexto.
8. Metadatos: mapear Study a `PSI-*`, título ISA, acrónimo/familia, DOI existente y `metadata_only`; Evidence documental con fuente/localizador del ISA, `reviewed=false` mientras no se revise su soporte. No crear Trial u Observation por un título de estudio.
9. Licencias individuales y condiciones de redistribución permanecen pendientes. No subir ZIP, PDF completos ni DOC al repositorio.

## Reproducibilidad de esta inspección

Los scripts de trabajo `inventory_archive.py`, `summarize.py` y `read_pdf.py` usaron Python 3.12 del runtime local, `zipfile`, `hashlib`, `csv`, `pypdf` y Poppler `pdftoppm`. El inventario no depende de IA ni de credenciales. Se calculó de nuevo el SHA-256 del ZIP al terminar y coincide con el inicial. El informe registra inspección de archivo, no revisión científica completa de los 27 PDF.


## Implementación y verificaciones de ingesta

Tras esta inspección se implementaron `flamelab.data.loader`, `flamelab.data.inventory` y `flamelab.data.cli`. El contrato canónico valida IDs, referencias, unidades, procedencia y ausencia; el loader añade límite de 20 MiB y rechazo de claves JSON repetidas. La importación valida antes de abrir o migrar la base, es idempotente y exige `--replace` para cambiar un corpus existente. La CLI de inventario no extrae miembros y valida también archivos anidados, alias de rutas Windows, cifrado, enlaces, tamaño, ratio de expansión y recuentos.

Pruebas ejecutadas en Windows con Python 3.12.14 y SQLite local:

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_data.py -q
# 20 passed
.\.venv\Scripts\python.exe -m ruff check apps/api/src/flamelab/data apps/api/tests/test_data.py
# All checks passed!
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
# 24 estudios, 0 ensayos, 0 observaciones
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/fixtures/demo.json
# 2 estudios sintéticos, 5 ensayos, 6 observaciones
.\.venv\Scripts\python.exe -m flamelab.data.cli inventory ..\Documents\datasets_lujan.zip --output work/zip_inventory_cli.json
# 123 archivos, 105 directorios; SHA-256 coincide; ninguna extracción
```

El test de importación real sobre SQLite temporal comprueba importación repetida sin duplicados, bloqueo del reemplazo implícito, reemplazo explícito y conservación de snapshots. Las pruebas de archivos adversariales comprueban rutas inseguras, enlaces, alias, bombas de expansión, presupuestos, profundidad y ZIP anidados; los casos de contrato comprueban cero conocido, ausencia, referencias, IDs y booleanos inválidos. Estas pruebas verifican software; no validan resultados científicos NASA. La CLI de inventario cuenta 276 miembros y 143.823.545 bytes al incluir de nuevo los contenidos anidados para su presupuesto de recursos.

Verificación adicional de persistencia (misma sesión de implementación):

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_data.py apps/api/tests/test_storage.py -q
# 23 passed
.\.venv\Scripts\python.exe -m ruff check apps/api/src/flamelab/data apps/api/tests/test_data.py apps/api/tests/test_storage.py
# All checks passed!
```

`test_storage.py` añade reconstrucción de conexiones y reaplicación de migraciones SQLite, recuperación exacta de una investigación y su snapshot tras sustituir el corpus activo, rechazo de modelos alterados sin validar y conservación del corpus activo tras una importación CLI inválida. No se ha probado PostgreSQL en esta revisión. Una auditoría adicional cotejó los 24 títulos y DOI del catálogo directamente con los ISA dentro del ZIP original; ninguna URL del catálogo se inventó. Esa auditoría acredita la transcripción del enlace, no su disponibilidad en red ni el respaldo semántico de resultados.
