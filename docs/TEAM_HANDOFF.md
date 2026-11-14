# Relevo de ingeniería — Los TTS

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

24 estudios reales son metadata_only. BASS-II tabla 5.1 PDF65/impresa57 es candidata
pendiente de transcripción, condiciones sucesivas y revisión. Saffire exige aclarar
encabezados/unidades/configuración. No se validó IA real, PostgreSQL ni ciencia NASA.

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
