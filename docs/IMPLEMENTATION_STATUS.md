# Estado real de FlameLab SI

Actualizado: 14 de noviembre de 2026. La petición vigente autorizó construir el
esqueleto; sustituye la fase anterior limitada a documentación. Rama local
`codex/integrated-skeleton`, base identificada por tag `flamelab-skeleton-2026-11-14`.
SHA definitivo y bundle en el relevo exportado. No publicado en GitHub.

## Implementado y ejecutado

| Área | Capacidad real | Evidencia de ejecución |
|---|---|---|
| Inspección | ZIP seguro, hashes, 24 estudios, tablas/unidades/duplicados y revisión visual BASS-II tabla5.1. | DATA_INSPECTION y catálogo; hash original intacto al cierre. |
| Contratos | Pydantic estricto, referencias, unidades canónicas, ausencias y procedencia; OpenAPI/TS derivados. | Pruebas de contratos y detección de deriva. |
| API | Salud, catálogo/ensayos/evidencia, perfil, ranking, comparación, investigación, informe, escenarios y replay. | TestClient, uvicorn HTTP real, consumidor TS y Chrome. |
| Persistencia | SQLite/Alembic, importación idempotente, reemplazo explícito, snapshots SHA-256 y expedientes. | Reapertura/reinicio y cambio de corpus conservan informe/evidencia históricos. |
| Datos | CLI inventory/validate/import; 24 estudios metadata_only separados de fixtures. | 0 observaciones reales importadas; 2 estudios/5 ensayos/6 observaciones sintéticas. |
| Ciencia | Filtros de elegibilidad, Gower fijo v1, cobertura ponderada, estratificación, puntos/medianas y unidades independientes. | Casos sintéticos de ausencia, incompatibilidad, cero, ejes, réplicas y métricas. |
| IA demo | Flujo Python de herramientas acotado y determinista, citas, hipótesis preparada, informe. | No necesita clave y no llama a LLM; insuficiencia explícita sin datos/X. |
| Cliente | React/TS, openapi-fetch, filtros editables, tablas, evidencia histórica, A/B, informe/eventos. | 6 pruebas cliente, build/tipos y recorrido de navegador real. |
| Windows | Setup sin sobrescribir .env, scripts API/web/check, lockfiles. | Setup y check ejecutados en Windows; ver VERIFICATION. |

## Preparado, sin validación real del servicio

- Adaptador OpenAI Responses configurable: salida estructurada, límites, timeout,
  errores y citas comprobados con HTTP simulado. Cero llamadas reales, cero claves.
  Validar IDs no demuestra que una afirmación esté respaldada científicamente.
- SQLAlchemy, dependencia opcional psycopg y Compose PostgreSQL/pgvector: no se
  ejecutó servidor PostgreSQL/Docker. No se creó ni pobló un índice vectorial.
- CI Windows/Linux escrita, pero no ejecutada en GitHub porque no hubo publicación.
- P5/P6 tienen carpetas y cliente común. DESIGN_ANDURIL conserva la dirección visual;
  no se ha construido frontend de producto ni una escena física.

## Pendientes concretos

1. P2/P3: revisión y contrato de condiciones sucesivas para BASS-II, caras de
   combustión, O2 inicial/final, discrepancias de dimensiones y licencias. Resolver
   métricas/encabezados de Saffire antes de comparación cuantitativa.
2. P3/P4: evaluación científica/semántica con consultas independientes; no confundir
   pruebas de software con validación de datos NASA o predicción de incendios.
3. P4: planificador de lenguaje natural, modelo/budget autorizado y prueba acotada
   del proveedor. Las restricciones verbales no cambian filtros automáticamente.
4. P1: publicación coordinada, CI remota, motor PostgreSQL, autenticación/límites
   antes de exposición de red y recuperación operativa.
5. P5/P6: Evidence Canvas, Mission Lab, experiencia visual y diseño inverso; los
   siguientes experimentos actuales son una propuesta preparada, no descubrimientos.

No implementados: extracción automática PDF/LLM, RAG multimodal, embeddings,
LangGraph, bootstrap/intervalos, regresión validada, visión de vídeo, CFD, optimización
inversa ni autonomía experimental. Los roles lógicos comparten un flujo, no seis
backends. El contrato y el estado real prevalecen sobre tablas históricas de visión.

## Verificación y entrega

`scripts/check.ps1`: 112 pruebas Python aprobadas, 6 pruebas de cliente aprobadas,
Ruff, OpenAPI/TS sin deriva, tipado, build y HTTP con reinicio correctos. Setup/check
también aprobados desde clon limpio con dependencias propias en este Windows. Aviso
Starlette/TestClient sobre httpx deprecado; no fallo. Detalles y límites en
VERIFICATION. Relevo, propietarios y primera tarea en TEAM_HANDOFF.

Documents conserva SHA-256 del ZIP
`5fcfa48e95a7c9ff84462c9fb498e144fc401bb22c0b09e18ff36d582e61c644`.
No se versionan ZIP, PDFs completos, credenciales, bases ni node_modules. El paquete
documental original sigue intacto fuera del clon; no había código ajeno en destino.
