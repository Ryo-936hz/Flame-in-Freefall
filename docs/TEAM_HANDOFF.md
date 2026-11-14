# Relevo vigente — P6 integrado con P5

**P6 terminado para la demo integrada:** escenarios genéricos y presets BASS-II,
informe, recuperación y recorridos de navegador comprobados. Código **`66934638e37c1396eeab638631d54a2159ab7930`**;
la PR #3 permanece pendiente de integración en `main`. La comprobación real BASS-II
es local y opt-in; el CI utiliza datos sintéticos. Ver [relevo P6](handoffs/P6.md).

El usuario asignó P6 después del cierre P1/P3/P4. Entrega en `raul`, código
`66934638e37c1396eeab638631d54a2159ab7930`, [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3) abierta y todavía no fusionada en `main`.
Base `main` `f8e6a01`; se conservan P6 `80ceba4` y P5 `9f54700` mediante merge.
[Guion/arranque](DEMO.md), [relevo P6](handoffs/P6.md), [estado](IMPLEMENTATION_STATUS.md)
y [verificación](VERIFICATION.md).

Mission Lab, informe y recuperación están montados en Evidence Canvas. A/B y
consulta genéricos usan la métrica seleccionada; los presets BASS-II fijan tasa de propagación; los resultados anteriores se distinguen
al cambiar entradas. Las fuentes separan snapshot y corpus, y Reset/una consulta
nueva impiden que una respuesta tardía reabra el expediente anterior.

**Pruebas:** puerta original 342 Python/1 omisión y corpus 7/7; clon limpio
340 Python/3 omisiones; 76 cliente, E2E 24 pasos/58 checks. [CI](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286) aprobado
en Windows/Linux, PostgreSQL y navegador en ambos sistemas. Los avisos y límites
se detallan en VERIFICATION, sin convertir tests en validación científica.

| Puesto | Continuidad después de esta entrega |
|---|---|
| P1/P3/P4 | Revisar e integrar la PR; mantener contratos, puertas de pruebas y límites de interpretación. |
| P2/P3 | Conservar la aprobación descriptiva de los diez puntos BASS-II, aviso M8 y lunar corregido; ampliar revisión solo con fuentes. El corpus global sigue sin validación. |
| P5 | Integrar la PR #3 conservando sus cambios posteriores de AskSI/CSS; revisar citas históricas y guardas de AskSI. El host acreditado aquí es `9f54700`. |
| P6 | Mantener los presets y los dos recorridos de aceptación; la entrega no tiene bloqueos de implementación P6; lector de pantalla y móvil físico no se presuponen probados. |

Para un clon nuevo seguir README desde la etiqueta
`flamelab-p6-demo-2026-11-14`, que fija código y documentación para los seis. Para incorporar en una rama existente: guardar cambios, `git fetch origin`,
revisar el diff y hacer `git merge origin/raul`; después setup y check con E2E.
Una vez fusionada la PR, usar `origin/main` como referencia compartida. No reset
ni force push. No se movieron las referencias iniciales ni se enviaron mensajes
en nombre del equipo.

## Historial de la entrega P1/P3/P4

La PR #2 descrita a continuación ya se fusionó en `main` como `8fffddc`.
Sus pendientes de montaje P5/P6 pertenecen a aquel momento y quedan superados por
la entrega vigente de arriba; sus resultados de backend siguen siendo históricos.

El usuario asume P1/P3/P4. Entrega publicada en `raul`, [PR #2](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/2).
Código verificado `fd83a84aa24511e573a1b5f27cc859bcdddbf638`; las anotaciones posteriores solo documentan pruebas. [Guía reproducible](INTEGRATION_P134.md),
[estado](IMPLEMENTATION_STATUS.md), [verificación](VERIFICATION.md).

P1 publica el contrato/preview/snapshots/CI; P3 conserva identidad, controles,
métricas y evaluaciones; P4 conecta plan, herramientas y revisión acotada con
funcionamiento sin credenciales. El pendiente de métrica por segmento está cerrado.
Los nuevos tipos son aditivos y generados. Los expedientes antiguos permanecen
legibles con `plan=null`, sin recalcular resultados.

| Puesto | Siguiente trabajo propio |
|---|---|
| P1/P3/P4 | Mantener las puertas de check/CI y revisar cambios de datos/consumidores; no quedan stubs de su recorrido demo. |
| P2 | Resolver las dudas científicas de la auditoría con evidencia; no cambiar revisado/unverified por pasar software. |
| P5 | Consumir preview/plan, mostrar filtros/bloqueos y conectar Evidence Canvas con tipos regenerados. |
| P6 | Conectar A/B, informe y recuperación; probar el recorrido visual junto a P5. |

No se han enviado mensajes en nombre del equipo ni movido referencias iniciales.
La rama `main` se integra mediante el proceso de revisión acordado; usar el commit
exacto entregado, preservando ramas/cambios propios. El historial inferior conserva
el estado de la primera base y no sustituye esta sección.

## Histórico de la base inicial


Integrador P1. [Repositorio compartido](https://github.com/Ryo-936hz/Flame-in-Freefall),
rama de integración `main`. La referencia común de arranque es
`origin/codex/team-start-v1`: conservarla sin mover y crear una rama propia.
[TEAM_START](TEAM_START.md) contiene comandos para clonar, comprobar SHA, arrancar
y elegir puesto. No se han cambiado permisos ni asignado personas ficticias.

La construcción local anterior (`543c13b`, tag `flamelab-skeleton-2026-11-14`)
se conserva en el historial publicado y en el bundle histórico. La publicación
mediante Git conserva los commits locales. Para la primera tarea usar la referencia
común de TEAM_START, que añade la guía y el registro de publicación a aquella base.

## Terminado y pendiente

Pregunta con filtros → perfil/ranking/comparación → evidencia → hipótesis preparada
→ informe persistido. Datos sintéticos identificados, escenario lunar insuficiente,
snapshot conservado tras reinicio y sustitución del corpus. Ver VERIFICATION.

The standalone catalog remains 24 metadata-only studies. The P2 branch adds a
separate local BASS-II Table 5.1 extraction and canonical import with successive
conditions: 20 tests, 43 conditions, 39 known rates and four absences. Scientific
review remains pending; Saffire stays documentary context. See the English
[P2 delivery](P2_DELIVERY.md). Real external AI, PostgreSQL and NASA scientific
interpretation are not validated by these software checks.

## Reparto

| Puesto | Primer incremento | Área | Criterio y revisores |
|---|---|---|---|
| P1 Integración | Mantener CI y verificar PostgreSQL. | Contratos, API, storage, migraciones, scripts/CI | Motor y recuperación reales, sin deriva; P2/P4/P5. |
| P2 Datos | Revisar tabla 5.1, identidad, O2 temporal, caras, licencias. | data/, flamelab/data | Cada cifra con original/unidad/localizador; P3. |
| P3 Ciencia | Contrato de condiciones sucesivas con P2 y evaluación independiente. | science/, tests ciencia, evals | Sin pseudorreplicación ni métricas mezcladas; P1/P2/P4. |
| P4 IA | Planificador/evaluación de síntesis con corpus autorizado. | ai/, pruebas proveedor | Citas pertinentes, presupuesto y fallos medidos; P3/P5. |
| P5 Evidence Canvas | Tabla/gráfico/fuente unidos por IDs. | features/evidence, lib, marco común | Accesibilidad, unidades/procedencia, DESIGN_ANDURIL; P1/P3/P6. |
| P6 Mission Lab/demo | A/B, guion, hipótesis y siguiente experimento. | features/mission-lab, evals, DEMO | Cambios observables, propuestas rotuladas; P3/P5. |

Son roles, no nombres asignados. Los TTS deben indicar personas/usuarios GitHub.
Leer cada `docs/team/Px_*.md` y prompt asociado. Cada persona usa clon y rama propios
desde el mismo SHA. Cambios compartidos: acuerdo P1/productor/consumidor y regenerar
OpenAPI/TS en el mismo incremento; nunca copiar tipos a mano.

## Contratos, decisiones y continuidad

Autoridad `apps/api/src/flamelab/domain/contracts.py`. Primera versión ejecutable
1.0: entradas estrictas, IDs con namespace recuperables, fuentes seguras, procedencia,
ausencias/unidades; `uncertainty`/`interval` nulos; evidencia histórica con research_id.
CONTRACTS/CONTRACT_MODELS y ADR0007 registran diferencias frente a la propuesta.

Storage conserva snapshots JSON validados con SHA-256; no implementa todavía tablas
analíticas relacionales por observación. Flujo IA Python acotado, sin LangGraph ni
agentes autónomos. Sin embeddings, bootstrap, CFD u optimización.

Ejecutar setup/check, revisar rama/commit y cambios locales antes de editar. No reset
destructivo ni reemplazar documentos ajenos. El paquete documental fuente permanece
fuera del clon. Las licencias del ZIP siguen pendientes: no redistribuir originales
por el mero hecho de estar inventariados. Cada siguiente entrega usa
`docs/prompts/HANDOFF_TEMPLATE.md` con verificaciones ejecutadas y límites.
