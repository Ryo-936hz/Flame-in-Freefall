# Demo y narrativa

## Recorrido ejecutable de la base local

La demo disponible utiliza **2 estudios, 5 ensayos y 6 observaciones sintéticos**. El modo de coordinación
es determinista y no llama a un modelo externo. El catálogo real de 24 investigaciones está separado y solo
contiene metadatos; no presentar el recorrido numérico como comparación NASA.

1. Preparar y arrancar la base con README/SETUP_WINDOWS. Comprobar salud y etiquetas de modo.
2. Ejecutar la consulta demo del arnés técnico con permiso explícito de sintéticos y filtros estructurados.
3. Revisar elegibilidad, similitud, cobertura, grupos, puntos, unidades y tamaño de muestra. Abrir la evidencia
   enlazada: sus cifras remiten al fixture local, sin fuente NASA inventada.
4. Cambiar restricciones o comparar escenarios A/B; verificar cambios de selección y límites. Es comparación
   de evidencia, no simulación física.
5. Ejecutar el caso sin evidencia suficiente. Un objetivo ausente o un eje X completamente desconocido no
   produce cifras sustituidas ni una conclusión cuantitativa.
6. Recuperar investigación, eventos guardados e informe. Los eventos se identifican como replay y el informe
   conserva el corpus usado aunque se cambie el corpus activo posteriormente.

`scripts/smoke.py` automatiza el recorrido HTTP; los comandos y resultados están en README y VERIFICATION.
La propuesta de siguiente investigación está rotulada `prepared_demo_hypothesis`: es contenido preparado,
no descubrimiento autónomo. El arnés comprueba conexiones; no es Evidence Canvas/Mission Lab final.

## Mensaje

La visión de FlameLab SI es utilizar evidencia de NASA para analizar lo observado, explorar posibilidades
y decidir qué investigar después. La base actual demuestra las conexiones con datos sintéticos y conserva
un catálogo real trazable. La importación científica y la experiencia visual completa son siguientes incrementos.

## Guion de producto futuro de tres minutos

La duración es una decisión de diseño; no se ha confirmado como límite oficial local. Este guion exige una
serie BASS-II revisada que todavía no está incorporada. No sustituir sus cifras por fixtures sin cambiar las etiquetas.

| Tiempo | Acción | Resultado |
|---|---|---|
| 0:00–0:30 | Plantear objetivo y restricciones. | La IA organiza una investigación. |
| 0:30–1:15 | Mostrar serie BASS-II, gráfico y ranking. | Un clic conduce a la evidencia original. |
| 1:15–2:00 | Cambiar condiciones y contrastar Saffire. | Se explican diferencias y límites de aplicación. |
| 2:00–2:40 | Pedir alternativas y siguiente prueba. | Se muestran hipótesis con respaldo y objeciones. |
| 2:40–3:00 | Generar informe. | Quedan hallazgos, límites, fuentes y trabajo pendiente. |

## Qué puede prepararse

Extracciones revisadas, índices, gráficos calculados previamente, escenarios y una reproducción de respaldo. Cada resultado conserva su estado. Una reproducción no se presenta como búsqueda en vivo. La preparación no justifica inventar mediciones o validaciones.

## Qué debe funcionar en el recorrido central

En la base, un cambio de filtros estructurados afecta al escenario, selección o comparación. Cambiar solo
la redacción de la pregunta no implica comprensión automática de nuevas restricciones. Los identificadores
conectan puntos, filas y fuentes; ranking y advertencias explican criterios y ausencia de datos.

## Ambición de producto

Mission Lab puede incluir una escena conceptual, escenarios A/B y diseño inverso. El usuario pide alternativas de investigación bajo restricciones; la IA muestra fundamento, incertidumbres y prueba necesaria. Una simulación conceptual lleva su etiqueta. No se necesita afirmar que existe un predictor validado de combustión lunar.

## Preparación científica

Confirmar serie, variable objetivo, unidades y réplicas antes de elegir los ejemplos. Saffire puede servir como comparación descriptiva de escala y configuración; no debe agregarse automáticamente a la misma regresión. Si solo hay límites de extinción, el gráfico representa esos límites.

## Respaldo operativo

P6 mantiene una consulta conocida, una consulta modificada y una consulta sin evidencia suficiente. Registrar el commit usado. Comprobar archivos locales, fuentes, conexión y modo del proveedor. Una captura o grabación de respaldo se identifica como resultado previo.

## Preguntas difíciles

- ¿De dónde sale este punto? Abrir fuente y localizador.
- ¿Por qué este resultado está primero? Mostrar restricciones, similitud y cobertura.
- ¿Qué hace la IA? Distinguir el flujo determinista actual, sus herramientas y una eventual síntesis externa; no presentar demo como inferencia real.
- ¿Qué está prototipado? Mostrar etiquetas y alcance.
- ¿Qué falta para uso real? Corpus verificado, evaluación ampliada, revisión especializada y modelos validados donde se hagan predicciones.

## P6 · Recorrido Mission Lab

Guion de respaldo verificado contra la API real (modo `demo`, `FLAMELAB_SEED_DEMO=true`, SQLite temporal) el
2026-11-14. Todas las cifras proceden de los **fixtures sintéticos** (`synthetic:*`): no son mediciones NASA. La
coordinación es determinista y no llama a un modelo. `/scenarios/compare` compara **aplicabilidad de evidencia**
(`label: evidence_comparison_not_physical_simulation`); no simula combustión ni predice seguridad.

- Commit de partida: `422f6b03f410c6ac049b699e13fc204a3af67743` (API sin cambios en la rama de trabajo).
- Commit del recorrido: el commit de la rama P6 que introduce esta sección (`git log -1 -- docs/DEMO.md`); el relevo registra su SHA. Repetir la verificación si el recorrido se ejecuta sobre otro commit.

### 1. Consulta conocida (respondida)

`POST /api/v1/research` con `demoRanking` de `apps/web/src/lib/client.ts`:

```json
{"question": "Que ensayos sinteticos en microgravedad son comparables variando la velocidad de flujo?",
 "ranking": {"target": {"gravity_regime": "microgravity"}, "required_match": ["gravity_regime"],
             "vary": ["flow_velocity_cm_s"], "allow_synthetic": true, "minimum_coverage": 0.6, "limit": 3}}
```

Resultado observado:

- `status: completed`, `provider: demo`, resumen «Demostración determinista con datos sintéticos.»
- Seleccionados: `synthetic:trial-1`, `-2`, `-3` (`eligible`, similitud 1.0, cobertura 1.0,
  `explicit_requirements_satisfied`). Fuera: `trial-4` `excluded` (`required_condition_mismatch:gravity_regime`,
  es `earth`) y `trial-5` `indeterminate` (`required_condition_missing:gravity_regime`, `no_known_target_conditions`).
- Comparación: `flame_spread_rate_mm_s` frente a `flow_velocity_cm_s`, 1 grupo, 4 puntos de 3 ensayos
  (`trial-1` aporta 2 observaciones de la misma unidad independiente: no son réplicas).
- Hipótesis `demo:hypothesis-controlled-series`, etiqueta `prepared_demo_hypothesis` (contenido preparado, no
  descubrimiento). Siguiente prueba (`next_measurement`): «Registrar velocidad calibrada, O2 durante el ensayo y
  propagación con unidades, controlando geometría y material.» Incluye `alternative_explanation` y `falsification`.

### 2. Consulta modificada A/B

`POST /api/v1/scenarios/compare` con A = `demoRanking` y B = la misma petición cambiando solo
`target.gravity_regime` a `"lunar"`:

```json
{"name_a": "A microgravedad", "name_b": "B",
 "scenario_a": {"target": {"gravity_regime": "microgravity"}, "required_match": ["gravity_regime"], "vary": ["flow_velocity_cm_s"], "allow_synthetic": true, "minimum_coverage": 0.6, "limit": 3},
 "scenario_b": {"target": {"gravity_regime": "lunar"}, "required_match": ["gravity_regime"], "vary": ["flow_velocity_cm_s"], "allow_synthetic": true, "minimum_coverage": 0.6, "limit": 3}}
```

| Escenario | Seleccionados | Salen y motivo en B |
|---|---|---|
| A microgravedad | trial-1, trial-2, trial-3 | — |
| B lunar | ninguno | trial-1..3 `required_condition_mismatch:gravity_regime`; trial-5 sigue `indeterminate` |

Advertencias: «Compara aplicabilidad de evidencia; no simula la combustión ni predice seguridad.» y, en
`ranking_b`, «No eligible evidence for the explicit filters and coverage requirement.» El cambio se explica por el
filtro explícito: ningún fixture declara gravedad lunar. No implica nada sobre la combustión lunar.

Variantes de B también observadas (misma A):

- `allow_synthetic: false` (microgravedad): B vacío; todos `excluded` con `synthetic_not_allowed` (más los motivos previos de trial-4/5).
- `gravity_regime: "earth"`: entra `trial-4` (`eligible`, similitud 1.0); salen trial-1..3 por `required_condition_mismatch:gravity_regime`. Es el único B de los fixtures donde algo **entra**.

### 3. Consulta sin evidencia suficiente

`POST /api/v1/research` con `{"question": "Aplicación lunar sin evidencia directa", "ranking": <B lunar anterior>}`
(la misma que usa `scripts/smoke.py`). Resultado: `status: insufficient_evidence`, resumen «Evidencia insuficiente
para la métrica y las restricciones solicitadas.», `ranking.items` vacío, `comparison: null`, `hypotheses` y
`claims` vacíos. Qué falta, según la respuesta: «Faltan candidatos elegibles o mediciones compatibles de la
métrica.» (0 de 5 ensayos elegibles). No se sustituyen cifras ni se propone una hipótesis.

### Funcional, preparado e ilustrativo

| Elemento | Estado |
|---|---|
| Ranking, elegibilidad, motivos, comparación A/B, estado `insufficient_evidence` | Funcional: calculado por la API en cada petición. |
| Hipótesis y siguiente prueba | Preparado: texto fijo `prepared_demo_hypothesis`, no inferido por un modelo. |
| Datos de ensayos y observaciones | Sintéticos: fixtures de software. |
| Escena conceptual / simulación | No existe; si se añade, va rotulada como ilustrativa. |

### Caso de respaldo

El respaldo es la consulta conocida (1) y la lunar (3). Reproducción sin UI: `uv run python scripts/smoke.py`
(arranca API en SQLite temporal, ejecuta research, escenarios y caso lunar y reinicia; resultado observado:
`"n_trials": 5`, `"points": 4`, `"restart_persistence": "passed"`), o las peticiones JSON de arriba con `curl`
contra una API en modo demo. Una captura o grabación se presenta como resultado previo, nunca como ejecución en vivo.

### Pasos en la UI Mission Lab

Por función. La UI Mission Lab está montada en el arnés técnico (`apps/web/src/features/mission-lab/`) y se recorrió en Chromium; el diseño final sigue pendiente.

1. Lanzar la consulta conocida y abrir el panel de hipótesis: etiqueta preparada visible, fundamento, alternativa,
   refutación y siguiente prueba.
2. Elegir un escenario B en el selector (gravedad lunar, gravedad terrestre, flujo 2 cm/s puntuado, sin sintéticos) y comparar.
3. Revisar la vista entra / sale / se mantiene: cada salida muestra sus motivos de `ranking_b.excluded`; la
   etiqueta de comparación de evidencia es visible.
4. Pulsar la consulta sin evidencia: se muestra `insufficient_evidence` y lo que falta, sin cifras ni hipótesis.

### Aceptación de extremo a extremo

| Revisor | Comprueba |
|---|---|
| P1 | El recorrido corre en el commit registrado; `scripts/smoke.py`, pruebas y cliente generado sin cambios manuales. |
| P3 | Motivos de exclusión e `insufficient_evidence` son correctos; nada sugiere física lunar ni datos NASA. |
| P4 | La hipótesis conserva `prepared_demo_hypothesis`/`ai_hypothesis` y muestra fundamento, alternativa y refutación. |
| P5 | Mission Lab se integra en la aplicación sin romper el arnés; etiquetas sintético/demo visibles. |

### Límites

Datos sintéticos (5 ensayos, 6 observaciones); demo determinista sin LLM; sin escena física ni simulación; sin
datos NASA cuantitativos. Similitud no es confianza ni peligrosidad.
