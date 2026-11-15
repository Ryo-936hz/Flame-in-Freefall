# Dirección visual inspirada en sistemas de Anduril

> **Registro histórico del diseño anterior.** Desde el incremento AI Research, `raul` adopta el dashboard de `main` (`d46d27b`). El alcance vigente y su guion están en [AI_RESEARCH_CASE](AI_RESEARCH_CASE.md). Las secciones siguientes conservan el experimento anterior y sus pruebas.

## Composición experimental vigente en `raul`

La petición actual prueba una interfaz de cinco pantallas, separando la tarea
principal del detalle que se consulta bajo demanda. Conserva los tokens de color,
tipografía y contraste de la interfaz integrada, incluidos los temas oscuro y claro.
La referencia estable sigue siendo `main`, `4833000d98fcb9d197a01e4d7622c8639115131d`; este rediseño
permanece en `raul` y no se fusiona en `main` como parte del experimento.

| Pantalla | Función principal |
|---|---|
| Research | Pregunta, métrica y filtros explícitos con controles desplegables. |
| Results | Datos o conclusiones del expediente seleccionado; fuentes en un panel modal lateral. |
| Lab | Casos BASS-II, escenarios A/B o hipótesis y consultas, con una vista visible cada vez. |
| Library | Estudios del corpus activo y contexto documental Saffire en vistas separadas. |
| Reports | Informe guardado, recuperación y reproducción de eventos. |

Las pantallas permanecen montadas al navegar; las selecciones y resultados se
conservan. Las advertencias científicas activas mantienen su jerarquía y las
explicaciones extensas usan desplegables. El panel de fuentes conserva la
distinción entre evidencia guardada en el expediente y evidencia del corpus activo.
[Guion, alcance y límites del experimento](UX_EXPERIMENT_RAUL.md).

## Antecedentes de diseño

El mandato inicial y la composición por zonas que siguen se conservan como
historial. La propuesta de paneles simultáneos y el host anterior de tres columnas
no describen la composición experimental de cinco pantallas.

## Mandato del usuario

El frontend futuro debe seguir una estética de sistemas de software de Anduril. Esta referencia guía composición, densidad y jerarquía. No implica copiar su interfaz exacta, sus activos, su logotipo ni afirmar relación con la empresa. Referencia pública: https://www.anduril.com/.

El esqueleto que se implemente después no deberá desarrollar el frontend final. Su interfaz técnica servirá para comprobar contratos y conexiones. P5 y P6 aplicarán esta dirección después de estabilizar el recorrido.

## Intención

Una estación de trabajo científica sobria: información densa pero legible, paneles persistentes, control claro de escenario, estado visible y acceso inmediato a evidencia. La atención se dirige a la decisión y su fundamento.

## Propuesta de lenguaje visual

- Fondo oscuro grafito, superficies ligeramente diferenciadas y bordes discretos.
- Tipografía sans legible para contenido; monoespaciada reservada a identificadores, unidades y valores tabulares.
- Acento limitado para selección y actividad. Rojo/ámbar solo para estados definidos, nunca para insinuar peligrosidad no calculada.
- Tablas compactas con alineación numérica, unidades visibles y encabezados persistentes.
- Mapas o escenas conceptuales subordinados a la investigación; no decoraciones de combate.
- Transiciones breves y estados de carga reales. Evitar escáneres, alertas o animaciones que simulen análisis inexistentes.

Estos son criterios de diseño propuestos para FlameLab, no una descripción certificada de componentes internos de Anduril.

## Composición histórica de la pantalla principal

| Zona | Contenido |
|---|---|
| Cabecera | Investigación, escenario, modo de datos y estado del sistema. |
| Lateral de escenario | Objetivo, restricciones, filtros y escenarios A/B. |
| Área central | Gráfico de ensayos y comparación persistente. |
| Panel de ranking | Resultados, similitud, cobertura y razones. |
| Panel de evidencia | Documento, página, figura y metadatos del dato seleccionado. |
| Conversación | Preguntas, acciones y resultados de herramientas observables. |

El chat no debe empujar la comparación fuera de pantalla. Un punto, una fila y una fuente se mantienen vinculados por identidad de ensayo/observación.

## Accesibilidad y semántica

Contraste suficiente, foco visible, navegación por teclado y alternativas textuales a gráficos. No codificar un estado solo mediante color. Mantener legibles las etiquetas «Datos sintéticos», «Hipótesis IA», «Resultado precalculado» y «Simulación ilustrativa» donde corresponda.

## Estados que se diseñan desde el inicio

Sin datos; cargando; respuesta parcial; fuente ausente; datos sintéticos; incompatibilidad; evidencia insuficiente; proveedor no configurado; error recuperable. Ninguno debe quedar como pantalla vacía o gráfico con ceros inventados.

## Entrega visual

P5 controla el marco y Evidence Canvas. P6 controla el contenido específico de Mission Lab dentro de una frontera acordada. Ambos usan tokens y componentes compartidos; no crean dos sistemas de estilos.
