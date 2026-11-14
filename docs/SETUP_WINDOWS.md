# Preparación Windows

Para un nuevo miembro del equipo, seguir primero [TEAM_START](TEAM_START.md):
clonar GitHub y crear una rama propia desde **`origin/main`**. La PR #3 ya está
fusionada en esa base mediante `0b732cb`. En un clon existente, conservar los
cambios propios y hacer merge de `origin/main`; no reiniciar desde una etiqueta
histórica. La ruta del clon es libre; no copiar la ruta del equipo de integración.

Clon original: `C:\Users\user\Desktop\NASA\Flame-in-Freefall`. El paquete original estaba
en `NASA\FlameLab_Contexto_Codex\FlameLab_Contexto`; este y Documents se conservaron.
No se requieren Docker ni claves para la demo.

## Instalación y ejecución

1. Tener Git, Python 3.12 y Node >=22.12 con npm. Probados aquí: Python 3.12.14,
   Node 24.22.1, Git 2.55.0.windows.5 y PowerShell 7 en Windows.
2. Ejecutar `./scripts/setup.ps1` desde el clon. Respeta `uv.lock`, `package-lock.json`
   y `.env` existente; crea entorno `.venv` y configuración demo si faltan.
3. Ejecutar `./scripts/check.ps1`. Para incluir navegador: instalar Chromium con
   `node node_modules/playwright/cli.js install chromium` y ejecutar
   `./scripts/check.ps1 -E2E`. La prueba crea sus propios servicios y base temporal.
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
- Semilla demo solo sobre base vacía. Para cargar el corpus P2, seguir
  [DEMO](DEMO.md) usando una base dedicada. La importación rechaza reemplazar
  silenciosamente un corpus distinto; los expedientes conservan su snapshot.
- `data/catalog/psi_metadata.json` contiene solo metadatos de 24 estudios. El
  **bundle completo P2** añade 1.058 registros y 1.673 observaciones, con 1.283
  valores conocidos, y se mantiene `scientific_unverified`. Son artefactos distintos.
  Los diez puntos del guion BASS-II tienen conformidad descriptiva de P3, con límites.
  Importar el catálogo de metadatos no instala esas mediciones.
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

## PostgreSQL verificado en CI; pgvector fuera del alcance probado

PostgreSQL 17 pasó migraciones, reemplazo de corpus y recuperación histórica en
el CI del hito P6; consultar el SHA y el run en [VERIFICATION](VERIFICATION.md).
El check local omite esa prueba si falta `FLAMELAB_TEST_POSTGRES_URL`.
Para ejecutarla, instalar la dependencia opcional (`uv sync --locked --extra postgres`)
y usar una base **desechable de prueba** con `apps/api/tests/test_postgres_integration.py`.
SQLite basta para arrancar la demo; no se necesita instalar PostgreSQL en Windows.

`compose.yaml` prepara una imagen PostgreSQL/pgvector y exige contraseña local.
El uso de esa imagen no acredita pgvector: no hay extensión activada por migración,
tabla vectorial ni embeddings. No se presume validada la operación en producción.

## Base para seis personas

Todos crean su rama desde `origin/main` y comparan el SHA completo de la base
compartida siguiendo [TEAM_START](TEAM_START.md). Los clones existentes conservan
su trabajo antes del merge. Las referencias `team-start-v1` y las etiquetas P6
permanecen congeladas como historial. Los contratos son únicos y generados;
no hay que reconstruir seis versiones de la aplicación.
