# Relevo P2 para P1 y P3 · FlameLab Demo 1.1.0

- Rama `lujan`. Base del extractor `04baeeee1f0bf3f75d957f7ed845c890efc2a3ec`.
- Artefacto `flamelab-p2-demo-v1.1.0.zip`. Contiene `bundle.json`, `quality.json`, `cases.json`, este relevo y `SHA256SUMS`. Destino acordado en esta entrega: traspaso interno a P1.
- Contrato de datos `1.1`, `dataset_id: psi:nasa-local-corpus-v1`. Se conservan los identificadores del corpus existente. `1.1.0` identifica esta entrega y sus casos, y los SHA-256 fijan los bytes del corpus.
- Corpus de 24 estudios, 2.265 evidencias, 1.058 registros de ensayo o configuración y 1.673 observaciones. El guion cuantitativo se limita a BASS-II (`psi:PSI-25`). La API lo identifica como `scientific_unverified`.

## P1 · Cargar y comprobar

Extraer el paquete en `work/flamelab-p2-demo-v1.1.0` dentro del clon. Los comandos se ejecutan desde la raíz con las dependencias fijadas de FlameLab. Para cargar el bundle basta su JSON, sin descargar los originales ni instalar el extractor.

```bash
(cd work/flamelab-p2-demo-v1.1.0 && sha256sum -c SHA256SUMS)
uv run --locked python -m flamelab.data.cli validate work/flamelab-p2-demo-v1.1.0/bundle.json
uv run --locked python -m flamelab.data.cli import work/flamelab-p2-demo-v1.1.0/bundle.json --database-url sqlite:///work/flamelab-demo-v1.1.0.db
FLAMELAB_DATABASE_URL=sqlite:///work/flamelab-demo-v1.1.0.db FLAMELAB_SEED_DEMO=false FLAMELAB_AI_PROVIDER=demo \
  uv run --locked uvicorn flamelab.main:app --host 127.0.0.1 --port 8000
```

En PowerShell, verificar con `Get-FileHash -Algorithm SHA256` y configurar esas tres variables con `$env:` antes de ejecutar `uvicorn`. La base es un archivo SQLite dedicado. La primera importación debe devolver `changed: true` y la repetición `changed: false`. `/api/v1/health` debe mostrar `schema_version: 1.1`, `ai_provider: demo` y `data_mode: scientific_unverified`. Este modo comprueba el recorrido de datos. El proveedor del despliegue se configura aparte.

Enviar los objetos `bass_6`, `bass_5` y `lunar` de `cases.json` individualmente a `POST /api/v1/research`. Para A/B, enviar sus objetos `ranking` como `scenario_a` y `scenario_b` a `POST /api/v1/scenarios/compare`.

| Caso | Resultado esperado |
| --- | --- |
| `bass_6` | `completed`, cuatro puntos de cuatro ensayos. |
| `bass_5` | `completed`, seis puntos de seis ensayos. En A/B respecto a `bass_6`, entran M4/M16/M17, sale M19 y se mantienen M7/M8/M13 con otro segmento. |
| `lunar` | `insufficient_evidence`, cero ensayos seleccionados y comparación nula para los filtros del caso. |

Los filtros exactos dejan las coincidencias empatadas en similitud. El orden de desempate por ID carece de interpretación como ranking de peligro. Al abrir un punto, usar el ID de la evidencia de su segmento con `GET /api/v1/evidence/{evidence_id}?research_id={run_id}`. El informe se puede recuperar por `GET /api/v1/research/{run_id}/report`.

## P3 · Cotejo de los puntos del guion

P2 cotejó los 43 pares de flujo y tasa o ausencia con la Tabla 5.1. Esta tabla abrevia los diez puntos de los dos presets. El prefijo de los IDs es `psi:PSI-25:`. Para cada fila, la observación termina en `:spread` y su evidencia en `:table51`, añadidos al ID del segmento. El localizador usa la fila de datos de la Tabla 5.1, sin contar cabeceras. La muestra procede de la columna `Sample #` del CSV operativo y su línea física se cuenta con la cabecera como línea 1. [Original NASA, p. 65 del PDF y p. 57 impresa](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65) · [NASA PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25)

| Velocidad del aire (cm/s) | Tasa (mm/s) | Segmento | Muestra | Fila PDF / línea CSV | Entrada en la celda |
| ---: | ---: | --- | --- | --- | ---: |
| 6 | 0.099 | `M7:stage:2` | `177m` | 7 / 34 | 2 |
| 6 | 0.056 | `M8:stage:2` | `178m` | 8 / 35 | 2 |
| 6 | 0.047 | `M13:stage:1` | `169m` | 13 / 40 | 1 |
| 6 | 0.0159 | `M19:stage:2` | `170m` | 19 / 46 | 2 |
| 5 | 0.045 | `M4:stage:1` | `171m` | 4 / 31 | 1 |
| 5 | 0.083 | `M7:stage:3` | `177m` | 7 / 34 | 3 |
| 5 | 0.04 | `M8:stage:3` | `178m` | 8 / 35 | 3 |
| 5 | 0.035 | `M13:stage:2` | `169m` | 13 / 40 | 2 |
| 5 | 0.144 | `M16:stage:1` | `164m` | 16 / 43 | 1 |
| 5 | 0.053 | `M17:stage:1` | `166m` | 17 / 44 | 1 |

- **Unidad experimental.** Los cuatro y los seis puntos corresponden a siete ensayos distintos al considerar los dos presets juntos. Los segmentos repetidos de M7/M8/M13 pertenecen a la misma muestra física en ambos lados. La secuencia conserva el orden publicado. El guion describe el cambio de evidencia recuperada. Las diferencias de espesor, ancho, caras y atmósfera limitan la interpretación causal.
- **Ausencias.** M6 (segmentos 1/2, 10/8 cm/s) y M12 (segmentos 1/2, 12/10 cm/s) conservan cuatro tasas `null` con `not_measured` y `Not tracked` original. Los 43 segmentos conservan O₂ sin medir como `null`. Los extremos de O₂ permanecen en el ensayo. Se conoce el número de caras que ardieron y la identidad de la cara queda `not_reported`.
- **Discrepancias.** Los valores expuestos para M8 corresponden a la Tabla 5.1. La Figura 5.2 reporta pendientes de 0.0557 y 0.0391 mm/s a 6 y 5 cm/s respectivamente. `quality.json` conserva ambas referencias y las diferencias de ancho nominal y lecturas operativas. [Auditoría de fuentes](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/04baeee/docs/P2_SOURCE_AUDIT.md) · [Método O₂, p. 68 del PDF](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=68)
- **Revisión P3 pendiente.** Confirmar por escrito los diez puntos y la interpretación descriptiva del guion. Se aplicaron los criterios publicados por P3 sobre independencia, alcance temporal y comparación entre campañas. Los estados `unverified` y `reviewed=false` reflejan que falta esa conformidad. [Matriz P3](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/04baeee/evals/science/NASA_24_REVIEW.md)

## Tarjeta Saffire para el guion

| | BASS-II, Tabla 5.1 | Saffire I y III | Saffire II |
| --- | --- | --- | --- |
| Plataforma | Guantebox de microgravedad de la ISS | Conducto de ensayo en Cygnus | Conducto de ensayo en Cygnus |
| Configuración | Láminas de PMMA colado, ancho publicado de 1.2 o 2.2 cm, flujo opuesto en la serie | Tejido de algodón y fibra de vidrio (SIBAL), 94 × 40.6 cm, pruebas con propagación concurrente y opuesta | Nueve muestras de varios materiales, 29 × 5 cm según Urban et al. |
| Fuente | [NASA TM, §5 y Tabla 5.1](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65) | [NASA NTRS, resumen del ensayo a gran escala](https://ntrs.nasa.gov/citations/20170008805) · [Urban et al., resumen y configuración](https://doi.org/10.1016/j.combustflame.2018.10.012) | [Urban et al., resumen y configuración](https://doi.org/10.1016/j.combustflame.2018.10.012) |

Texto para el guion: «Saffire aporta contexto a otra escala, con materiales y confinamiento distintos. Estas diferencias delimitan dónde se pueden aplicar las observaciones de BASS-II». Mostrarlo en un panel documental separado. Los casos cuantitativos fijan `study_ids` a PSI-25. Los datos estructurados de Saffire I del corpus completo permanecen disponibles en su ficha con sus limitaciones, y los CSV y artículos discrepan en algunos campos. [Detalle y procedencia Saffire](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/04baeee/docs/P2_SAFFIRE_CONTEXT.md)

## Regeneración y condiciones de uso

En el commit base, con los originales en `datasets/` según el inventario versionado:

```bash
uv run --locked --with pymupdf==2.1 python -m flamelab.data.cli extract-nasa datasets --output-dir work/p2-demo-regenerated
sha256sum work/p2-demo-regenerated/{bundle,quality}.json
```

| Archivo | SHA-256 |
| --- | --- |
| `bundle.json` | `7dc69717b4bc6151025df2993d9cf66622db3a8b7242798a1d7bfe8b8e335781` |
| `quality.json` | `8b44ddd333912f4b4849b82c5d2df29ec1b1d38de6bf8d5191ef9e8afbd57ee9` |

Las dos regeneraciones del corpus completo y las dos de BASS-II aislado coincidieron byte a byte con las extracciones ya existentes. Se validó el bundle, se importó dos veces en una base dedicada y se recorrieron los tres casos por API en modo determinista. Se comprobaron las diez citas de puntos, los 24 estudios, ambas comparaciones A/B y la recuperación del informe al reabrir la API.

El paquete interno contiene extracciones y referencias. PSI-25 identifica la investigación como `CC0-1.0` en la auditoría de fuentes. El memorando NTRS es de distribución pública y muestra una nota de derechos distinta. P1 debe usar las citas originales y consultar las condiciones aplicables por fuente antes de redistribuir públicamente el corpus completo o exponer sus extractos. El paquete conserva esas referencias para la comprobación. [Auditoría y alcance de licencias](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/04baeee/docs/P2_SOURCE_AUDIT.md) · [Registro NTRS](https://ntrs.nasa.gov/citations/20210011385)
