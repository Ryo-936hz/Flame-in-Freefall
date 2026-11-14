# Referencia de producto aprobada

Transcripción de la propuesta aportada por el usuario. Describe la visión de producto y demo; no es evidencia de implementación. Para el trabajo local vigente prevalecen AGENTS, el prompt maestro, PRODUCT, CONTRACTS y las decisiones registradas tras inspeccionar los datos.

Fuente: FlameLab_SI_Propuesta_Final_Los_TTS.docx.

## Propuesta final de FlameLab SI

Laboratorio científico de misión dirigido por inteligencia artificial

Los TTS · NASA Space Apps Challenge · 14 de noviembre de 2026

## Visión del producto

FlameLab SI convierte una pregunta de seguridad contra incendios espaciales en una investigación visual: reúne evidencia de NASA, compara ensayos, explora escenarios y propone qué estudiar después. La IA coordina el recorrido y construye el espacio de trabajo según el objetivo del usuario.

Esta propuesta fusiona la arquitectura sencilla y la entrada por escenarios del plan del equipo con el investigador de IA, la comparación visual y la trazabilidad de FlameLab SI. Es una propuesta de producto y demo; no describe un sistema ya implementado.

El usuario principal es un investigador o ingeniero que necesita entender la evidencia disponible para un material o escenario. El núcleo demostrable combina extracción científica, análisis por grupos comparables y ranking de evidencia. Se preparará una serie de BASS-II y se utilizará Saffire para mostrar los límites de trasladar conclusiones entre configuraciones y escalas.

| Módulo | Qué hace la IA | Resultado visible |
| --- | --- | --- |
| Mission Brief | Interpreta objetivo y restricciones. | Escenario y plan de investigación. |
| AI Scientist | Busca, contrasta y organiza evidencia. | Hallazgos con fuentes y tareas ejecutadas. |
| Evidence Canvas | Selecciona grupos compatibles, calcula similitud y construye comparaciones. | Ensayos reales, ranking explicable y fuente original. |
| Mission Lab | Explora cambios y alternativas. | Escenarios A/B y cobertura de evidencia. |
| Discovery Engine | Formula hipótesis y siguientes pruebas. | Propuestas de investigación contrastables. |
| Mission Report | Sintetiza el expediente. | Informe con conclusiones, límites y fuentes. |

El reto pide resumir, ordenar e interpretar investigaciones de combustión de PSI mediante un dashboard interactivo con SI. La extracción para modelización y el apoyo a nuevos controles y equipos aparecen como posibles orientaciones. Nuestra propuesta cubre el núcleo y utiliza esas orientaciones para ampliar la visión. [1]

Promesa del producto: Describe tu misión. FlameLab SI investiga la evidencia de NASA, compara alternativas y propone el siguiente paso.

## La IA como responsable del recorrido

El sistema mantiene un expediente compartido con la pregunta, el escenario, las fuentes, los ensayos, los cálculos y las hipótesis. El chat, las tablas, los gráficos y el laboratorio consultan ese mismo estado. Una nueva restricción modifica tanto el análisis como la interfaz.

Un director científico coordina cuatro funciones. Pueden implementarse como roles dentro de un único flujo, sin necesidad de desplegar un servicio o un modelo distinto para cada una.

| Función | Trabajo | Prueba visible |
| --- | --- | --- |
| Investigador | Busca registros, documentos, tablas, figuras y vídeos pertinentes; reformula consultas. | Cada hallazgo abre su evidencia y explica su relevancia. |
| Analista | Consulta observaciones validadas, forma grupos compatibles y ejecuta estadística y ranking. | Gráfico estratificado, puntos individuales y explicación del top 3. |
| Revisor | Comprueba citas, unidades y condiciones; señala inferencias no respaldadas. | Corrige una conclusión o identifica qué dato falta. |
| Diseñador | Propone alternativas, hipótesis y pruebas bajo las restricciones del usuario. | Devuelve opciones justificadas y una siguiente investigación. |

La IA decide buscar más, consultar datos estructurados, ejecutar un análisis, cambiar una visualización o solicitar una aclaración. El cálculo de similitud, los controles de calidad y las estadísticas se ejecutan con herramientas deterministas. La IA planifica, interpreta y conecta sus resultados.

Ejemplo de interacción: Compara los ensayos del mismo material; añade geometría y presión; explica cuáles sirven para analizar el efecto de la ventilación. La IA filtra la tabla, actualiza el gráfico y describe las exclusiones.

Referencias reales de diseño: PaperQA2 aporta investigación documental con búsqueda iterativa y citas; AI co-scientist de Google explora generación y crítica de hipótesis. LangGraph permite coordinar pasos con estado y herramientas. Son referencias y componentes, no pruebas de que nuestro sistema haya alcanzado sus resultados. [2–4]

El término SI se usa en el contexto del reto. El proyecto demostrará capacidades concretas de investigación asistida; no afirmará haber demostrado superinteligencia general.

## El núcleo científico de la demo

La primera serie se elegirá dentro de BASS-II después de comprobar la variable objetivo, los archivos disponibles y las condiciones de los ensayos. El informe NASA de 2021 documenta series y matrices experimentales; no se presupone que todos los valores necesarios estén publicados en tablas. Si se digitaliza una figura, se conservará esa procedencia y su precisión limitada. [12]

Saffire se incorporará como caso de contraste de escala y configuración. NASA ha documentado efectos del tamaño de muestra y del conducto. Antes de comparar se revisarán también material, geometría, flujo y demás condiciones; una diferencia entre proyectos no se atribuirá automáticamente solo a la escala. [13]

| Necesidad | Implementación propuesta | Salida visible |
| --- | --- | --- |
| Calidad | Nulos por estudio, rangos y duplicados por identidad de ensayo y medición. | Cobertura, incidencias y datos ausentes. |
| Normalización | Unidades y categorías con valor original, material específico y fuente. | Condiciones comparables e inspeccionables. |
| Extracción | pdfplumber para tablas; LLM con JSON validado para condición y observación. | Cada observación abre página, tabla o figura. |
| EDA estratificado | Grupos por material, geometría, espesor o diámetro, flujo y condiciones relevantes. | Puntos por ensayo y mapa de cobertura. |
| Estadística | Mediana y tamaño de muestra; bootstrap solo con independencia suficiente. | Resumen del grupo e incertidumbre cuando proceda. |
| Ranking | Filtros de compatibilidad y similitud Gower ponderada. | Top 3 con contribución por variable y cobertura. |
| Síntesis IA | Recuperación de evidencia seleccionada y revisión de afirmaciones. | Respuesta con citas y lagunas reconocidas. |

Se distinguen no medido, no informado, no extraído y no aplicable de un cero observado. PMMA y acrílico pueden compartir una categoría de búsqueda cuando la fuente confirme su composición; se conservan grado, aditivos, color, geometría y dimensiones.

No se cuentan fotogramas ni múltiples condiciones de una misma muestra como réplicas independientes. Cuando hay dependencia, la unidad de remuestreo es el ensayo independiente o la muestra que corresponda. Sin réplicas suficientes se muestran puntos y límites, sin intervalos decorativos.

Gower combina variables numéricas y categóricas; no determina por sí mismo la compatibilidad científica. Se fijan rangos de normalización y pesos reproducibles. Los campos ausentes no cuentan como coincidencia: se informa la cobertura y se exige información mínima. Similitud, calidad de evidencia y riesgo permanecen separados. [14] La finalidad de la consulta determina los campos: para estudiar el efecto del oxígeno se mantiene comparable el resto y se permite que varíe el oxígeno.

Se evaluará el top 3 con consultas etiquetadas manualmente, reservando consultas que no se utilicen para ajustar pesos. Habrá casos de respuesta y de evidencia insuficiente. El LLM no modificará las puntuaciones calculadas para hacer más convincente su narración.

## Una interfaz que cambia con la investigación

La pantalla estrella muestra un gráfico de ensayos reales en el centro, un ranking explicable al lado y acceso a la tabla o figura original con un clic. La conversación permanece visible y permite modificar la pregunta, los filtros y las visualizaciones. Un selector de escenario conecta ese análisis con Mission Lab.

Mission Brief permite escribir el objetivo o elegir un escenario de estación, hábitat o rover. La IA prepara una ficha editable con material, atmósfera, flujo, gravedad y pregunta de investigación. El usuario puede orientar la consulta hacia prevención, detección o supresión.

### Evidence Canvas

Presenta fragmentos de investigaciones, tablas y figuras; muestra vídeo cuando aporta evidencia. El gráfico principal compara una magnitud publicada frente al flujo, estratificando las condiciones pertinentes. Si la serie disponible informa límites de extinción u otra variable, se representa esa magnitud real. Se fijan ensayos, se cambian columnas y se abre la fuente desde cada punto o celda.

### Mission Lab

Permite guardar escenarios A/B y modificar condiciones. La IA actualiza qué evidencia resulta aplicable, qué hipótesis cambian y qué información falta. Una vista conceptual del hábitat puede localizar materiales, instrumentos o fenómenos y abrir sus fuentes. Una animación ilustrativa se identifica como tal; su geometría o sus colores no se presentan como resultados de dinámica de fluidos.

### Diseño inverso

El usuario fija un objetivo y restricciones: Propón tres configuraciones candidatas para estudiar este material manteniendo estas condiciones. La IA produce alternativas con fundamento, objeciones, datos faltantes y prueba necesaria. Se presentan como hipótesis de diseño, sin convertirlas en recomendaciones certificadas.

### Discovery Engine

Transforma las lagunas en preguntas investigables. Cada hipótesis incluye evidencia que la motiva, explicación alternativa, variables que habría que controlar y resultado que podría refutarla. La visión futura incorpora selección de nuevas mediciones mediante aprendizaje activo y relaciones empíricas interpretables.

El ranking de ensayos usa compatibilidad y similitud; el sistema mantiene separados resultado observado, respaldo de evidencia y aplicabilidad. El mapa de calor principal representa número de ensayos por combinación de condiciones y hace visibles los huecos que la IA puede convertir en preguntas.

La construcción visual mediante componentes estructurados se inspira en A2UI. La escena interactiva puede desarrollarse con React Three Fiber. Ambas tecnologías apoyan la experiencia; su presencia no implica validación científica. [5–6]

## Guion de demostración

El recorrido propuesto dura tres minutos y muestra una investigación completa. Es una duración de diseño, no un límite oficial verificado. La pregunta inicial es: Estoy estudiando materiales para el interior de un hábitat lunar. Ayúdame a comparar la evidencia cuando cambian la atmósfera y la ventilación.

| Tiempo | Acción | Qué debe recordar el jurado |
| --- | --- | --- |
| 0:00–0:30 | Introducir el objetivo. La IA prepara el escenario y el plan. | La IA entiende una tarea científica y organiza el trabajo. |
| 0:30–1:15 | Mostrar ensayos BASS-II, ranking explicable y acceso al original. | La IA trabaja con grupos comparables y evidencia inspeccionable. |
| 1:15–2:00 | Cambiar una condición e incorporar Saffire como contraste. | La IA explica qué diferencias limitan la transferencia entre escenarios. |
| 2:00–2:40 | Pedir tres alternativas y la siguiente prueba útil. | La plataforma ayuda a formular nuevas investigaciones. |
| 2:40–3:00 | Generar el informe de misión. | El trabajo queda sintetizado y puede compartirse. |

Se preparará una serie compatible de BASS-II y un caso de Saffire. La primera demostrará extracción, análisis y ranking; el segundo mostrará diferencias de escala y configuración, sin mezclar automáticamente sus resultados en una regresión. SAME y FLEX pueden aparecer como navegación contextual hacia detección y supresión. [7,12–13]

El escenario lunar es un objetivo de aplicación, no una afirmación de que se dispone de pruebas directas equivalentes. El enunciado indica que no hay datos de combustión en gravedad parcial disponibles actualmente en PSI; el producto debe mostrar cuándo una conclusión requiere más investigación. [1]

El informe final contendrá escenario, ensayos comparados, hallazgos, fuentes, hipótesis y datos faltantes. La presentación cerrará con la visión de ampliar el mismo flujo a más investigaciones y nuevos modelos.

Frase de presentación: FlameLab SI transforma décadas de investigación de NASA en un laboratorio de IA donde podemos comparar lo observado, explorar lo posible y decidir qué investigar después.

## Qué funcionará y qué mostraremos como visión

La demo puede ser ambiciosa sin implementar toda la plataforma. Se preparará un recorrido acotado con evidencia auténtica y se prototiparán las capacidades futuras. La precalculación de resultados verificables permite concentrar el tiempo en la experiencia.

| Nivel | Contenido | Cómo se identifica |
| --- | --- | --- |
| Funcional | Consulta al corpus, controles de datos, comparación BASS-II, ranking explicable, fuentes y una interacción real con IA. | Evidencia NASA y Análisis calculado, según el resultado. |
| Preparado | Extracción revisada, embeddings, tablas, figuras y análisis obtenidos previamente. | Resultado precalculado cuando sea relevante para entender la ejecución. |
| Prototipado | Diseño inverso guiado, escenas conceptuales o animaciones fuera de un dominio validado. | Hipótesis IA, Escenario preparado o Simulación ilustrativa. |

### Comprobaciones mínimas de la demo

Verificar los valores y fuentes mostrados; comprobar normalización, unidad experimental y datos ausentes; evaluar el top 3 con consultas revisadas; probar que cambiar una condición altera la selección; revisar citas y un caso sin evidencia suficiente. Estas comprobaciones apoyan una demo creíble sin exigir completar toda la plataforma.

### Prioridad de esfuerzo

Primero, una investigación real completa. Después, una interfaz visual pulida y un laboratorio de escenarios ambicioso. Por último, ampliar corpus y automatizar capacidades que la demo ya haya hecho comprensibles.

Las etiquetas se colocan en el panel correspondiente y son legibles durante la demo. Los datos sintéticos, si se usan, nunca aparecen como mediciones de NASA. Un resultado almacenado puede mostrarse como resultado previo; no se representa una búsqueda o cálculo inexistente como si acabara de ejecutarse.

Para la experiencia de IA se prioriza una entrada real del usuario que cambie la selección de datos o la comparación. Los escenarios preparados y una reproducción de respaldo pueden proteger la presentación frente a fallos, dejando claro cuándo se recurre a ellos.

Se elegirá una sola ampliación analítica inicial. Por defecto, regresión simple si hay suficientes ensayos comparables y una variable objetivo; separación de evaluación por ensayo o muestra. OpenCV sustituirá esa ampliación si se dispone de vídeo con escala espacial, tiempo y geometría de observación adecuados. Clustering y detección de anomalías quedan después de validar el ranking. BoTorch y PySR permanecen como evolución de investigación, claramente diferenciada de lo implementado. [8–9]

## Arquitectura y organización del trabajo

Se conserva la base convencional del equipo y se concentra la novedad en el comportamiento de la IA. La siguiente selección evita mantener varias opciones equivalentes por capa.

| Capa | Selección | Propósito |
| --- | --- | --- |
| Aplicación | React, TypeScript y Tailwind | Espacio de trabajo y conversación. |
| Visualización | Recharts y React Three Fiber | Comparaciones y escenario conceptual. |
| API e IA | FastAPI y LangGraph | Herramientas, estado, revisión y streaming. |
| Modelo | Modelo multimodal de razonamiento mediante API | Investigación, interpretación y generación estructurada. |
| Persistencia | PostgreSQL y pgvector | Mediciones, fuentes y recuperación vectorial en una base. |
| Documentos | pdfplumber y PyMuPDF; LLM con JSON validado | Tablas, fragmentos y procedencia verificable. |
| Datos y cálculos | pandas, Pydantic, Pint y funciones Python | Profiling, unidades, EDA, Gower y estadística. |
| Interfaz dirigida por IA | Componentes React con esquema JSON; A2UI como ampliación | Actualizar tablas, gráficos, fuentes e hipótesis. |

PostgreSQL con pgvector mantiene los datos estructurados y la búsqueda vectorial en la misma infraestructura. La recuperación multimodal con Qwen3-VL se añade cuando aporte una ventaja demostrable para figuras o tablas; se prepara fuera del recorrido en vivo. [10–11]

El modelo distingue investigaciones, muestras, ensayos, condiciones sucesivas, observaciones, fuentes y regiones de evidencia. Guarda valor original, unidad, normalización y origen publicado, digitalizado, calculado o ilustrativo. Los identificadores se resuelven por fuente e investigación: una observación citada en dos artículos no se convierte en dos ensayos.

Los frentes de trabajo pueden repartirse, sin presuponer el tamaño del equipo: datos y evidencia; IA y herramientas; interfaz y escenarios; integración y presentación. Desde el primer bloque se integra un recorrido vertical. La revisión de datos y la narrativa avanzan durante todo el trabajo.

El producto inicial demuestra profundidad en un caso. La visión completa incluye cobertura de más familias experimentales, revisión especializada, modelos validados, diseño inverso y planificación de nuevas mediciones.

## Fuentes y referencias de implementación

Fuentes consultadas el 14 de noviembre de 2026. Las funcionalidades de FlameLab SI descritas en este documento son decisiones de diseño; las referencias siguientes respaldan el contexto del reto y la existencia de tecnologías o investigaciones relacionadas.

Documentos de partida: NASA_Fire_Safety_Challenge_Plan.md y la aportación del equipo sobre extracción, análisis por grupos comparables y ranking de evidencia. Esta propuesta integra ambas aportaciones y conserva el archivo original.

[1] Flame in Freefall y reproducción del enunciado por HackAthlone

[2] PaperQA2 y recuperación científica con citas

[3] Google AI co scientist

[4] LangGraph y orquestación con estado

[5] A2UI y respuestas mediante interfaces

[6] React Three Fiber

[7] NASA PSI investigaciones por área

[8] BoTorch y funciones de adquisición

[9] PySR y regresión simbólica

[10] pgvector

[11] Qwen3 VL Embedding

[12] Informe NASA BASS II y resultados de investigación

[13] NASA Materials Flammability Update y efectos de escala

[14] Documentación de Gower en daisy

[15] pdfplumber y extracción de tablas

Decisión propuesta para Los TTS: construir FlameLab SI como científico de misión. La pantalla central conectará ensayos reales de BASS-II, ranking explicable y fuente original; Saffire mostrará límites de transferencia. El laboratorio de escenarios y el diseño inverso comunicarán la ambición de una IA que también propone qué investigar después.

## Enlaces conservados

- https://hackathlone.com/challenges/flame-in-freefall
- https://github.com/Future-House/paper-qa
- https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/
- https://docs.langchain.com/oss/python/langgraph/overview
- https://developers.googleblog.com/a2ui-10-build-delightful-fast-reliable-agentic-experiences/
- https://r3f.docs.pmnd.rs/getting-started/introduction
- https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/
- https://botorch.readthedocs.io/en/stable/acquisition.html
- https://github.com/astroautomata/PySR
- https://github.com/pgvector/pgvector
- https://github.com/QwenLM/Qwen3-VL-Embedding
- https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf
- https://ntrs.nasa.gov/api/citations/20210021181/downloads/NASA%20Materials%20Flammability%20Update%20update%209.09.2021%20Final.pdf
- https://stat.ethz.ch/R-manual/R-devel/library/cluster/html/daisy.html
- https://github.com/jsvine/pdfplumber
