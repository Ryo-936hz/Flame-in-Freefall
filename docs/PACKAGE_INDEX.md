# Índice del paquete de contexto

El paquete original contenía únicamente Markdown. La aplicación está ahora
integrada en `main` (PR #3, `0b732cb`) y conserva ese historial documental. El
equipo parte de `origin/main` y mantiene un solo contrato. El cierre adicional P2
está implementado y verificado localmente en `raul`, código `20aab80404fc2f0fc188d718cac47d0d4bf31d54`,
entregado mediante la PR #4 sobre `main`. Su [guía de integración](INTEGRATION_P2_MAIN.md)
y [verificación](VERIFICATION.md) identifican alcance, arranque real y pruebas por SHA.
Las propuestas futuras no se describen como capacidades ya implementadas.

## Recorrido inicial

1. Lee [README](../README.md) y [AGENTS](../AGENTS.md).
2. Sigue [TEAM_START](TEAM_START.md) y [SETUP_WINDOWS](SETUP_WINDOWS.md) para arrancar; [TEAM_HANDOFF](TEAM_HANDOFF.md) fija la continuidad. Para el corpus real, utiliza [INTEGRATION_P2_MAIN](INTEGRATION_P2_MAIN.md).
3. Confirma [hechos e incógnitas](FACTS_AND_UNKNOWNS.md), [estado](IMPLEMENTATION_STATUS.md) y [verificaciones](VERIFICATION.md).
4. Usa [PRODUCT](PRODUCT.md), [ARCHITECTURE](ARCHITECTURE.md) y los [contratos](CONTRACTS.md) para ampliar el recorrido integrado. El [prompt maestro](LOCAL_CODEX_MASTER_PROMPT.md) conserva el mandato de arranque.
5. Coordina el incremento de P1–P6 siguiendo [WORKFLOW](WORKFLOW.md) y el relevo vigente. El host P5/P6 ya está integrado; conserva las ramas y los cambios posteriores de cada puesto.

## Qué aporta cada bloque

| Bloque | Propósito |
|---|---|
| Producto y referencia | Conservar la idea aprobada, la ambición de IA y los límites de la demo. |
| Contratos | Evitar que cada asistente invente campos, rutas y formas de comunicación. |
| Ciencia y datos | Mantener procedencia, comparabilidad, unidades y ausencia de evidencia. |
| IA | Conectar herramientas y explicaciones con citas, evaluación y límites verificables. |
| Implementación | Instalar, comprobar y mantener la base compartida; conservar el proceso inicial como historia. |
| Equipo y prompts | Delimitar responsables, archivos compartidos, dependencias y relevos. |
| Diseño | Conservar la dirección visual y los límites de la interfaz implementada; distinguir evolución futura de funciones actuales. |
| ADR | Explicar por qué se eligió cada decisión y cómo cambiarla sin incoherencia. |

## Índice documental

- [.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) — PULL_REQUEST_TEMPLATE.
- [AGENTS.md](../AGENTS.md) — Instrucciones de trabajo para FlameLab SI.
- [README.md](../README.md) — Ejecución de la base integrada y alcance.
- [docs/ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md) — Criterios de aceptación.
- [docs/AI_CONTEXT_MAP.md](AI_CONTEXT_MAP.md) — Mapa de contexto para asistentes.
- [docs/AI_SYSTEM.md](AI_SYSTEM.md) — Sistema de IA.
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — Arquitectura.
- [docs/BUILD_ORDER.md](BUILD_ORDER.md) — Orden de construcción de la base compartida.
- [docs/CONTRACTS.md](CONTRACTS.md) — Operaciones y contrato local implementado.
- [docs/CONTRACT_MODELS.md](CONTRACT_MODELS.md) — Modelos y diferencias respecto de la propuesta.
- [docs/DATA_DICTIONARY.md](DATA_DICTIONARY.md) — Diccionario conceptual de datos.
- [docs/DATA_INGESTION.md](DATA_INGESTION.md) — Ingesta de datos.
- [docs/DECISIONS.md](DECISIONS.md) — Registro de decisiones.
- [docs/DEMO.md](DEMO.md) — Demo y narrativa.
- [docs/DESIGN_ANDURIL.md](DESIGN_ANDURIL.md) — Dirección visual inspirada en sistemas de Anduril.
- [docs/EVALUATION.md](EVALUATION.md) — Evaluación de ciencia e IA.
- [docs/FACTS_AND_UNKNOWNS.md](FACTS_AND_UNKNOWNS.md) — Hechos decisiones e incógnitas.
- [docs/IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — Estado real de la base y pendientes.
- [docs/INTEGRATION_P2_MAIN.md](INTEGRATION_P2_MAIN.md) — Integración vigente, arranque compartido e importación Windows del corpus P2.
- [docs/INTEGRATION_P134.md](INTEGRATION_P134.md) — Historial del cierre de backend P1/P3/P4.
- [docs/P2_NASA_24.md](P2_NASA_24.md) — Cobertura, extracción y límites del corpus de 24 estudios.
- [docs/P2_SOURCE_AUDIT.md](P2_SOURCE_AUDIT.md) — Auditoría de fuentes y alcance del dictamen posterior.
- [docs/P2_SAFFIRE_CONTEXT.md](P2_SAFFIRE_CONTEXT.md) — Contraste documental Saffire y discrepancias de fuentes.
- [docs/handoffs/P2_DEMO.md](handoffs/P2_DEMO.md) — Paquete interno P2 1.1.1, casos y condiciones de uso.
- [docs/handoffs/P3_BASS_II_DECISION_DEMO.md](handoffs/P3_BASS_II_DECISION_DEMO.md) — Conformidad descriptiva limitada y diez puntos identificados.
- [docs/handoffs/P6.md](handoffs/P6.md) — Alcance de Mission Lab, informe y recuperación.
- [docs/LOCAL_CODEX_MASTER_PROMPT.md](LOCAL_CODEX_MASTER_PROMPT.md) — Prompt maestro histórico de arranque local.
- [docs/OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) — Preguntas abiertas.
- [docs/PRODUCT.md](PRODUCT.md) — Producto y alcance.
- [docs/PRODUCT_REFERENCE.md](PRODUCT_REFERENCE.md) — Referencia de producto aprobada.
- [docs/REPOSITORY_LAYOUT.md](REPOSITORY_LAYOUT.md) — Estructura y fronteras futuras.
- [docs/SCIENTIFIC_RULES.md](SCIENTIFIC_RULES.md) — Reglas científicas.
- [docs/SECURITY.md](SECURITY.md) — Seguridad y límites de confianza.
- [docs/SETUP_WINDOWS.md](SETUP_WINDOWS.md) — Preparación para Codex local en Windows.
- [docs/SOURCES.md](SOURCES.md) — Fuentes y referencias.
- [docs/START_HERE.md](START_HERE.md) — Empieza aquí.
- [docs/TESTING.md](TESTING.md) — Estrategia de pruebas.
- [docs/WORKFLOW.md](WORKFLOW.md) — Trabajo de seis personas con asistentes.
- [docs/DATA_INSPECTION.md](DATA_INSPECTION.md) — Inventario real, hallazgos y límites de extracción.
- [docs/TEAM_HANDOFF.md](TEAM_HANDOFF.md) — Referencia común y reparto de siguientes incrementos.
- [docs/TEAM_START.md](TEAM_START.md) — Clon nuevo desde main, rama propia y actualización conservando cambios.
- [docs/VERIFICATION.md](VERIFICATION.md) — Entorno, comandos ejecutados, resultados y límites.
- [docs/adr/0001-canonical-contracts.md](adr/0001-canonical-contracts.md) — ADR 0001 Contratos canónicos y monorepo.
- [docs/adr/0002-local-and-postgres.md](adr/0002-local-and-postgres.md) — ADR 0002 SQLite local y camino PostgreSQL.
- [docs/adr/0003-ai-modes.md](adr/0003-ai-modes.md) — ADR 0003 Modo de demostración y proveedor configurable.
- [docs/adr/0004-provenance.md](adr/0004-provenance.md) — ADR 0004 Procedencia y separación de fixtures.
- [docs/adr/0005-scientific-ranking.md](adr/0005-scientific-ranking.md) — ADR 0005 Compatibilidad antes de similitud.
- [docs/adr/0006-ui-skeleton.md](adr/0006-ui-skeleton.md) — ADR 0006 Interfaz técnica antes del frontend de producto.
- [docs/adr/0007-inspection-and-integrated-base.md](adr/0007-inspection-and-integrated-base.md) — ADR 0007 Inspección y decisiones de la base local.
- [docs/adr/README.md](adr/README.md) — Decisiones de arquitectura.
- [docs/prompts/HANDOFF_TEMPLATE.md](prompts/HANDOFF_TEMPLATE.md) — Plantilla de relevo.
- [docs/prompts/P1_START.md](prompts/P1_START.md) — Prompt inicial para P1.
- [docs/prompts/P2_START.md](prompts/P2_START.md) — Prompt inicial para P2.
- [docs/prompts/P3_START.md](prompts/P3_START.md) — Prompt inicial para P3.
- [docs/prompts/P4_START.md](prompts/P4_START.md) — Prompt inicial para P4.
- [docs/prompts/P5_START.md](prompts/P5_START.md) — Prompt inicial para P5.
- [docs/prompts/P6_START.md](prompts/P6_START.md) — Prompt inicial para P6.
- [docs/prompts/README.md](prompts/README.md) — Prompts y continuidad.
- [docs/team/P1_INTEGRATION.md](team/P1_INTEGRATION.md) — P1 Integración API infraestructura y contratos.
- [docs/team/P2_DATA.md](team/P2_DATA.md) — P2 Datos extracción y procedencia.
- [docs/team/P3_SCIENCE.md](team/P3_SCIENCE.md) — P3 Análisis científico ranking y comparación.
- [docs/team/P4_AI.md](team/P4_AI.md) — P4 IA herramientas y revisión.
- [docs/team/P5_FRONTEND.md](team/P5_FRONTEND.md) — P5 Evidence Canvas e interfaz científica.
- [docs/team/P6_MISSION_DEMO.md](team/P6_MISSION_DEMO.md) — P6 Mission Lab hipótesis demo y coordinación QA.

## Alcance de la entrega

El código, los generados y scripts se describen en REPOSITORY_LAYOUT y README.
La demo predeterminada y el CI son sintéticos; el recorrido real BASS-II es opt-in
y requiere importar el paquete P2 local. El catálogo de metadatos, el corpus
completo importado y la tarjeta documental Saffire tienen ámbitos distintos.
El corpus no se distribuye mediante Git y conserva `scientific_unverified`.
La API se ejecuta localmente; no se acredita un despliegue público.
Los resultados por SHA están en VERIFICATION y no se infieren de un enlace o
de las pruebas de una versión anterior.
