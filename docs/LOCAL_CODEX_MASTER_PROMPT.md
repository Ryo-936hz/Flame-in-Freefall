# Contexto maestro — continuidad de la demo integrada

La base ya está implementada y publicada. La PR #3 se fusionó en `main` mediante
`0b732cb`; P2 de `lujan` forma parte de esa integración. Para trabajo nuevo se usa
`origin/main` y una rama propia. Las referencias iniciales y P6 son históricas.
La petición actual del usuario y [AGENTS](../AGENTS.md) prevalecen sobre el bloque
de construcción original conservado al final.

## Prompt vigente de continuidad

```text
Actúa como responsable de ingeniería e integración de FlameLab SI para Los TTS.
Trabaja en C:/Users/user/Desktop/NASA/Flame-in-Freefall conservando el trabajo existente.
Lee AGENTS.md, docs/START_HERE.md, IMPLEMENTATION_STATUS.md, TEAM_HANDOFF.md,
PRODUCT.md y DEMO.md; después los contratos y el paquete del área asignada.
Comprueba Git antes de editar. La base compartida es origin/main; no reinicies
desde team-start-v1 ni desde una etiqueta antigua. Integra cambios mediante merge.
P1/P3/P4, P2 y P6 están integrados; el host P5 es 9f54700. AskSI/CSS posteriores
siguen en la rama P5 y deben conservarse al actualizarla.
El cierre adicional P2 está implementado y verificado localmente en raul:
catálogo, métricas y contraste Saffire, código 20aab80404fc2f0fc188d718cac47d0d4bf31d54.
El cierre se entrega mediante la PR #4 sobre `main`; la PR3 anterior ya está fusionada.
Lee docs/INTEGRATION_P2_MAIN.md y VERIFICATION.md para su alcance y pruebas.
Comprueba el estado real antes de ampliar el trabajo; no rehagas funciones cerradas.
Usa contratos generados, fuentes trazables y modo demo sin credenciales.
Conserva las etiquetas sintético/preparado/ilustrativo y las limitaciones científicas.
No conviertas diez puntos BASS-II revisados descriptivamente en validación global,
ni mezcles cuantitativamente Saffire con BASS-II sin la revisión correspondiente.
```

## Historial: prompt de construcción inicial

El bloque siguiente documenta la fase anterior a la implementación. Sus referencias
a «solo documentación», repositorio vacío o frontend todavía reservado no describen
el estado actual y no autorizan deshacerlo. Se conserva para rastrear decisiones:

```text
Actúa como responsable de ingeniería e integración de FlameLab SI para Los TTS.
Somos seis personas y desarrollaremos sobre:
https://github.com/Ryo-936hz/Flame-in-Freefall

Lee primero AGENTS.md, docs/START_HERE.md, docs/IMPLEMENTATION_STATUS.md,
docs/PRODUCT.md, docs/FACTS_AND_UNKNOWNS.md, docs/CONTRACTS.md,
docs/CONTRACT_MODELS.md, docs/SETUP_WINDOWS.md, docs/BUILD_ORDER.md
y docs/REPOSITORY_LAYOUT.md. Después consulta el resto
según la tarea. Los documentos describen un diseño, no código ya publicado.

Carpeta de trabajo: C:/Users/user/Desktop/NASA.
Paquete documental sugerido: C:/Users/user/Desktop/NASA/FlameLab_Contexto.
Clon sugerido: C:/Users/user/Desktop/NASA/Flame-in-Freefall.
Hay un ZIP de datos en C:/Users/user/Desktop/NASA/Documents.
Conserva Documents intacto. Copia la documentación al clon tras comparar
archivos, sin pisar contenido previo ni asumir que el remoto sigue vacío.

Antes de programar:
1. Inspecciona la carpeta y conserva todos los archivos y cambios existentes.
2. Identifica e inventaría el ZIP sin ejecutar su contenido ni extraer rutas
   inseguras. Revisa qué investigaciones, variables, tablas y vídeos contiene.
3. Comprueba el repositorio remoto y cualquier clon local. Durante la
   planificación el remoto estaba vacío; no asumas que sigue igual.
4. Contrasta la estructura de los datos con los contratos propuestos y registra
   hechos, decisiones e incógnitas. No inventes observaciones NASA.

Después construye un esqueleto integrado con API Python/FastAPI, contratos
Pydantic, cliente React/TypeScript tipado, persistencia y herramientas científicas.
Debe existir un recorrido verificable que conecte datos, ranking, comparación,
coordinación de IA, evidencia e informe. Empieza con SQLite y modo demo explícito
sin clave; prepara el camino PostgreSQL/pgvector y un proveedor externo configurable.
Los fixtures sintéticos deben permanecer identificados de extremo a extremo.

No construyas todavía el frontend final. Prepara su estructura, cliente y un
arnés técnico. El producto futuro seguirá docs/DESIGN_ANDURIL.md: estación de
trabajo científica sobria, sin copiar marcas ni activos de Anduril.

Mantén la ambición de AI Scientist, Evidence Canvas, Mission Lab, diseño inverso
y siguientes experimentos. Distingue lo funcional de lo preparado e ilustrativo.
La primera comparación científica candidata usa una serie de BASS-II y Saffire
como contraste de escala/configuración, solo si los datos inspeccionados lo permiten.

Genera OpenAPI y tipos desde una autoridad de contrato. Implementa validación de
procedencia, estados de ausencia, unidades y referencias. Los cálculos son
herramientas verificables; la IA no inventa ni modifica sus resultados.

Organiza el trabajo para P1 integración, P2 datos, P3 ciencia, P4 IA,
P5 Evidence Canvas y P6 Mission Lab/demo. Primero crea y verifica una sola base
común; después habilita los seis trabajos paralelos sobre el mismo commit.
Usa los paquetes docs/team y acuerda
cambios compartidos. No crees seis versiones de contratos ni edites archivos
ajenos sin coordinación.

Crea instrucciones reproducibles para Windows, lockfiles, pruebas y CI según el
alcance. Ejecuta verificaciones reales y corrige problemas. Documenta exactamente
qué motores, proveedores y entornos se probaron. No declares una validación que
solo se haya razonado o simulado.

Conserva trabajo previo, no publiques secretos y no subas el ZIP sin revisar su
licencia y necesidad. Al terminar entrega rutas, archivos, comandos, resultados,
pendientes y reparto de tareas. No garantices ausencia absoluta de errores.
```

Si la siguiente petición del usuario cambia el alcance, esa petición prevalece y se actualiza el registro de decisiones antes de asumir tareas incompatibles.
