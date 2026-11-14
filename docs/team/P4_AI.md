# P4 IA herramientas y revisión

## Cuándo comenzar

Este paquete se ejecuta después de crear y verificar una sola base común mediante el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Antes de ese hito, P1 coordina la inspección local y el esqueleto; el resto puede revisar datos, criterios y diseño sin duplicar contratos ni infraestructura. Los criterios siguientes son objetivos futuros, no capacidades entregadas.

## Resultado del puesto

La IA aporta planificación y explicación. No conviertas una narración en cálculo ni supongas acceso a un modelo por el tipo de suscripción del equipo.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después AI_SYSTEM, SECURITY, EVALUATION, CONTRACTS, SCIENTIFIC_RULES y el código de proveedores.

## Área de trabajo

- `apps/api/src/flamelab/ai/`
- `pruebas del coordinador y proveedores`
- `prompts de ejecución del backend bajo su módulo`

Las rutas futuras son fronteras de responsabilidad, no funciones ya implementadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Conectar director, recuperación, análisis, revisión e hipótesis mediante herramientas tipadas.
2. Conservar un modo demo explícito y un proveedor externo configurable.
3. Validar identificadores de citas y componentes de respuesta.
4. Implementar planificación de lenguaje natural como incremento separado si todavía manda el filtro explícito.
5. Añadir evaluación de insuficiencia de evidencia, errores, prompt injection y fidelidad a cálculos.

## Criterios de aceptación

- El modo sin clave funciona y se identifica como demo.
- El modo externo no cae silenciosamente a una respuesta falsa de éxito.
- Citas y trial_id referencian evidencia recuperada coherente.
- Las respuestas no presentan datos sintéticos como resultados NASA.
- Las acciones visuales usan el catálogo del contrato y no código ejecutable libre.

## Dependencias y revisión

P3 revisa interpretación; P1 revisa errores y configuración; P5 revisa paneles.

Cuando la base exista, empieza con los contratos y fixtures verificados en ese commit. Un bloqueo de datos reales no impide implementar tipos, estados vacíos o pruebas con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `feat/p4-descripcion` y el prompt [de inicio](../prompts/P4_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
