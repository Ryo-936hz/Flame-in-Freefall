# Fuentes autoalojadas

Subconjuntos latinos con licencia SIL Open Font License 1.1. Inter Tight y Geist
Mono proceden de `@fontsource-variable/inter-tight@5.3.0` y
`@fontsource-variable/geist-mono@5.3.0`. Se versionan los `.woff2` para no añadir
dependencias npm al lockfile (propiedad de P1); las licencias acompañan a cada archivo.

- `inter-tight-latin-wght-normal.woff2` — Inter Tight, texto de interfaz.
- `geist-mono-latin-wght-normal.woff2` — Geist Mono, identificadores, unidades y cifras.
- `bricolage-grotesque-latin-600.woff2` — Bricolage Grotesque 600, titulares de portada. Subconjunto de Google Fonts.

Si P1 prefiere gestionarlas como dependencias, sustituir estos archivos por los
paquetes y conservar la misma familia en `src/style.css`.
