# P6 Mission Lab hipótesis demo y coordinación QA

## Cuándo comenzar

Este paquete se ejecuta después de crear y verificar una sola base común mediante el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Antes de ese hito, P1 coordina la inspección local y el esqueleto; el resto puede revisar datos, criterios y diseño sin duplicar contratos ni infraestructura. Los criterios siguientes son objetivos futuros, no capacidades entregadas.

## Resultado del puesto

P6 no reimplementa el backend de hipótesis propiedad de P4. Define la experiencia y acuerda cambios de contrato con P1. La ambición visual debe hacer comprensible una investigación, no ocultar falta de evidencia.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después DEMO, PRODUCT, DESIGN_ANDURIL, AI_SYSTEM, EVALUATION y CONTRACTS.

## Área de trabajo

- `apps/web/src/features/mission-lab/ como frontera futura`
- `docs/DEMO.md y material de presentación`
- `evals/ como frontera futura coordinada con P3/P4`
- `pruebas de recorrido y guion coordinadas con P1`

Las rutas futuras son fronteras de responsabilidad, no funciones ya implementadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Diseñar escenarios A/B que muestren cómo cambia la evidencia aplicable.
2. Presentar hipótesis recibidas del backend y la siguiente prueba útil.
3. Construir la escena conceptual opcional conservando su etiqueta.
4. Mantener el guion, datos seleccionados y respaldo de presentación.
5. Coordinar aceptación de extremo a extremo y una consulta sin evidencia suficiente.

## Criterios de aceptación

- Cambiar un escenario produce diferencias observables y explicables.
- La respuesta de /scenarios/compare se presenta como comparación de evidencia, no simulación física.
- Hipótesis muestran fundamento, alternativa y condición de refutación.
- La demo distingue funcional, precalculado e ilustrativo.
- El recorrido está vinculado a un commit y tiene un caso de respaldo identificado.

## Dependencias y revisión

P5 revisa integración visual; P3 revisa ciencia; P4 revisa hipótesis; P1 revisa el recorrido.

Cuando la base exista, empieza con los contratos y fixtures verificados en ese commit. Un bloqueo de datos reales no impide implementar tipos, estados vacíos o pruebas con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `feat/p6-descripcion` y el prompt [de inicio](../prompts/P6_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
