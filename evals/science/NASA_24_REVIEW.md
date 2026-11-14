# Incorporación de las24 investigaciones NASA — revisión P3

Fecha: 14-11-2026. Base revisada: raul `1f271ec`. Esta es una matriz de incorporación y preguntas candidatas, no una validación experimental ni una autorización para mezclar campañas.

## Alcance y evidencia

Se recalculó el SHA256 del ZIP y se leyeron sus miembros sin extraer ni ejecutar contenido. Se cotejaron las24 entradas ISA con el catálogo y se parsearon las22 tablas CSV completas, comprobando hashes frente al inventario. Los localizadores S-* identifican archivos y cabeceras/registros. Los registros son ordinales CSV lógicos, con cabecera=1, no necesariamente líneas físicas. Los27 PDF y2 DOC se verificaron como archivos presentes por hash; salvo la revisión previa de BASS-II tabla 5.1, no se afirma haber revisado íntegramente su contenido. Las conclusiones numéricas de esta matriz se limitan a CSV inspeccionados y esa tabla; extraer resultados adicionales de informes queda explícitamente pendiente.

**BASS-II:** P2 comunica una primera serie importada. No se ha confirmado en un bundle/commit accesible: el catálogo de raul sigue metadata_only, y origin/lujan (`75e9550`) y origin/nicolas (`422f6b0`) no contienen una nueva serie versionada. Esto no niega una importación local de P2. Antes de integrarla, solicitar rama/commit, ruta del bundle, esquema y comprobación reproducible; no sustituir el catálogo por suposición.

**Leyenda:** A=números candidatos a análisis descriptivo tras validación; B=configuraciones numéricas o resultados ambiguos, aún sin comparaciones de efecto; C=índice/resumen útil para catálogo y contexto; D=documentación/metadatos o índice de figuras. A no significa listo para importar. Las preguntas son propuestas de producto inferidas del contenido. Los estudios de la columna comparables son candidatos condicionados, no grupos estadísticos autorizados.

## Matriz: una fila por estudio, en orden de revisión cuantitativa propuesto

| Orden / estudio y objeto | Uso / preguntas candidatas | Magnitudes y unidades | Qué representa una fila | Comparación candidata | Verificación pendiente / fuente |
|---|---|---|---|---|---|
| 1. **PSI-25 — Burning and Suppression of Solids - II** | **A: serie candidata**. ¿Cómo cambia la propagación con flujo, manteniendo material/geometría? | Tabla 5.1: velocidad cm/s, propagación mm/s, espesor mm, ancho cm, caras, tiempo min y O2 vol%. CSV: atmósfera/lecturas de instrumentos. | Ensayo físico con condiciones sucesivas; no una réplica por pareja. | 26/62 y Saffire solo contexto; primero comparaciones internas controladas. | Localizar bundle/commit de P2; segmentos, caras, O2 temporal, discrepancias CSV/PDF y revisión científica. [S-PSI-25](#s-psi-25) |
| 2. **PSI-69 — Flame Extinguishment Experiment** | **A: numérico candidato**. ¿Qué condiciones acompañan extinción frente a interrupción de una gota? | Presión mmHg, fracciones molares, diámetros inicial/extinción mm, tiempo s; Burning rate; mm ambiguo. | Registro de test con identificador y motivo de fin; separar calibraciones/interrupciones. | 68 para dominio de condiciones;39 para contexto de llamas frías, no agrupación automática. | Definición de diámetro de extinción, unidad burning-rate, fracciones/cabeceras truncadas, censura y réplicas. [S-PSI-69](#s-psi-69) |
| 3. **PSI-102 — Smoke and Aerosol Measurement Experiment** | **A: numérico candidato**. ¿Qué materiales y tasas de pérdida de masa aparecen bajo cada flujo/envejecimiento? | Flujo cm/s, pérdida de masa mg/min, envejecimiento min. | Muestra/configuración; no presupone réplica independiente ni medición de respuesta de detector. | 101 tras revisar protocolo/material;47/115 documental. | Medido frente a condición impuesta, identidad de muestra, incertidumbre y falta de observables de aerosol en CSV. [S-PSI-102](#s-psi-102) |
| 4. **PSI-101 — Smoke Aerosol Measurement Experiment-Reflight** | **A: numérico candidato**. ¿Qué diferencias de duración/envejecimiento y Rt/R0 aparecen por material? | Velocidad entrada cm/s, Rt/R0 razón sin unidad declarada, duración y tiempos s. | Test con sufijos y descripción; posiblemente pasos relacionados, no109 réplicas. | 102 solo variables/protocolos armonizados;115 contexto de modelado. | Definir Rt/R0 con informe, sufijos, reutilización de muestra y tiempos netos frente a primarios. [S-PSI-101](#s-psi-101) |
| 5. **PSI-159 — Advanced Combustion via Microgravity Experiments / Cool Flames Investigation with Gases** | **A: numérico candidato**. ¿Qué configuraciones se asocian con ignición, terminación y temperatura reportadas? | Presión bar, caudales mg/s, tiempo s, temperatura C/K, fracciones, Tad K, TFP/Zst. | Test/condición normal o inversa; incluye intentos fallidos y filas vacías. | 10 para variables comunes estratificando combustible/configuración;39/117/142 contexto. | Significado TFP/SE/FT, temperatura medida frente a Tad calculada, ceros de no ignición y controles. [S-PSI-159](#s-psi-159) |
| 6. **PSI-10 — Advanced Combustion via Microgravity Experiments / Flame Design** | **A: condiciones numéricas**. ¿Qué dominio de composición, presión y caudal se exploró en llamas normales/inversas? | Caudales mg/s, presión atm, fracciones, Zst y Tad K; no presumir que Tad sea temperatura medida. | Test identificado; algunos valores son rampas RAMPED y extremos inicial/final. | 159 para dominio común, sin equiparar todos los resultados ni combustibles. | Procedencia/calculo de Tad/Zst, rampas, condiciones efectivas y variable experimental objetivo. [S-PSI-10](#s-psi-10) |
| 7. **PSI-98 — Spacecraft Fire Safety Experiment-I** | **A: numérico limitado**. ¿Cómo difieren las configuraciones concurrente/opuesta y los tiempos reportados? | Dimensiones cm, flujo cm/s, O2 %, potencia W, ignición/combustión s. | Dos muestras con datos y referencias de visualización; no4 ensayos. | 100 para configuraciones SIBAL;99 y25 contexto de escala/material. | Rangos/aproximaciones O2, motivo de fin, independencia y unidades/dimensiones; no tasa de propagación en CSV. [S-PSI-98](#s-psi-98) |
| 8. **PSI-99 — Spacecraft Fire Experiment-II** | **B: numérico condicionado**. ¿Qué resultados de propagación/longitud aparecen para cada material y gravedad? | Unidades incrustadas cm/mm, cm/s, W, s, mm/s; texto n/a, Acceleratory e Insignificant. | Muestra con columnas1g/microgravedad más notas/referencias; no15 réplicas. | 98/100 por configuración;25 solo tras compatibilidad material/escala. | Resolver ?-g Spread Length,037mm, nota 4, arrastres de material, etiquetas de gravedad y magnitud antes de graficar. [S-PSI-99](#s-psi-99) |
| 9. **PSI-107 — Smoke Point In Co-flow Experiment** | **B: condiciones y tiempo**. ¿Qué dominio de boquilla/caudal/aire se ensayó y qué eventos se repiten? | Boquilla mm, combustible sccm y mg/s, aire cm/s; GMT inicio/fin. | Registro de condición/evento; hay34 duplicados exactos excedentes y eventos compartidos. | 60 como análisis dependiente,106/21 contexto de coflujo. | Identificar evento único y cambios internos; fecha/cruce de día; criterio y valores del punto de humo requieren informe. [S-PSI-107](#s-psi-107) |
| 10. **PSI-100 — Spacecraft Fire Experiment-III** | **B: configuración numérica**. ¿Qué geometría y sentido de flujo se usaron en SaffireIII? | Dimensiones con cm en celdas y flujo cm/s; sin tasa ni tiempo objetivo. | Dos muestras/direcciones identificadas. | 98 para configuración,99 contexto; no extrapolar efecto solo de cambiar velocidad. | Normalizar celdas, verificar dimensiones/orientación y obtener respuesta experimental para análisis de efectos. [S-PSI-100](#s-psi-100) |
| 11. **PSI-39 — Cool Flames Investigation** | **B: condiciones numéricas**. ¿Con qué combustible, atmósfera, presión y soporte se ejecutaron los tests? | Presión textual atm, fracciones O2/N2/He; fibra y combustible categóricos. | Registro test/CIR;8 duplicados exactos excedentes requieren identidad. | 69/68 familia gotas;159/117/142 solo contexto de llama fría inicialmente. | No hay temperatura/tasa objetivo en CSV; extraer respuesta del informe, revisar fibra y duplicados. [S-PSI-39](#s-psi-39) |
| 12. **PSI-68 — Flame Extinguishment Experiment - 2** | **B: matriz de diseño**. ¿Qué rangos de combustibles, diámetros y atmósferas cubre FLEX2? | Diámetro mm, presión atm, temperatura C, flujo cm/s, fracción molar O2. | Fila por combustible y conjuntos/rangos de condiciones; no producto cartesiano de ensayos realizados. | 69 para cobertura del dominio;39 documental. | Conseguir registros por test y resultados; distinguir rangos posibles de combinaciones realmente ejecutadas. [S-PSI-68](#s-psi-68) |
| 13. **PSI-26 — Burning and Suppression of Solids** | **C: índice experimental**. ¿Qué materiales y muestras se ensayaron en BASS? | Fecha/GMT, IDs y dimensiones incluidas en descripción; sin tasa en columna. | Ejecución/as-run con muestra; relacionar IDs antes de contar réplicas. | 25 para contexto de campaña;62 es estudio de modelado relacionado. | Obtener respuesta cuantitativa, condiciones calibradas, geometría y enlaces a observaciones originales. [S-PSI-26](#s-psi-26) |
| 14. **PSI-20 — Advanced Combustion via Microgravity Experiments - Burning Rate Emulator** | **C: resumen de campaña**. ¿Qué días, quemadores y concentraciones incluyeron igniciones? | Quemador mm, O2% y conteo Flames Ignited. | Resumen diario; la nota indica presiones variadas no identificadas. | 21/22/23 contexto ACME;10/159 variables de diseño, no respuesta común garantizada. | Desagregar por ensayo, presión efectiva y variable burning-rate real; no confundir conteo con tasa de combustión. [S-PSI-20](#s-psi-20) |
| 15. **PSI-21 — Advanced Combustion via Microgravity Experiments / Coflow Laminar Diffusion Flame** | **C: resumen de campaña**. ¿Qué familias de combustible y rangos de concentración cubre CLD? | MFC: máximo del controlador en slpm base N2 según nota; concentración% y conteos. | Día/tipo; cambios entre y dentro de tests. | 107/106 contexto de coflujo;otros ACME cobertura de campaña. | No usar MFC como velocidad real; verificar erratas CH5, extinción antes de alcanzar mínimo y obtener señales por ensayo. [S-PSI-21](#s-psi-21) |
| 16. **PSI-22 — Advanced Combustion via Microgravity Experiments Electric-Field Effects on Laminar Diffusion Flames** | **C: resumen de campaña**. ¿Qué polaridades, combustibles y días se incluyeron? | Polaridad categórica, concentración y conteo de igniciones; no magnitud del campo en CSV. | Día/serie de pruebas;8 duplicados excedentes. | 20/21/23 contexto de plataforma; no atribuir causalidad a polaridad con estos resúmenes. | Voltaje/campo real, geometría electrodo, respuesta medida, duplicados e identidad de ensayo. [S-PSI-22](#s-psi-22) |
| 17. **PSI-23 — Advanced Combustion via Microgravity Experiments-Structure and Response of Spherical Diffusion Flames** | **C: resumen de campaña**. ¿Qué atmósferas y mezclas se exploraron en llamas esféricas? | Atmósfera aproximada, mezcla y número de igniciones; nota indica presión variable/viciación. | Resumen diario/serie; no observación individual de estructura. | Otros ACME como contexto;39/159 no equiparar llama esférica gaseosa y gota. | Condiciones efectivas por test, erratas N3, perfiles temporales y variable respuesta del informe. [S-PSI-23](#s-psi-23) |
| 18. **PSI-106 — Structure and Liftoff In Combustion Experiment** | **C: índice de sesiones**. ¿Qué sesiones y combustibles forman SLICE? | Fecha, combustible y concentración textual; sin altura de despegue numérica. | Sesión/fecha que puede contener calibraciones y múltiples tests. | 107/21 contexto de coflujo. | Separar calibraciones; obtener altura/estructura y caudales por test antes de análisis numérico de liftoff. [S-PSI-106](#s-psi-106) |
| 19. **PSI-47 — Dust and Aerosol Measurement Feasibility Test / Dust and Aerosol Measurement Feasibility Test-2** | **C: contexto instrumental**. ¿Qué equipos, materiales y lugares se usaron para muestreo de aerosol? | Descripciones de hardware, polvo y ubicación; sin concentración/tamaño numéricos en CSV. | Sesión D1/D2. | 101/102 contexto de medición de humo, sin misma población de partículas garantizada. | Calibración/respuesta del sensor y datos originales; DOC binarios no ejecutados ni interpretados como tablas. [S-PSI-47](#s-psi-47) |
| 20. **PSI-142 — Quantitative Studies of Cool Flame Transitions at Radiation / Stretch Extinction Using Counterflow Flames** | **D: índice bibliográfico**. ¿Qué figuras tratan límites de llama fría y comparaciones con/sin ozono? | No mediciones en CSV: Data ID, descripción, DOI y Figure ID. | Referencia a figura publicada; no un ensayo. | 39/159/117 contexto de mecanismos; no mezclar gotas, gases y contraflujo. | Acceder a publicaciones, revisar ejes/unidades y digitalización; el título Quantitative no implica números locales. [S-PSI-142](#s-psi-142) |
| 21. **PSI-60 — Computational and Experimental Analysis of SPICE Data Sets** | **D: metadatos**. ¿Qué trabajo analiza computacional/experimentalmente SPICE? | Sin CSV experimental ni informe PDF/DOC en este ZIP; magnitudes no determinables localmente. | Registro ISA de estudio, no medición. | 107 como estudio de origen; no contarlo como réplica nueva. | Obtener publicación/datos/código y trazabilidad entre resultados derivados y ensayos SPICE. [S-PSI-60](#s-psi-60) |
| 22. **PSI-62 — Concurrent Flame Spread Modeling using Flamelet Generated Manifolds in Microgravity with Comparison to BASS Experiments using Two-Color Tomography** | **D: metadatos**. ¿Qué trabajo modela propagación concurrente y la contrasta con BASS? | Sin CSV ni informe PDF/DOC local; unidades no determinables. | Registro ISA de estudio. | 26/25 como contexto; condiciones concurrentes/opuestas deben distinguirse. | Obtener publicación/modelo/tomografía y resultados; nunca presentar simulación como medición independiente. [S-PSI-62](#s-psi-62) |
| 23. **PSI-115 — Utilization of the Smoke Aerosol Measurement Experiment Data for Advanced Modeling and Simulation of Smoke Generation in Micro-Gravity** | **D: documental candidato**. ¿Qué trabajo propone modelado de humo a partir de SAME? | No CSV; unidades/resultados cuantitativos pendientes de extracción del informe. | Metadatos e informe NNX17AF08A, no filas de ensayo. | 102/101 como fuentes vinculadas por temática; identidad exacta por verificar. | Leer tablas/páginas del informe, separar parámetros/simulación/medición y evitar doble conteo del corpus SAME. [S-PSI-115](#s-psi-115) |
| 24. **PSI-117 — Effect of External Thermo-Convective Perturbation on Cool Flame Dynamics: A Multidimensional Multi-Physics CFD Analysis** | **D: documental candidato**. ¿Qué trabajo aborda perturbaciones termoconvectivas de llamas frías? | No CSV; magnitudes y unidades no determinadas en esta revisión. | Metadatos y tesis adjunta; no observaciones normalizadas. | 39/159/142 como contexto, no equivalencia física demostrada. | Verificar correspondencia entre título ISA y tesis cuyo nombre menciona gotas submilimétricas; localizar resultados y unidades antes de atribuir conclusiones. [S-PSI-117](#s-psi-117) |

## Qué incorporar al producto y cuándo

1. **Ahora: los 24 como catálogo documentado.** Ficha de estudio, tema, fuente, inventario de variables, estado de revisión y enlace a investigaciones relacionadas. Mostrar “solo metadatos”, “resumen de campaña”, “serie candidata” o “serie revisada”; no convertir todo en puntos del gráfico.
2. **Primera ola numérica:25,69,102,101,159,10,98.** Cerrar primero BASS-II con P2/P1. Luego FLEX para resultados por test, SAME/SAME-R para masa/envejecimiento y ACME para condiciones/ignición. Cada familia necesita su métrica y contrato propios. Los gráficos iniciales son descriptivos dentro de cada estudio y estrato.
3. **Segunda ola:99,107,100,39,68.** Resolver ambigüedades; ofrecer exploración de configuraciones y cobertura antes de prometer tasas/efectos. SaffireII puede subir de prioridad tras aclarar cabeceras y notas. FLEX2 debe mostrar rangos, sin fabricar combinaciones de ensayos.
4. **Contexto operativo:26,20,21,22,23,106,47.** Navegador de materiales, cronología y configuración; conteos diarios claramente etiquetados. Sus PDF pueden abrir futuras series, pero el CSV actual no basta para medir los efectos sugeridos por los títulos.
5. **Conocimiento y relaciones:142,60,62,115,117.** Incorporar enlaces/metadatos desde el inicio. Revisar documentación/digitalización después; vincular modelos derivados a los estudios de origen para no duplicar evidencia. El orden refleja disponibilidad local y utilidad para la demo, no calidad científica de los estudios.

## Comparaciones que ofrecer y límites

- **Dentro de una campaña:** puntos por ensayo, condiciones documentadas, ausencia explícita y estratos por material, geometría, gravedad, dirección de flujo, procedencia y controles necesarios. Las mesetas, filas repetidas y representaciones derivadas conservan su unidad experimental.
- **Entre campañas:** primero paneles paralelos de configuración, dominio de variables y métodos. BASS/BASS-II/Saffire, FLEX/FLEX2/CFI, SAME/SAME-R y ACME son familias de navegación, no autorización automática de pooling.
- **No ofrecer aún:** ranking universal de peligro; curva única BASS–Saffire; usar burning-rate de gota, pérdida de masa y velocidad de frente como misma métrica; inferir causalidad de resúmenes diarios; considerar CFD/figuras derivadas réplicas.
- **Requisito para cualquier incorporación numérica:** identidad de ensayo/muestra y dependencia, definición de métrica y unidad, condiciones efectivas, procedencia por valor, control de duplicados/censura/ausencias, revisión P2/P3 y contrato P1. El actual Metric.other no sustituye esa definición. Acceso/redistribución por fuente sigue pendiente.

## Localizadores de respaldo

Todos los caminos siguientes son miembros exactos de `NASA/Documents/datasets_lujan.zip`, SHA256 `5fcfa48e95a7c9ff84462c9fb498e144fc401bb22c0b09e18ff36d582e61c644`. Los títulos/objetos se respaldan en Study Title; unidades/estructura en cabeceras y celdas CSV. Las recomendaciones de orden y comparabilidad son juicio de integración P3, sujeto a revisión especializada.

### S-PSI-25

- Objeto: `PSI-25/Investigation Metadata Files/PSI-25_metadata_PSI_metadata_PSI-101_BASS-II/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-25/Experimental table/PSI-25_Experimental table_BASS-II.csv`; cabecera registro 1; 129 registros no vacíos. Cabeceras: `PI`; `Test #`; `Date`; `GMT`; `Sample #`; `Fuel Sample Material`; `Flow restrictor`; `Fan display`; `Air display`; `Radiometer gain   (1000   250   50   10)`; `Total Frames Shot`; `Calibrated  initial O2 % by vol`; `Calibrated final O2 % by vol`; `Initial CO2 % by vol`; `Final CO2 % by vol`; `Initial CO (ppm)`; `Final CO (ppm)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Serie candidata: `PSI-25/Reports/PSI-25_Reports_BASS-II Summary Report.pdf`, tabla 5.1, página PDF 65/impresa 57; O2 temporal PDF 68. Son valores publicados y condiciones sucesivas, no nuevas réplicas.
- Documento disponible: `PSI-25/Reports/PSI-25_Reports_BASS-II Summary Report.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-69

- Objeto: `PSI-69/Investigation Metadata Files/PSI-69_metadata_PSI-133_FLEX/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-69/Experimental table/PSI-69_Experimental table_FLEX.csv`; cabecera registro 1; 274 registros no vacíos. Cabeceras: `FLEX Test #`; `FLEX Identifier`; `Test Date`; `Test GMT`; `Fuel`; `Ambient pressure; mmHg`; `O initial ambient composition; mole fraction`; `N initial ambient composition; mole fraction`; `CO initial ambient composition; mole fraction`; `He initial ambient composition; mole fraction`; `Droplet initial diameter; mm`; `Visible flame extinction diameter; mm`; `Burning rate; mm`; `Burn time; s`; `Test end`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-102

- Objeto: `PSI-102/Investigation Metadata Files/PSI-102_metadata_PSI-170_SAME/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-102/Experimental table/PSI-102_Experimental table_SAME.csv`; cabecera registro 1; 8 registros no vacíos. Cabeceras: `Sample #`; `Sample Material`; `Air Flow (cm/s)`; `Weight loss rate (mg/min)`; `Aging Duration (minutes)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-102/Reports/PSI-102_Reports_SAME_Final Science Report.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-101

- Objeto: `PSI-101/Investigation Metadata Files/PSI-101_metadata_PSI-169_SAME-R/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-101/Experimental table/PSI-101_Experimental table_SAME-R.csv`; cabecera registro 1; 109 registros no vacíos. Cabeceras: `Sample Type`; `SAME Test #`; `Description`; `Date`; `Inlet velocity (cm/s)`; `Rt/R0`; `Duration (sec)`; `Primary aging time (sec)`; `Primary mixing time (sec)`; `Net aging time (sec)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-101/Reports/PSI-101_Reports_SAME-R_Final Report.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-159

- Objeto: `PSI-159/Investigation Metadata Files/PSI-159_metadata_PSI-159-ISA/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-159/Experimental table/PSI-159_Experimental table_CFI-G_Inverse Flames.csv`; cabecera registro 1; 154 registros no vacíos. Cabeceras: `Flame Type`; `Day`; `Fuel`; `Test`; `Xf  before test`; `Xf  after test`; `approx p (bar)`; `XO2`; `HC burnrate (mg/s)`; `O2 flow rate (mg/s)`; `TFP`; `Tad (K)`; `Zst`; `Hot ignition`; `burn time (sec)`; `Self -ext or flow term`; `Peak burner Temp (C)`; `Peak burner temp (K)`; `Color`; `Comments`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Tabla: `PSI-159/Experimental table/PSI-159_Experimental table_CFI-G_Normal Flames.csv`; cabecera registro 1; 179 registros no vacíos. Cabeceras: `Flame Type`; `Day`; `Fuel`; `Test`; `Cool flame?`; `XO2 before test`; `XO2  after test`; `approx p (bar)`; `Xf`; `mHC (mg/s)`; `TFP`; `Tad (K)`; `Zst`; `Hot ignition`; `burn time (sec)`; `Self-ext or flow term`; `Peak burner T (C )`; `Comments`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-159/Reports/PSI-159_Reports_FinalRpt_ACME.CFI-G.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-10

- Objeto: `PSI-10/Investigation Metadata Files/PSI-10_metadata_PSI-10-ISA/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-10/Experimental table/PSI-10_Experimental table_Flame Design_Inverse Flame.csv`; cabecera registro 1; 120 registros no vacíos. Cabeceras: `Flame Type`; `Day`; `Test`; `XO2`; `mO2 (mg/s)`; `mN2 (mg/s)`; `mtot (mg/s)`; `XC2H4 initial`; `XC2H4 final`; `pinit (atm)`; `pfinal (atm)`; `pmean (atm)`; `mean Zst`; `Tad (K)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Tabla: `PSI-10/Experimental table/PSI-10_Experimental table_Flame Design_Normal Flame.csv`; cabecera registro 1; 207 registros no vacíos. Cabeceras: `Flame Type`; `Day`; `Fuel`; `Test`; `Xfuel`; `mfuel (mg/s)`; `mN2 (mg/s)`; `mtot (mg/s)`; `XO2 (init)`; `XO2 (final)`; `pinit (atm)`; `pfinal (atm)`; `pmean (atm)`; `mean Zst`; `Tad (K)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-10/Reports/PSI-10_Reports_FinalRpt_ACMEFlameDesign.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-10/Reports/PSI-10_Reports_TaskbookPubsList_Feb2023.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-10/Reports/PSI-10_Reports_TaskbookRpts.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-98

- Objeto: `PSI-98/Investigation Metadata Files/PSI-98_metadata_PSI-166_SAFFIRE-I/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-98/Experimental table/PSI-98_Experimental table_SAFFIRE-1.csv`; cabecera registro 1; 4 registros no vacíos. Cabeceras: `Sample Number`; `Material`; `Sample Thickness (cm)`; `Sample Length (cm)`; `Sample Width (cm)`; `Air Flow (cm/s)`; `Percent O2`; `Ignition Power (W)`; `Ignition Time (s)`; `Burn Time (s)`; `Flow Direction`; `Camera 1`; `Camera 2`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-99

- Objeto: `PSI-99/Investigation Metadata Files/PSI-99_metadata_PSI-167_SAFFIRE-II/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-99/Experimental table/PSI-99_Experimental table_SAFFIRE-2.csv`; cabecera registro 1; 15 registros no vacíos. Cabeceras: `Sample Number`; `Material`; `Samle Thickness`; `Sample Length`; `Sample Width (cm)`; `Air Flow (cm/s)`; `Percent O2 (Note 1)`; `Ignition Power (W)`; `Ignition Time (s)`; `Burn Time (s)`; `Flow Direction`; `?-g Burn Length`; `?-g Spread Length`; `1-g Burn Length`; `1-g Spread Rate`; `Camera 1`; `Camera 2`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-107

- Objeto: `PSI-107/Investigation Metadata Files/PSI-107_metadata_PSI-176_SPICE/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-107/Experimental table/PSI-107_Experimental table_Spice.csv`; cabecera registro 1; 469 registros no vacíos. Cabeceras: `GMT date`; `GMT ignition`; `GMT  Flame Off`; `Fuel`; `Nozzle (mm)`; `Fuel Rate (sccm)`; `Fuel Rate (mg/s)`; `HC Fuel Rate (mg/s)`; `Air Rate (cm/s)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-107/Reports/PSI-107_Reports_SMOKE POINTS OF MICROGRAVITY AND  NORMAL GRAVITY COFLOW DIFFUSION  FLAMES_DotsonThesis.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-107/Reports/PSI-107_Reports_SPICE_30-DayPostFlightReport.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-107/Reports/PSI-107_Reports_SPICE_FinalReport.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-100

- Objeto: `PSI-100/Investigation Metadata Files/PSI-100_metadata_PSI-168_SAFFIRE-III/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-100/Experimental table/PSI-100_Experimental table_SAFFIRE-3.csv`; cabecera registro 1; 2 registros no vacíos. Cabeceras: `Sample Number`; `Material`; `Sample Thickness`; `Sample Length`; `Sample Width`; `Air Flow`; `Direction`; `Camera 1`; `Camera 2`.
- Cotejo de ejemplos: registros 2, 3; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-39

- Objeto: `PSI-39/Investigation Metadata Files/PSI-39_metadata_PSI-118_CFI/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-39/Experimental table/PSI-39_Experimental table_CFI.csv`; cabecera registro 1; 87 registros no vacíos. Cabeceras: `Flex Number`; `Test Date`; `Local Time`; `CIR`; `Pressure`; `Oxygen`; `Nitrogen`; `Helium`; `Fiber`; `Fuel`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-39/Reports/PSI-39_Reports_CFI Science Final Report.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-68

- Objeto: `PSI-68/Investigation Metadata Files/PSI-68_metadata_PSI-132_FLEX-2/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-68/Experimental table/PSI-68_Experimental table_Flex2.csv`; cabecera registro 1; 8 registros no vacíos. Cabeceras: `Sample (Fuel Type)`; `Initial Droplet Diameter (mm)`; `Ambient Gas Mixture`; `Oxygen Mole Fraction`; `Ambient Pressure (atm)`; `Ambient Temperature (C)`; `Flow Velocity (cm/s)`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-26

- Objeto: `PSI-26/Investigation Metadata Files/PSI-26_metadata_PSI-102_BASS/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-26/Experimental table/PSI-26_Experimental table_BASS.csv`; cabecera registro 1; 122 registros no vacíos. Cabeceras: `Date`; `GMT`; `As Run Test #`; `Test #`; `Sample #`; `Fuel Sample Material`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-20

- Objeto: `PSI-20/Investigation Metadata Files/PSI-20_metadata_PSI-96_ACME BRE/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-20/Experimental table/PSI-20_Experimental table_ACME BRE.csv`; cabecera registro 1; 18 registros no vacíos. Cabeceras: `Year`; `Month`; `Date`; `Burner Size (mm)`; `Fuel Bottle`; `Oxygen Conc (percent)`; `Flames Ignited`; `Notes`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-20/Reports/PSI-20_Reports_Dissertation-PD-revised_.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-20/Reports/PSI-20_Reports_Final_20220201.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-21

- Objeto: `PSI-21/Investigation Metadata Files/PSI-21_metadata_PSI-97_ACME CLD Flame/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-21/Experimental table/PSI-21_Experimental table_CLD Flame.csv`; cabecera registro 1; 32 registros no vacíos. Cabeceras: `Test Type`; `Test Day`; `Fuel MFC`; `N2 MFC`; `Fuel Bottle`; `Fuel conc. Range`; `Flames ignited`; `Notes`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-22

- Objeto: `PSI-22/Investigation Metadata Files/PSI-22_metadata_ACME E-FIELD Flames/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-22/Experimental table/PSI-22_Experimental table_ACME E-FIELD Flames.csv`; cabecera registro 1; 32 registros no vacíos. Cabeceras: `Test Type`; `Test Day`; `Year`; `Month`; `Date`; `Mesh Polarity`; `Fuel Bottle`; `Fuel Conc`; `Flames Ignited`; `Notes`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_2018 - E-FIELD Flames 30-day Operation Accomplishments Report for ISS Increments 55 and 56 20181115.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_2019 - E-FIELD Flames 30-Day Operation Accomplishments Report for ISS Increments 57 and 58 20190601.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_ACME fact sheet 20180519.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_ACME fact sheet 20180820.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_E-FIELD Flames Final Report.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_PS-01548 ACME info sheet.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_PS-02788 ACME info sheet.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_PS-03055 ACME info sheet.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-22/Reports/PSI-22_Reports_PS_00538  Unlocking Mysteries.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-23

- Objeto: `PSI-23/Investigation Metadata Files/PSI-23_metadata_PSI-99_ACME s-Flame/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-23/Experimental table/PSI-23_Experimental table_ACME s-Flame.csv`; cabecera registro 1; 18 registros no vacíos. Cabeceras: `Test Type`; `Test Day*`; `Year`; `Month`; `Date`; `Atmosphere*`; `Fuel Bottle`; `Flames Ignited*`; `Notes`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-23/Reports/PSI-23_Reports_s-Flame 30-day report Inc 63 20201216.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-23/Reports/PSI-23_Reports_s_Flame_final_report_20210729.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-106

- Objeto: `PSI-106/Investigation Metadata Files/PSI-106_metadata_PSI-174_SLICE/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-106/Experimental table/PSI-106_Experimental table_Slice.csv`; cabecera registro 1; 12 registros no vacíos. Cabeceras: `Test Date`; `Fuel Type`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-47

- Objeto: `PSI-47/Investigation Metadata Files/PSI-47_metadata_PSI-126_DAFT_DAFT-2/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-47/Experimental table/PSI-47_Experimental table_DAFT.csv`; cabecera registro 1; 2 registros no vacíos. Cabeceras: `Session Name`; `Actual Day`; `Hardware Description`; `Sample Material`; `Sampled Location`.
- Cotejo de ejemplos: registros 2, 3; alcance total y anomalías contrastados con DATA_INSPECTION.
- Documento disponible: `PSI-47/Reports/PSI-47_Reports_DAFT_1YearReport.doc`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-47/Reports/PSI-47_Reports_DAFT_30Day.PostFlightReport.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
- Documento disponible: `PSI-47/Reports/PSI-47_Reports_DAFT_FinalReport.doc`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-142

- Objeto: `PSI-142/Investigation Metadata Files/PSI-142_metadata_PSI-164_Quantitative Studies/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- Tabla: `PSI-142/Experimental table/PSI-142_Experimental table_Data Summary Table.csv`; cabecera registro 1; 8 registros no vacíos. Cabeceras: `Data ID`; `Data Description`; `Reference Publication Link`; `Figure ID in Reference`.
- Cotejo de ejemplos: registros 2, 3, 4; alcance total y anomalías contrastados con DATA_INSPECTION.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-60

- Objeto: `PSI-60/Investigation Metadata Files/PSI-60_metadata_NEWID-5_Computational and Ex/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- No hay CSV experimental en el archivo local; no inferir métricas o unidades desde el título.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-62

- Objeto: `PSI-62/Investigation Metadata Files/PSI-62_metadata_NEWID-7_Concurrent Flame Spr/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- No hay CSV experimental en el archivo local; no inferir métricas o unidades desde el título.
- No hay PDF/DOC de informe en este ZIP para el estudio; los enlaces externos pueden aportar material no incluido.

### S-PSI-115

- Objeto: `PSI-115/Investigation Metadata Files/PSI-115_metadata_PSI-185_Utilization of the S/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- No hay CSV experimental en el archivo local; no inferir métricas o unidades desde el título.
- Documento disponible: `PSI-115/Reports/PSI-115_Reports_NNX17AF08A_FinalReport.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.

### S-PSI-117

- Objeto: `PSI-117/Investigation Metadata Files/PSI-117_metadata_NEWID-13_Effect of External T/i_Investigation.txt`, campo `Study Title`, línea(s) 34.
- No hay CSV experimental en el archivo local; no inferir métricas o unidades desde el título.
- Documento disponible: `PSI-117/Reports/PSI-117_Reports_Dissertation_Combustion Behavior Of Sub-Millimeter Sized Oxygenated And N-Alka.pdf`. Existencia/hash verificados; extracción cuantitativa adicional pendiente.
