# ADR 0004 Procedencia y separación de fixtures

- Estado: Propuesta de diseño para implementación local; revisar contra el ZIP y el estado real del repositorio.
- Fecha: 14 de noviembre de 2026.
- Revisión: P1 y los responsables consumidores.

## Contexto

La estructura de datos debe desarrollarse antes de disponer de un corpus científico revisado.

## Decisión

Usar fixtures sintéticos identificados y catálogo de fuentes separado. Propagar la procedencia en puntos, rankings, evidencia y respuestas. Por defecto no admitir fixtures como evidencia científica.

## Consecuencias

Los metadatos NASA no respaldan cifras sintéticas. La importación real exige referencias e integridad. Una validación del software con fixtures no demuestra un resultado experimental.

## Revisión futura

Si el código o el alcance exige cambiar esta decisión, añadir un ADR que la sustituya y enlazarlo aquí. No reescribir silenciosamente su significado.
