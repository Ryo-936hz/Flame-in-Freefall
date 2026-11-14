# Trabajo de seis personas con asistentes

## Base común

La base vigente es **`origin/main`**, que incluye la PR #3 fusionada mediante
`0b732cb` y la integración de P2. [TEAM_HANDOFF](TEAM_HANDOFF.md) identifica el
incremento actual; [DEMO](DEMO.md) describe el recorrido y [VERIFICATION](VERIFICATION.md)
registra las pruebas por SHA. El cierre adicional P2 está implementado y verificado
localmente en `raul`, código `20aab80404fc2f0fc188d718cac47d0d4bf31d54`, entregado mediante la PR #4 sobre `main`. [INTEGRATION_P2_MAIN](INTEGRATION_P2_MAIN.md) distingue ese
incremento de la PR #3 ya fusionada y de las pruebas históricas.

Cada persona utiliza su propio clon y rama de tarea. Una rama nueva parte de
`origin/main`; antes de trabajar juntos se acuerda y anota el SHA común. Una rama
existente conserva sus cambios y hace merge de `origin/main`, resolviendo conflictos
con sus responsables. [TEAM_START](TEAM_START.md) contiene los comandos.
Las suscripciones y los chats no comparten memoria: el repositorio es el contexto común.

`codex/team-start-v1` y las etiquetas P6 permanecen congeladas como historia.
[BUILD_ORDER](BUILD_ORDER.md) conserva la construcción inicial y
[INTEGRATION_P134](INTEGRATION_P134.md) el cierre anterior del backend. Ninguna
de esas referencias exige deshacer avances. P1 mantiene el contrato y el recorrido
común; las PR se revisan e integran en `main`. La matriz de rutas está en
[REPOSITORY_LAYOUT](REPOSITORY_LAYOUT.md).

## Inicio de una tarea

1. Leer AGENTS, START_HERE, estado y paquete asignado.
2. Comprobar `git status` y preservar trabajo local.
3. Incorporar de forma segura la referencia común indicada en TEAM_HANDOFF y crear una rama como `codex/p3-ranking-explicaciones`.
4. Dar al asistente el prompt de su puesto y una tarea concreta con criterio de aceptación.
5. Identificar los archivos propios, compartidos y consumidores antes de editar.

Los nombres de ramas son ejemplos. No crear seis ramas vacías para simular avance ni mezclar todo el trabajo en una sola rama compartida.

## Fronteras

| Cambio | Quién lo coordina | Revisión mínima |
|---|---|---|
| Contrato, endpoint o migración | P1 | Responsable consumidor y responsable científico si aplica. |
| Ingesta y normalización | P2 | P3. |
| Ranking y estadísticas | P3 | P2 y P4 si cambia salida de herramienta. |
| IA y prompts | P4 | P3 para afirmaciones y P5 para acciones visuales. |
| Evidence Canvas y marco visual | P5 | P6 y P1 para contratos. |
| Mission Lab e informe/demo | P6 | P5 y P3. |

Las carpetas y sus propietarios se detallan en REPOSITORY_LAYOUT y en cada paquete.
Evidence Canvas, Mission Lab y las evaluaciones ya tienen implementación; comprobar
el árbol y el estado antes de añadir o modificar código. Las tareas del primer
reparto delimitan áreas, no constituyen una orden de reimplementar lo terminado.

## Cambios compartidos

Antes de cambiar un campo: describir motivo, consumidores afectados, compatibilidad y migración. P1 integra el cambio de contrato y publica el artefacto generado. Los demás actualizan sus ramas después. No mantener seis copias del mismo tipo de datos.

## Entrega

Una PR pequeña por resultado verificable. Describir comportamiento, pruebas ejecutadas, datos/modos usados, cambios de contrato y pendientes. No declarar que las pruebas pasan si solo se razonó sobre ellas. Revisar el diff completo y buscar secretos.

No solicitar aprobación para cada edición reversible dentro del área ya asignada. Sí coordinar cambios que alteren contratos, datos compartidos o alcance de otra persona. No publicar, mergear o cambiar permisos en nombre de otra persona sin el mandato del equipo.

## Integración continua

P1 mantiene el recorrido mínimo funcionando. Se integran incrementos completos: un endpoint con su contrato y prueba, o un gráfico con su consumidor. No dejar toda la integración para la presentación. P6 verifica periódicamente el guion con la versión integrada.

## Relevo y nuevo chat

Utilizar [HANDOFF_TEMPLATE](prompts/HANDOFF_TEMPLATE.md). Incluye rama/commit, archivos modificados, decisión relevante, pruebas y siguiente paso. El nuevo asistente debe leer el estado real, no confiar únicamente en el resumen.

## Conflictos

No resolver un conflicto aceptando todo un lado sin leerlo. Identificar el responsable, conservar ambos comportamientos necesarios y volver a ejecutar las pruebas afectadas. No utilizar force push en `main` ni borrar cambios ajenos para facilitar el merge.
