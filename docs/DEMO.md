# Demo vigente — Mission Lab integrado

Entrega P6 en `raul`, con P1/P3/P4 y P2 de `main`, P6 `80ceba4` y el host P5
`9f54700` integrados. El commit de entrega y pruebas ejecutadas están en
[relevo P6](handoffs/P6.md) y [VERIFICATION](VERIFICATION.md).
El [guion anterior](handoffs/P6_DEMO_HISTORY.md) se conserva como historial.

## Preparación reproducible en Windows

La etiqueta `flamelab-p6-demo-2026-11-14` fija esta entrega para los seis.
En un clon nuevo, `git fetch origin --tags` y
`git switch -c mi-demo flamelab-p6-demo-2026-11-14`.
En una rama existente, conservar e integrar los cambios propios; no hacer reset.
Git, Python 3.12, Node 24/npm y PowerShell 7; instalación inicial con red:

```powershell
.\scripts\setup.ps1
node node_modules/playwright/cli.js install chromium
.\scripts\check.ps1 -E2E
```

El check con navegador inicia su propia API/Vite, puertos libres y SQLite temporal.
No requiere claves, Docker, ZIP NASA ni un servidor previamente iniciado. Instala
dependencias desde lockfiles; no presupone Playwright, uv o npm global para el E2E.
Para la presentación manual, dos terminales desde la raíz:

```powershell
.\scripts\dev-api.ps1
```

```powershell
.\scripts\dev-web.ps1
```

Abrir http://127.0.0.1:5173. El entorno demo habitual debe mostrar datos sintéticos.
Setup conserva `.env`; una base con datos importados no se sustituye automáticamente.
Si la base habitual es real, usar el recorrido E2E aislado para reproducir los
resultados de este guion, sin reemplazar el corpus del usuario.

## Guion de tres casos

1. **Investigación conocida.** Usar «Reset» y «Investigate». La tasa de propagación
   frente al flujo usa cuatro observaciones de tres ensayos sintéticos. Varias
   observaciones del mismo ensayo no crean unidades independientes. Abrir una
   fuente desde tabla, gráfico o hipótesis: la evidencia del expediente se lee
   desde su snapshot. La hipótesis preparada conserva fundamento, alternativa,
   condición de refutación y siguiente medición; no es un descubrimiento de un LLM.
2. **Cambio de escenario.** En Mission Lab, comparar A/B lunar: B no encuentra
   candidato en el fixture. La variante terrestre permite entrar a `synthetic:trial-4`;
   su medición cero es un dato conocido. El preset de flujo puntuado compara
   parecido, no compatibilidad física. Leer motivos y segmentos A/B: una fila por
   ensayo; el límite top-k no se describe como una exclusión física. La métrica
   elegida en el formulario se envía a ambos rankings. Las fuentes A/B proceden
   del corpus activo, incluso antes de ejecutar una investigación.
3. **Evidencia insuficiente.** Ejecutar la consulta lunar de Mission Lab. Se muestra
   el estado real del backend, sus filtros/métrica, el plan guardado y lo que falta.
   Abrir ese expediente y descargar el informe. No se inventan observaciones ni
   hipótesis para cubrir el vacío. La insuficiencia lunar es una expectativa de
   estos fixtures; el resultado de un corpus distinto lo decide la API.

Después de A/B, cambiar métrica o filtros muestra el resultado como anterior.
La consulta también detecta cambios de pregunta y orden de variables. Restaurar
los mismos valores puede devolver la marca actual, sin recalcular. «Recompute»
ejecuta una nueva petición. Esa vigencia se refiere a entradas/expediente del
host; no certifica que un corpus externo no haya cambiado entre lecturas.

## Guion real BASS-II, separado del fixture

La sección **BASS-II · approved source cases** usa los tres objetos exactos de
`data/catalog/p2-demo-cases-v1.1.0.json` y los textos aprobados de
`p2-demo-copy-v1.1.1.json`. La aprobación de P3 cubre diez observaciones publicadas
y su interpretación descriptiva: no valida el corpus completo. Ver el
[dictamen](handoffs/P3_BASS_II_DECISION_DEMO.md) y el [paquete P2](handoffs/P2_DEMO.md).

Requiere el `bundle.json` del paquete interno **1.1.1**, que incorpora los dos
avisos M8. No se descarga ni publica ese corpus desde el navegador. Para una
presentación manual, importar en una base dedicada desde PowerShell:

```powershell
$bundle = (Resolve-Path 'C:\ruta\flamelab-p2-demo-v1.1.1\bundle.json').Path
.\.venv\Scripts\python.exe -m flamelab.data.cli validate $bundle
.\.venv\Scripts\python.exe -m flamelab.data.cli import $bundle --database-url sqlite:///work/p2-demo-v1.1.1.db
$env:FLAMELAB_DATABASE_URL = 'sqlite:///work/p2-demo-v1.1.1.db'
$env:FLAMELAB_SEED_DEMO = 'false'
$env:FLAMELAB_AI_PROVIDER = 'demo'
.\scripts\dev-api.ps1
```

En otra terminal ejecutar `scripts/dev-web.ps1`. La importación no sustituye otra
base; ante un corpus distinto se detiene en vez de reemplazarlo silenciosamente.
La API debe indicar `scientific_unverified`, sin mediciones sintéticas.

1. **Run BASS-II · 6 cm/s**: cuatro puntos de cuatro ensayos. Abrir M8 desde la
   tabla/gráfico y comprobar el aviso literal de Tabla 5.1 frente a Figura 5.2.
2. **Run BASS-II · 5 cm/s**: seis puntos de seis ensayos. Cada punto conserva su
   segmento, muestra y referencia; los extremos de O₂ siguen a nivel de ensayo.
3. **Compare BASS-II · 6 → 5 cm/s**: entran M4/M16/M17, sale M19 y se mantienen
   M7/M8/M13 con otro segmento. En conjunto son siete muestras, no diez réplicas.
   La copia aprobada describe recuperación de evidencia; no atribuye cambios de
   tasa únicamente al flujo. Si los resultados no corresponden a los casos
   revisados, se muestran los resultados recibidos sin esa interpretación fija.
4. **Run BASS-II · lunar**: busca PSI-25 lunar a cualquier velocidad, sin heredar
   el flujo del formulario. Debe obtener `insufficient_evidence`, cero puntos y
   ninguna comparación. El texto aprobado se limita al corpus BASS-II importado.
5. Descargar el informe y conservar su ID. Reiniciar la API con la misma base y
   recuperar ese ID desde Report and recovery: el informe y la evidencia son
   los del expediente guardado.

Estos presets fijan `study_ids=["psi:PSI-25"]`, `condition_scope="segment"`,
`allow_synthetic=false`, métrica de propagación e `include_hypotheses=false`.
No alteran el formulario general ni son una traducción de texto libre. Los
controles generales conservan sus propios filtros; para repetir el guion exacto
se utilizan los botones BASS-II.

Prueba automatizada opt-in, aislada de la base manual:

```powershell
$env:FLAMELAB_P2_DEMO_BUNDLE = (Resolve-Path 'C:\ruta\flamelab-p2-demo-v1.1.1\bundle.json').Path
.\scripts\check.ps1 -E2E
```

Para ejecutar solo ese recorrido:

```powershell
node apps/web/tests/e2e/p6-bass-walkthrough.mjs "--bundle=C:\ruta\bundle.json"
```

El runner comprueba el paquete aprobado antes de abrir Chromium,
crea su propia base temporal y no modifica el archivo de entrada. El CI público
ejecuta el recorrido sintético; esta comprobación real necesita el bundle local.
Los resultados ejecutados y el hash exacto están en [VERIFICATION](VERIFICATION.md).

## Informe, recuperación y respaldo

«Report and recovery» muestra y descarga exactamente el Markdown recibido del
servidor, sin ejecutarlo ni reconstruirlo. «Replay saved events» son eventos
guardados, no streaming. Tras recargar, «Reopen last research» recupera el último
expediente disponible; también se admite su ID. Reset limpia la vista y
cancela respuestas pendientes, pero conserva los expedientes y los recientes.

El respaldo ejecutable es el fixture `data/fixtures/demo.json` y
`scripts/smoke.py`: consulta conocida, cambio de gravedad y caso lunar sobre
SQLite temporal, con reinicio. En Windows:

```powershell
.\.venv\Scripts\python.exe scripts/smoke.py
```

El E2E `npm run test:e2e:p6` añade el navegador real. Puede guardar capturas con
`-- --screenshots=work/p6-e2e`. Una captura, informe descargado o grabación usada
sin API se presenta como resultado guardado/precalculado del commit de entrega,
nunca como una investigación en vivo. Los resultados no certifican ciencia NASA.

## Qué es funcional, preparado o ilustrativo

| Elemento | Estado |
|---|---|
| Filtros, métrica, selección A/B, motivos, informe y recuperación | Funcional: peticiones a la API y persistencia. |
| Hipótesis `prepared_demo_hypothesis` | Texto preparado con fundamento/alternativa/refutación; sin modelo externo. |
| Fixture numérico de este guion | Sintético: 2 estudios, 5 ensayos y 6 observaciones. |
| Ilustración de llama de P5 | Conceptual y rotulada; no calcula combustión ni riesgo. |
| Informe/captura exportada | Resultado guardado; conserva su etiqueta cuando sirve de respaldo. |

El catálogo conserva acceso a las 24 investigaciones cuando el corpus P2 se importa,
pero el fixture sintético usado en CI no contiene esas mediciones. Los datos P2 mantienen sus
limitaciones y estado científico: consultar [P2_NASA_24](P2_NASA_24.md) y la auditoría.
No se han ejecutado llamadas pagadas, validación física, CFD, diseño inverso ni
pruebas con un lector de pantalla o dispositivo móvil físico.
