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
