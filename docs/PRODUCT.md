# Producto y alcance

## Objetivo

FlameLab SI convierte una pregunta en una investigación visual de seguridad contra incendios espaciales. La IA organiza la búsqueda, prepara comparaciones, explica límites y propone qué estudiar después. El usuario puede comprobar la evidencia que respalda cada conclusión.

La demo pretende comunicar una visión ambiciosa mediante un recorrido acotado y verificable. No exige implementar todos los módulos de producción. Las capacidades preparadas, sintéticas e ilustrativas conservan su identificación.

## Usuario y pregunta central

Usuario principal: investigador o ingeniero que explora evidencia experimental. Usuario secundario: estudiante o jurado que necesita entender por qué una comparación es útil y dónde deja de serlo.

Pregunta guía: «Estoy estudiando materiales para un hábitat. ¿Qué evidencia permite analizar los efectos de la atmósfera y la ventilación, y qué debería investigar después?» El escenario lunar es un objetivo de aplicación, no una prueba de disponer de mediciones lunares equivalentes.

## Funciones conectadas

| Función | Resultado del usuario |
|---|---|
| Mission Brief | Objetivo y restricciones editables. |
| AI Scientist | Plan breve, recuperación de evidencia y uso de herramientas. |
| Evidence Canvas | Tabla, gráfico, ranking y documento original conectados. |
| Mission Lab | Escenarios A/B y cambios en la aplicabilidad de la evidencia. |
| Discovery Engine | Hipótesis y siguientes pruebas, identificadas como propuestas. |
| Mission Report | Síntesis de hallazgos, límites, fuentes y trabajo pendiente. |

El expediente de investigación es compartido por las funciones. Cambiar una condición debe cambiar los datos o la interpretación pertinente; no basta con cambiar el texto visible.

## Caso científico de la demo

Los presets BASS-II usan diez observaciones publicadas, correspondientes a siete
muestras, aprobadas por P3 para uso descriptivo limitado. Conservan segmentos,
fuentes, aviso M8 y ausencia de O₂ medido por segmento. La comparación 6→5 cm/s
describe cambios de evidencia recuperada; no demuestra causalidad exclusiva del flujo.
El corpus global conserva `scientific_unverified`.

Saffire aporta un contraste documental de material, escala, flujo y confinamiento,
con fuentes y discrepancias explícitas. El cierre adicional P2 incorpora su tarjeta
separada del análisis BASS-II. No mezcla tasas ni rankings entre campañas.
Si un documento ofrece extinción, duración o longitud, esas variables conservan
su identidad y no se presentan como velocidad de propagación.
Ver [paquete P2](handoffs/P2_DEMO.md), [dictamen P3](handoffs/P3_BASS_II_DECISION_DEMO.md)
y [estado de implementación](IMPLEMENTATION_STATUS.md).

SAME y FLEX pueden ofrecer navegación contextual hacia detección y supresión. No se presupone que el primer incremento ingiera todas las familias.

## Prioridades

1. Recorrido completo de consulta, selección, análisis y procedencia.
2. Comparación científica que responda a una pregunta concreta.
3. IA que use herramientas y construya respuestas visuales.
4. Laboratorio de escenarios y diseño inverso que hagan visible la visión del producto.
5. Ampliaciones cuantitativas condicionadas por datos adecuados.

## Fuera del núcleo inicial

No se requiere un simulador CFD validado, optimización universal de hábitats, entrenamiento de un modelo fundacional, clasificación universal de riesgo de materiales ni autonomía experimental real. El proyecto no certifica seguridad operacional. Clustering y detección de anomalías se posponen hasta validar recuperación y ranking.

## Interfaz implementada y evolución

La reserva inicial del frontend pertenece a la fase de construcción del esqueleto.
La petición posterior integró Evidence Canvas P5 con Mission Lab, informe y
recuperación P6 en `main`. Su recorrido utiliza filtros explícitos y presets;
la API ofrece planificación acotada, sin interpretación general de lenguaje natural.
La llama de la interfaz es conceptual. AskSI/CSS posteriores de P5 siguen en su
rama independiente y no se dan por terminados por esta integración.

La dirección visual de [DESIGN_ANDURIL](DESIGN_ANDURIL.md) continúa vigente.
Diseño inverso, CFD y autonomía experimental siguen siendo visión futura, no
requisitos ejecutables de la demo local. [DEMO](DEMO.md) y [VERIFICATION](VERIFICATION.md)
identifican el recorrido y las comprobaciones realmente ejecutadas.
