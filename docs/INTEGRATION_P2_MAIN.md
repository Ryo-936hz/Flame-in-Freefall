# Integración vigente de P2 y P6 en main

## Estado y alcance

La [PR #3](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/3) está fusionada
como `0b732cb74dfab97f9191fc1677b4c244d84f6b6b`. La rama P2 `lujan`,
`f8e6a01f4f47cc89e9d45a35c23b924b81d808d3`, ya era ancestro de `main`:
no había commits P2 adicionales que copiar. Se conservan sus datos, contratos,
extractores, auditorías y paquete de demo.

La revisión posterior de aceptación cierra estos huecos de consumo:

- Tarjeta Saffire separada, con fuentes, discrepancias y límites de interpretación.
- Las 14 métricas canónicas disponibles en Mission Brief; las campañas permanecen
  aisladas por el backend. No se cambian fórmulas ni el contrato.
- Catálogo con IDs de observación/ensayo/segmento, valores originales, unidades y
  ausencias; paginación y reintentos explícitos. Fuentes literales del corpus activo.
- Control de cobertura asociado a su etiqueta accesible y porcentaje visible.
- Recorrido de navegador ampliado para catálogo, campañas numéricas, configuraciones,
  documentos, fallos recuperables y contexto Saffire. Sus cifras finales se registran
  en [VERIFICATION](VERIFICATION.md), separadas de las comprobaciones anteriores.

El código del cierre es `20aab80404fc2f0fc188d718cac47d0d4bf31d54`, verificado
localmente: 342 pruebas Python/una omisión local, 77 cliente, recorrido sintético
25/64 y real 17/101. El clon limpio Windows también pasó: 340 Python/3 omisiones,
77 cliente y navegador 25/64. La [PR #4](https://github.com/Ryo-936hz/Flame-in-Freefall/pull/4)
entrega el cierre sobre `main`. [VERIFICATION](VERIFICATION.md) registra los
resultados por código y entorno; las pruebas históricas no acreditan archivos posteriores.

## Arranque común en Windows

Git, Python 3.12, Node 24 con npm y PowerShell 7. Clon nuevo:

```powershell
git clone https://github.com/Ryo-936hz/Flame-in-Freefall.git
Set-Location Flame-in-Freefall
git fetch origin
git switch --no-track -c codex/mi-tarea origin/main
git rev-parse HEAD
.\scripts\setup.ps1
node node_modules/playwright/cli.js install chromium
.\scripts\check.ps1 -E2E
```

En un clon existente: comprobar `git status`, conservar cambios propios, hacer
`git fetch origin` y `git merge origin/main` desde la rama de trabajo. No usar
reset para incorporar la integración. Cada persona comparte el SHA comunicado
por el equipo y trabaja en su rama. Las referencias iniciales y P6 permanecen
inmutables como historial.

Dos terminales para el modo sintético sin credenciales:

```powershell
.\scripts\dev-api.ps1
```

```powershell
.\scripts\dev-web.ps1
```

Abrir http://127.0.0.1:5173. Setup conserva `.env`; la semilla solo llena una base
vacía. Este modo no requiere el ZIP ni el paquete NASA. [Guion](DEMO.md).

## Activar el paquete real P2 sin sobrescribir otra base

Usar `bundle.json` del paquete interno **FlameLab P2 demo 1.1.1**. No se incluye
el corpus completo en Git. El hash comprobado es
`cb8b782fd73dbe4df0576b8047f3dea781a37d7c06c962ad2e978e607a00191d`.
El paquete añade a la extracción revisada los dos avisos M8; conserva valores,
identidades, unidades y `reviewed=false`.

```powershell
$bundle = (Resolve-Path 'C:\ruta\flamelab-p2-demo-v1.1.1\bundle.json').Path
Get-FileHash -Algorithm SHA256 $bundle
.\.venv\Scripts\python.exe -m flamelab.data.cli validate $bundle
.\.venv\Scripts\python.exe -m flamelab.data.cli import $bundle --database-url sqlite:///work/nasa-team-main.db
.\.venv\Scripts\python.exe -m flamelab.data.cli import $bundle --database-url sqlite:///work/nasa-team-main.db
$env:FLAMELAB_DATABASE_URL = 'sqlite:///work/nasa-team-main.db'
$env:FLAMELAB_SEED_DEMO = 'false'
$env:FLAMELAB_AI_PROVIDER = 'demo'
.\scripts\dev-api.ps1
```

La primera importación en una base nueva devuelve `changed: true`; la segunda,
`changed: false`. Si la base tiene otro corpus, el importador rechaza la operación:
usar otro nombre de archivo para conservarlo. No añadir `--replace` por rutina.
En el equipo integrador ya se ejecutaron esas dos importaciones en la base dedicada
`work/nasa-team-main.db`. Esto no cambia la base predeterminada ni inicia un servidor
permanente; los comandos de arriba lo arrancan explícitamente con el corpus real.

En otra terminal iniciar `scripts/dev-web.ps1`. `/api/v1/health` debe indicar
`scientific_unverified`, proveedor `demo` y esquema 1.1. El catálogo debe listar
24 estudios: 7 con mapeos sin validación global y 17 documentales. Hay 1.058
registros y 1.673 observaciones normalizadas; 1.283 tienen valor conocido. Un
registro puede ser un ensayo o una configuración, no siempre una réplica física.

El guion real usa BASS-II a 6/5 cm/s, insuficiencia lunar sin filtro de flujo,
catálogo y contexto Saffire. M8 conserva su discrepancia. Diez puntos son siete
muestras identificadas; no son diez unidades experimentales independientes.

Para ejecutar el navegador real con ese paquete, en un proceso separado del
servidor de presentación:

```powershell
$env:FLAMELAB_P2_DEMO_BUNDLE = (Resolve-Path 'C:\ruta\flamelab-p2-demo-v1.1.1\bundle.json').Path
.\scripts\check.ps1 -E2E
```

El test crea sus propios puertos/base/procesos, no sustituye `nasa-team-main.db`
ni consume credenciales. El CI público usa fixtures sintéticos; las pruebas con
paquete real son opt-in locales. [Opciones E2E](../apps/web/tests/e2e/README.md).

## Límites y continuidad de las seis personas

P1 mantiene contratos y CI; P2/P3 amplían revisión científica con fuentes, sin
convertir tests en aprobación global. P4 conserva modo determinista y límites de
proveedores. P6 mantiene los dos recorridos y su guion. P5 debe integrar main en
su evolución posterior Ask SI/CSS, conservando el contexto de las citas históricas
según [relevo P6](handoffs/P6.md); esa rama independiente no se da por terminada.

No se necesitan para esta demo: proveedor pagado, CFD, diseño inverso, embeddings,
pgvector ni lenguaje natural general. No se ha acreditado lector de pantalla o
móvil físico. La aprobación P3 cubre diez puntos BASS-II y el contraste documental;
M8 no se ha resuelto por reanálisis y el resto del corpus conserva sus limitaciones.
