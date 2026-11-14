# Preguntas abiertas

Esta lista es una cola de decisiones. No bloquea todo el proyecto: las tareas independientes continúan con contratos y fixtures explícitos.

Actualización local, 14 de noviembre de 2026: la inspección del ZIP y la construcción de la base ya se han
realizado. OQ-01 está resuelta como inventario, no como validación científica. Los pendientes siguientes se
apoyan en DATA_INSPECTION, ADR 0007 y TEAM_HANDOFF.

| ID | Pregunta | Responsable | Impacto y siguiente acción |
|---|---|---|---|
| OQ-01 resuelta | ¿Qué contiene el ZIP local? | P2 | DATA_INSPECTION y zip_inventory.json: 24 investigaciones, metadatos, CSV/PDF y ningún vídeo; originales conservados. |
| OQ-02 | ¿Cómo incorporar la tabla BASS-II candidata de forma revisada? | P2 + P3 | Resolver mesetas, oxígeno inicial/final, discrepancias de anchura y referencias; no está importada como observaciones. |
| OQ-03 | ¿Cuál es la unidad independiente? | P3 | Reconstruir muestras, ensayos y condiciones sucesivas. |
| OQ-04 | ¿Qué caso Saffire contrasta de forma útil? | P2 + P3 | Revisar material, escala, conducto y flujo. |
| OQ-05 | ¿Quién ocupa cada puesto P1–P6? | Equipo | Registrar nombre y usuario con acuerdo del equipo. |
| OQ-06 | ¿Qué modelo externo y presupuesto están disponibles? | P4 + P1 | Configurar acceso de servidor; no asumir beneficios por suscripción. |
| OQ-07 | ¿Cuál es el límite y horario local de presentación? | P6 | Confirmar con organización. |
| OQ-08 | ¿Regresión o vídeo como única ampliación cuantitativa? | P3 + P6 | Decidir tras revisar datos y calibración. |
| OQ-09 | ¿Qué archivos pueden redistribuirse? | P2 | Registrar licencia por fuente. |
| OQ-10 | ¿Se necesita exponer la demo fuera de localhost? | P1 | Definir acceso, coste y secretos antes de desplegar. |
| OQ-11 resuelta | Publicación autorizada por el usuario. | P1 + equipo | main y codex/team-start-v1 son referencias remotas; TEAM_START contiene instrucciones comunes. |
| OQ-12 | ¿Cuándo validar PostgreSQL/pgvector? | P1 | Ejecutar migraciones/recorrido del motor real; CI se consulta en Actions/VERIFICATION. |
| OQ-13 | ¿Cómo evaluar relevancia de ranking y semántica de afirmaciones? | P3 + P4 + P6 | Preparar consultas científicas independientes y revisión humana; las pruebas sintéticas solo validan reglas y conexiones. |

Al resolver una pregunta, anotar evidencia y decisión en DECISIONS o un ADR, y actualizar los documentos afectados. No borrar la historia de por qué se eligió una opción.
