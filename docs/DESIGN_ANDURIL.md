# Dirección visual inspirada en sistemas de Anduril

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

## Composición de la pantalla principal

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
