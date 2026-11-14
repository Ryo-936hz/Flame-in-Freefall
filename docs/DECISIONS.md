# Registro de decisiones

Las decisiones D-01–D-10 proceden de la fase de diseño. La implementación local del 14 de noviembre de
2026 adopta su núcleo; la publicación posterior autorizada añade D-20.
El contrato ejecutable está en `apps/api/src/flamelab/domain/contracts.py`; los resultados de ejecución
pertenecen a VERIFICATION y la referencia común a TEAM_HANDOFF.

| ID | Decisión | Motivo | Responsable |
|---|---|---|---|
| D-01 | Monorepo con API Python y cliente React/TypeScript. | Compartir contratos y un recorrido verificable. | P1 |
| D-02 | Contrato Pydantic como autoridad. | Evitar divergencia entre asistentes y capas. | P1 |
| D-03 | SQLite local y camino PostgreSQL/pgvector. | Arranque simple con evolución a persistencia compartida. | P1 |
| D-04 | Modo sin proveedor externo explícito. | Desarrollo y pruebas sin credenciales ni coste implícito. | P4 |
| D-05 | Fixtures sintéticos separados de datos científicos. | Conectar módulos sin fabricar hallazgos. | P2 + P3 |
| D-06 | Elegibilidad, similitud y cobertura separadas. | Ranking interpretable sin índice de riesgo arbitrario. | P3 |
| D-07 | IA con herramientas controladas y cálculos deterministas. | Ambición de investigación con resultados verificables. | P4 |
| D-08 | Frontend de producto se construirá después. | La base actual entrega conexiones y arnés técnico; conserva la dirección visual sin construir el frontend final. | P5 |
| D-09 | Estética de estación científica inspirada en sistemas Anduril. | Dirección visual solicitada por el usuario. | P5 + P6 |
| D-10 | BASS-II como caso candidato y Saffire como contraste. | Mostrar análisis y límites de transferencia. | P2 + P3 |

## Decisiones aceptadas tras inspección e integración — 14 de noviembre de 2026

| ID | Decisión y alcance | Motivo y consecuencia | Responsable |
|---|---|---|---|
| D-11 | Mantener catálogo real `metadata_only` separado de la demo sintética. | El ZIP contiene una tabla BASS-II candidata, condiciones sucesivas y ambigüedades CSV/PDF; no convertirlas automáticamente en observaciones revisadas. DATA_INSPECTION y ADR 0007. | P1 + P2 + P3 |
| D-12 | Implementar contrato 1.0 estricto, sin `/` en IDs, con referencias de condiciones conocidas y fuentes HTTP(S). | Impedir coerciones numéricas, identidades no recuperables y mezcla de fuentes; OpenAPI/tipos se regeneran desde una autoridad. CONTRACTS y CONTRACT_MODELS. | P1 + consumidores |
| D-13 | Preservar bundles por hash y guardar cada investigación con su snapshot. | Reimportar incluso el mismo dataset_id no cambia informes anteriores; la ruta de evidencia admite research_id histórico. | P1 + P2 |
| D-14 | Flujo Python acotado sin LangGraph; máximo una síntesis externa. | El incremento no necesita un planificador dinámico. Filtros estructurados y cálculos deterministas siguen siendo autoridad; síntesis externa sin llamada real validada. ADR 0007. | P1 + P4 |
| D-15 | Escalas Gower v1 fijas; vary fuera de puntuación/cobertura; required_match se aplica incluso con peso cero. | Distancia reproducible sin confundir similitud con confianza o riesgo. Las escalas son parámetros software, pendientes de evaluación científica. science/METHOD.md. | P1 + P3 |
| D-16 | Comparaciones conservadoras, sin intervalos ni incertidumbre inferida. | Estratificar estudio, procedencia, grado y controles; faltas de control aíslan ensayos. No transformar observaciones repetidas en réplicas. | P3 |
| D-17 | Incluir evidencia de ensayo, condiciones y observaciones en cada resultado del ranking. | Permite citas legítimas de mediciones y rechaza fuentes vinculadas a otro ensayo seleccionado. | P1 + P3 + P4 |
| D-18 | X totalmente ausente implica investigación insuficiente. | Conservar Y disponible no demuestra que exista un par cuantitativo para la variable solicitada; no producir hipótesis preparada en ese caso. | P1 + P3 |
| D-19 histórica | Primera entrega local y referencia común. | Se conservan commit/bundle locales. La publicación posterior fue autorizada por el usuario en D-20. | P1 + equipo |
| D-20 | Publicar en main y conservar codex/team-start-v1 como referencia común del equipo. | El conector rechazó escritura con 403. El usuario eligió autenticar Git local; Git Credential Manager completó la autenticación y permitió publicar conservando el historial. Todos crean su primera rama desde la referencia común; no moverla. TEAM_START documenta arranque y tareas. | P1 + equipo |

Las decisiones anteriores conservan su contexto histórico. La planificación acotada
y PostgreSQL tienen avances posteriores descritos en IMPLEMENTATION_STATUS y
VERIFICATION; no equivalen a lenguaje natural general ni pgvector operativo.
Matriz analítica relacional, diseño inverso validado y frontend final siguen fuera de esta base.

## Añadir una decisión

Fecha, responsable, contexto, alternativas consideradas, decisión, consecuencias y archivos afectados. Para cambios estructurales usar un ADR. Los resultados de pruebas pertenecen a la entrega y al estado de implementación, no se inventan como motivo retrospectivo.


## Cierre conjunto P1/P3/P4 de la demo

Por petición explícita del usuario, los tres puestos se trabajan en `raul`,
preservando `main` y el historial de P4. [ADR 0009](adr/0009-visible-plans-and-metric-availability.md)
acuerda plan público aditivo, modo explícito compatible, catálogo determinista,
disponibilidad de métrica por segmento antes del límite y revisión externa acotada.
Las evaluaciones científicas y de IA pasan a ser puertas de check/CI. P5/P6 reciben
los contratos generados para su interfaz; no se reasigna su implementación visual.
## Qwen local para selección de evidencia

Ollama es un perfil opcional del servidor. Usa el modelo cuantizado `qwen3:0.6b`
en loopback y `httpx`, que ya forma parte del proyecto. El modelo recibe una
selección acotada de registros del corpus o resultados calculados y devuelve
índices validados. Python conserva la autoridad sobre métricas, filtros,
cálculos, procedencia y citas. La degradación usa catálogo o resultados
deterministas. [Despliegue y métricas operativas](DESPLIEGUE.md).
