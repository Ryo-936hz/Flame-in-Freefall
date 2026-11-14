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
