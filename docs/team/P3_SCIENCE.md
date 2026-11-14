# P3 Análisis científico ranking y comparación

## Cuándo comenzar

Este paquete se ejecuta después de crear y verificar una sola base común mediante el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Antes de ese hito, P1 coordina la inspección local y el esqueleto; el resto puede revisar datos, criterios y diseño sin duplicar contratos ni infraestructura. Los criterios siguientes son objetivos futuros, no capacidades entregadas.

## Resultado del puesto

El objetivo de tu fase de desarrollo será un ranking defendible y una comparación útil. No añadas clustering o una regresión sofisticada antes de evaluar el recorrido básico.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después SCIENTIFIC_RULES, DATA_DICTIONARY, EVALUATION, CONTRACTS y el README de science.

## Área de trabajo

- `apps/api/src/flamelab/science/`
- `pruebas de ranking comparación y perfil`
- `evaluaciones científicas coordinadas con P6`

Las rutas futuras son fronteras de responsabilidad, no funciones ya implementadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Definir elegibilidad a partir de pregunta, variable estudiada y condiciones críticas.
2. Mantener Gower ponderado reproducible con cobertura separada.
3. Construir grupos comparables y gráficos con unidades y tamaño muestral.
4. Revisar independencia de muestras antes de intervalos o regresión.
5. Evaluar el top 3 con consultas etiquetadas y una reserva no usada para ajustar pesos.

## Criterios de aceptación

- Un campo crítico ausente produce un estado explícito de aplicabilidad.
- La variable de vary puede cambiar y no contradice required_match.
- Los pesos y rangos están documentados; la IA no modifica puntuaciones calculadas.
- Puntos, grupos y medianas tienen procedencia y unidad experimental explícitas.
- Saffire no se agrega automáticamente a BASS-II sin comprobar configuración.

## Dependencias y revisión

P2 revisa datos y unidades; P4 revisa salida de herramientas; P5 revisa necesidades del gráfico.

Cuando la base exista, empieza con los contratos y fixtures verificados en ese commit. Un bloqueo de datos reales no impide implementar tipos, estados vacíos o pruebas con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `feat/p3-descripcion` y el prompt [de inicio](../prompts/P3_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
