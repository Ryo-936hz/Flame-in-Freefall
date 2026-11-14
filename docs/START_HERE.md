# Empieza aquí

**Incremento actual:** [entrega conjunta P1/P3/P4](INTEGRATION_P134.md), rama `raul`.
El catálogo opt-in de preguntas, plan público y disponibilidad por segmento están
implementados. Los datos P2 están integrados y siguen sin revisión científica
aprobada. Para estado vigente y pruebas, consultar IMPLEMENTATION_STATUS y VERIFICATION.
La guía y referencias iniciales de abajo se conservan como historial de arranque.

FlameLab SI es la base compartida de Los TTS: API, SQLite, ingesta, ciencia,
coordinación demo y cliente TypeScript con arnés React. Para clonar, arrancar y
elegir tarea, usar [TEAM_START](TEAM_START.md). El frontend de producto sigue pendiente.

## Estado local al 14 de noviembre de 2026

- Integración: `main` en GitHub; referencia de arranque para los seis: `origin/codex/team-start-v1`. Crear rama propia desde ella según [TEAM_START](TEAM_START.md).
- The default demo uses 2 studies, 5 trials and 6 **synthetic** observations. The standalone catalog still contains 24 metadata-only investigations. The integrated P2 import covers six campaigns with outcomes, one with configurations and seventeen documentary studies; scientific status remains unverified. See [P2_NASA_24](P2_NASA_24.md).
- SQLite y modo demo comprobados localmente y en CI GitHub Windows/Linux. Proveedor externo probado con HTTP simulado, sin llamadas reales. PostgreSQL base verificado en CI; pgvector pendiente; ejecuciones en [VERIFICATION](VERIFICATION.md).
- [README](../README.md) y [SETUP_WINDOWS](SETUP_WINDOWS.md) contienen comandos reales; [VERIFICATION](VERIFICATION.md) conserva resultados, entorno y límites.

## Primera lectura para cualquier asistente

1. [AGENTS](../AGENTS.md): reglas del repositorio y fuentes de autoridad.
2. [Producto](PRODUCT.md): resultado esperado y alcance.
3. [Hechos e incógnitas](FACTS_AND_UNKNOWNS.md): qué se conoce y qué no.
4. [Contratos](CONTRACTS.md) y [modelos](CONTRACT_MODELS.md): nombres y formatos compartidos; la autoridad es `apps/api/src/flamelab/domain/contracts.py`.
5. [Estado de implementación](IMPLEMENTATION_STATUS.md): qué existe realmente.
6. [Flujo de equipo](WORKFLOW.md) y tu paquete de trabajo.

Para continuar en Windows, utiliza [preparación local](SETUP_WINDOWS.md) y el [relevo de equipo](TEAM_HANDOFF.md). El [prompt maestro](LOCAL_CODEX_MASTER_PROMPT.md) y el [orden de construcción](BUILD_ORDER.md) conservan los requisitos de arranque; la [estructura](REPOSITORY_LAYOUT.md) identifica código y fronteras futuras. Los seis puestos deben partir de la misma referencia verificada y de sus propios clones/ramas. Después lee solo los documentos necesarios para tu tarea.

## Reparto de las seis personas

| Persona | Área | Paquete | Prompt inicial |
|---|---|---|---|
| P1 | Integración, API, infraestructura y contratos | [P1](team/P1_INTEGRATION.md) | [Inicio P1](prompts/P1_START.md) |
| P2 | Datos, extracción y procedencia | [P2](team/P2_DATA.md) | [Inicio P2](prompts/P2_START.md) |
| P3 | Ciencia, ranking y análisis | [P3](team/P3_SCIENCE.md) | [Inicio P3](prompts/P3_START.md) |
| P4 | IA, herramientas y revisión de respuestas | [P4](team/P4_AI.md) | [Inicio P4](prompts/P4_START.md) |
| P5 | Evidence Canvas e interfaz científica | [P5](team/P5_FRONTEND.md) | [Inicio P5](prompts/P5_START.md) |
| P6 | Mission Lab, hipótesis, demo y coordinación QA | [P6](team/P6_MISSION_DEMO.md) | [Inicio P6](prompts/P6_START.md) |

P1–P6 son puestos, no personas identificadas. El equipo debe asignar sus nombres y usuarios GitHub; el repositorio no presupone quién corresponde a cada puesto.

## Lectura por problema

- Datos: [diccionario](DATA_DICTIONARY.md), [ingesta](DATA_INGESTION.md), [reglas científicas](SCIENTIFIC_RULES.md), [fuentes](SOURCES.md).
- Implementación: [arquitectura](ARCHITECTURE.md), [contratos](CONTRACTS.md), [pruebas](TESTING.md), [seguridad](SECURITY.md).
- IA: [sistema de IA](AI_SYSTEM.md), [evaluación](EVALUATION.md), [catálogo de prompts](prompts/README.md).
- Producto: [diseño visual](DESIGN_ANDURIL.md), [demo](DEMO.md), [aceptación](ACCEPTANCE_CRITERIA.md).
- Contexto de asistentes: [mapa de autoridades](AI_CONTEXT_MAP.md).
- Coordinación: [decisiones](DECISIONS.md), [preguntas abiertas](OPEN_QUESTIONS.md), [relevo](prompts/HANDOFF_TEMPLATE.md), [ADRs](adr/README.md).

## Datos antes de ampliar

El ZIP de `C:\Users\user\Desktop\NASA\Documents` se ha inventariado sin modificar el original. Lee [DATA_INSPECTION](DATA_INSPECTION.md): existe una tabla BASS-II candidata con condiciones sucesivas, pero quedan cuestiones de unidades, asociación temporal e independencia por resolver. El inventario no equivale a validar observaciones científicas ni a autorizar redistribuir originales.
