# Estrategia de pruebas

Los comandos ejecutables están en README y `scripts/check.ps1`. Este documento explica qué comprueba
cada nivel; [VERIFICATION](VERIFICATION.md) registra los comandos, versiones y resultados realmente
ejecutados. Una prueba aprobada no demuestra que el corpus científico sea correcto si solo utiliza fixtures.

## Estado

Existen pruebas Python de contratos, datos, ciencia, API, persistencia y proveedor simulado; el cliente tiene
pruebas TypeScript, verificación de tipos y compilación. La generación de OpenAPI/tipos y su comprobación
de deriva forman parte del check. SQLite se prueba localmente; PostgreSQL 17 y el recorrido Chromium
sintético pasaron en CI del hito P6, con jobs Windows/Linux y PostgreSQL separados. La ejecución real
BASS-II es local y opt-in. Las pruebas nuevas se acreditan solo con su SHA y resultado; no se hereda
el éxito de un hito anterior. pgvector y llamadas reales a un proveedor siguen fuera de lo probado.
La cifra final no se copia aquí: consultar el registro único VERIFICATION.

## Niveles

| Nivel | Qué comprueba | Responsables |
|---|---|---|
| Contratos | Tipos, valores inválidos, esquemas y compatibilidad del cliente. | P1 + consumidores |
| Datos | Ausencias, unidades, identidades y procedencia. | P2 |
| Ciencia | Elegibilidad, ranking, cobertura y comparación. | P3 |
| IA | Herramientas, citas, errores y separación demo/proveedor. | P4 |
| Cliente | Tipado, estados y consumo de respuestas. | P5 |
| Recorrido | Pregunta, análisis, evidencia, escenario, informe, recuperación y respuestas tardías frente a Reset/nueva consulta. | P1 + P6 |

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

El recorrido predeterminado remite a su fixture sintético y localizadores, sin usar enlaces NASA para
respaldar cifras fabricadas. Ejecutar la consulta conocida, cambiar filtros/métrica, probar insuficiencia
y comprobar etiquetas, fuentes, informe y recuperación. El recorrido real BASS-II requiere el paquete
P2 1.1.1 y conserva la conformidad descriptiva limitada de P3; comprueba IDs, muestras, segmentos,
valores, fuentes y aviso M8. Registrar ejecución software y revisión de fuentes por separado.

La incorporación de nuevas cifras al guion exige revisar sus originales, unidades, identidad y localizador.
Navegar otros estudios del catálogo no los convierte en científicamente revisados. Saffire se presenta
como contraste documental; la tarjeta no introduce puntos ni prueba importación del corpus.
[DEMO](DEMO.md) explica ambos recorridos y sus requisitos. La prueba visual en viewport móvil
no acredita un lector de pantalla ni un teléfono físico.

## Qué no afirmar

No escribir «PostgreSQL probado» por haber compilado SQL o añadido un contenedor. No escribir «IA validada» por aprobar un mock. No escribir «datos NASA verificados» por cargar una tabla sintética. Los informes distinguen ejecución real, simulación, revisión estática y pendiente.
