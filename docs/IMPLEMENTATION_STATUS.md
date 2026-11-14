# Estado real de FlameLab SI

Actualizado: 14 de noviembre de 2026. Entrega conjunta P1/P3/P4 en `raul`, basada
en `main` `04baeee`, P3 `321cc0b` y P4 `12555c1`. El usuario asume estos tres
puestos. [Guía de entrega](INTEGRATION_P134.md) y [verificación](VERIFICATION.md).

## Implementado para la demo

| Área | Capacidad comprobable |
|---|---|
| Contrato/API | Pydantic estricto, corpus 1.1 con lectura 1.0, OpenAPI/TypeScript generados, plan público previsualizable y persistido. |
| Ciencia | Condiciones efectivas, Gower/cobertura separados, disponibilidad de métrica antes del límite, controles/procedencia por estrato, cuentas de segmentos y unidades identificadas. |
| IA demo | Catálogo determinista opt-in; modo explícito compatible; conflictos/ambigüedades visibles; cálculos ejecutados por herramientas, citas y propuestas etiquetadas. |
| Proveedor opcional | Transporte acotado y errores explícitos; resumen del programa y afirmaciones numéricas verificadas contra campo/ensayo/fuente. Probado con mocks, sin llamadas reales. |
| Persistencia | SQLite de archivo, Alembic, ingesta idempotente y snapshots; informes, planes y fuentes históricas sobreviven a reemplazo/reinicio. |
| Datos P2 | 24 estudios, 1.058 registros, 1.673 observaciones, 1.283 conocidas; corpus local separado de fixtures. BASS 20 ensayos/43 segmentos/39 tasas conocidas. |
| Cliente | Tipos compartidos regenerados y arnés técnico compatible. P5/P6 mantienen el trabajo de interfaz. |
| Check/CI | Ruff, Python, suites ciencia/IA, deriva de contratos, tipado, cliente, build y HTTP real con reinicio. Corpus real opt-in. |

## Verificación de esta entrega

Windows: **342 pruebas Python aprobadas, 1 omitida(s)**
por PostgreSQL sin servidor local; seis pruebas cliente, tipos/build y recorrido
HTTP/SQLite correctos. Evaluaciones: seis legacy, seis de segmentos, diagnóstico
de disponibilidad aprobado, 18 casos IA y siete checks sobre el corpus real local.
El resultado completo, clon limpio y CI se registran en VERIFICATION con sus SHA.

Clon limpio del código `fd83a84aa24511e573a1b5f27cc859bcdddbf638`: setup/check correctos,
340 Python aprobadas y tres omisiones esperadas sin datos reales/PostgreSQL local.
CI de la [PR #2](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/2) aprobado en Windows, Linux y PostgreSQL 17:
[ejecución 43614900736](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43614900736). PostgreSQL comprobó reemplazo de corpus y
recuperación histórica; no se valida pgvector. La documentación posterior conserva
este SHA de código verificado.

## Lo que requiere trabajo de otros puestos o validación externa

- **P2:** revisión de discrepancias M8/anchuras/O₂ y definiciones de métricas,
  censura, identidad experimental y derechos de fuentes. Todos los datos importados
  siguen `unverified`; las evidencias mantienen `reviewed=false`.
- **P5/P6:** presentar plan y bloqueos, conectar tabla/gráfico/fuentes y A/B/informe,
  integrar sus ramas y ejecutar el recorrido visual conjunto. El arnés no es frontend final.
- **Validación futura:** calidad/coste de un proveedor real con autorización,
  consultas científicas revisadas de forma independiente y despliegue con controles
  de acceso. No se necesitan para ejecutar esta demo local sin credenciales.

No implementados: lenguaje natural general, extracción PDF/LLM general, RAG
multimodal, embeddings, bootstrap, regresión física validada, visión de vídeo,
CFD, diseño inverso ni autonomía experimental. No son tareas pendientes ocultas
en un esqueleto de P1/P3/P4: quedan fuera del alcance concreto de esta demo.

## Historial y continuidad

Las entregas previas y sus resultados están en VERIFICATION y los relevos
[P1](handoffs/P1.md), [P3](handoffs/P3.md), [P4](handoffs/P4.md).
La referencia inicial `codex/team-start-v1` permanece congelada. Para el incremento
actual usar el commit de la entrega, sin reset ni borrar ramas de compañeros.
