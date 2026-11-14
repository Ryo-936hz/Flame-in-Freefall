# Orden de construcción de la base compartida

Este documento conserva el **orden histórico** de construcción del esqueleto local.
El equipo completó esa base y añadió P1/P3/P4, P2 y la interfaz P5/P6, ahora
integrados en `main` mediante PR #3 (`0b732cb`). La continuidad parte de
`origin/main`, según [TEAM_HANDOFF](TEAM_HANDOFF.md).

Los hitos, tareas y restricciones de frontend de abajo pertenecen a aquella fase;
no son pendientes actuales ni una instrucción para reconstruir o quitar funciones.
[IMPLEMENTATION_STATUS](IMPLEMENTATION_STATUS.md) y [VERIFICATION](VERIFICATION.md)
registran el alcance y las ejecuciones por SHA. El catálogo completo P2 y la
conformidad descriptiva de diez puntos BASS-II son posteriores a la base inicial.

## Resultado buscado en la fase inicial

Una persona con un clon limpio puede preparar el entorno, arrancar API y arnés técnico sin clave de IA, enviar una investigación con filtros explícitos, comparar ensayos sintéticos claramente etiquetados, abrir su evidencia y recuperar el informe persistido. Ese recorrido establece las conexiones que las seis personas ampliarán después.

El arnés sirve para comprobar integración. La estética y las experiencias finales de Evidence Canvas y Mission Lab se desarrollarán más tarde, con [DESIGN_ANDURIL](DESIGN_ANDURIL.md) como dirección.

## Hitos y condiciones de salida conservados

| Hito | Trabajo | Condición para avanzar | Coordinación |
|---|---|---|---|
| 0. Inspección local | Revisar NASA, Documents, ZIP y estado de GitHub; copiar documentación sin sobrescrituras. | Inventario con archivos, fuentes, variables e incógnitas. No se ha perdido trabajo previo. | P1 + P2 |
| 1. Contrato revisado | Contrastar CONTRACT_MODELS con los datos; resolver unidades, identidad, ausencias y procedencia. | Un solo modelo ejecutable coherente y decisiones registradas; casos sintéticos definidos. | P1 + P2 + P3 |
| 2. Base ejecutable | Crear monorepo, entorno fijado, API, salud, configuración y pruebas iniciales. | API arranca sin claves; errores de configuración son explícitos; instalación documentada. | P1 |
| 3. Datos y almacenamiento | Implementar validación, repositorio SQLite, ingesta local y fixtures identificados. | Importación idempotente; referencias válidas; datos sintéticos diferenciados de catálogo NASA. | P1 + P2 |
| 4. Ciencia conectada | Implementar perfil, elegibilidad, ranking y comparación sobre el mismo contrato. | Casos de ausencia, incompatibilidad y unidad independiente pasan; métricas y ejes mantienen significado. | P3 + P1 |
| 5. Investigación | Conectar herramientas en flujo explícito y modo demo determinista; persistir expediente. | Respuesta con análisis, citas y límites; estado insuficiente cuando corresponde; informe recuperable. | P4 + P1 |
| 6. Cliente técnico | Generar OpenAPI/tipos, cliente HTTP y arnés de integración. | Navegador consume salud, investigación, escenarios y evidencia con estados de error; no hay tipos copiados a mano. | P5 + P1 |
| 7. Base compartible | Añadir scripts Windows, CI y prueba HTTP; revisar instrucciones desde instalación limpia. | Se registra commit, comandos, resultados y pendientes; contrato sin deriva; modos visibles. | P1 + P6 |
| 8. Trabajo paralelo | Asignar personas, ramas e incrementos utilizando los seis paquetes. | Todos parten del mismo commit de base y conocen propietarios/revisores. | Equipo |

Las consultas y respuestas iniciales se ajustan a [CONTRACTS](CONTRACTS.md). No se necesitan agentes autónomos, inferencia de restricciones verbales, un índice vectorial poblado, CFD ni frontend final para cerrar el hito 7. Estas ampliaciones deben aportar una mejora observable después de la base.

## Coordinación usada antes del hito 7

P2 puede revisar archivos y fuentes; P3 puede definir casos científicos y consultas etiquetadas; P4 puede preparar evaluación y catálogo de herramientas; P5 puede revisar accesibilidad y semántica visual; P6 puede construir el guion. P1 integra el contrato y la base. Ninguno crea un segundo backend o esquema incompatible.

En aquella primera ronda la base se limitó al catálogo real de metadatos y al
recorrido numérico sintético; BASS-II requería una entrega P2/P3 posterior. Esa
entrega ya existe, con alcance y límites en [P2_DEMO](handoffs/P2_DEMO.md). No es
necesario reconstruir seis esqueletos ni usar el reparto histórico como una lista
de tareas todavía pendientes.

## Historial de la primera ronda después del reparto

| Puesto | Primer incremento sugerido | Dependencia que debe consumir |
|---|---|---|
| P1 | Instalación reproducible y recorrido integrado con errores observables. | Entregas pequeñas de los otros puestos. |
| P2 | Una serie real trazable y un informe de calidad. | Contrato e importador de la base. |
| P3 | Ranking explicable y comparación de una serie compatible. | Corpus validado por P2; fixtures como respaldo de software. |
| P4 | Respuesta con evidencia pertinente y acciones visuales tipadas. | Herramientas científicas y catálogo de paneles. |
| P5 | Tabla, gráfico, ranking y fuente conectados por identidad. | Cliente tipado y acciones visuales acordadas. |
| P6 | Escenarios A/B y guion completo con límites explícitos. | Comparación, investigación y componentes compartidos. |

## Criterio histórico de cierre del esqueleto

- El recorrido completo funciona en modo demo sin credenciales y conserva las etiquetas sintéticas.
- Contratos, API y cliente mantienen los mismos campos; se detecta deriva de generados.
- Persistencia y errores se prueban en SQLite; PostgreSQL y proveedor externo se declaran probados solo si realmente se ejecutan.
- Los datos locales inspeccionados tienen inventario y decisiones; no es obligatorio fingir un corpus real si el ZIP no lo permite.
- El README del repositorio contiene comandos reales, requisitos y resultados reproducibles.
- IMPLEMENTATION_STATUS enumera capacidades implementadas, preparadas y pendientes con evidencia.
- No se ha construido el frontend de producto ni publicado el ZIP por accidente.
- P1 entrega commit y relevo que permiten iniciar los seis puestos sin reconstruir contexto.

## Si aparece un bloqueo

Un ZIP sin tablas adecuadas cambia la estrategia de ingesta y selección de caso, no autoriza inventar cifras. La falta de credenciales mantiene el modo demo. Una dependencia incompatible obliga a revisar versiones y registrar la decisión. Una pregunta científica sin evidencia debe producir un resultado insuficiente. La siguiente petición del usuario siempre prevalece sobre este orden propuesto.
