# ADR 0005 Compatibilidad antes de similitud

- Estado: Propuesta de diseño para implementación local; revisar contra el ZIP y el estado real del repositorio.
- Fecha: 14 de noviembre de 2026.
- Revisión: P1 y los responsables consumidores.

## Contexto

Ordenar documentos por similitud textual no permite comparar condiciones físicas ni estimar peligrosidad.

## Decisión

Aplicar restricciones de elegibilidad y luego Gower ponderado para condiciones mixtas. Mantener cobertura y razones. Permitir variar la variable estudiada según la pregunta.

## Consecuencias

La distancia no es confianza ni riesgo. Datos críticos ausentes tienen estado explícito. Pesos y rangos se versionan y se evalúan con consultas revisadas.

## Revisión futura

Si el código o el alcance exige cambiar esta decisión, añadir un ADR que la sustituya y enlazarlo aquí. No reescribir silenciosamente su significado.
