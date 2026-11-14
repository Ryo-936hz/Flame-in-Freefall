# Integración de backend P1/P3/P4 y continuación P6

**P6 terminado para la demo integrada:** escenarios genéricos y presets BASS-II,
informe, recuperación y recorridos de navegador comprobados. Código **`66934638e37c1396eeab638631d54a2159ab7930`**;
la PR #3 permanece pendiente de integración en `main`. La comprobación real BASS-II
es local y opt-in; el CI utiliza datos sintéticos. Ver [relevo P6](handoffs/P6.md).

**Entrega verificada:** P6 montado en la interfaz P5, código `66934638e37c1396eeab638631d54a2159ab7930`,
publicado en `raul` mediante [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3), aún sin fusionar. Conserva `main`
`f8e6a01`, P6 `80ceba4` y P5 `9f54700`. El [guion](DEMO.md),
[relevo P6](handoffs/P6.md) y [estado](IMPLEMENTATION_STATUS.md) describen el recorrido
actual. Clon limpio y [CI Windows/Linux/PostgreSQL/navegador](https://github.com/Ryo-936hz/Flame-in-Freefall/actions/runs/43621040286) aprobados;
76 pruebas cliente y E2E 24 pasos/58 checks. VERIFICATION separa cada entorno.

## Antecedente P1/P3/P4

La PR #2 se fusionó en `main` como `8fffddc`. La descripción siguiente conserva
su entrega de backend; los comandos de arranque ya apuntan al incremento actual.

El usuario asume conjuntamente integración, ciencia y coordinación de IA. Esta
entrega se trabajó en `raul`, preservando la integración P2 de `main` (`04baeee`)
y la rama P4 (`12555c1`). La referencia inicial `codex/team-start-v1` no se mueve.
Código verificado: `fd83a84aa24511e573a1b5f27cc859bcdddbf638` ([PR #2](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/2)).
La documentación de verificación posterior no cambia ese código; `git rev-parse HEAD`
permite comprobar la referencia utilizada.

## Capacidades de backend conservadas

- API y contrato canónico con plan previsualizable, modo explícito compatible y
  catálogo determinista de preguntas. Plan guardado en el expediente y el informe.
- Disponibilidad de métrica por ensayo/segmento antes de limitar candidatos;
  comparación con controles efectivos, fuentes, unidades y ausencias conservados.
- A/B puede exigir la misma métrica que investigación. Sin métrica conserva su
  selección histórica por condiciones y lo advierte en la respuesta.
- Síntesis demo sin clave. Adaptador opcional con errores explícitos y revisión de
  afirmaciones numéricas por campo, ensayo y fuente; no admite relato científico libre.
- SQLite persistente, snapshots y evidencia histórica tras reinicio/reimportación.
  Las variantes en memoria/URI se rechazan; `sqlite:///` y `sqlite+pysqlite:///`
  de archivo reciben las mismas reglas de conexión, FK y WAL.
- Check/CI ejecutan regresiones API, ciencia, IA, contrato, cliente y HTTP real.
  [VERIFICATION](VERIFICATION.md) registra exactamente qué se ejecutó.

## Nuevo clon Windows desde la entrega

Git, Python 3.12, Node 24 con npm y PowerShell 7. La instalación inicial necesita
red para paquetes fijados por lockfiles. No hacen falta claves, ZIP NASA ni Docker.

```powershell
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
Set-Location .\Flame-in-Freefall
git fetch origin --tags
git switch --no-track -c mi-demo flamelab-p6-demo-2026-11-14
git rev-parse HEAD
.\scripts\setup.ps1
.\scripts\check.ps1
```

`mi-demo` es un ejemplo para un clon nuevo. Si ya tienes rama/cambios, consérvalos:
`git fetch origin`, revisa el diff e integra la referencia acordada sin reset.
Si necesitáis el mismo estado exacto, comparad el SHA completo con la entrega,
en lugar de asumir que una rama no ha avanzado.

API e interfaz integrada se arrancan en dos terminales de la raíz:

```powershell
.\scripts\dev-api.ps1
```

```powershell
.\scripts\dev-web.ps1
```

API: http://127.0.0.1:8000/docs. Interfaz: http://127.0.0.1:5173.
Setup conserva `.env` existente. La semilla es explícitamente sintética y solo
se añade si el almacén está vacío; nunca sustituye un corpus ya importado.

## Probar el plan y las tres consultas sin editar JSON

Con la API demo iniciada, PowerShell desde la raíz:

```powershell
$body = Get-Content .\docs\examples\demo_flow_request.json -Raw
$plan = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/v1/research/plan' -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$plan | ConvertTo-Json -Depth 12
$run = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/v1/research' -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$run.status
$run.plan
Invoke-RestMethod -Uri ("http://127.0.0.1:8000/api/v1/research/" + $run.id + '/report')
```

Cambiar únicamente el nombre del archivo para los otros dos ejemplos:

| Archivo | Resultado sintético esperado |
|---|---|
| `demo_flow_request.json` | Microgravedad, cuatro puntos y tres unidades; plan de variación de flujo. |
| `demo_earth_request.json` | Gravedad terrestre, una observación de valor cero conocido. |
| `demo_lunar_request.json` | `insufficient_evidence`, sin candidato/medición lunar. |

`scripts/smoke.py` ejecuta estos tres ejemplos por HTTP real, comprueba un conflicto
visible y reinicia su API/SQLite temporal. El check lo incluye. No es simulación
de combustión: cambiar la pregunta selecciona evidencia distinta.

## Interfaz P5/P6 integrada

Consumir los tipos regenerados, sin copiar modelos. `planning_mode=explicit`
mantiene el formulario actual; `catalog` habilita las frases de [AI_SYSTEM](AI_SYSTEM.md).
La previsualización del catálogo está disponible por API; el formulario actual
mantiene filtros explícitos. P6 muestra el plan persistido de su consulta y sus
límites. Una futura interfaz de catálogo debe mostrar `blocked=true` sin dibujar
resultados de un análisis no ejecutado. En históricos, `plan=null` significa que
no se guardó un plan, no que deba reconstruirse.

Para A/B con resultados de una métrica, enviar `metric` además de ambos rankings.
Conservar selección por IDs y `segment_id`, originales, unidades y procedencia.
No sumar unidades de estratos como réplicas globales; no trazar X nula como par
cuantitativo. Los eventos siguen siendo replay, no streaming en vivo.

La entrega actual incorpora Evidence Canvas de P5 y Mission Lab/ReportPanel de
P6. A/B envía la métrica, conserva contexto de segmentos y detecta resultados
anteriores. Informe literal, descarga, replay y recuperación se prueban con API
y SQLite reales; las respuestas tardías no sobreviven a Reset. El guion completo
y sus límites están en [DEMO](DEMO.md). Para ejecutarlo:

```powershell
node node_modules/playwright/cli.js install chromium
.\scripts\check.ps1 -E2E
```

Se conserva el diseño de DESIGN_ANDURIL. No se ha evaluado con lector de pantalla
ni móvil físico; la llama conceptual no representa una simulación científica.

## Datos y límites externos a este cierre

P2 está integrado: 24 estudios; seis campañas con resultados, una con configuraciones
y 17 documentales. El [dictamen P3](handoffs/P3_BASS_II_DECISION_DEMO.md) aprobó
diez puntos BASS-II para lectura descriptiva, conservando siete muestras y el
aviso M8. El [paquete P2 1.1.1](handoffs/P2_DEMO.md) incorpora ese aviso y el caso
lunar corregido. Esta aprobación no cambia el estado global `scientific_unverified`
ni marca las 2.265 evidencias como revisadas. 1.038 registros mantienen independencia
sin resolver; no se atribuye causalidad al flujo ni O₂ medido por segmento.
La demo predeterminada y el E2E siguen siendo sintéticos. La [auditoría P2](../evals/science/P2_INTEGRATION_REVIEW.md)
conserva los límites científicos generales, junto al dictamen específico posterior.

Los bundles reales locales se prueban opt-in con `FLAMELAB_BASS_BUNDLE` y
`FLAMELAB_NASA_BUNDLE`; no se distribuyen fuentes ni licencias por pasar un test.
No se han hecho llamadas pagadas ni se afirma validación física, CFD, regresión,
intervalos, diseño inverso, pgvector o despliegue público.
