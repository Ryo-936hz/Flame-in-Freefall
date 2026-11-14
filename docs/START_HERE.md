# Empieza aquí

**P6 terminado para la demo integrada:** escenarios genéricos y presets BASS-II,
informe, recuperación y recorridos de navegador comprobados. Código **`66934638e37c1396eeab638631d54a2159ab7930`**;
la PR #3 permanece pendiente de integración en `main`. La comprobación real BASS-II
es local y opt-in; el CI utiliza datos sintéticos. Ver [relevo P6](handoffs/P6.md).

**Incremento actual:** [demo de Mission Lab integrado](DEMO.md), rama `raul`,
código `66934638e37c1396eeab638631d54a2159ab7930` y [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3). Incluye P1/P3/P4 y P2 de `main` `f8e6a01`,
P6 `80ceba4` y la interfaz P5 `9f54700`. Leer [relevo P6](handoffs/P6.md),
[estado vigente](IMPLEMENTATION_STATUS.md) y [pruebas](VERIFICATION.md).
La PR aún no está fusionada en `main`; conservar ramas y cambios propios.

La base conecta API, persistencia, ingesta, ciencia e IA demo con Evidence Canvas,
Mission Lab, informe y recuperación. [README](../README.md) contiene los pasos para
clonar desde `flamelab-p6-demo-2026-11-14` y arrancar; [DEMO](DEMO.md) añade el E2E con Chromium.
`team-start-v1` y [TEAM_START](TEAM_START.md) son la referencia inicial, no una orden
de deshacer avances. La [entrega P1/P3/P4](INTEGRATION_P134.md) conserva el historial.

## Estado comprobado al 14 de noviembre de 2026

- Demo predeterminada: dos estudios, cinco ensayos y seis observaciones sintéticas.
  No requiere claves ni originales NASA.
- Interfaz P5/P6 montada y verificada: A/B, fuentes de expediente/corpus, informes,
  replay y recuperación tras reinicio; 24 pasos y 58 comprobaciones de navegador.
- Check con datos reales locales: 342 Python aprobadas y una omisión PostgreSQL;
  76 pruebas cliente. Clon limpio: 340 Python y tres omisiones esperadas.
- [CI](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286) aprobado en Windows/Linux, PostgreSQL y navegador Windows/Linux.
- Corpus P2: seis campañas con resultados, una de configuraciones y 17 documentales.
  Diez puntos BASS-II tienen conformidad descriptiva de P3 con límites; el corpus
  completo conserva `scientific_unverified`. No se usó un proveedor externo real.

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

El ZIP original se conserva intacto; [DATA_INSPECTION](DATA_INSPECTION.md)
documenta el inventario. La tabla BASS-II ya está importada con segmentos y fuentes.
El [dictamen P3](handoffs/P3_BASS_II_DECISION_DEMO.md) aprobó diez puntos para uso
descriptivo; [P2_DEMO](handoffs/P2_DEMO.md) describe el paquete con aviso M8 y lunar
corregido. No equivale a validar el corpus completo, atribuir causalidad al flujo,
medir O₂ por segmento ni autorizar redistribuir todos los originales.
