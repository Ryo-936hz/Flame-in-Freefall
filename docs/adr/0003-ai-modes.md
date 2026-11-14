# ADR 0003 Modo de demostración y proveedor configurable

- Estado: Propuesta de diseño para implementación local; revisar contra el ZIP y el estado real del repositorio.
- Fecha: 14 de noviembre de 2026.
- Revisión: P1 y los responsables consumidores.

## Contexto

Las credenciales y el acceso a modelos no son conocidos. La base debe permitir trabajo paralelo sin llamadas externas.

## Decisión

Ofrecer modo determinista demo y adaptador de proveedor externo configurado en servidor. El modo se conserva en la respuesta. El modelo se configura explícitamente.

## Consecuencias

No se presenta demo como inferencia externa. Los fallos del proveedor se comunican. La disponibilidad o posibles créditos de una suscripción se verifican en la cuenta, no se presuponen.

## Revisión futura

Si el código o el alcance exige cambiar esta decisión, añadir un ADR que la sustituya y enlazarlo aquí. No reescribir silenciosamente su significado.
