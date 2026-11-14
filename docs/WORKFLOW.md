# Trabajo de seis personas con asistentes

## Base común

Para el incremento actual P1/P3/P4 consultar [INTEGRATION_P134](INTEGRATION_P134.md).
La referencia de primera incorporación descrita abajo es histórica; los avances
se integran desde la entrega vigente indicada en TEAM_HANDOFF.

Cada persona utiliza su propio clon y una rama de tarea. `main` integra el código
compartido en GitHub. Los seis puestos crean su primera rama desde
`origin/codex/team-start-v1`, no desde un `main` que puede haber avanzado. Esa rama
de referencia se conserva sin mover por acuerdo del equipo; no se afirma que exista
una regla técnica de protección. [TEAM_START](TEAM_START.md) contiene los comandos.
Las suscripciones y los chats no comparten memoria: el repositorio es el contexto común.

El arranque siguió [BUILD_ORDER](BUILD_ORDER.md). P1 mantiene el contrato y el
recorrido común; las PR pequeñas se revisan e integran en `main`. El bundle local
anterior se conserva como archivo histórico. La matriz de rutas está en
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

Las carpetas y sus propietarios se detallan en REPOSITORY_LAYOUT y en cada paquete. Las rutas del frontend final y evaluación científica todavía pueden ser fronteras previstas; leer su estado antes de crear código.

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
