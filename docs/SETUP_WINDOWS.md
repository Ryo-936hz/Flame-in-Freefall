# Preparación Windows

Clon: `C:\Users\user\Desktop\NASA\Flame-in-Freefall`. El paquete original estaba
en `NASA\FlameLab_Contexto_Codex\FlameLab_Contexto`; este y Documents se conservaron.
No se requieren Docker ni claves para la demo.

## Instalación y ejecución

1. Tener Git, Python 3.12 y Node >=22.12 con npm. Probados aquí: Python 3.12.14,
   Node 24.22.1, Git 2.55.0.windows.5 y PowerShell 7 en Windows.
2. Ejecutar `./scripts/setup.ps1` desde el clon. Respeta `uv.lock`, `package-lock.json`
   y `.env` existente; crea entorno `.venv` y configuración demo si faltan.
3. Ejecutar `./scripts/check.ps1`.
4. En dos terminales: `./scripts/dev-api.ps1` y `./scripts/dev-web.ps1`.
5. Abrir `http://127.0.0.1:5173`. Ctrl+C detiene cada servidor.

API 8000 y Vite 5173, solo loopback. El proxy de Vite dirige `/api`, `/docs` y
`/openapi.json` a 8000. `dev-api.ps1 -Port 8001` cambia API; en ese caso configurar
también proxy o `VITE_API_BASE_URL=http://127.0.0.1:8001`. Nunca claves en VITE_*.

Setup permite `-Python` y `-Uv`. Si falta uv, instala `uv==0.9.5` localmente mediante
pip. En este equipo, si falta npm, usa pnpm del runtime Codex para instalar
`npm@11.6.2` en `work/npm-tooling`. En otros equipos, usar Node con npm. La primera
instalación requiere red; demo después no la necesita. No altera PATH ni instala
servicios globales.

## Conservación y errores

- Detener Vite antes de `setup.ps1`: se reprodujo EPERM de rolldown en Windows y se
  resolvió cerrando el proceso propio, sin permisos de administrador.
- SQLite requiere archivo; memoria se rechaza porque los motores usan conexiones
  separadas. Predeterminado `work/flamelab.db`.
- Semilla demo solo sobre base vacía. Para otro corpus usar importación `--replace`
  explícita o nueva URL SQLite; los expedientes anteriores conservan su snapshot.
- El catálogo real no contiene ensayos/mediciones. La API de catálogo dará perfil
  metadata_only y evidencia insuficiente para comparaciones numéricas.
- Detalles de resultados/aviso Starlette en `VERIFICATION.md`.

## Proveedor externo opcional

`FLAMELAB_AI_PROVIDER=openai` requiere modelo y clave en
`FLAMELAB_OPENAI_MODEL` / `FLAMELAB_OPENAI_API_KEY`, solo servidor/`.env` excluido de
Git. No hay modelo predeterminado ni activación por detectar una clave. No se verificó
cuenta, modelo ni facturación. No se enviaron archivos locales a ningún proveedor.

Adaptador: una petición Responses, JSON Schema, `store=false`, contexto y salida
limitados, deadline global, esquema/citas validados. El modelo solo sintetiza;
no reemplaza cálculos. Validar IDs no prueba respaldo semántico: revisión humana
pendiente. Referencia: [Structured Outputs oficial](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

## PostgreSQL preparado, no probado

SQLAlchemy/Alembic y dependencia opcional: `uv sync --locked --extra postgres`.
`compose.yaml` prepara una imagen PostgreSQL/pgvector y exige contraseña local.
Configurar URL `postgresql+psycopg://...` después. No se ejecutaron esos pasos.
No hay extensión activada por migración, tabla vectorial ni embeddings. P1 debe
verificar migración, concurrencia, copia/restauración y motor real antes de habilitarlo.

## Base para seis personas

Todos parten del tag `flamelab-skeleton-2026-11-14`; el relevo exportado contiene SHA
y bundle. Copiar bundle y usar `git clone <ruta-bundle> Flame-in-Freefall`, o esperar
publicación coordinada del mismo commit. Crear después una rama `codex/p1-...` a
`codex/p6-...`. No se han creado seis versiones de contratos ni ramas vacías.
