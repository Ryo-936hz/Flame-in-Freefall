# Catálogo real, sin observaciones importadas

`psi_metadata.json` es un DatasetBundle válido con 24 estudios del ZIP local y 24
referencias documentales ISA. Todos los estudios son `metadata_only`; no contiene
ensayos ni observaciones. Las evidencias son `reviewed=false`: comprobar un título
y DOI no demuestra el soporte de una conclusión científica.

`zip_inventory.json` conserva el inventario revisado del archivo local: hashes,
miembros, tipos, cabeceras CSV, recuentos y duplicados. La licencia de los originales
sigue pendiente. No contiene los PDFs, DOCs, ZIP originales, contactos ISA ni el
texto completo de los informes.

La importación reemplaza el corpus activo completo, solo con autorización explícita
mediante `--replace` si ya existe otro. No mezclar este catálogo con los fixtures para
atribuir cifras sintéticas a estudios reales.

```powershell
.\.venv\Scripts\python.exe -m flamelab.data.cli validate data/catalog/psi_metadata.json
.\.venv\Scripts\python.exe -m flamelab.data.cli import data/catalog/psi_metadata.json --database-url sqlite:///work/catalog.db
```

El inventario binario se reproduce sin extraer contenido:

```powershell
.\.venv\Scripts\python.exe -m flamelab.data.cli inventory ..\Documents\datasets_lujan.zip --output work/zip_inventory.json
```

La CLI reproduce nombres, hashes y seguridad; el informe revisado añade interpretación
de tablas y metadatos. Consultar `docs/DATA_INSPECTION.md` para los localizadores y la
serie BASS-II candidata.
