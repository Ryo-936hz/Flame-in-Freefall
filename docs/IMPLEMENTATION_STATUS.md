# Estado real de FlameLab SI

Actualizado: 14 de noviembre de 2026. La petición vigente autoriza publicar el
esqueleto y preparar el arranque del equipo. GitHub usa `main` y una referencia
de partida `codex/team-start-v1` para que los seis creen ramas desde el mismo commit.
Ver [TEAM_START](TEAM_START.md). El historial local anterior y el tag
`flamelab-skeleton-2026-11-14` se conservan como archivo, no como base de PR remotas.

## Implementado y ejecutado

P2 branch update, 14 November 2026: [P2_DELIVERY](P2_DELIVERY.md) describes the local
BASS-II increment, provisional shared contract choices, source review boundaries,
and reproduction commands. The first BASS-II increment was published on `lujan` at `bb7ac4f`.

The subsequent [24-study corpus increment](P2_NASA_24.md) verifies the original inventory,
stores searchable evidence by study, and extends the first seven candidates with independently
scoped numeric or configuration mappings. It includes catalog browsing in the technical harness.
Scientific review remains pending for imported observations and unresolved sample identities.

The follow-up on `lujan` adopts P1's segment contract 1.1 and P3's explicit condition
resolution, provenance strata and stable arithmetic. The BASS-II PDF and full NASA
corpus were regenerated under 1.1. Science and contract integration still need the
team's review before merging into `main`.

| Área | Capacidad real | Evidencia de ejecución |
|---|---|---|
| Inspección | ZIP seguro, hashes, 24 estudios, tablas/unidades/duplicados y revisión visual BASS-II tabla5.1. | DATA_INSPECTION y catálogo; hash original intacto al cierre. |
| Contratos | Pydantic estricto, referencias, unidades canónicas, ausencias y procedencia; OpenAPI/TS derivados. | Pruebas de contratos y detección de deriva. |
| API | Salud, catálogo/ensayos/evidencia, perfil, ranking, comparación, investigación, informe, escenarios y replay. | TestClient, uvicorn HTTP real, consumidor TS y Chrome. |
| Persistencia | SQLite/Alembic, importación idempotente, reemplazo explícito, snapshots SHA-256 y expedientes. | Reapertura/reinicio y cambio de corpus conservan informe/evidencia históricos. |
| Data | CLI inventory/validate/import plus hash-checked BASS-II extraction and quality report; synthetic fixture remains separate. | Local real bundle: 24 studies, 20 physical tests, 43 conditions, 39 known rates and 4 explicit absences. BASS-II is `unverified`; 23 other studies remain metadata-only. |
| Ciencia | Filtros de elegibilidad, Gower fijo v1, cobertura ponderada, estratificación, puntos/medianas y unidades independientes. | Casos sintéticos de ausencia, incompatibilidad, cero, ejes, réplicas y métricas. |
| IA demo | Flujo Python de herramientas acotado y determinista, citas, hipótesis preparada, informe. | No necesita clave y no llama a LLM; insuficiencia explícita sin datos/X. |
| Cliente | React/TS, openapi-fetch, filtros editables, tablas, evidencia histórica, A/B, informe/eventos. | 6 pruebas cliente, build/tipos y recorrido de navegador real. |
| Windows | Setup sin sobrescribir .env, scripts API/web/check, lockfiles. | Setup y check ejecutados en Windows; ver VERIFICATION. |
| GitHub/CI | Código publicado en main, historial conservado, guía para seis y CI Windows/Linux. | Primera ejecución remota 43592863296: ambos trabajos aprobados; detalle en VERIFICATION. |

## Preparado, sin validación real del servicio

- Adaptador OpenAI Responses configurable: salida estructurada, límites, timeout,
  errores y citas comprobados con HTTP simulado. Cero llamadas reales, cero claves.
  Validar IDs no demuestra que una afirmación esté respaldada científicamente.
- SQLAlchemy, dependencia opcional psycopg y Compose PostgreSQL/pgvector: no se
  ejecutó servidor PostgreSQL/Docker. No se creó ni pobló un índice vectorial.
- P5/P6 tienen carpetas y cliente común. DESIGN_ANDURIL conserva la dirección visual;
  no se ha construido frontend de producto ni una escena física.

## Pendientes concretos

1. P1/P3: review the implemented successive-condition contract and BASS-II
   interpretation, width and M8 discrepancies, sample-based independence and
   source rights. Initial/final oxygen and burning faces are represented; stage
   oxygen remains unmeasured. Resolve Saffire metrics/configuration before any
   quantitative import. See [P2_SOURCE_AUDIT](P2_SOURCE_AUDIT.md).
2. P3/P4: evaluación científica/semántica con consultas independientes; no confundir
   pruebas de software con validación de datos NASA o predicción de incendios.
3. P4: planificador de lenguaje natural, modelo/budget autorizado y prueba acotada
   del proveedor. Las restricciones verbales no cambian filtros automáticamente.
4. P1: mantener CI, motor PostgreSQL, autenticación/límites
   antes de exposición de red y recuperación operativa.
5. P5/P6: Evidence Canvas, Mission Lab, experiencia visual y diseño inverso; los
   siguientes experimentos actuales son una propuesta preparada, no descubrimientos.

Not implemented: general-purpose PDF/LLM extraction (P2 only supports a fixed,
hash-verified Table 5.1 source version), RAG multimodal, embeddings,
LangGraph, bootstrap/intervalos, regresión validada, visión de vídeo, CFD, optimización
inversa ni autonomía experimental. Los roles lógicos comparten un flujo, no seis
backends. El contrato y el estado real prevalecen sobre tablas históricas de visión.

## Verificación y entrega

Latest P2 verification in WSL: **132 Python tests passed**, including the opt-in
real-source API/restart journey; **6 client tests passed**. Ruff, OpenAPI/TypeScript
drift checks, typecheck, production build and the synthetic HTTP/restart smoke test
passed. Repeated extraction was byte-identical and repeated real-bundle import was
idempotent. These local results do not assert new remote CI or human scientific
review. Details and limitations are in [VERIFICATION](VERIFICATION.md).

Historical baseline `scripts/check.ps1`: 112 pruebas Python aprobadas, 6 pruebas de cliente aprobadas,
Ruff, OpenAPI/TS sin deriva, tipado, build y HTTP con reinicio correctos. Setup/check
también aprobados desde clon limpio con dependencias propias en este Windows. Aviso
Starlette/TestClient sobre httpx deprecado; no fallo. Detalles y límites en
VERIFICATION. Relevo, propietarios y primera tarea en TEAM_HANDOFF.

Documents conserva SHA-256 del ZIP
`5fcfa48e95a7c9ff84462c9fb498e144fc401bb22c0b09e18ff36d582e61c644`.
No se versionan ZIP, PDFs completos, credenciales, bases ni node_modules. El paquete
documental original sigue intacto fuera del clon; no había código ajeno en destino.
