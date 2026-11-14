# Desplegar FlameLab con Qwen local

Estos pasos usan el checkout en Ubuntu o WSL2 con Docker, Python 3.12, uv y Node 24. Ejecuta los comandos desde la raíz. Para Windows nativo, puedes usar los scripts del README y activar Ollama en el mismo host de la API.

## 1. Preparar el proyecto y la base

```bash
uv sync --locked
npm ci
mkdir -p work
```

Para reproducir BASS-II y las métricas de campaña, consigue el paquete P2 1.1.1 del equipo. Comprueba el SHA-256 del `bundle.json` según la [guía de integración](INTEGRATION_P2_MAIN.md). Impórtalo a una base dedicada.

```bash
.venv/bin/python -m flamelab.data.cli validate /ruta/al/bundle.json
.venv/bin/python -m flamelab.data.cli import /ruta/al/bundle.json --database-url sqlite:///work/flamelab-p2.db
```

## 2. Arrancar Ollama

```bash
docker run -d --restart unless-stopped --name flamelab-ollama \
  -p 127.0.0.1:11434:11434 -v flamelab-ollama-models:/root/.ollama \
  -e OLLAMA_NUM_PARALLEL=1 ollama/ollama
docker exec flamelab-ollama ollama pull qwen3:0.6b
curl -fsS http://127.0.0.1:11434/api/tags
```

Si el contenedor ya existe, usa `docker start flamelab-ollama`. El modelo cuantizado ocupa unos 523 MB. La API consulta Ollama por loopback, desactiva el razonamiento extendido y limita contexto, salida y duración.

[Modelo Qwen3 0.6B](https://ollama.com/library/qwen3:0.6b) · [API de chat de Ollama](https://docs.ollama.com/api/chat)

## 3. Abrir la demo

En una terminal:

```bash
FLAMELAB_DATABASE_URL=sqlite:///work/flamelab-p2.db \
FLAMELAB_SEED_DEMO=false FLAMELAB_AI_PROVIDER=qwen \
FLAMELAB_OLLAMA_MODEL=qwen3:0.6b \
.venv/bin/python -m uvicorn flamelab.main:app --host 127.0.0.1 --port 8000 --log-config scripts/qwen-logging.json
```

En otra terminal ejecuta `npm run dev:web`. Abre [FlameLab](http://127.0.0.1:5173/#dashboard) y verifica [la salud de la API](http://127.0.0.1:5173/api/v1/health). `ai_provider` indica el proveedor configurado. Para verificar una inferencia real, pregunta `Which studies investigate flame extinction?` en **Ask FlameLab**. En **Research → Charts** puedes elegir una métrica de FLEX o Saffire. **Compare** reúne las comparaciones de escenarios y de estudios. **Library** reúne el catálogo, el visor de fuentes y el contexto Saffire.

## 4. Servir la compilación

Ejecuta `npm run build` y sirve `apps/web/dist` como sitio estático. En el mismo origen, dirige `/api/` al puerto 8000 de la API. Mantén `/api/` separado de la regla que sirve `index.html`. Configura HTTPS y el acceso que requiera el despliegue en el proxy. Ejecuta API y Ollama en el mismo host o espacio de red para conservar la conexión local. Persiste el archivo SQLite y el volumen de Ollama. Si el endpoint de salud desde la web devuelve HTML, revisa primero la regla `/api/` del proxy.

## Qué hace el modelo

El backend recupera estudios, observaciones y fuentes desde el corpus activo. Cuando una pregunta abierta del chat tiene varias fuentes candidatas, Qwen ayuda a seleccionar las pertinentes. El buscador, los filtros, los gráficos, el ranking y las comparaciones se ejecutan directamente en código. Si Qwen falla o devuelve una selección vacía, el chat usa la recuperación del catálogo. El log de Qwen recoge duración y tokens sin guardar la pregunta ni el texto de las fuentes.

Para probar sin Ollama, inicia la API con `FLAMELAB_AI_PROVIDER=demo`. Si además usas el fixture de demo, sus mediciones son sintéticas. Para conservar expedientes anteriores, vuelve a arrancar con el mismo archivo SQLite.

**Ask FlameLab** abre el chat del dashboard. Consulta la guía integrada y recupera registros del corpus activo por estudio, ensayo y métrica. Si hay una investigación abierta, también puede recuperar sus hallazgos citados. Las preguntas de navegación, metodología y totales se resuelven directamente. Las demás usan recuperación léxica y, si Qwen está activo, una selección local de extractos con hasta cuatro segundos de espera por el modelo. El código compone la respuesta en inglés. Los detalles técnicos y fuentes se pueden desplegar en el chat. El historial se mantiene en la vista durante la sesión del navegador y la última pregunta ayuda a recuperar resultados en seguimientos breves.

Prueba `Plot BASS-II and FLEX` en el chat y pulsa **Open study comparison**. La página abre los dos estudios del corpus. Si comparten una métrica y unidad, muestra la mediana por estudio. Si no, muestra recuentos de observaciones con valor. En **Charts**, las líneas unen segmentos consecutivos de un mismo ensayo y las barras muestran medianas por grupo descriptivo.
