# Estrategia de pruebas

Los comandos ejecutables están en README y `scripts/check.ps1`. Este documento explica qué comprueba
cada nivel; [VERIFICATION](VERIFICATION.md) registra los comandos, versiones y resultados realmente
ejecutados. Una prueba aprobada no demuestra que el corpus científico sea correcto si solo utiliza fixtures.

## Estado

Existen pruebas Python de contratos, datos, ciencia, API, persistencia y proveedor simulado; el cliente tiene
pruebas TypeScript, verificación de tipos y compilación. La generación de OpenAPI/tipos y su comprobación
de deriva forman parte del check. SQLite se prueba localmente. PostgreSQL/pgvector, CI remoto y llamadas
reales a un proveedor no se declaran probados por tener configuración o mocks. La cifra final no se copia
aquí: consultar el registro único VERIFICATION.

## Niveles

| Nivel | Qué comprueba | Responsables |
|---|---|---|
| Contratos | Tipos, valores inválidos, esquemas y compatibilidad del cliente. | P1 + consumidores |
| Datos | Ausencias, unidades, identidades y procedencia. | P2 |
| Ciencia | Elegibilidad, ranking, cobertura y comparación. | P3 |
| IA | Herramientas, citas, errores y separación demo/proveedor. | P4 |
| Cliente | Tipado, estados y consumo de respuestas. | P5 |
| Recorrido | Pregunta, análisis, evidencia, escenario e informe. | P1 + P6 |

## Casos científicos de alto valor

- Cero observado permanece cero; ausencia permanece ausencia.
- Un campo crítico ausente no aparece como coincidencia perfecta.
- La cobertura se reduce cuando faltan condiciones pertinentes.
- Estudiar una variable permite que esa variable cambie mientras conserva las restricciones acordadas.
- Un ensayo incompatible no entra en una comparación cuantitativa sin explicación.
- Dos publicaciones sobre el mismo ensayo no duplican la muestra.
- Repeticiones dentro de un ensayo no se tratan como réplicas independientes.
- Un cambio de condición modifica la selección o expresa que faltan datos.
- Una investigación con valores Y pero sin ningún X conocido devuelve evidencia insuficiente.
- Fuentes de condiciones y observaciones se conservan en el ranking, y una cita no puede asociarse a otro ensayo seleccionado.

## Casos de integración

Arranque sin credenciales; salud de API; lectura de catálogo; ranking; comparación; investigación; apertura de evidencia; generación de la respuesta de informe; errores por identificadores inexistentes; respuesta cuando no hay candidatos. Comprobar persistencia solo en los motores realmente ejecutados.

Las regresiones de persistencia sustituyen un corpus incluso conservando su `dataset_id` y comprueban
que el expediente, informe y fuente histórica por `research_id` siguen usando el snapshot original. Los tests
de ZIP usan archivos fabricados para rutas inseguras, enlaces, alias y presupuestos de expansión; no ejecutan
contenido del ZIP real.

## Proveedor externo

Las pruebas automáticas no realizan llamadas de pago. Los dobles controlados cubren respuesta válida,
rechazo, timeout global, salida malformada y cita inventada o cruzada. Una prueba real del proveedor es
optativa, acotada y registrada por separado; no se ha ejecutado en esta entrega.

## Artefactos generados

Cuando cambia el contrato, regenerar OpenAPI/tipos y comprobar que no existe deriva. No modificar los generados para que una prueba pase. Revisar consumidor y productor en el mismo cambio.

## Validación manual de la demo

En esta base, cada cifra del recorrido remite a su fixture sintético y localizador, sin enlaces NASA que
pretendan respaldarla. Ejecutar la consulta conocida, cambiar un filtro, probar evidencia insuficiente y revisar
etiquetas de datos/modo. Antes de incorporar una serie real se deberá abrir la fuente original y revisar todos
los valores mostrados, unidades, identidad y localizador. Registrar ejecución y revisión humana por separado.

## Qué no afirmar

No escribir «PostgreSQL probado» por haber compilado SQL o añadido un contenedor. No escribir «IA validada» por aprobar un mock. No escribir «datos NASA verificados» por cargar una tabla sintética. Los informes distinguen ejecución real, simulación, revisión estática y pendiente.
