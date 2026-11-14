# Demo vigente — Mission Lab integrado

Entrega P6 en `raul`, con P1/P3/P4 y P2 de `main`, P6 `80ceba4` y el host P5
`9f54700` integrados. El commit de entrega y pruebas ejecutadas están en
[relevo P6](handoffs/P6.md) y [VERIFICATION](VERIFICATION.md).
El [guion anterior](handoffs/P6_DEMO_HISTORY.md) se conserva como historial.

## Preparación reproducible en Windows

Desde un clon de la entrega y su propia rama, conservar cualquier cambio local.
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

1. **Investigación conocida.** Usar «Reset all» y «Investigate». La tasa de propagación
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

## Informe, recuperación y respaldo

«Report and recovery» muestra y descarga exactamente el Markdown recibido del
servidor, sin ejecutarlo ni reconstruirlo. «Replay saved events» son eventos
guardados, no streaming. Tras recargar, «Reopen last research» recupera el último
expediente disponible; también se admite su ID. Reset all limpia la vista y
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
pero la demo de pruebas no contiene esas mediciones. Los datos P2 mantienen sus
limitaciones y estado científico: consultar [P2_NASA_24](P2_NASA_24.md) y la auditoría.
No se han ejecutado llamadas pagadas, validación física, CFD, diseño inverso ni
pruebas con un lector de pantalla o dispositivo móvil físico.
