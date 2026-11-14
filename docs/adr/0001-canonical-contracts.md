# ADR 0001 Contratos canónicos y monorepo

- Estado: Propuesta de diseño para implementación local; revisar contra el ZIP y el estado real del repositorio.
- Fecha: 14 de noviembre de 2026.
- Revisión: P1 y los responsables consumidores.

## Contexto

Seis personas y asistentes necesitan intercambiar datos sin definir seis formatos incompatibles.

## Decisión

Los modelos Pydantic del dominio son la autoridad. OpenAPI y tipos TypeScript se generan desde la API. JSON usa los nombres del contrato. P1 coordina cambios y consumidores.

## Consecuencias

Los generados no se editan a mano. Un cambio incompatible requiere regeneración y pruebas del productor y consumidor. El monorepo permite revisar ambos en la misma PR.

## Revisión futura

Si el código o el alcance exige cambiar esta decisión, añadir un ADR que la sustituya y enlazarlo aquí. No reescribir silenciosamente su significado.
