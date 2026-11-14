# Estado real de FlameLab SI

**Integración posterior de main:** se conservó el cambio de favicon `9f22d21`
mediante merge `576e608`, manteniendo el HTML y las funciones de P5/P6.
La referencia común actual es `flamelab-p6-demo-2026-11-14-r2`; la primera etiqueta
se conserva sin mover. El código funcional y sus pruebas completas son los
registrados abajo; la única diferencia de aplicación posterior es esa línea de favicon.

**P6 terminado para la demo integrada:** escenarios genéricos y presets BASS-II,
informe, recuperación y recorridos de navegador comprobados. Código **`66934638e37c1396eeab638631d54a2159ab7930`**;
la PR #3 permanece pendiente de integración en `main`. La comprobación real BASS-II
es local y opt-in; el CI utiliza datos sintéticos. Ver [relevo P6](handoffs/P6.md).

Actualizado: 14 de noviembre de 2026. P6 integrado en `raul` sobre `main`
`f8e6a01`, conservando las ramas P6 `80ceba4` y P5 `9f54700` mediante merge.
Código verificado **`66934638e37c1396eeab638631d54a2159ab7930`**, [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3) abierta para integración;
este incremento todavía no está en `main`. [Guion](DEMO.md),
[relevo P6](handoffs/P6.md) y [verificación](VERIFICATION.md).

## Implementado para la demo

| Área | Capacidad comprobable |
|---|---|
| Contrato/API | Pydantic estricto, corpus 1.1 con lectura 1.0, OpenAPI/TypeScript generados, plan público previsualizable y persistido. |
| Ciencia | Condiciones efectivas, Gower/cobertura separados, disponibilidad de métrica antes del límite, controles/procedencia por estrato y cuentas sin crear réplicas de segmentos. |
| IA demo | Catálogo determinista opt-in y modo explícito compatible; cálculos en herramientas, bloqueos y citas. Proveedor opcional probado con mocks, sin llamadas reales. |
| Persistencia | SQLite de archivo y PostgreSQL verificados; informes, planes y fuentes históricas sobreviven a reemplazo/reinicio. |
| Datos P2/P3 | 24 estudios, 1.058 registros, 1.673 observaciones y 1.283 valores conocidos. BASS-II conserva 20 ensayos/43 segmentos/39 tasas conocidas; diez puntos aprobados para uso descriptivo limitado. |
| Interfaz P5 integrada | Evidence Canvas, tabla/gráfico/selección/fuentes, filtros explícitos y catálogo P2. Ilustración conceptual rotulada. |
| Mission Lab P6 | A/B con métrica explícita, segmentos y motivos; vigencia ante cambios; hipótesis etiquetadas y consulta insuficiente con plan guardado. |
| Presets BASS-II P6 | Tres consultas exactas y A/B 6→5; texto aprobado condicionado a IDs, valores, muestras y fuentes; M8 literal y lunar sin flujo. |
| Informe/recuperación P6 | Texto literal del backend y descarga idéntica, replay, recuperación por ID/recientes; guardas compartidas ante Reset o una investigación posterior. |
| Check/CI | Ciencia/IA, contratos, 76 pruebas cliente, HTTP/reinicio y E2E real aislado con Chromium fijado por lockfile. |

La interfaz no interpreta texto libre ni ofrece un formulario de previsualización
del catálogo: el catálogo acotado y su previsualización están disponibles por API. P6 muestra el plan
persistido de su consulta. El recorrido visual usa el modo explícito.

## Verificación ejecutada

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
  siguen en la rama P5 y no están acreditados por este E2E. P5 debe incorporar la PR #3
  conservando sus avances y revisar citas históricas/guardas antes de cerrar AskSI.
- **Producto/validación:** quedan una revisión con lector de pantalla y móvil físico,
  evaluación de proveedor real y despliegue con controles de acceso. No se necesitan
  para esta demo local. El montaje P5/P6, A/B genérico, informe, recuperación y recorrido sintético están comprobados. Los presets BASS-II exactos también pasaron el recorrido local: 7 pasos / 44 comprobaciones con el paquete P2 1.1.1.

No implementados: lenguaje natural general, extracción PDF/LLM general, RAG
multimodal, embeddings, bootstrap, regresión física validada, visión de vídeo,
CFD, diseño inverso ni autonomía experimental.

## Historial y continuidad

P1/P3/P4 se integró mediante [PR #2](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/2),
merge `8fffddc`; su código probado fue `fd83a84`. La [guía de backend](INTEGRATION_P134.md)
conserva esos antecedentes. Los resultados previos y relevos no sustituyen esta
entrega P6. `codex/team-start-v1` permanece congelada; usar la referencia vigente
sin reset ni borrar ramas de compañeros.
