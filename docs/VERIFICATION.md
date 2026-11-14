# Registro de verificaciones

14 de noviembre de 2026, Windows, zona Europe/Madrid. Los resultados corresponden
al código local integrado; no son resultados de CI remota ni validación científica.

## Entorno observado

- Git 2.55.0.windows.5; Python 3.12.14; Node 24.22.1; uv 0.9.5; npm 11.6.2.
- Versiones resueltas y fijadas: FastAPI 0.162.7, Pydantic 2.14.3, SQLAlchemy 2.1.8,
  Alembic 1.20.1, uvicorn 0.54.0, httpx 0.28.1, pytest 9.2.0, Ruff 0.17.5;
  React 19.3.1, TypeScript 5.9.3, Vite 8.3.8, openapi-typescript 7.13.0.
- SQLite local en disco; fixtures sintéticos; AI_PROVIDER=demo.
- Navegador: Chrome 157.0.8103.39 y Playwright 1.62.1 ya disponibles en este equipo.

## Ejecuciones

| Comando/procedimiento | Resultado observado |
|---|---|
| `scripts/setup.ps1` | uv sync --locked, npm ci, schema/typecheck/build completados; .env preservado. |
| `scripts/check.ps1` | Proceso completo finalizado con éxito. Log local work/verification.log. |
| `python -m pytest -q` | **112 passed**, 1 aviso de deprecación, sin fallos. |
| `ruff check apps/api scripts` | All checks passed. |
| `python scripts/export-openapi.py --check` | Sin deriva respecto a Pydantic. |
| `npm run check:types` / `typecheck` | Sin deriva de TS y compilación de tipos correcta. |
| `npm run test:client` | **6/6** pruebas aprobadas. |
| `npm run build` | Compilación Vite correcta. |
| `python scripts/smoke.py` | HTTP real: 5 ensayos sintéticos, 4 puntos seleccionados, informe igual tras reinicio. |
| `npm run test:client:live` | 11 comprobaciones HTTP contra API8000: salud/perfil/investigación/procedencia/evidencia/persistencia/informe/replay/A-B/insuficiencia/404. |
| Chrome mediante Playwright | Investigar, evidencia histórica, informe, replay, A/B 3 frente a 0, lunar sin evidencia, error422; sin errores JS. |
| CLI inventory sobre ZIP original | 123 archivos+105 directorios; 276 miembros incluyendo anidados; hash intacto. |
| CLI validate/import | Catálogo/fixture válidos; repetición idempotente y reemplazo explícito comprobados. |

Los 112 casos cubren contratos estrictos, referencias/procedencia, ZIP malicioso,
ceros y ausencias, ranking y comparación, snapshots/SQLite, API y proveedor simulado.
No son 111 ensayos científicos. Las observaciones sintéticas prueban conexiones.

## Incidencias resueltas y límites

- Ruta documental inicial tenía un nivel menos; se localizó sin mover originales.
- No había Python/uv/npm estándar accesibles. Se reutilizaron runtimes disponibles
  y herramientas locales dentro del proyecto, sin instalación global.
- npm ci con Vite abierto falló EPERM de DLL en Windows; detener Vite y repetir
  setup resolvió el problema. No se borró trabajo ajeno ni se elevó privilegios.
- Revisión cruzada corrigió IDs con slash, fuentes de observación no enlazadas,
  memoria SQLite no persistente, respuestas externas malformadas, deadline global,
  tipos bool/numéricos y estado insuficiente sin X.
- Algunas corridas de desarrollo coincidieron con edición de pruebas; el resultado
  de cierre se tomó después de estabilizar los archivos, no de esas corridas.
- Starlette emite aviso de deprecación del transporte httpx de TestClient. No se
  añadió otro cliente equivalente solo para silenciarlo; el recorrido uvicorn
  verifica además HTTP real. Revisar al actualizar dependencias.
- El script de navegador usó Playwright preinstalado; no se añadió a dependencias
  ni CI. Reproducción manual documentada en apps/web/README.md.
- Ninguna llamada real a OpenAI, prueba PostgreSQL/Docker, CI GitHub, despliegue,
  móvil, validación semántica automática o revisión científica completa del corpus.

## Instalación limpia

Se creó `work/clean-checkout` con `git clone --no-hardlinks` desde el commit
`d9f7406` y se ejecutaron allí `scripts/setup.ps1` y `scripts/check.ps1`.
Se crearon su propia `.venv`, `node_modules`, herramientas locales y `.env`:
**112 pruebas Python, 6 de cliente, tipos/generados, build y HTTP con reinicio
aprobados**. Se reutilizaron runtimes y cachés del mismo Windows, no se probó una
máquina nueva ni otro sistema operativo. Los cambios posteriores al commit probado
solo registran estos resultados en documentación; el código y lockfiles no cambiaron.
`.gitattributes` fija LF para impedir deriva artificial de generados por CRLF.
Logs: `work/clean-checkout/work/setup.log` y `work/clean-checkout/work/verification.log`.

## Evidencia conservada

Inventario versionado en data/catalog/zip_inventory.json; documentación detallada
en DATA_INSPECTION. Logs temporales/smoke/capturas están en work, excluidos de Git.
El paquete de entrega copia los resultados relevantes sin claves, bases ni archivos
NASA originales. Las capturas son un arnés de software, no el frontend final.
