# ADR 0010 — Mission Lab integrado y pruebas de navegador

- Fecha: 14 de noviembre de 2026.
- Estado: aceptado para la demo por la asignación del usuario de P1/P3/P4 y ahora P6.
- Base: `main`/P2 `f8e6a01`, P6 `80ceba4`, P5 `9f54700`; historial conservado mediante merge en `raul`.

## Problema

Los paneles P6 solo estaban montados en el arnés. Su parche para P5 apuntaba a
una versión anterior y omitía el catálogo P2. A/B no enviaba la métrica vigente,
la recuperación podía publicar una respuesta anterior después de Reset y el E2E
dependía de herramientas globales y señales de procesos exclusivas de Linux.

## Decisión

Conservar el host, estilos, presets, ilustración y exportación de P5 e integrar
MissionLabPanel/ReportPanel mediante MissionSlotProps. Mantener accesible StudyCatalog.
La métrica viaja explícita; solo el backend calcula ranking y comparaciones.
La selección de evidencia distingue corpus activo y snapshot de expediente.
Un ticket compartido decide qué investigación o recuperación puede publicar el resultado;
cada panel además descarta respuestas al desmontarse. Reset conserva los expedientes
guardados y los recientes, pero vacía la vista y cancela las operaciones pendientes.

Se añade `playwright` **1.65.1** como dependencia de desarrollo fijada por lockfile.
Es la única dependencia nueva de esta revisión; GSAP y las fuentes proceden de P5.
Chromium correspondiente se instala explícitamente, sin herramientas npm globales.
El runner usa Python de `.venv`, Vite local y procesos propios ocultos en Windows,
puertos libres, SQLite temporal y el fixture sintético explícito. No lee `.env`
para la API de pruebas y valida el directorio temporal antes de limpiarlo.
CI ejecuta el recorrido en Windows/Linux. La guía oficial de instalación/CI es
[Playwright](https://playwright.dev/docs/ci-intro).

## Alternativas y consecuencias

- Mantener un parche sin montaje dejaría sin probar la integración que pide P6.
- Reescribir P5 duplicaría sus componentes; se limita el cambio compartido a montaje,
  selección de fuentes y orden de publicación.
- Depender de Playwright global no permite un clon reproducible. El coste aceptado
  es descargar Chromium para E2E, separado del arranque normal.

No cambia el contrato HTTP ni se editan generados. `test:client` descubre todas las
pruebas P5/P6; `check.ps1 -E2E` añade el navegador cuando está instalado.
La verificación efectivamente ejecutada se registra en VERIFICATION; este ADR no
acredita por sí solo compatibilidad ni aprobación científica de datos NASA.


## Presets BASS-II aprobados, ampliación del mismo cierre

El relevo P2 1.1.1 y el dictamen P3 ya permiten diez puntos descriptivos de
BASS-II. El formulario general de P5 no representa selección de estudio/segmento;
se añaden presets acotados dentro de P6 que consumen los JSON versionados, sin
ampliar contratos ni duplicar controles de P5. No heredan filtros ajenos al caso.
La narrativa aprobada solo acompaña respuestas coherentes con los puntos revisados;
el corpus global sigue `scientific_unverified`.

Un segundo recorrido de navegador, opt-in con el paquete local aprobado, comprueba
los presets contra la API real y la recuperación de fuentes/informe. Reutiliza
el aislamiento del runner, con una ruta explícita de entrada de solo lectura.
El fixture sintético sigue siendo la prueba reproducible sin datos externos de CI.
No se versionan el bundle, ZIP, bases ni extractos descargados.

P5 publicó después `45edc50`/`8adec7a` (Ask SI y reorganización CSS). Es un incremento
independiente, no una dependencia para P6; permanece en su rama. El host integrado
en esta entrega es `9f54700`. El relevo P6 identifica cómo incorporar estos paneles
y conservar el contexto histórico de las citas en esa evolución de P5.
