# ADR 0011 — Despliegue local con Docker

- Fecha: 15 de noviembre de 2026.
- Estado: aceptado a petición del usuario («dockeriza el proyecto para Linux y Windows»).
- Base: `main` `88f1922`.

## Problema

El arranque documentado depende de PowerShell (`scripts/*.ps1`) y de instalar
Python, uv y Node en cada equipo. En Linux hay que traducir los scripts a mano.
`compose.yaml` solo contenía un PostgreSQL opcional no verificado.

## Alternativas

1. Mantener solo los scripts nativos: sin coste nuevo, pero distinto en cada sistema.
2. Servir la web compilada desde FastAPI: un contenedor, pero cambia el código de la API.
3. **Dos imágenes desde un Dockerfile multietapa** (API Python y web estática en
   nginx con el mismo proxy que Vite), orquestadas con Docker Compose.

## Decisión

Se adopta la alternativa 3. No cambia código ni contratos de la aplicación.

- `api`: `python:3.12-slim` + uv 0.9.5 (misma versión que `setup.ps1`), `uv sync --locked --no-dev`.
  Usuario sin privilegios. Base SQLite en el volumen `flamelab-work`.
- `web`: `npm ci` + `vite build` en `node:24-slim`; se sirve con `nginx:1.27-alpine`, que
  redirige `/api`, `/openapi.json` y `/docs` a la API, como `apps/web/vite.config.ts`.
- `FLAMELAB_DATA` elige el corpus, cada uno en su propia base: `catalog` (por defecto,
  `psi_metadata.json`, importación idempotente sin `--replace`), `demo` (fixture
  sintético) o `empty`. Así no se mezclan datos sintéticos con el catálogo real.
- Solo se publica `127.0.0.1:8080`. Las claves de IA llegan por un `.env` local opcional,
  nunca en la imagen (`.dockerignore` excluye `.env`, `work/`, bases y binarios).
- PostgreSQL pasa al perfil `postgres`; sigue sin verificarse.
- Ampliación (15-11-2026, «añade la carga de datos»): modo `bundle`. La carpeta
  `data/local/` (o `FLAMELAB_IMPORT_DIR`) se monta en solo lectura en `/app/import` y se
  importa `FLAMELAB_BUNDLE`: un `bundle.json` o el ZIP del paquete P2, del que solo se
  leen `bundle.json` y `SHA256SUMS` en memoria (sin extraer, límite de 20 MiB, nombres
  sin rutas) y se exige que el hash coincida. Cada contenido usa su base
  `bundle-<sha256[:12]>.db`, así que nunca se sustituye un corpus ni se usa `--replace`.
  La extracción desde los originales (`extract-nasa`, requiere PyMuPDF) sigue fuera
  de la imagen.

## Consecuencias

- Mismo comando en Linux y en Windows (Docker Desktop con WSL 2).
- Nuevas dependencias de despliegue (no de la aplicación): imágenes base de Docker
  Hub/GHCR fijadas por etiqueta. Actualizarlas es una decisión explícita.
- Los scripts nativos y el E2E siguen siendo la vía de desarrollo y verificación;
  Docker no sustituye `check.ps1` ni las pruebas.
- Verificado solo en Linux (Docker 29.9.2, Compose v5.6.1). Windows pendiente.

## Rutas

`Dockerfile`, `.dockerignore`, `.gitignore`, `compose.yaml`, `docker/api-entrypoint.py`, `data/local/README.md`,
`docker/nginx.conf`, `README.md`, `docs/DESPLIEGUE_LOCAL_LINUX.md`.
