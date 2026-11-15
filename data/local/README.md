# Carpeta de importación local

Copiar aquí el corpus que se quiera cargar en Docker con `FLAMELAB_DATA=bundle`:
un `bundle.json` validable o el paquete interno `flamelab-p2-demo-v1.1.1.zip`
(se lee su `bundle.json` sin extraer y se coteja con su `SHA256SUMS`).

El contenido de esta carpeta no se versiona ni entra en la imagen; se monta en el
contenedor `api` en solo lectura. Ver «Cargar datos» en el [README](../../README.md).
