# Cliente técnico FlameLab SI

Este es el arnés de integración, no el frontend final. Consume salud, perfil,
investigación, escenarios A/B, evidencia del expediente, informe persistido y
reproducción de eventos. Las tablas muestran las unidades devueltas por la API;
el navegador no recalcula ranking ni estadísticas.

Desde la raíz, tras la preparación del README principal:

```powershell
npm run generate:types
npm run check:types
npm run typecheck
npm run test:client
npm run build
npm run dev:web
```

El servidor de desarrollo usa `http://127.0.0.1:5173` y dirige `/api` a la API
local del puerto 8000. Para comprobar el consumidor TypeScript contra la API
real iniciada en modo demo y con la fixture sintética cargada:

```powershell
npm run test:client:live
```

`FLAMELAB_API_URL` cambia el destino del test HTTP. `VITE_API_BASE_URL` permite
configurar un origen HTTP para el navegador; no contiene una ruta `/api/v1`
adicional. Ninguna variable `VITE_*` puede contener claves o secretos. El proxy
local evita necesitar ese cambio durante el recorrido habitual.

La autoridad es Pydantic → OpenAPI → `packages/contracts/schema.d.ts`.
`scripts/generate-types.mjs` genera ese archivo; no editarlo a mano.
`openapi-fetch` usa las rutas y cuerpos generados. Se desactiva la opción
`defaultNonNullable` del generador para conservar como opcionales los campos
de entrada que la API completa con defaults.

Los filtros JSON son explícitos y la API los valida. El modo demo no interpreta
restricciones verbales de la pregunta. `allow_synthetic` se activa en el ejemplo
y puede desactivarse en esos filtros. El escenario B cambia la gravedad a
`lunar`: muestra el cambio en selección, no una simulación física. Abrir una
fuente utiliza `research_id` para recuperar la evidencia guardada con el
expediente, incluso después de sustituir el corpus actual.

P5 ampliará `src/features/evidence/`; P6 ampliará
`src/features/mission-lab/`. Ambos coordinan con P1 los cambios de contrato.
La dirección visual permanece en `docs/DESIGN_ANDURIL.md`.

## Verificación realizada el 14 de noviembre de 2026

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
