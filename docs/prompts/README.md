# Prompts y continuidad

Primero, una conversación local coordinada por P1 utiliza el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md), inspecciona el ZIP y construye una base común según [BUILD_ORDER](../BUILD_ORDER.md). Los seis prompts de puesto se usan **después** de que exista un commit de base verificado. No sirven para producir seis esqueletos independientes.

Después de ese hito, cada persona inicia su asistente con el prompt de su puesto y una tarea concreta. Los prompts apuntan al repositorio para evitar copiar una versión desactualizada del plan. No contienen credenciales ni sustituyen contratos.

1. Elegir P1–P6 y leer su paquete.
2. Copiar su prompt inicial.
3. Añadir rama, objetivo y criterio de aceptación.
4. Pedir al asistente que inspeccione código y estado antes de editar.
5. Al cerrar, generar un relevo con [HANDOFF_TEMPLATE](HANDOFF_TEMPLATE.md).

Una nueva conversación no hereda automáticamente decisiones previas. El estado real del repositorio, el commit y el relevo hacen reproducible el contexto.
