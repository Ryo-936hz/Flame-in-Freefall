# Recorrido E2E P6 en la interfaz integrada

`p6-walkthrough.mjs` usa Chromium real, la API FastAPI real y SQLite temporal.
El host actual es la interfaz P5 con Mission Lab e informe P6 montados. Todos los
datos son **fixtures sintéticos**, no mediciones NASA; el proveedor es `demo`,
sin claves ni llamadas a un modelo externo.

## Instalar y ejecutar

Desde un clon configurado con `scripts/setup.ps1` en Windows, o `uv sync --locked`
y `npm ci --ignore-scripts` en Linux:

```powershell
node node_modules/playwright/cli.js install chromium
npm run test:e2e:p6 -- --screenshots=work/p6-e2e
```

En Linux de CI la instalación de navegador usa `install --with-deps chromium`.
Playwright está fijado en `package.json`/`package-lock.json`; no se buscan módulos
globales ni se descarga código durante la ejecución del recorrido. La primera
instalación del navegador necesita red. En el entorno Windows con npm gestionado,
`scripts/common.ps1` permite usar `Invoke-ProjectNpm` con los mismos argumentos.

Lanzamiento directo equivalente:

```powershell
node apps/web/tests/e2e/p6-walkthrough.mjs --host=p5 --screenshots=work/p6-e2e
```

## Aislamiento y portabilidad

- `runtime.mjs` usa Python del `.venv` del clon y Vite instalado mediante
  `process.execPath`; no depende de `uv`, `npx`, Python global ni shell.
- Elige puertos libres en loopback. `--api-port`/`--web-port` (o
  `P6_E2E_API_PORT`/`P6_E2E_WEB_PORT`) permiten fijarlos; un puerto ocupado se rechaza.
  Antes de consultar HTTP comprueba que el proceso propio haya anunciado su escucha.
- Crea una base nueva y un directorio temporal propio. La API arranca desde ese
  directorio, sin leer el `.env` del usuario, con fixture y proveedor explícitos.
  No se admite `--db`: el recorrido nunca importa, sustituye ni borra bases existentes.
- Al terminar, cierra Chromium y solo sus procesos hijos (árbol por PID propio en
  Windows; grupo propio en Linux). Valida la ruta temporal antes de eliminarla.
  Si la limpieza falla, la ejecución falla y conserva los archivos.
- Opciones restantes: `--root=<clon>`, `--headed`, `--timeout=<ms>` (100–120000),
  `--screenshots=<directorio>`. `P6_E2E_TMP` puede señalar una carpeta temporal
  existente. Las capturas solicitadas se conservan fuera del directorio efímero.

## Comportamientos comprobados

1. Host, paneles P6 y acceso al catálogo P2 y sus fuentes.
2. A/B con métrica explícita; abrir evidencia del corpus **antes** de investigar.
3. Investigación demo, hipótesis etiquetada y fuente histórica con `research_id`.
   Texto de fuente mostrado igual al texto devuelto por la API.
4. Comparación lunar sin candidatos, etiquetas de alcance y procedencia del corpus.
5. Cambio de filtros y de métrica: resultado anterior visible y recomputación con
   la métrica seleccionada. Una métrica ausente no reutiliza mediciones de otra.
6. Consulta insuficiente y cambio de pregunta: vigencia independiente de A/B.
7. Informe mostrado == respuesta `/report` == archivo descargado; eventos como
   replay literal, sin ejecutar de nuevo herramientas.
8. Recarga de página y reinicio de API sobre la misma base: recuperación del
   mismo expediente e informe; 404 y recuperación tras caída de la API.
9. Respuestas retenidas deliberadamente: Reset descarta recuperación y A/B
   pendientes; una investigación nueva prevalece sobre una recuperación anterior.
10. Temas oscuro/claro y viewport móvil de 390 px sin desbordamiento horizontal
    de página. Con `--screenshots`, se guardan capturas para inspección visual.
11. Ausencia de excepciones no capturadas de la página.

Salida: pasos PASS/FAIL, recuento de comprobaciones y código 0 solo si todos los
pasos y la limpieza pasan. Las pruebas de navegador complementan las pruebas
unitarias y HTTP; no equivalen a revisión con lector de pantalla, móvil físico,
validación científica de NASA ni evaluación de un proveedor externo.

Los resultados efectivamente ejecutados, entorno y commit están en
[`docs/VERIFICATION.md`](../../../../docs/VERIFICATION.md). No se reutilizan los
recuentos del antiguo arnés como si correspondieran a este host integrado.


## BASS-II real: comprobación opt-in separada

El CI ordinario ejecuta el recorrido **sintético**, incluido el rechazo de narrativas
aprobadas BASS-II cuando ese corpus no está cargado y Reset durante una petición
de preset pendiente. El CI no recibe ni distribuye los originales ni el bundle real.

Para probar los presets publicados de P2/P3, proporcionar por separado el
`bundle.json` del paquete interno **FlameLab Demo 1.1.1**:

```powershell
node apps/web/tests/e2e/p6-bass-walkthrough.mjs --bundle='C:\ruta\privada\bundle.json' --screenshots=work/p6-bass-e2e
```

También admite `FLAMELAB_P2_DEMO_BUNDLE` como entrada explícita. Si falta la entrada,
no se reemplaza con fixtures y termina con código 2. El preflight exige:

- SHA-256 `cb8b782fd73dbe4df0576b8047f3dea781a37d7c06c962ad2e978e607a00191d`.
- `dataset_id=psi:nasa-local-corpus-v1`, contrato 1.1, 24 estudios y ausencia de
  registros sintéticos.
- Los diez valores/IDs/muestras cotejados en el
  [dictamen P3](../../../../docs/handoffs/P3_BASS_II_DECISION_DEMO.md), siete unidades
  identificadas, O₂ de segmento ausente y aviso de discrepancia en ambas fuentes M8.

El runner carga el bundle en otra SQLite nueva, siempre con proveedor determinista,
y verifica los payloads exactos de `p2-demo-cases-v1.1.0.json`: cuatro puntos a
6 cm/s, seis a 5 cm/s, cambios A/B de selección y segmentos sin inventar réplicas,
texto aprobado de límites, y caso lunar sin restricción heredada de flujo.
Comprueba las fuentes M8 y su informe literales, descarga, recuperación tras
reiniciar API y recargar navegador, y layout de 1440/390 px. La entrada real nunca
se copia a Git ni se modifica. Las capturas se guardan solo en la ruta solicitada.

### Catálogo P2, campañas y contexto Saffire

El mismo recorrido opt-in también utiliza `p2-catalog-acceptance.mjs` para comprobar:

- Los 24 IDs y títulos del catálogo de la API aparecen en el selector de estudios.
- FLEX, SAME, SAME-R, CFI-G y Saffire I conservan sus métricas específicas;
  Flame Design aporta configuraciones sin observaciones y DAFT/Saffire II–III
  mantienen su alcance documental en este bundle.
- Páginas de fuentes/observaciones BASS-II con desplazamiento 0 → 20 → 0,
  identidad de ensayo y segmento, estados de ausencia y valores/unidades originales.
- Un fallo HTTP 503 deliberado en catálogo, página o fuente permite reintentar
  contra la API real. Cambiar estudio/página limpia la fuente anterior.
- Una investigación desde el formulario por cada campaña numérica anterior:
  selección de la métrica, un objetivo de material presente en la fuente, aislamiento
  de sus ensayos, valores y unidades en la tabla e informe persistido literal. No
  se infiere gravedad ni se fuerza una conclusión si falta eje X. Un objetivo vacío
  permanece insuficiente incluso con cobertura mínima cero; para explorar sin
  objetivos se utiliza el catálogo.
- Saffire se muestra en una tarjeta documental separada con enlaces atribuidos,
  discrepancias y aviso de que su presencia no confirma una importación. No añade
  puntos BASS ni ofrece acciones de ranking; Saffire I conserva únicamente su
  duración publicada y Saffire II/III no aportan tasa BASS normalizada.

La tarjeta Saffire se comprueba también en el recorrido sintético del CI. El
catálogo de 24 estudios, las métricas de campañas y los reintentos sobre sus
fuentes reales requieren el bundle privado explícito y no se atribuyen a ese CI.
Los fallos 503 son solo inyecciones de transporte para comprobar recuperación;
ningún valor científico ni respuesta de investigación se sustituye con mocks.

Este resultado verifica software, identidad y trazabilidad del guion; no convierte
el corpus `scientific_unverified` en validado ni estima causalidad, riesgo o física
lunar. Registrar por separado sus resultados y SHA; no atribuirlos al CI sintético.

## AI Research: caso preparado independiente

`node apps/web/tests/e2e/ai-research-walkthrough.mjs` verifica el recorrido visual,
la pausa humana, navegación, fuentes y exportación en un runtime aislado.
Acepta `--screenshots=work/ai-research-synthetic` y, opcionalmente,
`--bundle="C:\ruta\privada\bundle.json"` para comprobar los registros reales.
Sin bundle comprueba la ausencia explícita de registros NASA en el corpus sintético.
El caso preparado no se presenta como una investigación generada por ese corpus.
[Guion, alcance y resultados](../../../../docs/AI_RESEARCH_CASE.md).
