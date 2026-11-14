**Veredicto P3: Aprobado con cambios.** Fecha: 14 de noviembre de 2026.

Confirmo los diez puntos propuestos por P2: no cambio ninguna tasa ni retiro observaciones. Corrijo el filtro del caso `lunar` para que responda a su pregunta completa. La aprobación se limita a estos puntos y a la interpretación descriptiva especificada aquí; no valida científicamente todo el corpus.

Revisados los [casos](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/10e58007b5a5dd95e4d697a7b3ed6bfb5389bdbe/data/catalog/p2-demo-cases-v1.1.0.json) y el [relevo P2](https://github.com/Ryo-936hz/Flame-in-Freefall/blob/10e58007b5a5dd95e4d697a7b3ed6bfb5389bdbe/docs/handoffs/P2_DEMO.md) de `lujan`, commit `10e58007b5a5dd95e4d697a7b3ed6bfb5389bdbe`. El corpus regenerado desde `04baeee` coincide con los dos SHA-256 publicados por P2 para `bundle.json` y `quality.json`. No ha sido necesario abrir el ZIP de su WSL para cotejar esos contenidos.

**1. Tabla final de observaciones**

En todas las filas, «posición» cuenta desde 1 en las dos celdas correspondientes: velocidad y tasa. La fila de datos no incluye cabeceras. El CSV es `PSI-25/Experimental table/PSI-25_Experimental table_BASS-II.csv`; sus líneas físicas cuentan la cabecera como línea 1. El enlace PSI identifica la investigación; no es un enlace directo al CSV.

**Límites comunes L:** láminas de PMMA, microgravedad, flujo opuesto y dos caras en combustión. El número de caras es conocido; su identidad (`combustion_face`) permanece `not_reported`. Las dimensiones de cada fila son espesor y ancho publicados. Los extremos de O₂ pertenecen al ensayo completo, no al segmento; el O₂ del segmento sigue `null/not_measured`. Son tasas publicadas, no datos sintéticos, y no incluyen aquí una incertidumbre estimada. Una observación o segmento no crea una réplica independiente. La comparación autorizada es descriptiva y conserva estas limitaciones. [Configuración, §5.1, PDF 63/impresa 55](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=63); [O₂, §5.4, PDF 68/impresa 60](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=68).

| Caso | observation_id | trial_id | segment_id | Muestra (`Sample #`) | Velocidad original | Tasa original | Estado del dato | evidence_id | Enlace y localizador exacto | Condiciones y límites de uso | Decisión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bass_6 | `psi:PSI-25:M7:stage:2:spread` | `psi:PSI-25:M7` | `psi:PSI-25:M7:stage:2` | `177m` | 6 cm/s | 0.099 mm/s | `known`; publicado | `psi:PSI-25:M7:stage:2:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 7 (M7), posición 2/4 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 34, `Test #`/`Sample #`. | L; espesor 1 mm, ancho 1.2 cm; O₂ inicial→final del ensayo 18.9→18.4 vol% | Confirmo |
| bass_6 | `psi:PSI-25:M8:stage:2:spread` | `psi:PSI-25:M8` | `psi:PSI-25:M8:stage:2` | `178m` | 6 cm/s | 0.056 mm/s | `known`; publicado | `psi:PSI-25:M8:stage:2:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 8 (M8), posición 2/3 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 35, `Test #`/`Sample #`. | L; espesor 2 mm, ancho 1.2 cm; O₂ inicial→final del ensayo 19.1→18.2 vol% | Confirmo; aviso M8 obligatorio |
| bass_6 | `psi:PSI-25:M13:stage:1:spread` | `psi:PSI-25:M13` | `psi:PSI-25:M13:stage:1` | `169m` | 6 cm/s | 0.047 mm/s | `known`; publicado | `psi:PSI-25:M13:stage:1:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 13 (M13), posición 1/3 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 40, `Test #`/`Sample #`. | L; espesor 4 mm, ancho 2.2 cm; O₂ inicial→final del ensayo 20.8→19 vol% | Confirmo |
| bass_6 | `psi:PSI-25:M19:stage:2:spread` | `psi:PSI-25:M19` | `psi:PSI-25:M19:stage:2` | `170m` | 6 cm/s | 0.0159 mm/s | `known`; publicado | `psi:PSI-25:M19:stage:2:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 19 (M19), posición 2/2 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 46, `Test #`/`Sample #`. | L; espesor 4 mm, ancho 2.2 cm; O₂ inicial→final del ensayo 19→17.4 vol% | Confirmo |
| bass_5 | `psi:PSI-25:M4:stage:1:spread` | `psi:PSI-25:M4` | `psi:PSI-25:M4:stage:1` | `171m` | 5 cm/s | 0.045 mm/s | `known`; publicado | `psi:PSI-25:M4:stage:1:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 4 (M4), posición 1/2 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 31, `Test #`/`Sample #`. | L; espesor 5 mm, ancho 2.2 cm; O₂ inicial→final del ensayo 21.8→19.8 vol% | Confirmo |
| bass_5 | `psi:PSI-25:M7:stage:3:spread` | `psi:PSI-25:M7` | `psi:PSI-25:M7:stage:3` | `177m` | 5 cm/s | 0.083 mm/s | `known`; publicado | `psi:PSI-25:M7:stage:3:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 7 (M7), posición 3/4 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 34, `Test #`/`Sample #`. | L; espesor 1 mm, ancho 1.2 cm; O₂ inicial→final del ensayo 18.9→18.4 vol% | Confirmo |
| bass_5 | `psi:PSI-25:M8:stage:3:spread` | `psi:PSI-25:M8` | `psi:PSI-25:M8:stage:3` | `178m` | 5 cm/s | 0.04 mm/s | `known`; publicado | `psi:PSI-25:M8:stage:3:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 8 (M8), posición 3/3 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 35, `Test #`/`Sample #`. | L; espesor 2 mm, ancho 1.2 cm; O₂ inicial→final del ensayo 19.1→18.2 vol% | Confirmo; aviso M8 obligatorio |
| bass_5 | `psi:PSI-25:M13:stage:2:spread` | `psi:PSI-25:M13` | `psi:PSI-25:M13:stage:2` | `169m` | 5 cm/s | 0.035 mm/s | `known`; publicado | `psi:PSI-25:M13:stage:2:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 13 (M13), posición 2/3 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 40, `Test #`/`Sample #`. | L; espesor 4 mm, ancho 2.2 cm; O₂ inicial→final del ensayo 20.8→19 vol% | Confirmo |
| bass_5 | `psi:PSI-25:M16:stage:1:spread` | `psi:PSI-25:M16` | `psi:PSI-25:M16:stage:1` | `164m` | 5 cm/s | 0.144 mm/s | `known`; publicado | `psi:PSI-25:M16:stage:1:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 16 (M16), posición 1/3 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 43, `Test #`/`Sample #`. | L; espesor 1 mm, ancho 2.2 cm; O₂ inicial→final del ensayo 19.2→18.7 vol% | Confirmo |
| bass_5 | `psi:PSI-25:M17:stage:1:spread` | `psi:PSI-25:M17` | `psi:PSI-25:M17:stage:1` | `166m` | 5 cm/s | 0.053 mm/s | `known`; publicado | `psi:PSI-25:M17:stage:1:table51` | [Informe](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65): PDF 65/imp. 57, Tabla 5.1, fila 17 (M17), posición 1/3 en velocidad y tasa. [CSV PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25): línea 44, `Test #`/`Sample #`. | L; espesor 2 mm, ancho 2.2 cm; O₂ inicial→final del ensayo 18.8→17.1 vol% | Confirmo |

La muestra canónica y `independent_unit_id` son `psi:PSI-25:sample:<Sample #>`. Así, los dos puntos de M7 conservan `psi:PSI-25:sample:177m`, los de M8 `psi:PSI-25:sample:178m` y los de M13 `psi:PSI-25:sample:169m`. Los diez puntos representan siete ensayos y siete muestras identificadas, no diez réplicas. Esta identidad no demuestra por sí sola independencia estadística respecto a posibles condiciones de sesión o aparato.

**Decisión sobre M8.** Mostrar **0.056 mm/s a 6 cm/s** y **0.04 mm/s a 5 cm/s**, con la precisión original de la Tabla 5.1. La Figura 5.2 de la misma página publica pendientes de **0.0557** y **0.0391 mm/s**, respectivamente; a 10 cm/s, fuera de estos presets, publica **0.0637** frente a **0.057 mm/s** en la tabla. Se adopta una única fuente tabular para esta serie. No se afirma que la tabla resuelva cuál estimación es físicamente correcta; no se mezclan ni promedian ambas versiones y no se atribuye toda la discrepancia a redondeo. [Tabla 5.1 y Figura 5.2, PDF 65/impresa 57](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65).

Aviso exacto para ambos puntos M8: **«Valor publicado en la Tabla 5.1. La Figura 5.2 presenta un ajuste diferente: 0.0557 mm/s a 6 cm/s y 0.0391 mm/s a 5 cm/s. Se conserva la discrepancia; no se ha resuelto mediante reanálisis.»** El README de P2 ya documenta la diferencia; debe permanecer accesible desde los puntos o el panel de evidencia de la demo.

**Precedencia PDF/CSV.** Las tasas, velocidades seleccionadas y dimensiones proceden de la Tabla 5.1; el CSV operativo aporta la identidad de muestra. Sus textos `Air display` no constituyen una segunda serie emparejada de tasas. Por ejemplo, M16 y M19 no reproducen en esa columna todas las velocidades de la tabla. Mantener las discrepancias de `quality.json`. Los anchos 1.2 y 2.2 cm están además descritos en PDF 66/impresa 58; no sustituirlos por los anchos nominales 1 y 2 cm del CSV ni corregir silenciosamente su texto ambiguo de M19. [Informe, PDF 66/impresa 58](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=66).

**2. Interpretación autorizada para el jurado**

> Al cambiar la consulta de 6 a 5 cm/s, FlameLab recupera cuatro y seis observaciones publicadas de BASS-II: en conjunto corresponden a siete muestras, con M7, M8 y M13 presentes en ambos casos. Mostramos cómo cambia la evidencia recuperada; estos registros no permiten atribuir las diferencias de tasa únicamente al flujo, porque también evolucionan el oxígeno y la muestra durante cada ensayo.

La comparación dentro de cada muestra que sí puede describirse es:

| Muestra / ensayo | 6 cm/s | 5 cm/s | Lectura autorizada |
| --- | --- | --- | --- |
| 177m / M7 | 0.099 mm/s, segmento 2 | 0.083 mm/s, segmento 3 | Dos condiciones sucesivas de la misma muestra. |
| 178m / M8 | 0.056 mm/s, segmento 2 | 0.04 mm/s, segmento 3 | Dos condiciones sucesivas; conservar el aviso tabla/figura. |
| 169m / M13 | 0.047 mm/s, segmento 1 | 0.035 mm/s, segmento 2 | Dos condiciones sucesivas de la misma muestra. |

En esas tres parejas, la tasa tabulada es menor en el registro de 5 cm/s. Esto no estima un efecto causal de reducir el flujo ni una respuesta media de muestras independientes. El resto de la selección cambia de composición: sale M19 y entran M4, M16 y M17. No comparar medias de los grupos completos como si fueran condiciones equivalentes, unir los diez puntos en una curva única ni convertir similitud en peligrosidad. Mantener geometría, espesor, ancho, caras y procedencia como controles; el O₂ efectivo desconocido impide afirmar equivalencia completa. `sequence` expresa orden publicado, no tiempo ni duración. [Método, §5.3, PDF 64/impresa 56](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=64); [interpretación y O₂, PDF 66 y 68](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=66).

**Ausencias y O₂.** Conservar exactamente estas cuatro observaciones con `value: null`, `status: "not_measured"` y `original_value: "Not tracked"`:

- `psi:PSI-25:M6:stage:1:spread` — 10 cm/s.
- `psi:PSI-25:M6:stage:2:spread` — 8 cm/s.
- `psi:PSI-25:M12:stage:1:spread` — 12 cm/s.
- `psi:PSI-25:M12:stage:2:spread` — 10 cm/s.

No son cero, extinciones ni tasas interpolables. La Tabla 5.1 contiene 39 tasas y estas cuatro ausencias al expandir sus 43 entradas de flujo. Los extremos de O₂ se conservan únicamente en `trial.conditions.oxygen_initial_pct` y `oxygen_final_pct`. Los 43 segmentos conservan O₂ sin medición: no heredar extremos ni fabricar un promedio por segmento. El informe emplea una interpolación lineal para su análisis de O₂; eso es una estimación y no una medición continua que este bundle pueda atribuir automáticamente. [Tabla 5.1](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=65); [§5.4](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=68).

**Lunar.** Autorizar únicamente: **«En el corpus BASS-II importado no se recuperan observaciones de tasa de propagación con gravedad lunar. La evidencia disponible no permite responder sobre ese régimen.»** No afirmar que no existan investigaciones lunares en NASA ni que BASS-II prediga seguridad o combustión en la Luna. BASS-II documenta microgravedad en la ISS, que no es gravedad lunar. [§5.1](https://ntrs.nasa.gov/api/citations/20210011385/downloads/TM-20210011385.pdf#page=63).

**Saffire.** Confirmo su uso como panel documental separado de escala, material y configuración, sin añadir sus registros a estos diez puntos. El artículo de Urban et al. respalda las dimensiones 94 × 40.6 cm para I/III y nueve muestras de 29 × 5 cm para II, así como Cygnus y el tejido algodón/fibra de vidrio; NASA describe el contraste de confinamiento y escala. Estas diferencias no prueban transferibilidad cuantitativa desde BASS-II. No elegir silenciosamente entre las discrepancias de dimensiones, espesores y velocidades del CSV y las publicaciones ya registradas por P2. [Urban et al., resumen](https://www.sciencedirect.com/science/article/pii/S0010218018304395); [NASA, resumen de los ensayos a gran escala](https://ntrs.nasa.gov/citations/20170008805).

**3. Cambios aplicables por P2 y aceptación**

| Caso o contenido | Valor/texto actual comprobado | Reemplazo o decisión exacta | Fundamento |
| --- | --- | --- | --- |
| `bass_6` / `bass_5`, diez observaciones | Tabla y filtros del commit `10e5800` | Conservar los diez IDs, valores, muestras, citas y filtros. No retirar puntos. | Cotejo de la tabla anterior, Tabla 5.1 y CSV. |
| M8 en ambos casos | Tasas 0.056 y 0.04; discrepancia documentada en el relevo | Conservar los valores y mostrar el aviso M8 transcrito arriba en la evidencia de la demo. | Tabla 5.1 frente a Figura 5.2, misma página 65/57. |
| `lunar.ranking.target` | `{"gravity_regime":"lunar","flow_velocity_cm_s":6}` | `{"gravity_regime":"lunar"}` | La pregunta actual abarca BASS-II lunar sin especificar velocidad; el filtro de 6 cm/s estrecha indebidamente su alcance. |
| `lunar.ranking.required_match` | `["gravity_regime","flow_velocity_cm_s"]` | `["gravity_regime"]` | Misma coherencia entre pregunta y filtro; configuración de BASS-II en §5.1. |
| Resultado narrativo de `lunar` | `insufficient_evidence`, cero seleccionados para los filtros del caso | Mantener el estado y usar el texto lunar autorizado arriba. | Búsqueda corregida ejecutada: cero candidatos, cero puntos y comparación nula. |
| Relevo: «Revisión P3 pendiente» | Solicita confirmación de los diez puntos y el guion | «P3 confirma los diez puntos y su uso descriptivo, con aviso M8 y corrección del caso lunar. Esta conformidad no valida el corpus completo.» | Este dictamen y el alcance comprobado. |

Objeto `ranking` corregido para `lunar`:

```json
{
  "study_ids": [
    "psi:PSI-25"
  ],
  "condition_scope": "segment",
  "target": {
    "gravity_regime": "lunar"
  },
  "required_match": [
    "gravity_regime"
  ],
  "allow_synthetic": false,
  "limit": 20
}
```

Mantener `metric: "flame_spread_rate_mm_s"`, `include_hypotheses: false` y la pregunta actual de `lunar`. IDs esperados tras el cambio: `trial_ids: []`, `segment_ids: []`, `observation_ids: []`; resultado `insufficient_evidence`, `comparison: null`. Los IDs esperados para `bass_6` y `bass_5` son exactamente los cuatro y seis de la tabla; no cambia su filtro.

**Verificación y alcance.** Cotejo visual de la página 65, lectura de §§5.1/5.3/5.4 y CSV operativo; validación de los diez pares, unidades, originales, IDs, muestras y localizadores contra bundle, calidad y la tabla exacta de P2. Se comprobaron las cuatro ausencias y el O₂ de ensayo/segmento. Con el código de `04baeee`, los casos exactos de P2 y el lunar corregido se ejecutaron en el motor determinista, sin proveedor externo. Las citas de los puntos resuelven dentro de la evidencia recuperada. Esto no vuelve a certificar el despliegue HTTP ni la importación que P2 ya probó.

| Ejecución | Estado | Puntos |
| --- | --- | ---: |
| `bass_6` publicado | `completed` | 4 |
| `bass_5` publicado | `completed` | 6 |
| `lunar` publicado | `insufficient_evidence` | 0 |
| `lunar` corregido | `insufficient_evidence` | 0 |

SHA-256 del corpus contrastado:

```text
bundle.json   7dc69717b4bc6151025df2993d9cf66622db3a8b7242798a1d7bfe8b8e335781
quality.json  8b44ddd333912f4b4849b82c5d2df29ec1b1d38de6bf8d5191ef9e8afbd57ee9
PDF BASS-II   5ffa911fd9b6356f204646003fb9342e341810dcdfdf5cb15756e7f01ec5f770
CSV PSI-25    71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042
```

No quedan filas de los diez puntos pendientes por falta de fuente: se dispuso del PDF y CSV locales, y los archivos de P2 quedaron accesibles en GitHub. El visor web rechazó el PDF por tamaño; se inspeccionó la copia local con el hash indicado. La discrepancia M8 sigue abierta científicamente, pero su representación tabular y el aviso quedan aprobados para este uso.

Mantener `scientific_unverified` y el estado global de revisión pendiente: este dictamen no autoriza marcar las 2.265 evidencias o las 1.673 observaciones del corpus como revisadas. Registrar la conformidad de estos diez IDs, este commit y estos hashes separadamente, conservando las incidencias de `quality.json`. No se cambian contratos ni se mezcla esta decisión con una validación de las 24 investigaciones.
