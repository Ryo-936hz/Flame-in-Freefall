# Reparto para terminar la demo — seis programadores

Este reparto concreta la siguiente fase de programación. **Es trabajo pendiente,
no una declaración de capacidades terminadas.** Sustituye las prioridades iniciales
de los paquetes generales donde difieran: para la demo, P1 prioriza contratos e
integración SQLite; PostgreSQL no bloquea la entrega. El frontend se limita a la
experiencia necesaria para demostrar el recorrido; no se exige completar toda la
visión de producto.

## Uso

1. Abrir un clon propio en Codex y copiar completo el bloque del prompt del puesto.
2. Partir de `origin/codex/team-start-v1`, SHA
   `422f6b03f410c6ac049b699e13fc204a3af67743`, si es la primera tarea.
   Conservar cualquier rama/trabajo ya existente. [Arranque Windows](../TEAM_START.md).
3. Una rama por puesto; incorporar después los contratos integrados en `main`.
   La referencia inicial y el tag `flamelab-team-start-v1` no se mueven.
4. Revisar los criterios del prompt, realizar incrementos pequeños y entregar
   resultados reales. P1 consolida documentos globales; cada puesto escribe su
   propio `docs/handoffs/Px.md` (ruta nueva).

Los prompts nuevos se distribuyen en la rama documental
`codex/demo-programmer-prompts`. Se pueden copiar desde GitHub sin cambiar la base
de código común. P1 puede integrar esta rama documental antes del desarrollo;
los compañeros actualizan su rama de trabajo desde main cuando se acuerde.

## Puestos

| Puesto | Resultado | Prompt | Revisión |
|---|---|---|---|
| P1 | Contrato, API, persistencia e integración de demo | [P1](P1_START.md) | P2/P3 semántica; consumidores afectados |
| P2 | Serie BASS-II trazable y revisada | [P2](P2_START.md) | P3; P1 contrato |
| P3 | Comparación reproducible y unidad experimental correcta | [P3](P3_START.md) | P2/P4 |
| P4 | Pregunta → plan explícito → herramientas → explicación citada | [P4](P4_START.md) | P3/P5; P1 contrato |
| P5 | Formulario, tabla, gráfico, evidencia y marco común | [P5](P5_START.md) | P3/P6; P1 consumidor |
| P6 | A/B, informe, recuperación y recorrido de navegador | [P6](P6_START.md) | P3/P4/P5 |

## Propiedad exclusiva de las zonas compartidas

El propietario escribe; el revisor propone/revisa. Una solicitud no concede edición
simultánea. Para transferir una ruta, registrar responsable, alcance y commit antes
de tocarla. Las carpetas aún inexistentes de esta tabla son destinos propuestos.

| Zona | Único propietario durante esta demo |
|---|---|
| `apps/api/src/flamelab/domain/**`, `storage/**` dentro de flamelab, `main.py`, `config.py`, Alembic | P1 |
| `packages/contracts/**` | P1 mediante generación; nadie a mano |
| Manifiestos/lockfiles, configuración build/tests, `scripts/**`, `.github/workflows/**` | P1 |
| `apps/api/tests/test_api.py`, `test_contracts.py`, `test_storage.py`, `test_review.py`, `test_demo_integration.py`, fixtures Python compartidos | P1 |
| `apps/api/src/flamelab/data/**`, `data/**`, `test_data.py`, `test_bass_ingestion.py` | P2 |
| `apps/api/src/flamelab/science/**`, `test_science.py`, `test_condition_segments.py`, `evals/science/**` | P3 |
| `apps/api/src/flamelab/ai/**` incluido `report.py`, `test_provider.py`, `test_planner.py`, `test_ai_reports.py`, `evals/ai/**` | P4 |
| `apps/web/src/App.tsx`, `main.tsx`, `style.css`, `src/lib/**`, `src/components/**`, `src/features/evidence/**`, `apps/web/index.html` | P5 |
| `apps/web/tests/client.test.ts`, `live-smoke.ts`, `tests/evidence/**` | P5 |
| `apps/web/src/features/mission-lab/**`, `features/report/**`, `apps/web/tests/e2e/**`, `evals/demo/**` | P6 |
| README raíz, AGENTS, contratos, decisiones, estado, verificación y guías generales | P1 |
| DATA_INSPECTION, DATA_INGESTION, DATA_DICTIONARY y SOURCES | P2 |
| METHOD y evaluación en `evals/science/**` | P3 |
| AI_SYSTEM y evaluación en `evals/ai/**` | P4 |
| `apps/web/README.md` y documentación interna de sus componentes | P5 |
| DEMO y documentación interna de sus componentes | P6 |
| `docs/handoffs/Px.md` | Solo el puesto Px |

Las pruebas Python nombradas sin prefijo están en `apps/api/tests/`.
Los prefijos abreviados del frontend pertenecen a `apps/web/`.
Toda nueva dependencia se solicita a P1: no regenerar lockfiles en seis ramas.

## Acuerdos antes de depender de trabajo ajeno

**P1/P2/P3:** modelo de condiciones sucesivas, identidad experimental, geometría,
caras y oxígeno inicial/final. P2 entrega ejemplos de fuente; P3 define semántica
y resultados esperados; P1 implementa y genera tipos. Hasta integrarlo, no importar
datos reales mediante campos inventados ni duplicar ensayos para cada meseta.

**P4/P1/P5:** catálogo acotado de preguntas, plan interpretado visible, tratamiento
de ambigüedad y conflictos con filtros explícitos. La demo sin clave puede resolver
ese catálogo de forma determinista, identificándolo como tal.

**P5/P6:** P6 propone exports `MissionLabPanel` y `ReportPanel` en sus carpetas;
P5 acuerda props/callbacks y hace el montaje en App. Acordar investigación activa,
API/callbacks tipados, selección y apertura de evidencia. No existe todavía esta
interfaz: no asumir nombres de campos hasta comprobar el contrato. P5 mantiene
estilos globales; P6 usa estilos acotados a sus componentes.

**P6/P4/P1:** P6 presenta/descarga informe y prueba recuperación; P4 mantiene
contenido y renderizado backend; P1 conserva endpoints/snapshots. Ningún puesto
reimplementa el informe en paralelo.

Cada solicitud incluye: archivo/contrato, motivo, ejemplo de entrada/salida,
compatibilidad, prueba esperada y propietario. El asistente deja el relevo listo;
la persona lo comparte. No enviar mensajes en nombre del equipo automáticamente.

## Orden de entrega

1. P1/P2/P3 cierran contrato; P4 cierra catálogo; P5/P6 cierran montaje.
2. P2/P3 avanzan revisión y pruebas. P4/P5/P6 construyen contra la API y fixtures
   existentes, siempre marcados sintéticos.
3. P1 integra el contrato con compatibilidad y publica los generados. Los consumidores
   actualizan sus ramas. Luego se integran serie revisada, ciencia, planificación,
   Evidence Canvas y paneles; se prueba cada incremento.
4. P6 ejecuta el recorrido completo; P1 verifica clon limpio, persistencia y CI.
   El último bloque se dedica a errores e integración, sin añadir alcance nuevo.

## Definición de demo terminada

- Pregunta/filtros visibles → selección y comparación → punto/fila/fuente enlazados
  → escenario A/B → informe descargable → recuperar investigación tras reinicio.
- Sin claves y sin JSON manual; modos demo/sintético y límites científicos visibles.
- Una consulta válida, otra con condición cambiada y otra sin evidencia suficiente.
- Contratos generados consistentes; pruebas pertinentes de cada puesto y recorrido
  real de navegador ejecutados con commit y comandos registrados.
- Si BASS-II no supera acceso, procedencia/licencia y revisión P2/P3, el recorrido
  sintético puede estar completo, pero **la entrega con datos reales sigue pendiente**.
  No marcar el proyecto entero validado con NASA por superar pruebas software.
