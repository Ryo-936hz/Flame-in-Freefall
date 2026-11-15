"""Arranque de la API en Docker.

FLAMELAB_DATA elige el corpus, cada uno en su propia base SQLite del volumen /app/work:
  catalog  -> importa data/catalog/psi_metadata.json (24 estudios, metadata_only)
  demo     -> fixture sintético data/fixtures/demo.json (no son mediciones NASA)
  empty    -> base vacía
Si se define FLAMELAB_DATABASE_URL, se respeta y no se importa nada.
"""
import os
import sys

import uvicorn

from flamelab.data.cli import main as data_cli

MODES = {"catalog": "catalog.db", "demo": "demo.db", "empty": "flamelab.db"}

mode = os.environ.get("FLAMELAB_DATA", "catalog").strip().lower()
if mode not in MODES:
    sys.exit(f"FLAMELAB_DATA={mode!r} no válido; usar: {', '.join(MODES)}")

if "FLAMELAB_DATABASE_URL" not in os.environ:
    url = f"sqlite:////app/work/{MODES[mode]}"
    os.environ["FLAMELAB_DATABASE_URL"] = url
    os.environ["FLAMELAB_SEED_DEMO"] = "true" if mode == "demo" else "false"
    if mode == "catalog":
        # Idempotente con el mismo contenido; nunca usa --replace.
        code = data_cli(["import", "/app/data/catalog/psi_metadata.json", "--database-url", url])
        if code:
            sys.exit(code)

print(f"FlameLab API: datos={mode}, base={os.environ['FLAMELAB_DATABASE_URL'].split('/')[-1]}", flush=True)
uvicorn.run("flamelab.main:app", host="0.0.0.0", port=8000, proxy_headers=True)
