# Empieza aquí

**Base actual: `origin/main`.** La [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3)
se fusionó mediante `0b732cb`, incluyendo P1/P3/P4, P2 y el montaje P5/P6.
Lee [estado vigente](IMPLEMENTATION_STATUS.md), [relevo](TEAM_HANDOFF.md) y
[guion](DEMO.md). El cierre adicional P2 está implementado y verificado localmente
en `raul`, código **`20aab80404fc2f0fc188d718cac47d0d4bf31d54`**: tarjeta Saffire, catálogo con
reintentos/identidades y selector de 14 métricas. El cierre se entrega mediante la PR #4 sobre `main`; la PR #3 anterior ya está integrada.

La base conecta API, persistencia, ingesta, ciencia e IA demo con Evidence Canvas,
Mission Lab, informe y recuperación. [README](../README.md) y [TEAM_START](TEAM_START.md)
contienen los pasos para clonar `origin/main`, crear una rama propia y arrancar.
Para cargar el corpus real sin sustituir otra base, seguir [INTEGRATION_P2_MAIN](INTEGRATION_P2_MAIN.md).
En ramas existentes, conservar el trabajo e integrar `origin/main` mediante merge.
Las etiquetas P6, `team-start-v1` y la [entrega P1/P3/P4](INTEGRATION_P134.md)
conservan el historial; no se vuelve a ellas para deshacer avances.

## Cierre P2 comprobado localmente — código 20aab80

`check.ps1` terminó con salida 0: 342 Python/1 omisión PostgreSQL, 77 cliente,
contratos/tipado/build, evaluaciones ciencia/IA, corpus 7/7 y HTTP/reinicio.
Navegador sintético 25 pasos/64 comprobaciones; real P2 17 pasos/101 comprobaciones,
ambos sin fallos. El clon limpio también pasó: 340 Python/3 omisiones,
77 cliente y navegador 25/64. Resultados por SHA en [VERIFICATION](VERIFICATION.md). [Guía de integración](INTEGRATION_P2_MAIN.md).

## Hito comprobado P6 — código 6693463, 14 de noviembre de 2026

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

Estas cifras pertenecen al SHA indicado. Las mejoras posteriores requieren su
propia verificación, registrada en [VERIFICATION](VERIFICATION.md).

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
documenta el inventario. La extracción e importación BASS-II conservan segmentos y fuentes; cada clon
debe cargar el bundle local para disponer de las mediciones reales.
El [dictamen P3](handoffs/P3_BASS_II_DECISION_DEMO.md) aprobó diez puntos para uso
descriptivo; [P2_DEMO](handoffs/P2_DEMO.md) describe el paquete con aviso M8 y lunar
corregido. No equivale a validar el corpus completo, atribuir causalidad al flujo,
medir O₂ por segmento ni autorizar redistribuir todos los originales.
