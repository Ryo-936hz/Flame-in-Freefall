# P5 Evidence Canvas e interfaz científica

## Cuándo comenzar

La base está integrada en `main`. Sigue [TEAM_START](../TEAM_START.md): crea una
rama nueva desde `origin/main` o conserva e integra tu rama existente mediante merge.
Comprueba el SHA común y la tarea actual en [TEAM_HANDOFF](../TEAM_HANDOFF.md).
Este paquete conserva las fronteras, objetivos y tareas del primer reparto; no
ordena rehacer funciones existentes. Consulta [IMPLEMENTATION_STATUS](../IMPLEMENTATION_STATUS.md)
y [VERIFICATION](../VERIFICATION.md) y acuerda el incremento concreto antes de editar.
El prompt maestro y BUILD_ORDER distinguen el proceso histórico de la continuidad vigente.

## Resultado del puesto

El arnés técnico y el cliente tipado ya conectan la base. La siguiente tarea construye Evidence Canvas sobre ellos, según el incremento visual acordado por el equipo. La dirección Anduril se aplica con sobriedad y sin copiar marcas o introducir escenas militares ajenas al reto.

Este puesto se asigna a una persona del equipo. No presupone un usuario GitHub ni habilita a enviar mensajes en su nombre.

## Contexto que debe leer tu asistente

AGENTS y START_HERE; después DESIGN_ANDURIL, PRODUCT, CONTRACTS, ACCEPTANCE_CRITERIA y el cliente API real.

## Área de trabajo

- `apps/web/src/ excepto features/mission-lab/ reservado a P6`
- `apps/web/ configuración coordinada con P1`
- `pruebas de cliente y Evidence Canvas`
- `tokens y componentes compartidos`

Estas son fronteras de responsabilidad. Parte del código existente y consulta REPOSITORY_LAYOUT para las rutas todavía preparadas. No modificar contratos, migraciones, dependencias compartidas o archivos de otra persona sin coordinación. P1 mantiene `packages/contracts` generado; ningún puesto lo edita a mano.

## Tareas en orden

1. Partir de la interfaz técnica existente y construir el incremento del marco visual acordado siguiendo DESIGN_ANDURIL.
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

Empieza con los contratos y fixtures de la referencia común comprobada. Un bloqueo de datos reales no impide trabajar en estados vacíos o conexiones con fixtures identificados. No conviertas esa independencia en afirmación de validación científica.

## Primera entrega pequeña

Escoge un resultado de la lista que pueda integrarse completo: comportamiento, prueba y documentación. Describe qué falta para el siguiente incremento. Usa una rama `codex/p5-descripcion` y el prompt [de inicio](../prompts/P5_START.md).

## Relevo

Entrega rama, commit, archivos, comandos ejecutados, resultado y siguiente paso mediante [HANDOFF_TEMPLATE](../prompts/HANDOFF_TEMPLATE.md). Registra si trabajaste con fixtures, datos reales o un proveedor externo. No incluyas credenciales.
