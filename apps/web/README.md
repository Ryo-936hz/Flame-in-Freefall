# Cliente FlameLab SI · interfaz de demo (P5)

Sustituye al arnés técnico por una interfaz utilizable para la demo: formular
pregunta y filtros sin editar JSON, investigar y explorar gráfico, tabla, ranking
y evidencia enlazados por identidad. Sigue `docs/DESIGN_ANDURIL.md` de forma
acotada. Toda la interfaz está en inglés. Inter Tight y Geist Mono van autoalojadas.

- **Tema noche (por defecto):** negro, vidrio esmerilado y acento azul de llama en microgravedad (`#5C9CFF`).
- **Tema día:** fondo blanco cálido (`#FCF8F4`), paneles blancos sólidos y acento naranja de llama (`#C94A10`).
- **Escritorio:** la página no se desplaza; cada columna tiene su propio scroll.

## Estructura

| Ruta | Contenido |
|---|---|
| `src/App.tsx` | Montaje: conexión, investigación, selección compartida, chat, reinicio y animación de entrada. |
| `src/components/TopBar.tsx` | Navegación por secciones, estado de la API, «Ask SI», «Reset» e interruptor día/noche. |
| `src/components/MissionBrief.tsx` | Formulario tipado → `RankingRequest`: presets de hábitat, condiciones con slider numérico, resumen de los filtros que se enviarán y botón fijo «Investigate» (Ctrl+Enter). |
| `src/components/ChatPanel.tsx` | «Ask SI»: cada pregunta lanza una investigación con los filtros del Brief; las citas abren la evidencia. Superpuesto a la columna de evidencia, nunca a la comparación. |
| `src/components/SynthesisPanel.tsx` | Afirmaciones citadas, hipótesis rotuladas, actividad y advertencias. |
| `src/components/FlameIllustration.tsx` | Animación **ilustrativa** de llama a 1 g y a la gravedad del Brief; solo antes de la primera investigación. No es una simulación. |
| `src/components/InterimMissionTools.tsx` | Montaje **provisional** de A/B, informe, eventos y recuperación hasta los paneles de P6; define `MissionSlotProps`. |
| `src/features/evidence/` | Evidence Canvas: gráfico, tabla de puntos, ranking, visor de evidencia, selección y exportación CSV. |
| `src/lib/filters.ts` | Estado del formulario, presets de hábitat y traducción a filtros explícitos. |
| `src/lib/backendText.ts` | Traducción **provisional** al inglés del texto que emite el backend en español; borrar cuando el backend emita inglés. |
| `src/lib/motion.ts` | Animaciones GSAP: respetan «movimiento reducido» y nunca dejan contenido oculto. |
| `src/lib/latest.ts` | Guarda contra respuestas tardías. |
| `src/lib/format.ts` | Texto de códigos de razón y etiquetas; no recalcula nada. |
| `src/style.css` | Tokens por tema al inicio y reglas sin sobrescrituras. |
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
npx tsx --test apps/web/tests/evidence/*.test.ts
npm run build
npm run dev:web
npm run test:client:live   # con la API iniciada en modo demo
```

Las pruebas de `tests/evidence/` aún no están en `package.json` ni en CI: se ha
pedido a P1 que añada el comando (ver `docs/handoffs/P5.md`).

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

Playwright no es una dependencia del proyecto ni forma parte de su CI. Esa
comprobación de navegador se ejecutó con herramientas disponibles en este
equipo. Para reproducir manualmente: iniciar API y cliente, pulsar
«Investigar», abrir una evidencia, informe y eventos, comparar A/B y cambiar
el filtro `gravity_regime` a `lunar`; después introducir una clave de condición
desconocida para comprobar el error. No acredita compatibilidad móvil ni
validación científica con mediciones reales.

En Windows, detener Vite antes de repetir `npm ci` o `setup.ps1`: el proceso
puede mantener abierta una DLL de sus dependencias y bloquear su sustitución.
