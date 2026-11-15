# AI Research — caso preparado BASS-II

## Alcance y base

Trabajo exclusivo de `raul`, sobre la integración de `origin/main` **`d46d27b`**.
Se adopta el diseño nuevo de `main`: navegación, paleta, tipografía y estructura
actuales. El experimento UX de cinco pantallas de **`72e6e2b`** se conserva como
historial en [UX_EXPERIMENT_RAUL](UX_EXPERIMENT_RAUL.md) y en Git; no describe el
host vigente. Este incremento no se fusiona en `main`.

AI Research presenta una secuencia predefinida de cinco roles: Coordinator,
Scout, Analyst, Critic y Writer. Los personajes se desplazan entre las
tarjetas de documentos. Su movimiento es una coreografía de interfaz, no una
medida de velocidad de procesamiento ni una ejecución de agentes autónomos.
La pantalla lo identifica como **Prepared case** y el informe conserva ese alcance.

Los valores son diez observaciones publicadas de BASS-II cotejadas por P3, con
siete muestras identificadas. La composición del caso y sus conclusiones están
preparadas. No se realizan llamadas a un LLM, búsquedas vectoriales ni cálculos
científicos nuevos al ejecutar la animación. La implementación Qwen/Ollama y el
proveedor OpenAI incorporados desde `main` mantienen su recorrido independiente.
No se añade LangChain, LangGraph ni MCP como dependencia de esta pantalla.

## Cómo iniciar el recorrido

Arrancar el proyecto mediante una de las vías del [README](../README.md#instalación-y-arranque).
En el arranque local habitual, abrir:

```text
http://127.0.0.1:5173/#/dashboard/ai-research
```

Si se usa otro puerto, conservar el fragmento `#/dashboard/ai-research`.
No hace falta escribir una pregunta especial. La pantalla incluye este caso fijo:

> Compare BASS-II flame spread at 6 and 5 cm/s. What can the evidence support?

1. Pulsar **Start research**. La secuencia pasa por Plan (3 s), Sources (6 s)
   y Compare (6,5 s). El avance hasta la revisión dura aproximadamente **15,5 s**
   mientras la pantalla está activa y sin pausas.
2. En **Review**, inspeccionar la discrepancia M8. **Inspect source** abre la
   nota preparada y el enlace a la publicación original.
3. Marcar las tres comprobaciones: conservar M8, contar siete muestras y aceptar
   solo una comparación descriptiva con O₂ efectivo por segmento desconocido.
   Se puede añadir una nota propia.
4. Pulsar **Accept descriptive scope**. El botón exige las tres casillas marcadas.
   La etapa Report dura aproximadamente **4 s** antes de mostrar la conclusión.
5. **Download prepared report** descarga Markdown con los valores, fuentes,
   limitaciones y la nota de revisión. Este documento se genera en el navegador;
   no es un expediente nuevo persistido por la API.

**Pause / Resume** detiene o continúa las etapas temporizadas. **Reset case**
reinicia la secuencia y limpia casillas, nota y selección de fuente. El recorrido
se pausa al ocultar la pestaña, salir de esta vista o abrir una fuente. La
navegación dentro de la sesión conserva el progreso; recargar la página inicia
un caso nuevo. La revisión humana no tiene temporizador de aprobación automática.

## Fuentes y acceso real al corpus

Las tarjetas muestran notas preparadas con referencias a publicaciones. **Open
original publication** abre el documento original. **Load active corpus record**
consulta realmente `GET /api/v1/evidence/{evidence_id}`; el fragmento se muestra
literalmente y separado de la nota preparada. Si la API o el registro no están
disponibles, aparece ese estado y siguen accesibles la nota y el enlace original.
No se sustituye un fallo de API por un resultado presentado como recuperado.

| Tarjeta | Registro de evidencia | Fuente |
|---|---|---|
| NASA technical memorandum | `psi:PSI-25:M13:stage:1:table51` | NASA/TM-20210011385, PDF 65 / impresa 57, Tabla 5.1. |
| BASS-II · Table 5.1 | `psi:PSI-25:M8:stage:2:table51` | Misma página, fila M8; contraste con Figura 5.2. |
| M8 · sample & review notes | `psi:PSI-25:M8:operational` | CSV operativo BASS-II, línea física 35 contando cabecera. |

- [Informe NASA, página 65](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65).
- [Registro publicado PSI-25](https://doi.org/10.60555/4qc4-de67).
- [Dictamen P3 y localizadores de los diez puntos](handoffs/P3_BASS_II_DECISION_DEMO.md).
- [Textos aprobados del caso](../data/catalog/p2-demo-copy-v1.1.1.json).

La carga opcional de registros requiere el corpus P2 correspondiente. La
animación y los enlaces publicados funcionan con el caso preparado aunque ese
corpus no esté instalado. La importación se documenta en [DEMO](DEMO.md); este
incremento no publica el bundle privado ni reemplaza la base activa.

## Interpretación y revisión humana

Las selecciones de 6 y 5 cm/s contienen cuatro y seis observaciones, repartidas
en siete ensayos y siete muestras identificadas. M7, M8 y M13 aparecen en ambas
selecciones. En esas parejas, la tasa tabulada es menor a 5 cm/s; las condiciones
son sucesivas y no aíslan un efecto causal del flujo.

M8 mantiene **0.056 mm/s a 6 cm/s** y **0.04 mm/s a 5 cm/s** de la Tabla 5.1.
La Figura 5.2 publica ajustes de **0.0557** y **0.0391 mm/s**, respectivamente.
La discrepancia permanece abierta y no se resuelve mediante promedio o reanálisis.

Los segmentos no son réplicas nuevas y `sequence` representa orden publicado,
no tiempo. Los extremos de O₂ pertenecen al ensayo completo; no se asignan a los
segmentos. Las láminas PMMA operan en microgravedad y flujo opuesto; sus espesores
y anchos varían. Se conocen dos caras en combustión, pero su identidad no está
reportada. No se consideran grupos físicamente equivalentes ni se estima riesgo.

La aceptación humana reconoce estos límites para el caso visual. No cambia
`reviewed`, no valida científicamente el corpus y no atribuye independencia
estadística completa a las muestras. La conformidad P3 sigue limitada a los diez
puntos y su lectura descriptiva documentada.

## Archivos y verificación

- `apps/web/src/features/ai-research/case.ts`: pregunta, fuentes, valores, etapas
  y contenido del informe preparado.
- `apps/web/src/features/ai-research/AIResearch.tsx`: avance, pausa, revisión humana,
  consulta opcional de fuente y descarga.
- `apps/web/src/features/ai-research/AgentArena.tsx`: presentación de los personajes.
- `apps/web/src/features/ai-research/research.css`: estilos de la pantalla.

### Verificación local · 15 de noviembre de 2026

Código: `6f13ddf2247d466ea736770920ef77f8f1c8c4aa`, sobre el merge `b9951b7` de main en raul.

| Comprobación | Resultado |
|---|---|
| TypeScript y build Vite | Correctos. |
| Cliente | 86 pruebas, 0 fallos. |
| AI Research con corpus sintético aislado | 7 pasos, 39 comprobaciones, 0 fallos. |
| AI Research con bundle P2 real aislado | 7 pasos, 39 comprobaciones, 0 fallos. |
| Revisión visual | Escritorio y móvil de 390 px, temas oscuro/claro, diálogo de fuentes y revisión humana. |
| API y contratos | Coinciden con main d46d27b; no se añaden endpoints ni modelos. |

El navegador verificó pausa manual, navegación fuera de la vista, reducción de
movimiento, fuentes literales reales/ausencia explícita con corpus sintético,
Escape, las tres condiciones obligatorias de revisión, exportación con nota del
usuario y valores M8, y descarte de respuestas tardías tras Reset. Los runtimes de
prueba cerraron sus servicios y bases temporales correctamente. No se llamó a un
LLM ni se repitió la suite Python completa: estos resultados verifican el recorrido
preparado y no acreditan agentes autónomos ni validación científica adicional.

Se corrigió durante esta verificación el temporizador: se calcula el incremento
antes de pasarlo al updater de React, evitando que una ejecución diferida altere
la duración de las etapas.

Desde la raíz del clon configurado, con Chromium de Playwright instalado:

```powershell
. .\scripts\common.ps1
Invoke-ProjectNpm @('run', 'typecheck')
Invoke-ProjectNpm @('run', 'test:client')
Invoke-ProjectNpm @('run', 'build')
node apps/web/tests/e2e/ai-research-walkthrough.mjs --screenshots=work/ai-research-synthetic
node apps/web/tests/e2e/ai-research-walkthrough.mjs --bundle="C:\ruta\privada\bundle.json" --screenshots=work/ai-research-real
```

La prueba real utilizó el bundle P2 SHA-256
`cb8b782fd73dbe4df0576b8047f3dea781a37d7c06c962ad2e978e607a00191d`.
Las capturas y logs quedan en `work/ai-research-*`, excluidos de Git.
El código del test está en `apps/web/tests/e2e/ai-research-walkthrough.mjs`.
