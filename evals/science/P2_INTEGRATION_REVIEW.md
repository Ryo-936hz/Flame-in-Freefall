# P3: auditoría local de la integración P2

Fecha: 2026-11-14. Código exacto revisado: `04baeeee1f0bf3f75d957f7ed845c890efc2a3ec` (`origin/main` en el momento del snapshot). No se modificaron repositorio, contratos ni importadores. Los resultados son comprobaciones de extracción y representación; no constituyen validación científica de NASA ni aprobación de comparabilidad experimental.

## Fuentes y reproducibilidad

- ZIP original: `C:\Users\user\Desktop\NASA\Documents\datasets_lujan.zip`.
- SHA-256 del ZIP: `5fcfa48e95a7c9ff84462c9fb498e144fc401bb22c0b09e18ff36d582e61c644`.
- Se verificaron rutas, tipos, límites de tamaño, tamaño real y SHA-256 de cada miembro contra el inventario del commit. Se extrajeron una sola vez 123 archivos, 143527168 bytes, únicamente al directorio temporal de revisión. El ZIP original no se alteró.
- Extracción en un directorio temporal separado, sin modificar los importadores ni el venv del proyecto. No publicar fuentes, bundles ni evidencias textuales completas en Git.
- Runtime: Windows 11 10.0.26200, Python 3.12.14, PyMuPDF 2.1 instalado en un directorio aislado, Pydantic 2.14.3, FastAPI 0.162.7, SQLAlchemy 2.1.8. No se cambiaron lockfiles.
- Los importadores originales fueron `python -m flamelab.data.cli extract-bass-table51 <datasets> --output-dir <nuevo-directorio-bass>` y `python -m flamelab.data.cli extract-nasa <datasets> --output-dir <nuevo-directorio-corpus>`. Usar los comandos de instalación/extracción de [P2_NASA_24](../../docs/P2_NASA_24.md) y los comandos de comprobación de [README](README.md). No reutilizar salidas sin revisar su contenido.

| Archivo local | SHA-256 | Bytes |
| --- | --- | ---: |
| `bass/bundle.json` | `a2779a6e3a2b335298408c2dc5184e4bef916ad29cf7821737e148c5e5920007` | 357302 |
| `bass/quality.json` | `3d6ae4a150ecd0be82715597879512a932f08a6a24ae90d8e87baf08a5e020a3` | 30346 |
| `corpus/bundle.json` | `7dc69717b4bc6151025df2993d9cf66622db3a8b7242798a1d7bfe8b8e335781` | 5471154 |
| `corpus/quality.json` | `8b44ddd333912f4b4849b82c5d2df29ec1b1d38de6bf8d5191ef9e8afbd57ee9` | 2286091 |

## Recuentos reales

Ambos bundles pasan la validación ejecutable 1.1. BASS-II contiene los 24 estudios del catálogo, pero solo 20 ensayos BASS con resultados. El corpus completo contiene 24 estudios, 2265 evidencias, 1058 registros de ensayo/configuración y 1673 observaciones. Estados: 1283 `known`, 4 `not_measured`, 160 `not_reported`, 84 `not_applicable` y 142 `not_extracted`. Coinciden con los totales documentados por P2.

| Campaña | Registros | Observaciones conocidas | Unidad independiente |
| --- | ---: | ---: | --- |
| BASS-II / PSI-25 | 20 | 39 tasas de propagación | 20 muestras fuente identificadas |
| Flame Design / PSI-10 | 327 | 0 | Sin resolver; configuraciones, no resultados medidos |
| FLEX / PSI-69 | 265 | 413: 258 duraciones y 155 diámetros de extinción | Sin resolver |
| Saffire-I / PSI-98 | 2 | 2 duraciones reportadas | Sin resolver |
| SAME-R / PSI-101 | 107 | 300: 66 duraciones, 65 tiempos de envejecimiento primario, 65 de mezcla y 104 netos | Sin resolver |
| SAME / PSI-102 | 4 | 4 tasas de pérdida de masa reportadas | Sin resolver |
| CFI-G / PSI-159 | 333 | 525: 263 duraciones y 262 temperaturas | Sin resolver |
| Otros 17 estudios | 0 | 0 | Contexto documental/metadatos |

Hay seis campañas con valores de respuesta importados y una séptima con configuraciones numéricas; no hay 24 datasets numéricamente comparables. Los 1038 registros ajenos a BASS tienen `independent_unit_status=unresolved`. El número de registros, observaciones o IDs provisionales no debe convertirse en número de réplicas independientes. Las 2265 evidencias están `reviewed=false`; los siete estudios con registros siguen `unverified`.

## BASS-II: contraste con la fuente

Fuente principal: `datasets/PSI-25/Reports/PSI-25_Reports_BASS-II Summary Report.pdf`, SHA-256 `5ffa911fd9b6356f204646003fb9342e341810dcdfdf5cb15756e7f01ec5f770`. Se revisó visualmente la página PDF 65, impresa 57, y se leyó el texto de las páginas PDF 63–68 (impresas 55–60).

1. La Tabla 5.1 (PDF 65 / impresa 57) tiene M1–M20, 43 velocidades listadas y 39 tasas numéricas. M6 y M12 indican `Not tracked` para cada ensayo, lo que produce cuatro valores faltantes, no ceros. Las unidades son espesor mm, anchura cm, velocidad cm/s, propagación mm/s, tiempo de combustión min y O₂ vol%. La conversión importada de anchura a mm y duración a s es consistente con la tabla.
2. La misma página contiene la Figura 5.2: para M8, a 10, 6 y 5 cm/s, las pendientes mostradas son 0.0637, 0.0557 y 0.0391 mm/s; la Tabla 5.1 publica 0.057, 0.056 y 0.040 mm/s. Es una discrepancia real de fuentes internas, ya conservada como advertencia por P2. No resolverla eligiendo silenciosamente otra cifra ni tratar la primera diferencia como simple redondeo.
3. El orden de las listas permite emparejar velocidad/tasa por posición. La tabla no proporciona inicio/fin temporal de cada tramo. La Figura 5.2 ilustra tres periodos de flujo en M8, pero no convierte los 43 índices `sequence` en marcas de tiempo. La extracción conserva 20 ensayos, 20 muestras distintas y 43 segmentos/observaciones; las secuencias son contiguas dentro de cada ensayo.
4. §5.1 (PDF 63 / impresa 55) y §5.3 (PDF 64 / impresa 56) respaldan PMMA clear cast, muestras planas, microgravedad ISS, flujo opuesto y quemas de una o dos caras. La Tabla 5.1 informa el número de caras, no la identidad/orientación física de una cara. La extracción mantiene `burning_faces` 1/2 y `combustion_face=not_reported`; no los confunde.
5. §5.4 (PDF 68 / impresa 60) explica que O₂ solo se midió al inicio y al final; el perfil intermedio del informe es una estimación lineal. Por ello, las 43 condiciones `oxygen_pct` de segmento permanecen `not_measured`. O₂ inicial/final y duración total están solo en el ensayo. No hay fundamento para trasladarlos como mediciones de cada segmento.
6. El CSV operativo `PSI-25/Experimental table/PSI-25_Experimental table_BASS-II.csv` (SHA-256 `71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042`) aporta las identidades de muestra. Los 20 `Sample #` seleccionados son distintos; los 20 pares de O₂ inicial/final coinciden con la tabla. Las referencias a líneas CSV y filas de tabla quedan en `bass/quality.json`.
7. La anchura de la Tabla 5.1 es 1.2 o 2.2 cm. El CSV contiene anchuras nominales explícitas diferentes en 16 ensayos y texto no interpretable por la regla `cm wide` en otros cuatro. §5.3 menciona nominalmente 1/2 cm, mientras el párrafo de PDF 66 / impresa 58 vuelve a 1.2/2.2 cm. Mantener la prioridad documentada de la tabla cuantitativa hasta aclarar anchura nominal frente a anchura efectiva.
8. Los 20 textos `Air display` difieren de la celda de velocidades de la tabla, incluyendo diferencias de formato y listas operativas adicionales. Eso no prueba por sí solo un error de calibración. La fuente operativa completa permanece documental, separada de la serie de propagación seleccionada.

Las comprobaciones anteriores se ejecutaron sobre el bundle real mediante aserciones locales de revisión. Pasan; no se encontraron nuevos errores de emparejamiento, conversiones o identidad en la serie BASS importada. La comparación causal o la clasificación como científicamente revisada siguen pendientes.

## Solicitudes concretas para P2

- Resolver con fuente/método la discrepancia M8 Tabla 5.1 vs. Figura 5.2 (PDF 65 / impresa 57) y registrar qué estimador corresponde usar. Mantener mientras tanto valores de tabla y aviso.
- Confirmar la definición de anchura nominal/efectiva del montaje (Tabla 5.1; PDF 64 y 66; CSV operativo). Mantener geometría, espesor, anchura y número de caras como controles separados.
- Si se incorporan tiempos de tramo u O₂ intermedio, aportar intervalos temporales con referencia y distinguir una estimación del informe de una medición. No inferirlos desde `sequence` ni del promedio de los extremos.
- Para FLEX, resolver encabezados truncados de especies y definición de `Burning rate; mm`, conservar causa de fin (`Test end`) y distinguir extinción de parada de prueba. Fuente: `PSI-69_Experimental table_FLEX.csv`; límites actuales en `quality.table_mappings`.
- Para SAME-R, resolver la identidad compartida de registros con sufijo y el identificador duplicado antes de asignar unidades; para SAME, determinar si `Weight loss rate (mg/min)` es medida o impuesta. Fuentes: tablas PSI-101 y PSI-102, columnas identificadas en el quality.
- Para CFI-G, revisar motivos de finalización, comentarios y censura de las duraciones positivas; no equiparar intento, configuración y réplica. Fuentes: tablas PSI-159 Normal/Inverse Flames.
- Para Saffire-I, resolver dimensiones y ejes frente al informe, rango/aproximación de O₂ y unidad experimental. Fuente: `PSI-98_Experimental table_SAFFIRE-1.csv`; condiciones no extraídas conservadas con originales.
- Aportar un registro de revisión trazable antes de cambiar `reviewed=false`/`unverified`. La revisión de importación no basta para marcar el corpus como validado.

## Necesidades de coordinación con P1

- El contrato actual permite continuar la comparación descriptiva sin inventar datos: mantener `independent_unit_status=unresolved` en los 1038 registros y separar recuentos de registros, observaciones y unidades identificadas en API/cliente.
- Acordar extensión de contrato solo cuando se decida incorporar intervalos/rangos, censura, incertidumbre y distinción medición/estimación. El `sequence` actual conserva orden reportado, no tiempo, y no debe reutilizarse como tal.
- Cualquier ajuste compartido de condiciones/observaciones debe pasar por P1, con OpenAPI y TypeScript generados. Esta auditoría no cambia contratos ni exige desbloquear un importador nuevo para seguir con los cálculos ya autorizados de P3.

La verificación de API, ciencia y evaluaciones se registra por separado en el [relevo P3](../../docs/handoffs/P3.md). Esta auditoría conserva las limitaciones de fuente aunque esas pruebas pasen.
