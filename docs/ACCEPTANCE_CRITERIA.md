# Criterios de aceptación

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
- Comparación BASS/Saffire conserva diferencias de configuración.

## IA

- Usa herramientas con entradas y salidas validadas.
- Mantiene referencias a evidencia conocida.
- No modifica cálculos deterministas.
- Reconoce límites e insuficiencia de datos.
- Etiqueta hipótesis y modos de ejecución.
- Maneja errores del proveedor sin fingir éxito.

## Interfaz de producto futura

- Tabla, gráfico, ranking y fuente se mantienen conectados.
- La conversación modifica el análisis de forma observable.
- Se distingue observado, calculado, sintético e ilustrativo.
- Estados vacíos y errores son comprensibles.
- Teclado, foco, contraste y unidades son utilizables.

## Cierre de una tarea

PR con alcance claro, pruebas pertinentes ejecutadas y documentación actualizada. Las limitaciones se describen con precisión. Una tarea que prepara una conexión no declara que el algoritmo futuro esté terminado.
