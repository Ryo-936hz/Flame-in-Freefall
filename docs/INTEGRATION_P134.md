# Entrega conjunta P1/P3/P4 — demo de backend

El usuario asume conjuntamente integración, ciencia y coordinación de IA. Esta
entrega se trabaja en `raul`, preservando la integración P2 de `main` (`04baeee`)
y la rama P4 (`12555c1`). La referencia inicial `codex/team-start-v1` no se mueve.
Usar el commit indicado en la entrega/PR; `git rev-parse HEAD` permite comprobarlo.

## Qué está cerrado

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
git switch --no-track -c mi-demo origin/raul
git rev-parse HEAD
.\scripts\setup.ps1
.\scripts\check.ps1
```

`mi-demo` es un ejemplo para un clon nuevo. Si ya tienes rama/cambios, consérvalos:
`git fetch origin`, revisa el diff e integra la referencia acordada sin reset.
Si necesitáis el mismo estado exacto, comparad el SHA completo con la entrega,
en lugar de asumir que una rama no ha avanzado.

API y arnés se arrancan en dos terminales de la raíz:

```powershell
.\scripts\dev-api.ps1
```

```powershell
.\scripts\dev-web.ps1
```

API: http://127.0.0.1:8000/docs. Arnés: http://127.0.0.1:5173.
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

## Integración P5/P6

Consumir los tipos regenerados, sin copiar modelos. `planning_mode=explicit`
mantiene el formulario actual; `catalog` habilita las frases de [AI_SYSTEM](AI_SYSTEM.md).
Mostrar el plan previsualizado y sus filtros/métrica/eje/límites. Si `blocked=true`,
pedir aclaración; no dibujar resultados de un análisis no ejecutado. En históricos,
`plan=null` significa que no se guardó un plan, no que deba reconstruirse.

Para A/B con resultados de una métrica, enviar `metric` además de ambos rankings.
Conservar selección por IDs y `segment_id`, originales, unidades y procedencia.
No sumar unidades de estratos como réplicas globales; no trazar X nula como par
cuantitativo. Los eventos siguen siendo replay, no streaming en vivo.

P5/P6 mantienen la interfaz, el montaje conjunto y el recorrido visual. Esta rama
integra backend y arnés técnico; no incorpora ni declara terminadas sus ramas visuales.
El diseño documentado en DESIGN_ANDURIL se conserva.

## Datos y límites externos a este cierre

P2 está integrado: 24 estudios; seis campañas con resultados, una con configuraciones
y 17 documentales. Las 2.265 evidencias siguen sin revisión científica aprobada;
1.038 registros conservan independencia sin resolver. La demo predeterminada es
sintética. [Auditoría P2](../evals/science/P2_INTEGRATION_REVIEW.md) contiene dudas
de M8, anchura, O₂, unidades experimentales, censura y significado de métricas.

Los bundles reales locales se prueban opt-in con `FLAMELAB_BASS_BUNDLE` y
`FLAMELAB_NASA_BUNDLE`; no se distribuyen fuentes ni licencias por pasar un test.
No se han hecho llamadas pagadas ni se afirma validación física, CFD, regresión,
intervalos, diseño inverso, pgvector o despliegue público.
