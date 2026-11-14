# Evaluación P4 offline

```powershell
.venv\Scripts\python.exe evals/ai/run.py
```

El evaluador usa los servicios reales de planificación, ciencia y coordinación,
con `data/fixtures/demo.json` exclusivamente sintético. Las respuestas y fallos
externos se simulan sustituyendo la función de proveedor durante cada caso; no se
abre red ni SQLite, ni se leen credenciales de una cuenta. El modo demo falla si
intenta llamar al proveedor. Ninguna prueba valida un modelo externo real.

`cases.json` fija manualmente 18 expectativas:

- Formulario explícito y pregunta descriptiva, sin alteración de filtros.
- Catálogo de flujo que cambia parámetros, escenario lunar insuficiente y evaluación de evidencia.
- Ambigüedad, capacidad no soportada, restricción no interpretada y conflicto con filtro fijo.
- Afirmación cuantitativa respaldada y rechazo de cifras de otro ensayo/eje.
- Citas inventadas o existentes vinculadas a otro ensayo.
- Instrucciones maliciosas en fuente sin cambio de cálculos ni resumen del programa.
- Timeout, respuesta malformada y servicio indisponible simulados como errores explícitos.
- Insuficiencia que impide incluso la llamada al proveedor simulado.

Cada salida contiene resultado, plan/selección observados, discrepancias y SHA-256
de los bytes exactos de suite, fixture y runner. Se ignoran UUID y fecha, que no
definen corrección. Las expectativas no se regeneran desde los resultados.

Código de salida: **0** aprobado; **1** discrepancia; **2** entrada inválida.
`--cases` y `--fixture` permiten rutas explícitas. Se rechazan suites vacías, casos
sin expectativas, IDs duplicados y corpus no sintéticos. Los tests alteran una
expectativa y verifican salida 1; metadatos reales/suite vacía producen 2.

```powershell
.venv\Scripts\python.exe -m pytest apps/api/tests/test_ai_runner.py -q
```

El conjunto es una regresión de software usada durante desarrollo, no un benchmark
independiente. Las pruebas adicionales `test_planner.py` y `test_ai_reports.py`
cubren unidades de campañas, atribución a las fuentes de cada campo, cero, negaciones,
restricciones no latinas, notas de fuente que no pueden convertirse en afirmaciones
y reporte Markdown con contenido no fiable. `test_provider.py` prueba el protocolo
con HTTP simulado. La revisión de extracción e interpretación NASA y cualquier
evaluación de un modelo real se registran aparte.
