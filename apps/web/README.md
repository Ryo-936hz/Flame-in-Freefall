# Cliente FlameLab · interfaz integrada de demo (P5/P6)

Sustituye al arnés técnico por una interfaz utilizable para la demo: formular
pregunta y filtros sin editar JSON, investigar y explorar gráfico, tabla, ranking
y evidencia enlazados por identidad. Sigue `docs/DESIGN_ANDURIL.md` de forma
acotada: tema oscuro por defecto (claro opcional), Inter Tight y Geist Mono
autoalojadas, acentos de llama naranja/azul según tema, conservados del diseño de P5.

## Estructura

| Ruta | Contenido |
|---|---|
| `src/App.tsx` | Montaje: conexión, investigación, selección compartida y paneles. |
| `src/components/MissionBrief.tsx` | Formulario tipado → `RankingRequest` y resumen de los filtros que se enviarán. |
| `src/components/SynthesisPanel.tsx` | Afirmaciones citadas, hipótesis rotuladas, actividad y advertencias. |
| `src/features/mission-lab/` | Panel A/B, segmentos, hipótesis, consulta lunar y vigencia; define `MissionSlotProps`. |
| `src/features/report/` | Informe literal, descarga, eventos guardados y recuperación. |
| `src/features/catalog/` | Catálogo P2, accesible desde «Study catalog». |
| `src/features/evidence/` | Evidence Canvas: gráfico, tabla de puntos, ranking, visor de evidencia y selección. |
| `src/lib/filters.ts` | Estado del formulario y traducción a filtros explícitos. |
| `src/lib/latest.ts` | Guarda contra respuestas tardías. |
| `src/lib/format.ts` | Texto de códigos de razón y etiquetas; no recalcula nada. |
| `src/assets/fonts/` | Subconjunto latino con licencia OFL y sus licencias. |

## Reglas que respeta la interfaz

- Unidades, grupos, exclusiones, similitud y cobertura vienen de la API; React no
  duplica reglas científicas. El formulario solo comprueba la forma (vacío,
  número); rangos y combinaciones los valida la API (error 422 visible con su
  identificador de solicitud).
- Punto, fila, cita y fuente se enlazan por `observation_id`, `trial_id` y
  `evidence_id`, nunca por posición.
- La evidencia se pide con `research_id` para conservar el expediente. La de los
  ensayos excluidos no forma parte del expediente: se lee del corpus activo y se
  rotula «Corpus activo · no está en este expediente».
- Sintético/real y IA demo/proveedor quedan visibles en cabecera, canvas,
  ranking y evidencia. Las hipótesis preparadas se rotulan como propuesta.
- Una respuesta de una consulta anterior no sobrescribe la actual.
- Estados distinguibles: sin conexión, vacío, cargando, error con reintento y
  evidencia insuficiente con los motivos devueltos por el ranking.

## Comandos

Desde la raíz:

```powershell
npm run typecheck
npm run test:client
npm run build
npm run dev:web
npm run test:client:live   # con la API iniciada en modo demo
```

### Datos publicados y Ask SI

Sigue la [guía de importación de P2](../../docs/INTEGRATION_P2_MAIN.md#activar-el-paquete-real-p2-sin-sobrescribir-otra-base) para cargar el corpus en una base dedicada. `/api/v1/health` debe indicar `scientific_unverified`.

Para activar Qwen en Ask SI, inicia Ollama en el mismo equipo que la API y ejecuta `ollama pull qwen3:0.6b`. Arranca la API con `FLAMELAB_AI_PROVIDER=qwen` y el mismo `FLAMELAB_DATABASE_URL` donde importaste P2. Ask SI recupera fuentes del corpus. Si Ollama no está disponible, responde con los resultados del catálogo. Las mediciones y los rankings se calculan en la API.

`test:client` descubre todos los archivos `*.test.ts(x)` bajo `tests/`, incluidos P5/P6.
Para comprobar el navegador, instalar una vez Chromium y ejecutar:

```powershell
node node_modules/playwright/cli.js install chromium
npm run test:e2e:p6
# Alternativa con todas las puertas: .\scripts\check.ps1 -E2E
```

El runner arranca API/Vite aislados y usa únicamente fixtures sintéticos.
Guía, opciones y cobertura: [tests/e2e/README](tests/e2e/README.md).

El servidor de desarrollo usa `http://127.0.0.1:5173` y dirige `/api` a la API
local del puerto 8000. `VITE_API_BASE_URL` permite otro origen HTTP; ninguna
variable `VITE_*` puede contener claves. La autoridad es Pydantic → OpenAPI →
`packages/contracts/schema.d.ts`; no editar el generado.

En Windows, detener Vite antes de repetir `npm ci` o `setup.ps1`.

## Historial: arnés técnico

### Verificación del arnés, 14 de noviembre de 2026

En Windows, Node 24.22.1 y npm 11.6.2: generación y deriva de tipos,
`typecheck`, 6 pruebas del transporte y compilación Vite completadas.
El consumidor HTTP real (`test:client:live`) comprobó salud, perfil,
investigación, procedencia sintética, evidencia, recuperación persistida,
informe, eventos, cambio A/B, ausencia de evidencia y error 404. Usó SQLite,
proveedor demo, 5 ensayos sintéticos y 4 puntos en la comparación seleccionada.

También se abrió el arnés en Chrome 157.0.8103.39 sin interfaz visible mediante
Playwright 1.62.1 preinstalado en el entorno de trabajo. Se ejecutaron botones y
formularios reales: investigación, evidencia del snapshot, informe, eventos,
A/B (3 candidatos frente a 0), consulta lunar sin evidencia y filtro inválido
con error 422. No se observaron errores JavaScript de página. Las capturas
locales quedaron en `work/ui-proof.png`, `work/client-top-snapshot.png` y
`work/client-ranking-snapshot.png`; se inspeccionaron visualmente.

En esta verificación histórica Playwright aún no era dependencia ni parte de CI. Esa
comprobación de navegador se ejecutó con herramientas disponibles en este
equipo. Para reproducir manualmente: iniciar API y cliente, pulsar
«Investigar», abrir una evidencia, informe y eventos, comparar A/B y cambiar
el filtro `gravity_regime` a `lunar`; después introducir una clave de condición
desconocida para comprobar el error. No acredita compatibilidad móvil ni
validación científica con mediciones reales.

En Windows, detener Vite antes de repetir `npm ci` o `setup.ps1`: el proceso
puede mantener abierta una DLL de sus dependencias y bloquear su sustitución.
