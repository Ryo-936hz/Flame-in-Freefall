# Diccionario conceptual de datos

Los nombres propuestos de campos, enumeraciones y formatos están en [CONTRACT_MODELS](CONTRACT_MODELS.md) y [CONTRACTS](CONTRACTS.md). Se revisarán contra los datos locales antes de implementarlos. Este documento explica el significado científico; no define una API alternativa.

## Entidades

| Entidad | Significado | Error que se evita |
|---|---|---|
| Investigación | Campaña o estudio que agrupa trabajo experimental. | Asignar una sola atmósfera a toda una campaña. |
| Muestra | Objeto físico utilizado en uno o varios pasos. | Contar la misma muestra como muchas réplicas. |
| Ensayo | Ejecución experimental identificable. | Confundir artículo y ensayo. |
| Condición | Estado o configuración durante un ensayo. | Tratar un cambio de ventilación como un ensayo independiente sin evidencia. |
| Observación | Medición o resultado bajo condiciones determinadas. | Mezclar valores de momentos o configuraciones diferentes. |
| Evidencia | Fragmento, tabla, figura o segmento que respalda un dato. | Dar una URL genérica como respaldo de cualquier afirmación. |
| Escenario | Condiciones y objetivo que el usuario quiere investigar. | Presentar una intención de diseño como experimento real. |
| Hipótesis | Explicación o alternativa que se propone comprobar. | Presentar generación de IA como hallazgo validado. |

## Condiciones relevantes

Material y formulación, geometría, espesor o diámetro, dimensiones de muestra, concentración de oxígeno, presión, velocidad y dirección del flujo, régimen gravitatorio, instrumentos y condiciones de ignición. No todas estarán disponibles; su ausencia tiene significado.

La unidad canónica de cada variable se acuerda en el contrato. Conservar siempre el valor y unidad originales. Para oxígeno se debe conocer si se informa porcentaje, fracción, concentración u otra base. Para presión se debe distinguir absoluta de manométrica. Una herramienta de unidades no resuelve por sí sola estas diferencias semánticas.

## Estados de dato ausente

Distinguir al menos conceptualmente: no medido, no informado, no aplicable y todavía no extraído. Mapearlos a las enumeraciones exactas del contrato. Nunca sustituir por cero, cadena vacía o un valor plausible generado por IA.

## Materiales

PMMA puede normalizarse a una familia de material. La palabra «acrílico» necesita confirmación contextual antes de vincularse a esa familia. Mantener nombre original, grado, color, aditivos y tratamiento cuando estén disponibles. No borrar diferencias de muestra para aumentar artificialmente el tamaño del grupo.

## Procedencia mínima

Una observación debe poder conducir a la investigación, el ensayo, el archivo y la ubicación relevante. Registrar si el valor fue publicado en tabla, leído de texto, digitalizado, calculado o creado como fixture. Si se digitaliza un gráfico, conservar eje, transformación y precisión estimada; no presentar más cifras significativas que las justificadas.

## Identidad y duplicados

La clave de un ensayo debe estar delimitada por investigación/fuente, no únicamente por sus condiciones. Dos ensayos bajo condiciones iguales pueden ser réplicas válidas. Dos artículos pueden describir el mismo ensayo. Los identificadores importados se conservan junto a la identidad interna.

## Unidades experimentales

Mantener separados número de observaciones, condiciones, ensayos y muestras independientes. Los resúmenes e intervalos deben indicar cuál es su denominador. El dato sintético conserva una marca que se propaga hasta la respuesta del usuario.
