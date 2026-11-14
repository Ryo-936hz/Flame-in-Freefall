# Mapa de contexto para asistentes

## Contexto mínimo común

AGENTS, START_HERE, FACTS_AND_UNKNOWNS, IMPLEMENTATION_STATUS, CONTRACTS, CONTRACT_MODELS y paquete del puesto. La base está publicada e integrada en `main` (PR #3, `0b732cb`); los nuevos trabajos parten de `origin/main`. VERIFICATION registra qué se ejecutó y TEAM_HANDOFF fija la referencia común; los documentos históricos de planificación no prueban capacidades adicionales.

## Preguntas antes de actuar

1. ¿Qué autoriza la petición actual: documentar o implementar?
2. ¿Qué está observado y qué es diseño propuesto?
3. ¿Qué contrato producirá y consumirá mi módulo?
4. ¿Qué archivos están bajo mi responsabilidad?
5. ¿Qué datos y modos se utilizarán?
6. ¿Qué verificación demostrará el cambio y qué no demostrará?

## Autoridades

| Pregunta | Contexto documental | Autoridad de la base local |
|---|---|---|
| Campos y formatos | CONTRACTS y CONTRACT_MODELS | `apps/api/src/flamelab/domain/contracts.py`; OpenAPI/tipos generados. |
| Ciencia y ranking | SCIENTIFIC_RULES, DATA_DICTIONARY, `science/METHOD.md` y dictamen P3 | Herramientas/evaluaciones ejecutables; diez puntos BASS-II aprobados descriptivamente, corpus global sin validación. |
| Fuente de un dato | SOURCES, DATA_INSPECTION, P2_NASA_24 y P2_DEMO | Evidencia/localizador y snapshot del bundle; distinguir catálogo de metadatos, corpus P2 importado y fixtures. |
| IA y límites | AI_SYSTEM y SECURITY | Flujo Python y adaptador; solo demo y transporte externo simulado verificados. |
| Estado del proyecto | IMPLEMENTATION_STATUS y VERIFICATION | Código y resultados de ejecución observados. |
| Dirección visual | DESIGN_ANDURIL, DEMO y relevo P6 | Host P5 con Evidence Canvas/Mission Lab/informe; la llama es conceptual. AskSI/CSS posteriores siguen en P5. |
| Decisión del equipo | DECISIONS y ADRs | Los mismos registros actualizados. |

## Continuidad

Una conversación anterior no cambia silenciosamente el contrato. El nuevo asistente debe revisar el estado real y el último mensaje del usuario. No cargar todos los documentos indiscriminadamente: usar lectura progresiva y referencias explícitas para reducir ruido.

Al reanudar, leer TEAM_HANDOFF, comprobar rama/commit y revisar los archivos
mencionados. SQLite local, PostgreSQL 17 y CI Windows/Linux tienen ejecuciones
registradas; cada cambio nuevo necesita sus propios resultados. pgvector, llamadas
reales a IA y validación física global no se acreditan por configuración, mocks
o por las pruebas del corpus local. El prompt maestro y BUILD_ORDER conservan
bloques históricos separados de la continuidad vigente.
