# syntax=docker/dockerfile:1
# FlameLab SI: imagen de la API (FastAPI) y de la web (Vite compilada servida por nginx).
# Ver docs/adr/0011-docker-local-deployment.md y docs/DESPLIEGUE_LOCAL_LINUX.md.

FROM ghcr.io/astral-sh/uv:0.9.5 AS uv

# ---------- API ----------
FROM python:3.12-slim AS api
COPY --from=uv /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
WORKDIR /app
# Dependencias primero (capa cacheable) desde uv.lock, sin grupo dev.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
# El proyecto se instala editable: config.py resuelve la raíz del repositorio (/app).
COPY alembic.ini README.md ./
COPY apps/api ./apps/api
COPY data ./data
COPY docker/api-entrypoint.py ./docker/api-entrypoint.py
RUN uv sync --locked --no-dev \
 && useradd --system --uid 10001 --home-dir /app flamelab \
 && mkdir -p /app/work && chown flamelab /app/work
USER flamelab
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=5 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=2)"]
ENTRYPOINT ["python", "/app/docker/api-entrypoint.py"]

# ---------- Web (build) ----------
FROM node:24-slim AS web-build
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --no-audit --no-fund
COPY packages ./packages
COPY data/catalog ./data/catalog
COPY apps/web ./apps/web
RUN npm run build

# ---------- Web (runtime) ----------
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
