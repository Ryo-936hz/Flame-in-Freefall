# Ask SI y búsqueda — toma M13

Rama de grabación: `raul`. El caso se resuelve mediante una respuesta local fija
con valores publicados; no llama a Qwen ni presenta una inferencia de un modelo.
Las demás preguntas conservan el recorrido habitual de la API. No se modifica main.

## Recorrido para el vídeo

1. Abrir `http://127.0.0.1:5173/#/dashboard/chat`.
2. Pulsar la pregunta sugerida o escribir:
   **What was the flame spread rate in each segment of BAS-II M13?**
3. También se puede pegar esa pregunta en la búsqueda superior (Ctrl+K) y abrir
   el resultado de Research questions. Admite `BASS-II`, mayúsculas/minúsculas,
   espacios repetidos y puntuación final. Al seleccionar abre la respuesta en Ask SI.
4. La tabla muestra segmentos 1/2/3: tasas 0.047/0.035/0.033 mm/s y flujos 6/5/4 cm/s.
5. Sources (3) abre los registros del corpus activo; el enlace NASA abre la
   publicación. Reset limpia la conversación para repetir la toma.

Fuente: NASA/TM-20210011385, Tabla 5.1, M13, PDF p.65 / impresa p.57.
Los tres registros corresponden a la muestra 169m y no son réplicas independientes.
Se conserva el orden publicado, sin atribuirlo a tiempo ni establecer causalidad.
Los valores se cotejaron con los tres registros M13 del bundle P2 local; el tercer
segmento a 4 cm/s no forma parte del dictamen limitado a los casos 5/6 cm/s.
No se amplía aquí la validación científica del corpus.

Implementación: `apps/web/src/lib/m13Reference.ts` y tabla en `ChatPanel.tsx`;
`search.ts`, `CommandPalette.tsx` y el host conectan la búsqueda con Ask SI.
La fuente opcional se obtiene realmente de la API: si no está importada, se
conserva su error normal; el enlace a la publicación está siempre disponible.

Verificación local: TypeScript y build correctos, 86 pruebas de cliente aprobadas.
Navegador: sugerencia Ask SI, tres valores exactos, ausencia de llamadas a modelo
para esta pregunta, fuente real del segmento 3 con HTTP 200, búsqueda con la
variante BASS-II, reset, móvil 390 px sin desbordamiento y sin errores JavaScript.
Se conserva el aviso Vite de tamaño del bundle (aprox. 503.82 kB minificado).