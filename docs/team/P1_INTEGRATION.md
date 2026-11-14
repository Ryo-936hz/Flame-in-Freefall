# P1 Integración API infraestructura y contratos

## Cuándo comenzar

La base está integrada en `main`. Sigue [TEAM_START](../TEAM_START.md): crea una
rama nueva desde `origin/main` o conserva e integra tu rama existente mediante merge.
Comprueba el SHA común y la tarea actual en [TEAM_HANDOFF](../TEAM_HANDOFF.md).
Este paquete conserva las fronteras, objetivos y tareas del primer reparto; no
ordena rehacer funciones existentes. Consulta [IMPLEMENTATION_STATUS](../IMPLEMENTATION_STATUS.md)
y [VERIFICATION](../VERIFICATION.md) y acuerda el incremento concreto antes de editar.
El prompt maestro y BUILD_ORDER distinguen el proceso histórico de la continuidad vigente.

## Resultado del puesto

Integra primero una consulta y una respuesta completas. No construyas seis servicios independientes ni cambies el contrato para resolver una necesidad aislada sin revisar a sus consumidores.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después README, CONTRACTS, ARCHITECTURE, SECURITY, TESTING y los ADRs.

## Área de trabajo

- `apps/api/src/flamelab/domain/`
- `apps/api/src/flamelab/routes/`
- `apps/api/src/flamelab/storage/`
- `apps/api/src/flamelab/config.py`
- `apps/api/src/flamelab/main.py`
- `migraciones y configuración Alembic`
- `scripts/`
- `.github/workflows/`
- `configuración raíz y lockfiles`
- `packages/contracts/ generado`

Estas son fronteras de responsabilidad. Parte del código existente y consulta REPOSITORY_LAYOUT para las rutas todavía preparadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Mantener el recorrido local y el README reproducibles.
2. Coordinar contratos, rutas y migraciones. Regenerar OpenAPI y tipos del cliente cuando cambien.
3. Integrar entregas pequeñas sin romper los demás puestos.
4. Comprobar importación, persistencia y errores. Distinguir SQLite probado de PostgreSQL pendiente si corresponde.
5. Preparar instalación Windows segura que conserve la carpeta Documents y trabajo local.

## Criterios de aceptación

- Arranque desde un clon limpio en modo demostración.
- API y cliente consumen el mismo contrato; no hay deriva generada.
- El recorrido investigación–informe funciona con fixtures etiquetados.
- Configuración externa falla de forma explícita si faltan credenciales o modelo.
- CI y comandos locales reflejan las verificaciones que realmente se ejecutan.

## Dependencias y revisión

P5 revisa consumidores; P2/P3 revisan cambios de datos; P4 revisa configuración de proveedor.

Empieza con los contratos y fixtures de la referencia común comprobada. Un bloqueo de datos reales no impide trabajar en estados vacíos o conexiones con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `codex/p1-descripcion` y el prompt [de inicio](../prompts/P1_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
