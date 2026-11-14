# Experimento UX de `raul`

## Alcance vigente

El usuario pide varias pantallas y menos densidad y texto repetido, manteniendo
el estilo de FlameLab y sus límites científicos. La base estable del equipo es
`main`, commit **`4833000d98fcb9d197a01e4d7622c8639115131d`**. Este experimento se desarrolla
**solo en `raul`**; no se fusiona una PR ni se actualiza `main` con este incremento.

El cambio reorganiza la presentación React y sus recorridos de navegador. No
cambia backend, contratos, fórmulas, fuentes, valores importados ni los cuerpos
de las peticiones científicas. Se conservan la paleta y los tokens existentes,
la tipografía, los temas oscuro/claro y la identificación textual de datos sintéticos.
La [dirección visual](DESIGN_ANDURIL.md) separa esta composición de la propuesta histórica.

## Guion de las cinco pantallas

La navegación superior usa **Research**, **Results**, **Lab**, **Library** y
**Reports**. Sus rutas son `#research`, `#results`, `#lab`, `#library` y `#reports`.
El historial del navegador cambia de pantalla sin descartar el estado de la sesión.

1. **Research.** Revisar la pregunta y la métrica. Abrir **Conditions** para cambiar
   condiciones exactas, de similitud o variables estudiadas. **Sampling & coverage**
   contiene el límite de ensayos, cobertura y permiso de datos sintéticos.
   **Review filters** conserva el resumen de la petición. Las condiciones activas
   aparecen también junto a la acción **Investigate**, que abre Results.
   El texto de la pregunta no sustituye los filtros explícitos.
2. **Results.** Alternar **Data** y **Findings** para consultar mediciones o
   conclusiones del expediente. En Data, alternar gráfico/tabla, exportar CSV y
   abrir **Groups and controls** o **Ranking and coverage** cuando se necesite el
   detalle. **Record details** identifica el expediente y su fecha. **Edit query**
   vuelve al borrador: editarlo no recalcula el resultado guardado. Una nueva
   investigación sustituye el resultado activo cuando la API responde.
3. **Lab.** Elegir **BASS-II cases**, **A/B scenarios** o **Hypotheses & queries**.
   Solo una vista se muestra cada vez. Las pestañas aceptan flechas izquierda/derecha,
   Home y End. BASS-II mantiene sus consultas fijas y A/B usa los filtros del formulario;
   sus métricas se muestran de forma explícita. Los métodos, expectativas de fixtures
   y filtros completos se consultan en desplegables. Abrir un expediente desde Lab
   conduce a Results; al volver a Lab se conserva el resultado local y su vigencia.
4. **Library.** Usar **Studies** para seleccionar un estudio, paginar sus fuentes y
   observaciones y abrir el registro literal. El catálogo conserva sus reintentos,
   IDs de ensayo/segmento/observación, originales, unidades y estados de ausencia.
   Su visor de fuente permanece dentro del catálogo. **Saffire context** abre la
   tarjeta documental separada; su presencia no afirma que el corpus NASA esté importado.
5. **Reports.** Leer o descargar el informe original del expediente activo,
   recuperar otro por ID o desde los recientes y consultar el replay de eventos.
   La recuperación abre el expediente en Results. Los informes y eventos proceden
   del servidor; reorganizar su presentación no los reconstruye ni reescribe.

## Panel lateral de fuentes

Un punto, una fila o una cita de Results/Lab abre **Evidence source**, un diálogo
nativo lateral. **Close source** o Escape lo cierra y permite volver al contenido.
Las fuentes guardadas usan el ID de su expediente; las consultas al corpus activo
mantienen su etiqueta. El texto de evidencia y sus localizadores siguen siendo
los de la API. Cambiar de pantalla cierra el diálogo sin alterar el expediente.

## Estado y límites que se conservan

Las cinco pantallas, las vistas de Lab y las vistas internas de resultados y
biblioteca se ocultan sin desmontarse durante la navegación. Esto mantiene
borrador, selecciones, resultados, catálogo y operaciones pendientes. No se promete
persistencia del borrador después de recargar la página; los expedientes guardados
se recuperan mediante Reports.

**Reset** cancela la publicación de respuestas tardías, limpia resultados,
selección y filtros y reinicia Lab y ReportPanel. **Reset filters** solo restaura
el formulario. Los avisos de resultado anterior en Lab siguen comparando filtros,
métrica, pregunta y expediente según corresponda.

Las hipótesis conservan su etiqueta y límites. Comparar escenarios describe
evidencia seleccionada, no simula combustión ni estima peligrosidad. Los presets
BASS-II requieren el paquete P2 real para reproducir sus casos aprobados; los
fixtures no se sustituyen por mediciones NASA. La conformidad de P3 sigue limitada
a los puntos y al uso descriptivo del [dictamen BASS-II](handoffs/P3_BASS_II_DECISION_DEMO.md).
M8 conserva su discrepancia en la evidencia y el caso lunar no añade un filtro de flujo.

## Arranque y verificación del incremento

Código del experimento: **`b753658d2aa84cf5b33ca6bf01bb485ad4c1c2d6`**, en `raul`.
`main` permanece en `4833000d98fcb9d197a01e4d7622c8639115131d`.

Usar las dependencias del [arranque Windows](SETUP_WINDOWS.md), pero seleccionar
`raul` para probar este diseño. Conservar cualquier trabajo local antes de cambiar
de rama. En un clon configurado:

```powershell
git fetch origin
git switch raul
git pull --ff-only origin raul
```

Si faltan las dependencias, ejecutar `scripts/setup.ps1` antes de arrancar Vite.
Después, en dos terminales desde la raíz del clon:

```powershell
.\scripts\dev-api.ps1
```

```powershell
.\scripts\dev-web.ps1
```

Abrir `http://127.0.0.1:5173/#research`. Los scripts conservan `.env` y el corpus
existente. Una instalación nueva usa datos sintéticos. Para los casos reales
BASS-II, seguir la importación en base dedicada de [DEMO](DEMO.md); los originales
y el bundle privado no se publican en esta rama. La distribución en pantallas de
este documento reemplaza las indicaciones visuales del recorrido anterior.

### Resultados locales del rediseño — 14 de noviembre de 2026

| Comprobación | Resultado |
|---|---|
| TypeScript | Correcto. |
| Cliente | 77 pruebas aprobadas. |
| Compilación de producción Vite | Correcta. |
| Navegador + API + SQLite con fixtures sintéticos | 29 pasos, 104 comprobaciones, 0 fallos. |
| Navegador con bundle P2 real | 17 pasos, 105 comprobaciones, 0 fallos. |
| Inspección visual | Cinco pantallas en escritorio/móvil; temas oscuro/claro y fuentes laterales. |
| Diferencias fuera del alcance | Sin cambios en backend, contratos, cálculos, datos, dependencias ni tokens de `style.css`. |

El recorrido final sintético, TypeScript y build cubren el código indicado. El
cliente y el recorrido real se ejecutaron antes del último ajuste de navegación:
se eliminó `id="lab"` para evitar que el hash desplazara la cabecera en móvil. Ese ajuste
se comprobó después con nueve verificaciones del recorrido sintético: las cinco
pantallas, entrada directa a `#lab` y atrás/adelante, manteniendo cabecera visible
y scroll del documento en cero. No se repitió la importación del corpus real por
ese cambio de presentación.

Se comprobaron estado conservado, teclado y foco del diálogo, Reset durante
solicitudes, citas/fuentes e informes literales, vigencia A/B, recuperación tras
reinicio, campañas y los casos BASS-II. Las advertencias científicas distintas
permanecen visibles; solo se agrupan ocurrencias del mismo mensaje asociadas a
registros identificados, con acceso al detalle de cada una.

Para repetir las verificaciones de cliente y navegador (Chromium ya instalado):

```powershell
. .\scripts\common.ps1
Invoke-ProjectNpm @('run', 'typecheck')
Invoke-ProjectNpm @('run', 'test:client')
Invoke-ProjectNpm @('run', 'build')
Invoke-ProjectNpm @('run', 'test:e2e:p6', '--', '--screenshots=work/ux-e2e-synthetic')
```

El recorrido real es opt-in y requiere la copia privada con SHA-256
`cb8b782fd73dbe4df0576b8047f3dea781a37d7c06c962ad2e978e607a00191d`:

```powershell
Invoke-ProjectNpm @('run', 'test:e2e:p6:bass', '--', '--bundle=C:\ruta\privada\bundle.json', '--screenshots=work/ux-e2e-real')
```

Las pruebas levantan sus servicios y bases temporales y los cierran al terminar;
no sustituyen la base de la demo abierta. Más detalle en el
[recorrido E2E](../apps/web/tests/e2e/README.md).

### Límites y siguiente decisión

Este es un experimento de UX pendiente de valoración por el equipo. No está
integrado en `main`. Las pruebas no amplían la validación científica del corpus:
P2 sigue marcado `scientific_unverified`, con conformidad descriptiva limitada a
los casos BASS-II documentados. El proveedor usado fue `demo`, sin llamadas a IA
externa. No se volvió a ejecutar la suite Python completa ni PostgreSQL para este
cambio de presentación; sus cifras históricas no se atribuyen al rediseño.
