# P5 Evidence Canvas e interfaz científica

## Cuándo comenzar

Este paquete se ejecuta después de crear y verificar una sola base común mediante el [prompt maestro](../LOCAL_CODEX_MASTER_PROMPT.md) y [BUILD_ORDER](../BUILD_ORDER.md). Antes de ese hito, P1 coordina la inspección local y el esqueleto; el resto puede revisar datos, criterios y diseño sin duplicar contratos ni infraestructura. Los criterios siguientes son objetivos futuros, no capacidades entregadas.

## Resultado del puesto

La siguiente fase preparará conexiones, no el frontend final. La dirección Anduril se aplica con sobriedad y sin copiar marcas o introducir escenas militares ajenas al reto.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después DESIGN_ANDURIL, PRODUCT, CONTRACTS, ACCEPTANCE_CRITERIA y el cliente API real.

## Área de trabajo

- `apps/web/src/ excepto features/mission-lab/ reservado a P6`
- `apps/web/ configuración coordinada con P1`
- `pruebas de cliente y Evidence Canvas`
- `tokens y componentes compartidos`

Las rutas futuras son fronteras de responsabilidad, no funciones ya implementadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Cuando exista la interfaz técnica, partir de ella y construir el marco visual siguiendo DESIGN_ANDURIL.
2. Crear gráfico, tabla, ranking y visor de evidencia enlazados por identidad.
3. Consumir el cliente tipado y mostrar estados de error, vacío y parcial.
4. Permitir que acciones de la IA modifiquen componentes registrados.
5. Coordinar con P6 el punto de montaje de Mission Lab y el sistema de estilos.

## Criterios de aceptación

- Un punto, fila y fuente corresponden a la misma observación/ensayo.
- Se ven unidades, cobertura y razones de ranking.
- Las marcas sintéticas e ilustrativas no desaparecen al cambiar de panel.
- El chat no desplaza permanentemente la comparación fuera de pantalla.
- El frontend no contiene secretos ni réplicas manuales de contratos.

## Dependencias y revisión

P6 revisa el recorrido; P3 revisa semántica de gráficos; P1 revisa conexión y generación de tipos.

Cuando la base exista, empieza con los contratos y fixtures verificados en ese commit. Un bloqueo de datos reales no impide implementar tipos, estados vacíos o pruebas con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `feat/p5-descripcion` y el prompt [de inicio](../prompts/P5_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
