# P5 — Evidence Canvas e interfaz común

Copia el bloque completo en Codex con tu clon abierto. No hace falta rellenar una tarea: ya está definida. Consulta el [reparto y coordinación](DEMO_COORDINATION.md).

```text
Actúa como responsable de Evidence Canvas e interfaz común (P5) de FlameLab SI, equipo Los TTS.
Trabaja sobre el clon abierto de https://github.com/Ryo-936hz/Flame-in-Freefall.
Tu objetivo es completar tu parte de la demo integrada, no crear otro esqueleto.

ANTES DE EDITAR
Lee AGENTS.md, docs/TEAM_START.md, docs/START_HERE.md,
docs/IMPLEMENTATION_STATUS.md, docs/TEAM_HANDOFF.md, docs/WORKFLOW.md,
docs/prompts/DEMO_COORDINATION.md y docs/team/P5_FRONTEND.md.
Si la guía de coordinación aún no existe en tu rama, después de git fetch origin
léela con git show origin/codex/demo-programmer-prompts:docs/prompts/DEMO_COORDINATION.md.
Puedes leer la documentación nueva sin cambiar tu base de código ni copiar encima
de cambios locales. Este prompt concreta la tarea frente a prioridades históricas.
Después lee docs/DESIGN_ANDURIL.md, docs/PRODUCT.md, docs/CONTRACTS.md y apps/web/README.md.
Inspecciona git status, rama, commit y código real de tu área. Las rutas de este
prompt son relativas al repositorio; ** indica archivos descendientes y las rutas
marcadas nuevas se pueden crear, no se presuponen implementadas.

La base inicial común es 422f6b03f410c6ac049b699e13fc204a3af67743,
origin/codex/team-start-v1 (tag flamelab-team-start-v1). Si comienzas sin rama propia
ni trabajo pendiente, crea codex/p5-evidence-canvas desde esa referencia verificada.
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
Sustituye el arnés técnico por una interfaz de demo utilizable: formular pregunta,
revisar filtros interpretados, investigar y explorar tabla, gráfico y evidencia.
Sigue la dirección visual documentada con una implementación acotada a la demo.
1. Construye composición común, navegación/selección y formulario sin JSON manual.
   Mientras P4 prepara el planificador, permite filtros explícitos tipados.
2. Implementa tabla de ensayos, gráfico con unidades y ranking con cobertura.
   Enlaza punto, fila y fuente mediante IDs; nunca por posición de array.
3. Presenta evidencia y localizador con el research_id del resultado para conservar
   contexto histórico. Distingue evidencia localizable de una URL disponible;
   no inventes enlaces a PDFs ausentes.
4. Muestra carga, error, vacío, insuficiencia y procedencia real/sintética. Permite
   operar con teclado y etiquetas accesibles.
5. Acuerda con P6 props/callbacks y montaje de MissionLabPanel y ReportPanel.
   Tú editas App.tsx y estilos globales; P6 edita exclusivamente sus módulos.

ARCHIVOS QUE PUEDES EDITAR
- apps/web/src/App.tsx, main.tsx, style.css y apps/web/index.html.
- apps/web/src/lib/** y nuevos apps/web/src/components/**.
- apps/web/src/features/evidence/**.
- apps/web/tests/client.test.ts, live-smoke.ts y nuevo tests/evidence/**.
- apps/web/README.md y docs/handoffs/P5.md.
P6 es dueño de features/mission-lab/**, features/report/** y tests/e2e/**.
P1 es dueño de packages/contracts/**, manifiestos, lockfiles y configuración de build.
No copies tipos de API: importa los generados y usa createApi de src/lib/client.ts.
No construyas otro cliente en cada panel ni edites backend para ajustar el gráfico.

PRIMER INCREMENTO
Entrega el marco común y selección tabla → evidencia con fixtures existentes.
Antes de integrar P6, acuerda la firma mínima de los componentes: resultado/
investigación seleccionada, API compartida o callbacks tipados, cambio de selección
y apertura de evidencia. Es una interfaz propuesta, no un export ya existente.
P6 publica sus componentes; tú haces el montaje en un incremento pequeño.

CRITERIOS DE ACEPTACIÓN
- Un usuario completa pregunta/filtros → resultado → punto/fila → fuente sin
  editar JSON, sin conocer IDs y sin recargar para cada paso.
- Selección coherente y navegación por teclado; las unidades, grupos y exclusiones
  vienen del backend y no de reglas científicas duplicadas en React.
- Modo sintético/real y modo IA demo/proveedor son visibles; nunca se rotulan
  fixtures como mediciones NASA.
- Carga/error/vacío/insuficiencia son distinguibles y permiten corregir/reintentar.
- Respuestas tardías de una consulta anterior no sobrescriben la selección actual.
- Ambos paneles de P6 quedan montados mediante la frontera acordada; no hay cambios
  concurrentes de App, estilos globales ni modelos generados.
- Tipado, pruebas cliente y build pasan; realiza una comprobación real en navegador
  con datos actuales y registra limitaciones visuales o de accesibilidad.

VERIFICACIÓN
Ejecuta npm run typecheck, npm run test:client y npm run build, con el npm indicado
por TEAM_START si no está en PATH. Ejecuta tus nuevas pruebas de tests/evidence
con el runner acordado; pide a P1 añadir su comando a check/CI. Recorre tabla,
gráfico y fuente con teclado, y comprueba error/insuficiencia. No declares E2E de
producto ejecutado por haber pasado únicamente pruebas del cliente HTTP.

ENTREGA
Completa incrementos revisables con pruebas pertinentes; no te quedes solo en un plan.
Actualiza únicamente tu documentación asignada y docs/handoffs/P5.md usando
docs/prompts/HANDOFF_TEMPLATE.md. Incluye SHA inicial/final, rutas, comportamiento,
comandos ejecutados, resultados, pendientes, datos usados y solicitudes a otros
puestos. Los documentos globales de estado/decisiones los consolida P1; envíale
los hechos por el relevo, sin editarlos los seis a la vez.
Revisa el diff y prepara la entrega en tu rama siguiendo WORKFLOW. No merges
automáticamente en main ni fuerces pushes. No contactes a compañeros ni abras
mensajes en su nombre: deja las solicitudes listas para que la persona las comparta.
```
