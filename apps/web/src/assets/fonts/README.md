# Fuentes autoalojadas

Subconjunto latino de tres familias con licencia SIL Open Font License 1.1, copiado
de los paquetes `@fontsource-variable/inter-tight@5.3.0`,
`@fontsource-variable/geist-mono@5.3.0` y `@fontsource-variable/geist@5.3.0`. Se versionan los `.woff2` para no añadir
dependencias npm al lockfile (propiedad de P1); las licencias acompañan a cada archivo.

- `inter-tight-latin-wght-normal.woff2` — Inter Tight, texto de interfaz.
- `geist-mono-latin-wght-normal.woff2` — Geist Mono, identificadores, unidades y cifras.
- `geist-latin-wght-normal.woff2` — Geist Sans (LICENSE-Geist.txt), nombre de la aplicación.

Si P1 prefiere gestionarlas como dependencias, sustituir estos archivos por los
paquetes y conservar la misma familia en `src/style.css`.
