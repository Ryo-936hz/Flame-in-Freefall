# P2 Datos extracción y procedencia

## Cuándo comenzar

Este paquete se ejecuta después de crear y verificar una sola base común mediante el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Antes de ese hito, P1 coordina la inspección local y el esqueleto; el resto puede revisar datos, criterios y diseño sin duplicar contratos ni infraestructura. Los criterios siguientes son objetivos futuros, no capacidades entregadas.

## Resultado del puesto

El ZIP no fue leído al generar la base. No afirmes que un campo o vídeo existe sin inspeccionarlo. Una tabla plausible no es un sustituto de datos reales.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después FACTS_AND_UNKNOWNS, DATA_DICTIONARY, DATA_INGESTION, SCIENTIFIC_RULES, SOURCES y CONTRACTS.

## Área de trabajo

- `apps/api/src/flamelab/data/`
- `data/catalog/`
- `data/fixtures/`
- `data/raw/ y data/processed/ como trabajo local`
- `pruebas de ingesta y validación de datos`

Las rutas futuras son fronteras de responsabilidad, no funciones ya implementadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Inventariar el ZIP local sin ejecutar su contenido ni asumir su estructura.
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

Cuando la base exista, empieza con los contratos y fixtures verificados en ese commit. Un bloqueo de datos reales no impide implementar tipos, estados vacíos o pruebas con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `feat/p2-descripcion` y el prompt [de inicio](../prompts/P2_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
