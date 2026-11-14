# Ingesta de datos

## Estado actual e historia

El ZIP no fue accesible durante la preparación documental y se inspeccionó en la
fase local posterior. [DATA_INSPECTION](DATA_INSPECTION.md) conserva inventario,
hashes y límites. El archivo versionado `data/catalog/psi_metadata.json` contiene
24 estudios de metadatos; se distingue del **bundle completo P2** generado localmente.
Ese bundle reúne 24 estudios, 2.265 evidencias, 1.058 registros de ensayo/configuración
y 1.673 observaciones, con 1.283 valores conocidos. La demo inicial sigue siendo sintética.

Existen extractores específicos `extract-bass-table51` y `extract-nasa`, validación
y una importación transaccional e idempotente. El bundle P2 1.1.1 está preparado
para el guion BASS-II: diez puntos con conformidad descriptiva de P3, aviso M8 y
caso lunar sin filtro de velocidad. El resto conserva sus límites y el corpus
global permanece `scientific_unverified`.

Para **Windows**, seguir [DEMO](DEMO.md): importar el JSON del paquete en una base
dedicada con el Python de `.venv`; no hacen falta el extractor ni los originales
para importar ese bundle. [P2_NASA_24](P2_NASA_24.md) explica la regeneración con los
originales locales y [P2_DEMO](handoffs/P2_DEMO.md) identifica los hashes y condiciones
de uso. `inventory` inspecciona el ZIP sin extracción; no sustituye las verificaciones
previas requeridas al extraer un archivo.

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

Los comandos de inventario, extracción específica, validación e importación
existen y ofrecen `--help`. Las reglas por campaña implementadas y los límites
pendientes están en [P2_NASA_24](P2_NASA_24.md). No existe un extractor universal
PDF/LLM ni se incorporan automáticamente propuestas de modelos al corpus.

## Extensiones futuras de extracción

Estas orientaciones no describen funciones generales ya implementadas. Priorizar CSV/XLSX originales cuando existan. Para PDF digital, pdfplumber puede recuperar tablas y PyMuPDF permite localizar texto y regiones. Un LLM puede proponer relaciones condición–observación mediante JSON validado. Las propuestas pendientes no se convierten automáticamente en mediciones verificadas.

Si solo hay figuras, digitalizar de forma documentada o elegir otra magnitud. Conservar la precisión limitada y la escala de los ejes. Nunca reconstruir una tabla ausente inventando números coherentes con el dibujo.

## Informe de calidad

Registrar total de documentos, investigaciones, ensayos y observaciones; estados de ausencia por campo; unidades detectadas; conversiones; duplicados confirmados; discrepancias; datos rechazados y razones. Un rango inusual se revisa, no se elimina para mejorar el gráfico.

## Importación repetida

El mismo archivo o ensayo no debe duplicarse al repetir el proceso. La identidad se basa en fuente e identificación física, no solo en material/oxígeno/flujo. Dos réplicas genuinas con iguales condiciones se conservan.

## Criterio para utilizar datos en la demo

Los puntos mostrados tienen fuente comprobable, unidades claras, identidad de ensayo y marca de procedencia. Si todavía no se alcanza este criterio, se muestran fixtures como sintéticos y la interfaz indica que el corpus científico está pendiente.
