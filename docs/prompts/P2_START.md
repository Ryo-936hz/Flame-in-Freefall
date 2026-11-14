# P2 — Datos reales y procedencia

Copia el bloque completo en Codex con tu clon abierto. No hace falta rellenar una tarea: ya está definida. Consulta el [reparto y coordinación](DEMO_COORDINATION.md).

```text
Actúa como responsable de Datos reales y procedencia (P2) de FlameLab SI, equipo Los TTS.
Trabaja sobre el clon abierto de https://github.com/Ryo-936hz/Flame-in-Freefall.
Tu objetivo es completar tu parte de la demo integrada, no crear otro esqueleto.

ANTES DE EDITAR
Lee AGENTS.md, docs/TEAM_START.md, docs/START_HERE.md,
docs/IMPLEMENTATION_STATUS.md, docs/TEAM_HANDOFF.md, docs/WORKFLOW.md,
docs/prompts/DEMO_COORDINATION.md y docs/team/P2_DATA.md.
Si la guía de coordinación aún no existe en tu rama, después de git fetch origin
léela con git show origin/codex/demo-programmer-prompts:docs/prompts/DEMO_COORDINATION.md.
Puedes leer la documentación nueva sin cambiar tu base de código ni copiar encima
de cambios locales. Este prompt concreta la tarea frente a prioridades históricas.
Después lee docs/DATA_INSPECTION.md, docs/DATA_INGESTION.md, docs/DATA_DICTIONARY.md, docs/SCIENTIFIC_RULES.md y docs/SOURCES.md.
Inspecciona git status, rama, commit y código real de tu área. Las rutas de este
prompt son relativas al repositorio; ** indica archivos descendientes y las rutas
marcadas nuevas se pueden crear, no se presuponen implementadas.

La base inicial común es 422f6b03f410c6ac049b699e13fc204a3af67743,
origin/codex/team-start-v1 (tag flamelab-team-start-v1). Si comienzas sin rama propia
ni trabajo pendiente, crea codex/p2-datos-bass desde esa referencia verificada.
Si ya tienes trabajo, consérvalo y comprueba su base antes de continuar; no hagas
reset, no cambies ramas de otra persona y no muevas la referencia común.
Incorpora después los cambios compartidos de main acordados; no vuelvas a la base
antigua tras cada entrega. Sigue TEAM_START para setup y arranque en Windows.

LÍMITES COMUNES
La demo actual usa fixtures sintéticos; el catálogo real es metadata_only.
El planificador de lenguaje natural y la interfaz de producto están pendientes.
No conviertas una propuesta/documento en capacidad implementada ni un test simulado
en validación real. Mantén modo sin credenciales, procedencia y fuentes verificables.
No publiques originales, claves ni bases. La autoridad es domain/contracts.py;
packages/contracts se genera desde API y no se edita a mano.
Trabaja únicamente en las rutas asignadas abajo. Para otra ruta, entrega al dueño
una solicitud con motivo, ejemplo entrada/salida y prueba esperada. Continúa las
partes independientes; no inventes contratos ni ocultes el bloqueo con casts.
No necesitas permiso para ediciones rutinarias dentro de tu tarea.

TAREA
Prepara la primera serie BASS-II cuantitativa revisable e importable.
1. Localiza la fuente indicada en DATA_INSPECTION: BASS-II Summary Report
   NASA/TM-20210011385, tabla 5.1, página PDF 65 / impresa 57, ensayos M1–M20.
   Verifica la tabla y su contexto en el documento; no transcribas desde memoria.
   Si el original no está disponible, documenta el bloqueo y avanza con el
   importador y casos sintéticos rotulados, sin inventar números.
2. Conserva texto/valor original, unidad, normalización, estudio, muestra,
   ensayo, secuencia y localizador de cada cifra. Registra las discrepancias
   CSV/PDF; Fan/Air display no equivale a velocidad física en cm/s.
3. M6/M12 "Not tracked" son ausencias. Varias parejas velocidad/tasa de un ensayo
   no son réplicas. O2 inicial/final no es O2 medido en cada meseta.
4. Propón a P1/P3 los campos necesarios; tras recibir el contrato integrado,
   adapta CLI/importador y validaciones. No inventes un segundo contrato público.
5. Entrega una serie pequeña revisada por P3, con manifiesto de revisión y
   procedencia. Mantén Saffire como contraste cualitativo hasta resolver unidades,
   configuración y comparabilidad; no fuerces un gráfico combinado.

ARCHIVOS QUE PUEDES EDITAR
- apps/api/src/flamelab/data/**.
- data/catalog/**, data/fixtures/** y nuevo data/reviewed/bass-ii/**.
- data/raw/**, data/processed/** y work/p2/** SOLO como archivos locales excluidos.
- apps/api/tests/test_data.py y nuevo test_bass_ingestion.py.
- docs/DATA_INSPECTION.md, DATA_INGESTION.md, DATA_DICTIONARY.md y SOURCES.md.
- docs/handoffs/P2.md.
data/reviewed es una ruta nueva propuesta para derivados autorizados: antes de
versionar datos revisa licencia/procedencia; si no está resuelto, deja allí solo
manifiesto/instrucciones y conserva números transcritos localmente en data/processed.
No publiques el ZIP/PDF original. No borres o cambies IDs del fixture demo existente.
P1 modifica contracts.py, persistencia, migraciones y generados; P3 modifica ciencia.

PRIMER INCREMENTO
Transcribe un subconjunto con una condición, otro con condiciones sucesivas y
un dato ausente; entrega localizadores y propuesta de mapeo a P1/P3. Amplía después
a la tabla, sin bloquear el primer incremento en un extractor PDF general.

CRITERIOS DE ACEPTACIÓN
- Cada observación incluida vuelve a la tabla/fila y mantiene valor original y unidad.
- Duplicados, referencias rotas, ausencias y discrepancias tienen validación o
  registro explícito; cero no se interpreta como ausencia.
- Importar dos veces conserva identidad y no multiplica ensayos/observaciones.
- La serie pasa el contrato acordado; P3 deja constancia de la revisión de comparabilidad.
- No se presentan secuencias como ensayos independientes ni O2 interpolado como medido.
- Datos reales y sintéticos quedan separados en IDs, procedencia y selección.
- Se documenta un comando reproducible de validación/importación y su resultado.
  Si falta fuente/licencia/revisión, esa parte queda pendiente, nunca "aprobada".

VERIFICACIÓN
Ejecuta .venv\Scripts\python.exe -m pytest apps/api/tests/test_data.py
apps/api/tests/test_bass_ingestion.py -q (en una sola línea), Ruff sobre tus cambios
y la CLI real de validate/import con un destino temporal. Consulta su --help antes
de escribir comandos. Prueba duplicados, Not tracked, unidades y referencias.

ENTREGA
Completa incrementos revisables con pruebas pertinentes; no te quedes solo en un plan.
Actualiza únicamente tu documentación asignada y docs/handoffs/P2.md usando
docs/prompts/HANDOFF_TEMPLATE.md. Incluye SHA inicial/final, rutas, comportamiento,
comandos ejecutados, resultados, pendientes, datos usados y solicitudes a otros
puestos. Los documentos globales de estado/decisiones los consolida P1; envíale
los hechos por el relevo, sin editarlos los seis a la vez.
Revisa el diff y prepara la entrega en tu rama siguiendo WORKFLOW. No merges
automáticamente en main ni fuerces pushes. No contactes a compañeros ni abras
mensajes en su nombre: deja las solicitudes listas para que la persona las comparta.
```
