# Estado real de FlameLab SI

Actualizado: 14 de noviembre de 2026. La [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3)
está fusionada en `main` mediante **`0b732cb`**. Conserva P1/P3/P4, la integración
P2 de `lujan`, P6 `80ceba4`, el host P5 `9f54700` y el favicon posterior.
La base actual del equipo es `origin/main`; la etiqueta P6
`flamelab-p6-demo-2026-11-14-r2` queda como historial y no se mueve.

**Cierre adicional P2 implementado y verificado localmente en `raul`:** tarjeta
documental Saffire, reintentos/identidades del catálogo y selector de las 14 métricas.
Código **`20aab80404fc2f0fc188d718cac47d0d4bf31d54`**. El cierre se entrega mediante la PR #4 sobre `main`; la PR #3 anterior ya está fusionada. [Guía P2](INTEGRATION_P2_MAIN.md),
[guion](DEMO.md), [relevo](TEAM_HANDOFF.md) y [verificación](VERIFICATION.md).

El cierre se publica en la [PR #4](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/4); el CI de cada revisión puede consultarse allí. La base compartida es `origin/main`.

## Implementado para la demo

| Área | Capacidad comprobable |
|---|---|
| Contrato/API | Pydantic estricto, corpus 1.1 con lectura 1.0, OpenAPI/TypeScript generados, plan público previsualizable y persistido. |
| Ciencia | Condiciones efectivas, Gower/cobertura separados, disponibilidad de métrica antes del límite, controles/procedencia por estrato y cuentas sin crear réplicas de segmentos. |
| IA demo | Catálogo determinista opt-in y modo explícito compatible; cálculos en herramientas, bloqueos y citas. Proveedor opcional probado con mocks, sin llamadas reales. |
| Ask SI | Compose arranca Ollama y prepara `qwen3:0.6b` por defecto. Qwen selecciona fuentes del corpus; el catálogo responde si Ollama falla. [Arranque](../README.md#a-docker-linux-windows-y-macos) y [verificación](VERIFICATION.md#qwen-local-en-docker-compose). |
| Persistencia | SQLite de archivo y PostgreSQL verificados; informes, planes y fuentes históricas sobreviven a reemplazo/reinicio. |
| Datos P2/P3 | 24 estudios, 1.058 registros, 1.673 observaciones y 1.283 valores conocidos. BASS-II conserva 20 ensayos/43 segmentos/39 tasas conocidas; diez puntos aprobados para uso descriptivo limitado. |
| Interfaz P5 integrada | Evidence Canvas, tabla/gráfico/selección/fuentes, filtros explícitos y catálogo P2. Ilustración conceptual rotulada. |
| Mission Lab P6 | A/B con métrica explícita, segmentos y motivos; vigencia ante cambios; hipótesis etiquetadas y consulta insuficiente con plan guardado. |
| Presets BASS-II P6 | Tres consultas exactas y A/B 6→5; texto aprobado condicionado a IDs, valores, muestras y fuentes; M8 literal y lunar sin flujo. |
| Informe/recuperación P6 | Texto literal del backend y descarga idéntica, replay, recuperación por ID/recientes; guardas compartidas ante Reset o una investigación posterior. |
| Comprobación local | Ciencia/IA, contratos, 77 pruebas cliente, HTTP/reinicio y recorridos sintético/real aislados con Chromium fijado por lockfile. |

Investigate usa filtros explícitos y P6 muestra el plan persistido de su consulta.
La previsualización de planes del catálogo acotado está disponible por API. Ask SI
acepta preguntas de texto libre y recupera fuentes del corpus activo.

## Verificación del cierre P2 — código 20aab80

Windows, código `20aab80404fc2f0fc188d718cac47d0d4bf31d54`. `check.ps1` terminó con salida 0:
**342 Python aprobadas, 1 omisión PostgreSQL, 77 cliente**, Ruff, deriva de contratos,
tipado/build, ciencia 6 heredadas + 6 segmentos + disponibilidad, IA 18, corpus 7/7
y recorrido HTTP con reinicio. La prueba de navegador sintética pasó **25 pasos /
64 comprobaciones** y la real P2 **17 pasos / 101 comprobaciones**, ambas sin fallos.

Clon limpio Windows de este código: setup y check -E2E con salida 0,
340 Python/3 omisiones, 77 cliente y navegador 25/64. Detalles del entorno y
CI en [VERIFICATION](VERIFICATION.md); no se reutilizan resultados del hito anterior.

## Verificación del hito P6 — código 6693463

- Puerta Windows con ambos bundles reales: **342 Python aprobadas, 1 omitida**
  (PostgreSQL sin servidor local), **76 cliente**, tipos/build y HTTP/reinicio correctos.
  Ciencia 6+6 casos y disponibilidad; IA 18; corpus real 7/7.
- Clon nuevo del código indicado, con `.venv` y `node_modules` propios:
  `setup.ps1` y `check.ps1 -E2E` con salida 0; **340 Python aprobadas, 3 omitidas**
  (dos bundles locales y PostgreSQL), 76 cliente y **24 pasos / 58 checks E2E**.
  Se utilizó el mismo Windows con runtimes y caché Chromium compartibles.
- [CI 43621040286](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286) completado con éxito: Windows/Linux, PostgreSQL 17 y
  navegador Windows/Linux. No se infiere validación de pgvector por usar ese contenedor.

Un aviso Starlette/httpx permanece. Los detalles y límites de cada ejecución se
conservan en VERIFICATION. El E2E de CI usa fixtures sintéticos; el recorrido local
BASS-II usa el paquete real aprobado y pasó 7 pasos / 44 comprobaciones.

## Datos y pendientes externos

- **BASS-II:** el [dictamen P3](handoffs/P3_BASS_II_DECISION_DEMO.md) confirma diez
  observaciones (siete muestras) para comparación descriptiva. El [paquete P2 1.1.1](handoffs/P2_DEMO.md)
  incorpora el aviso M8 y elimina el filtro de velocidad del caso lunar. La discrepancia
  tabla/figura no se ha resuelto mediante reanálisis; el O₂ de segmento sigue sin medirse.
- **Corpus global:** mantiene `scientific_unverified`; no se marcan todas sus evidencias
  como revisadas. Continúan las cuestiones de métricas, censura, independencia,
  comparabilidad y condiciones de redistribución fuera del alcance aprobado.
- **P5 posterior:** el host integrado es `9f54700`. AskSI/CSS posteriores (`45edc50`/`8adec7a`)
  siguen en la rama P5 y no están acreditados por este E2E. P5 debe incorporar `origin/main`
  conservando sus avances y revisar citas históricas/guardas antes de cerrar AskSI.
- **Producto/validación:** quedan una revisión con lector de pantalla y móvil físico,
  evaluación de proveedor real y despliegue con controles de acceso. No se necesitan
  para esta demo local. El montaje P5/P6, A/B genérico, informe, recuperación y recorrido sintético están comprobados. Los presets BASS-II exactos también pasaron el recorrido local: 7 pasos / 44 comprobaciones con el paquete P2 1.1.1.

No implementados: lenguaje natural general, extracción PDF/LLM general, RAG
multimodal, embeddings, bootstrap, regresión física validada, visión de vídeo,
CFD, diseño inverso ni autonomía experimental.

Las pruebas del hito P6 conservan su SHA y no sustituyen las comprobaciones del
cierre P2 registradas arriba.

## Historial y continuidad

P1/P3/P4 se integró mediante [PR #2](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/2),
merge `8fffddc`; su código probado fue `fd83a84`. La [guía de backend](INTEGRATION_P134.md)
conserva esos antecedentes. Los resultados previos y relevos no sustituyen esta
entrega P6. `codex/team-start-v1` permanece congelada; usar la referencia vigente
sin reset ni borrar ramas de compañeros.
