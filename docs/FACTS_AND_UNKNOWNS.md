# Hechos decisiones e incógnitas

Actualización local: 14 de noviembre de 2026. Cada afirmación nueva debe indicar su categoría y fuente. No conviertas una decisión de diseño en un hecho científico.

## Confirmado por la petición del usuario

- Equipo de seis personas, Los TTS.
- Repositorio compartido: `https://github.com/Ryo-936hz/Flame-in-Freefall`.
- Trabajo mediante asistentes de IA en clones/ramas individuales.
- Objetivo: documentación, esqueleto integrado y reparto de tareas.
- La propuesta final aportada en DOCX guía el producto.
- El frontend futuro seguirá una inspiración estética de sistemas de Anduril.
- El usuario informó de un ZIP en `C:\Users\user\Desktop\NASA\Documents`.

## Instrucción vigente

The current P2 request authorizes rebuilding the data increment on `lujan` after
incorporating main, including provisional shared contract/consumer changes.
The previous attempt is preserved in Git backups. See [P2_DELIVERY](P2_DELIVERY.md).

El usuario ha autorizado además publicar la base en GitHub y dejar instrucciones
para seis personas. Se conserva Documents y el historial local. `main` es la
integración y `codex/team-start-v1` la referencia común de arranque, según TEAM_START.
La fase limitada a Markdown y la entrega exclusivamente local son antecedentes.

## Observado en la implementación local

- El paquete estaba en `NASA/FlameLab_Contexto_Codex/FlameLab_Contexto`; se integró tras comparar rutas y hashes, conservando el original.
- GitHub fue consultado de nuevo el 14 de noviembre de 2026: repositorio público vacío, sin refs/commits. No existía `NASA/Flame-in-Freefall`; se clonó y se creó la rama `codex/integrated-skeleton`.
- `datasets_lujan.zip` fue inspeccionado sin ejecutar su contenido ni modificar Documents: 24 investigaciones, 22 CSV, 27 PDF, 48 TXT ISA, 24 ZIP de metadatos, 2 DOC y ningún vídeo. Inventario, hashes y límites en [DATA_INSPECTION](DATA_INSPECTION.md).
- BASS-II Table 5.1 has now been extracted into a canonical local bundle: 20 tests, 43 conditions, 39 known rates and four missing rates. The scientific status is `unverified`. Initial/final oxygen are distinct test-level fields; intermediate oxygen remains unmeasured. Source discrepancies and review requirements are retained.
- El catálogo real tiene 24 estudios `metadata_only`, sin ensayos ni observaciones cuantitativas. El bundle demo separado contiene 2 estudios, 5 ensayos y 6 observaciones sintéticas.
- Hay API, contratos canónicos, repositorio SQLite con snapshots, CLI, ciencia, coordinación determinista y cliente técnico. Las pruebas concretas se registran en [VERIFICATION](VERIFICATION.md); los mocks del proveedor no son llamadas reales ni evaluación científica.

## Historia de la preparación documental

- La preparación se hizo en un entorno Linux remoto, sin acceso montado al disco Windows indicado.
- En aquel entorno el ZIP local no estaba adjunto ni accesible. La inspección local posterior se registra arriba.
- El remoto se observó vacío; ese dato se volvió a comprobar antes del clonado local.
- La entrega histórica no contenía resultados de pruebas del esqueleto. Las verificaciones posteriores con fixtures validan software, no hallazgos de NASA.

## Confirmado por fuentes documentales

- El reto plantea resumir, ordenar e interpretar investigaciones de combustión de PSI en un dashboard con SI.
- BASS-II estudia condiciones que incluyen concentración de oxígeno, ventilación y características del combustible.
- La escala y configuración deben revisarse al relacionar resultados BASS/Saffire.
- El enunciado indica ausencia actual de datos de combustión en gravedad parcial en PSI; no afirma que no exista investigación externa sobre el tema.

Enlaces y precisión del alcance en [SOURCES](SOURCES.md).

## Decisiones del proyecto

- Contrato Pydantic ejecutable como autoridad; OpenAPI y tipos derivados de la API.
- Monorepo con Python/FastAPI y React/TypeScript.
- Modo de desarrollo sin credenciales externas y modo IA configurable.
- Fixtures sintéticos identificados; datos reales separados.
- Comparabilidad, similitud y cobertura explícitas.
- Investigación por herramientas, con cálculos deterministas.
- Infraestructura sencilla antes de añadir servicios equivalentes.

## Pendiente de comprobar

| Incógnita | Responsable | Cómo se resuelve |
|---|---|---|
| Calidad y licencia de cada fuente inventariada | P2 | Ampliar la revisión más allá del inventario de archivos. |
| BASS-II scientific review | P2 + P3 | Review the extracted series, source discrepancies and comparability; extraction and import are implemented. |
| Caso Saffire adecuado | P2 + P3 | Revisar escala, material y configuración. |
| Réplicas independientes | P3 | Reconstruir unidad experimental. |
| Acceso a un modelo externo y presupuesto | P4 + P1 | Configuración de servidor y prueba acotada autorizada. |
| Nombres y usuarios de las seis personas | Equipo | Asignar P1–P6 en una decisión de coordinación. |
| Tiempo local de pitch y entrega | Equipo | Confirmar con organización local. |
| Licencias de cada archivo | P2 | Registrar por fuente antes de redistribuir. |
| PostgreSQL/pgvector | P1 | Ejecutar motor y migraciones; la configuración no prueba su funcionamiento. |
| Estado de cada nueva CI | P1 | Consultar Actions y VERIFICATION; no inferir éxito por haber subido el workflow. |

## Regla para nuevos resultados

Anota si son observados, calculados, digitalizados, sintéticos, inferidos o ilustrativos. Registra origen, condiciones y limitaciones. Un nombre NASA en el título no acredita que una tabla sea auténtica ni que sus filas sean independientes.
