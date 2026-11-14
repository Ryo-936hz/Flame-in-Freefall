# Mapa de contexto para asistentes

## Contexto mínimo común

AGENTS, START_HERE, FACTS_AND_UNKNOWNS, IMPLEMENTATION_STATUS, CONTRACTS, CONTRACT_MODELS y paquete del puesto. La base integrada existe localmente. VERIFICATION registra qué se ejecutó y TEAM_HANDOFF fija la referencia común; los documentos históricos de planificación no prueban capacidades adicionales.

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
| Ciencia y ranking | SCIENTIFIC_RULES, DATA_DICTIONARY y `science/METHOD.md` | Herramientas deterministas y pruebas; evaluación de relevancia científica pendiente. |
| Fuente de un dato | SOURCES, DATA_INSPECTION y manifiesto | Evidencia y localizador del bundle; catálogo real de metadatos separado de fixtures. |
| IA y límites | AI_SYSTEM y SECURITY | Flujo Python y adaptador; solo demo y transporte externo simulado verificados. |
| Estado del proyecto | IMPLEMENTATION_STATUS y VERIFICATION | Código y resultados de ejecución observados. |
| Dirección visual | DESIGN_ANDURIL | Especificación conservada; frontend de producto pendiente. |
| Decisión del equipo | DECISIONS y ADRs | Los mismos registros actualizados. |

## Continuidad

Una conversación anterior no cambia silenciosamente el contrato. El nuevo asistente debe revisar el estado real y el último mensaje del usuario. No cargar todos los documentos indiscriminadamente: usar lectura progresiva y referencias explícitas para reducir ruido.

Al reanudar, leer TEAM_HANDOFF, comprobar rama/commit y revisar los archivos mencionados. No asumir que una prueba configurada se ejecutó: PostgreSQL/pgvector, CI remoto, llamadas reales a IA y comparación cuantitativa NASA siguen separados de las pruebas software locales.
