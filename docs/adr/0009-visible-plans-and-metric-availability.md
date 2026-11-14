# ADR 0009 — Plan visible, disponibilidad de métricas y síntesis acotada

Fecha: 14 de noviembre de 2026. Estado: aceptado e implementado para la demo.
Responsables: P1, P3 y P4 asumidos conjuntamente por petición del usuario.

## Problema

Los filtros estructurados eran la única autoridad pública, mientras la rama P4
interpretaba algunas palabras sin exponer un plan tipado. Además, comprobar una
métrica solo por ensayo antes del límite podía escoger un segmento sin esa medida
y ocultar otro ensayo respaldado. La revisión de relatos admitía números de otros
ensayos o de fuentes irrelevantes por coincidencia global.

## Decisión

1. Conservar `planning_mode=explicit` por defecto. Añadir `catalog` para tres
   intenciones deterministas: variar flujo, elegir gravedad y evaluar evidencia.
   Conflictos, negaciones, cantidades o texto fuera del catálogo requieren
   aclaración/formulario; no se eliminan silenciosamente.
2. Un único modelo canónico `ResearchPlan` sirve para previsualización y resultado.
   `POST /research/plan` no ejecuta ciencia, consulta corpus ni persiste. El plan
   se incluye en cada nuevo expediente; los anteriores conservan `plan=null`.
3. Research pasa la métrica a `rank_trials` para comprobar disponibilidad por
   ensayo/segmento antes de score y top-k. Ranking directo sigue por condiciones.
   A/B ofrece `metric` opcional con la misma semántica, sin romper clientes antiguos.
4. Proveedor externo opcional con resumen del programa y un catálogo de afirmaciones
   numéricas verificables por variable, ensayo y fuente del dato. Prosa libre,
   causalidad e inferencias no verificables se rechazan explícitamente. Los cálculos,
   selección, paneles e hipótesis preparadas permanecen bajo control de herramientas.
5. Publicar únicamente adiciones compatibles en el contrato; generar OpenAPI y
   TypeScript juntos. Guardar snapshots históricos sin reinterpretarlos.

## Alternativas descartadas

- Activar interpretación libre por defecto habría cambiado silenciosamente
  solicitudes existentes. El modo explícito mantiene su significado.
- Aumentar el límite del ranking no corrige la disponibilidad de métricas.
- Coincidencia de palabras, IDs existentes o cifras globales no prueban que una
  cita respalde la afirmación concreta. No se declara una revisión semántica general.
- Añadir otro LLM, servicios o contratos paralelos no es necesario para esta demo.

## Consecuencias y consumidores

P5/P6 pueden mostrar `plan`, llamar a la previsualización y enviar exactamente la
petición revisada. Deben distinguir bloqueo del plan de insuficiencia científica,
etiquetar `demo`, conservar procedencia y omitir X nula al trazar pares cuantitativos.
El corpus puede cambiar entre preview y ejecución; el resultado guardado conserva
el snapshot realmente usado. El contrato no implementa reservas ni trabajos en cola.

No se han realizado llamadas pagadas ni se afirma calidad de un modelo externo.
La validación científica de NASA, dudas P2, intervalos, CFD, diseño inverso y
despliegue público siguen fuera de esta entrega. Las verificaciones y su commit
se registran en VERIFICATION, no se deducen de este ADR.

Rutas: `domain/contracts.py`, `main.py`, `ai/`, `science/ranking.py`,
`packages/contracts/`, pruebas API/contrato/IA y `evals/{science,ai}`.
