# Criterios de aceptación

Estos criterios describen comportamiento, no certifican su ejecución. El alcance
actual y las pruebas por SHA están en [IMPLEMENTATION_STATUS](IMPLEMENTATION_STATUS.md)
y [VERIFICATION](VERIFICATION.md); [DEMO](DEMO.md) define los recorridos reproducibles.

## Esqueleto común

- Un nuevo clon puede seguir el README para iniciar el modo local sin credenciales externas.
- API y cliente comparten contratos generados.
- Existe un recorrido de investigación que conecta datos, ciencia, IA y representación estructurada.
- La persistencia y sus migraciones están identificadas; se distingue qué motores se probaron.
- Los fixtures son explícitamente sintéticos y conservan su marca en las respuestas.
- Los errores por datos ausentes, identificadores desconocidos y proveedor no configurado son explícitos.

## Datos reales

- Archivo original y procedencia identificables.
- Valores, unidades y condición de extracción conservados.
- Identidad de ensayo y observación coherente.
- Campos ausentes sin sustitución por cero.
- Datos de la demo revisados contra sus fuentes.
- Licencia y redistribución documentadas.

## Ciencia

- Elegibilidad antes de similitud.
- Cobertura separada del ranking.
- La variable estudiada puede variar según la pregunta.
- Restricciones y exclusiones son inspeccionables.
- Estadísticas respetan unidad experimental.
- El contraste documental BASS/Saffire conserva diferencias de material, escala, flujo y confinamiento; no implica una comparación numérica entre campañas.

## IA

- Usa herramientas con entradas y salidas validadas.
- Mantiene referencias a evidencia conocida.
- No modifica cálculos deterministas.
- Reconoce límites e insuficiencia de datos.
- Etiqueta hipótesis y modos de ejecución.
- Maneja errores del proveedor sin fingir éxito.

## Interfaz de la demo integrada

- Tabla, gráfico, ranking y fuente se mantienen conectados por identidad y origen de expediente/corpus.
- Al ejecutar un nuevo análisis, los filtros, la métrica y los escenarios producen cambios observables. Mission Lab identifica sus resultados anteriores al cambiar entradas. Evidence Canvas conserva el expediente guardado con su ID, fecha, pregunta y métrica del resultado, sin reinterpretarlo como respuesta a los filtros editados.
- Se distingue observado, calculado, sintético e ilustrativo.
- Estados vacíos y errores son comprensibles.
- Teclado, foco, contraste y unidades son utilizables.

- Informe y recuperación conservan el contenido del servidor; Reset o una nueva investigación descartan respuestas tardías.
- El catálogo muestra estudios, registros y fuentes disponibles; una tarjeta documental no afirma que el corpus esté importado.

## Evolución futura de conversación

La conversación podrá modificar el análisis mediante acciones tipadas. La demo
actual usa filtros/presets explícitos y un catálogo acotado por API; no exige
lenguaje natural general ni un proveedor externo real. El incremento AskSI de P5
se revisa por separado, conservando fuentes históricas y guardas.

## Cierre de una tarea

PR con alcance claro, pruebas pertinentes ejecutadas y documentación actualizada. Las limitaciones se describen con precisión. Una tarea que prepara una conexión no declara que el algoritmo futuro esté terminado.
