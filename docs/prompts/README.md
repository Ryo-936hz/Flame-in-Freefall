# Prompts para terminar la demo

Los seis prompts contienen ya tarea, rutas permitidas, primer incremento,
dependencias, criterios de aceptación y verificaciones. Copiar el bloque completo
del puesto en Codex con el clon abierto; no hace falta inventar una tarea adicional.

- [P1 — API, contratos e integración](P1_START.md)
- [P2 — Datos reales y procedencia](P2_START.md)
- [P3 — Comparación y reglas científicas](P3_START.md)
- [P4 — Planificación de IA y evidencia](P4_START.md)
- [P5 — Evidence Canvas e interfaz común](P5_START.md)
- [P6 — Mission Lab, informes y demo](P6_START.md)

Consultar primero [propiedad de archivos y coordinación](DEMO_COORDINATION.md).
La base común es `422f6b03f410c6ac049b699e13fc204a3af67743`;
[TEAM_START](../TEAM_START.md) explica cómo clonar y arrancar.
Esta planificación no afirma que las tareas ya estén implementadas.

## Contexto de construcción y continuidad

Primero, una conversación local coordinada por P1 utiliza el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md), inspecciona el ZIP y construye una base común según [BUILD_ORDER](../BUILD_ORDER.md). Los seis prompts de puesto se usan **después** de que exista un commit de base verificado. No sirven para producir seis esqueletos independientes.

Después de ese hito, cada persona inicia su asistente con el prompt de su puesto y una tarea concreta. Los prompts apuntan al repositorio para evitar copiar una versión desactualizada del plan. No contienen credenciales ni sustituyen contratos.

1. Elegir P1–P6 y leer su paquete.
2. Copiar su prompt inicial.
3. Utilizar la tarea, rama y criterios definidos; registrar el SHA real del clon.
4. Pedir al asistente que inspeccione código y estado antes de editar.
5. Al cerrar, generar un relevo con [HANDOFF_TEMPLATE](HANDOFF_TEMPLATE.md).

Una nueva conversación no hereda automáticamente decisiones previas. El estado real del repositorio, el commit y el relevo hacen reproducible el contexto.
