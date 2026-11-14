# P4 IA herramientas y revisión

## Cuándo comenzar

La base está integrada en `main`. Sigue [TEAM_START](../TEAM_START.md): crea una
rama nueva desde `origin/main` o conserva e integra tu rama existente mediante merge.
Comprueba el SHA común y la tarea actual en [TEAM_HANDOFF](../TEAM_HANDOFF.md).
Este paquete conserva las fronteras, objetivos y tareas del primer reparto; no
ordena rehacer funciones existentes. Consulta [IMPLEMENTATION_STATUS](../IMPLEMENTATION_STATUS.md)
y [VERIFICATION](../VERIFICATION.md) y acuerda el incremento concreto antes de editar.
El prompt maestro y BUILD_ORDER distinguen el proceso histórico de la continuidad vigente.

## Resultado del puesto

La IA aporta planificación y explicación. No conviertas una narración en cálculo ni supongas acceso a un modelo por el tipo de suscripción del equipo.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después AI_SYSTEM, SECURITY, EVALUATION, CONTRACTS, SCIENTIFIC_RULES y el código de proveedores.

## Área de trabajo

- `apps/api/src/flamelab/ai/`
- `pruebas del coordinador y proveedores`
- `prompts de ejecución del backend bajo su módulo`

Estas son fronteras de responsabilidad. Parte del código existente y consulta REPOSITORY_LAYOUT para las rutas todavía preparadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

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

Empieza con los contratos y fixtures de la referencia común comprobada. Un bloqueo de datos reales no impide trabajar en estados vacíos o conexiones con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `codex/p4-descripcion` y el prompt [de inicio](../prompts/P4_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.

## Incremento de planificador y revisión

El coordinador reconoce un catálogo interno limitado: comparar variando flujo,
cambiar el escenario entre gravedad lunar, microgravedad y terrestre, evaluar
evidencia disponible y detener solicitudes ambiguas o fuera de capacidad. Los
filtros públicos siguen siendo autoridad. Si una intención contradice un filtro
explícito, el plan informa el conflicto y no ejecuta herramientas. No se cambió el
contrato público.

El resumen externo no se publica: el informe conserva una síntesis generada desde
los resultados del programa. Las afirmaciones del proveedor requieren cita
recuperada y enlace coherente; la revisión rechaza cifras/unidades que no aparecen
en salidas calculadas, contradicciones de procedencia sintética y citas sin
solapamiento léxico con su contexto. Ese solapamiento solo es un filtro de
regresión; no valida que la fuente sostenga semánticamente la afirmación. La
revisión humana y las consultas etiquetadas siguen pendientes.

El informe diferencia fixtures sintéticos de documentos locales sin URL y conserva
el localizador documental. La aceptación se comprueba con proveedores simulados y
fixtures sintéticos; no acredita calidad de un proveedor real ni validez científica.
