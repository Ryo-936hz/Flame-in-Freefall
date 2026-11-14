# ADR 0002 SQLite local y camino PostgreSQL

- Estado: Propuesta de diseño para implementación local; revisar contra el ZIP y el estado real del repositorio.
- Fecha: 14 de noviembre de 2026.
- Revisión: P1 y los responsables consumidores.

## Contexto

El equipo necesita arrancar sin Docker ni servicios de pago, pero la visión incluye persistencia relacional compartida y pgvector.

## Decisión

Usar SQLite para desarrollo rápido y PostgreSQL con pgvector mediante configuración y migraciones. Acceder mediante repositorio para separar motor y dominio.

## Consecuencias

Se deben verificar los motores realmente utilizados. El contenedor PostgreSQL o la extensión instalada no demuestran que la búsqueda vectorial esté poblada o validada. No añadir otra base equivalente sin ADR.

## Revisión futura

Si el código o el alcance exige cambiar esta decisión, añadir un ADR que la sustituya y enlazarlo aquí. No reescribir silenciosamente su significado.
