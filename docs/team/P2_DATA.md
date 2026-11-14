# P2 Datos extracción y procedencia

## Cuándo comenzar

La base integrada ya existe. Sigue [TEAM_START](../TEAM_START.md), crea tu rama desde `origin/codex/team-start-v1` y comprueba el SHA común antes de comenzar. El prompt maestro y BUILD_ORDER conservan el proceso de construcción. Este paquete define las siguientes tareas del puesto; consulta IMPLEMENTATION_STATUS y VERIFICATION para distinguir lo ya ejecutado de lo pendiente.

## Resultado del puesto

El ZIP ya se inspeccionó y la extracción 1.1 contiene un catálogo de 24 estudios con datos o configuraciones estructurados en siete campañas. El [relevo P2 de la demo](../handoffs/P2_DEMO.md) documenta los diez puntos BASS-II aprobados por P3 para el guion descriptivo, el aviso M8, el caso lunar y el contraste Saffire.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después FACTS_AND_UNKNOWNS, DATA_DICTIONARY, DATA_INGESTION, SCIENTIFIC_RULES, SOURCES y CONTRACTS.

## Área de trabajo

- `apps/api/src/flamelab/data/`
- `data/catalog/`
- `data/fixtures/`
- `data/raw/ y data/processed/ como trabajo local`
- `pruebas de ingesta y validación de datos`

Estas son fronteras de responsabilidad. Parte del código existente y consulta REPOSITORY_LAYOUT para las rutas todavía preparadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Revisar el inventario existente y verificar el hash del ZIP disponible; inventariar de nuevo solo si cambia la fuente, sin ejecutar contenido.
2. Resolver catálogo PSI/NTRS, licencia y archivos de la serie BASS-II candidata.
3. Extraer tablas y relaciones condición–observación con localizadores.
4. Normalizar unidades y materiales conservando origen, ausencias y formulación.
5. Validar e importar de forma idempotente; separar metadatos reales de observaciones sintéticas.

## Criterios de aceptación

- Cada observación de la demo abre su fuente y localizador correctos.
- Una importación repetida no duplica el mismo ensayo.
- Dos réplicas distintas bajo iguales condiciones se conservan.
- Los datos ausentes no se convierten en ceros y los originales siguen recuperables.
- Existe un informe de calidad con incidencias y decisiones de revisión.

## Dependencias y revisión

P3 revisa semántica y comparabilidad; P1 revisa importación y persistencia.

Empieza con los contratos y fixtures de la referencia común comprobada. Un bloqueo de datos reales no impide trabajar en estados vacíos o conexiones con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `codex/p2-descripcion` y el prompt [de inicio](../prompts/P2_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
