# P1 Integración API infraestructura y contratos

## Cuándo comenzar

Este paquete se ejecuta después de crear y verificar una sola base común mediante el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Antes de ese hito, P1 coordina la inspección local y el esqueleto; el resto puede revisar datos, criterios y diseño sin duplicar contratos ni infraestructura. Los criterios siguientes son objetivos futuros, no capacidades entregadas.

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

Las rutas futuras son fronteras de responsabilidad, no funciones ya implementadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

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

Cuando la base exista, empieza con los contratos y fixtures verificados en ese commit. Un bloqueo de datos reales no impide implementar tipos, estados vacíos o pruebas con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `feat/p1-descripcion` y el prompt [de inicio](../prompts/P1_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
