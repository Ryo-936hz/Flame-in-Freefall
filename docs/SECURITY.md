# Seguridad y límites de confianza

El objetivo es una demo científica con una superficie de ataque acotada. Este documento define requisitos de implementación; no certifica que el producto esté listo para exposición pública.

## Secretos y proveedores

Claves solo en configuración del servidor. El futuro archivo de ejemplo deberá contener únicamente nombres y valores ficticios. No poner secretos en variables `VITE_*`, prompts versionados, fixtures, commits o logs. Revisar el diff antes de publicar.

El proveedor externo recibe únicamente el contexto necesario. Antes de enviar un ZIP o corpus no público, comprobar derechos y autorización. No asumir que todo archivo local es redistribuible por mencionar NASA.

## Contenido recuperado

Documentos, extractos y respuestas del modelo son datos no fiables. No seguir instrucciones incluidas dentro de ellos. No ejecutar código, comandos ni SQL generado libremente. Validar tipos de panel, argumentos, longitudes y referencias.

## Archivos y ZIP

Validar nombres y rutas antes de extraer. Rechazar rutas absolutas, escapes con `..`, enlaces y tamaños desproporcionados. Trabajar en un directorio explícito. Mantener originales y hashes. No ejecutar archivos del archivo comprimido.

## Red y fuentes

La selección de una evidencia no debe convertirse en un proxy que descargue cualquier URL proporcionada por un usuario. Si se implementa descarga, controlar esquemas, redirecciones, tamaño, tiempo y destinos. Los enlaces a fuentes deben representarse como datos, con protocolos permitidos.

## Aplicación

El entorno local limita CORS a los orígenes configurados. CORS no es autenticación. Antes de exponer una API con llamadas de pago, añadir control de acceso, límites de uso, presupuesto y observabilidad. No publicar claves ni una API de coste ilimitado durante la demo.

## Registro

Registrar identificador de petición, duración, modo, estado y errores sanitizados. Evitar cuerpo completo de documentos, claves y datos personales. La explicación de la IA no necesita revelar razonamiento interno; basta con acciones, evidencias y resultados.

## Protección del trabajo del equipo

Ramas por tarea, revisiones y contratos generados. No reescribir `main`, eliminar trabajo ajeno ni cambiar permisos del repositorio como parte de una tarea ordinaria. La lista de colaboradores y las protecciones se configuran por el propietario del repositorio.

## Antes de enseñar o desplegar

Revisar secretos, modos de datos, citas, errores, configuración de proveedor y alcance de acceso. Una reproducción preparada se identifica como tal. No afirmar validación científica o de seguridad que no se haya realizado.
