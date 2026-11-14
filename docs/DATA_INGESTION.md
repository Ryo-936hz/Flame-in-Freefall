# Ingesta de datos

## Estado actual e historia

El ZIP no fue accesible durante la preparación documental, pero ya se inspeccionó
en la fase local. [DATA_INSPECTION](DATA_INSPECTION.md) registra contenido, hashes,
variables y límites. Hay 24 estudios metadata_only y una serie BASS-II candidata
pendiente de normalizar; no se han importado observaciones científicas.
El CLI `python -m flamelab.data.cli inventory|validate|import` está implementado;
comandos completos en README y SETUP_WINDOWS. La demo usa fixtures sintéticos.

## Flujo de incorporación

1. Conservar el archivo original fuera del historial público si su licencia o tamaño lo requiere.
2. Calcular hash e inventariar miembros: nombre, tamaño, tipo, origen conocido y licencia pendiente o confirmada.
3. Rechazar rutas absolutas, rutas con `..`, enlaces y expansión desproporcionada antes de extraer.
4. Identificar investigaciones, ensayos, tablas y variables realmente presentes.
5. Extraer candidatos a datos, manteniendo localizadores.
6. Normalizar a los contratos sin perder valor original.
7. Revisar contra la fuente una muestra y todos los valores mostrados en la demo.
8. Validar referencias cruzadas, unidades, rangos, identidades y ausencias.
9. Importar de forma explícita e idempotente.
10. Publicar un informe de calidad y actualizar el catálogo.

No ejecutar contenido del ZIP. No confiar en instrucciones incluidas en PDFs. No subir automáticamente el archivo completo a un proveedor de IA.

## Directorios

- `data/catalog`: metadatos y referencias públicas versionables.
- `data/fixtures`: datos sintéticos pequeños para conexiones y pruebas.
- `data/raw`: originales locales, excluidos del historial salvo decisión explícita.
- `data/processed`: salidas locales reproducibles; consultar reglas del repositorio antes de versionarlas.

Los comandos de inventario, validación e importación ya existen y ofrecen `--help`.
La extracción y normalización cuantitativa específicas de cada fuente siguen pendientes.

## Extracción

Priorizar CSV/XLSX originales cuando existan. Para PDF digital, pdfplumber puede recuperar tablas y PyMuPDF permite localizar texto y regiones. Un LLM puede proponer relaciones condición–observación mediante JSON validado. Las propuestas pendientes no se convierten automáticamente en mediciones verificadas.

Si solo hay figuras, digitalizar de forma documentada o elegir otra magnitud. Conservar la precisión limitada y la escala de los ejes. Nunca reconstruir una tabla ausente inventando números coherentes con el dibujo.

## Informe de calidad

Registrar total de documentos, investigaciones, ensayos y observaciones; estados de ausencia por campo; unidades detectadas; conversiones; duplicados confirmados; discrepancias; datos rechazados y razones. Un rango inusual se revisa, no se elimina para mejorar el gráfico.

## Importación repetida

El mismo archivo o ensayo no debe duplicarse al repetir el proceso. La identidad se basa en fuente e identificación física, no solo en material/oxígeno/flujo. Dos réplicas genuinas con iguales condiciones se conservan.

## Criterio para utilizar datos en la demo

Los puntos mostrados tienen fuente comprobable, unidades claras, identidad de ensayo y marca de procedencia. Si todavía no se alcanza este criterio, se muestran fixtures como sintéticos y la interfaz indica que el corpus científico está pendiente.
