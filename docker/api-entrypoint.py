"""Arranque de la API en Docker.

FLAMELAB_DATA elige el corpus, cada uno en su propia base SQLite del volumen /app/work:
  catalog  -> importa data/catalog/psi_metadata.json (24 estudios, metadata_only)
  demo     -> fixture sintético data/fixtures/demo.json (no son mediciones NASA)
  bundle   -> importa FLAMELAB_BUNDLE desde /app/import (carpeta local montada en solo
              lectura): un bundle.json o el paquete ZIP de P2 con SHA256SUMS
  empty    -> base vacía
Si se define FLAMELAB_DATABASE_URL, se respeta y no se importa nada.
"""
import hashlib
import os
import sys
import zipfile
from pathlib import Path, PurePosixPath

import uvicorn

from flamelab.data.cli import main as data_cli
from flamelab.data.loader import MAX_BUNDLE_BYTES

MODES = {"catalog": "catalog.db", "demo": "demo.db", "bundle": None, "empty": "flamelab.db"}
IMPORT_DIR = Path("/app/import")
STAGING_DIR = Path("/app/work/imports")


def fail(message: str) -> None:
    sys.exit(f"Carga de datos: {message}")


def read_package(path: Path) -> bytes:
    """Lee bundle.json de un paquete ZIP sin extraerlo y lo coteja con SHA256SUMS."""
    try:
        with zipfile.ZipFile(path) as archive:
            members = {}
            for info in archive.infolist():
                parts = PurePosixPath(info.filename).parts
                if info.is_dir() or not parts or ".." in parts or info.filename.startswith("/"):
                    continue
                members.setdefault(parts[-1], info)
            needed = [members.get("bundle.json"), members.get("SHA256SUMS")]
            if None in needed:
                fail(f"{path.name} no contiene bundle.json y SHA256SUMS")
            contents = {}
            for info in needed:
                if info.file_size > MAX_BUNDLE_BYTES:
                    fail(f"{info.filename} supera el límite de 20 MiB")
                with archive.open(info) as stream:
                    data = stream.read(MAX_BUNDLE_BYTES + 1)
                if len(data) > MAX_BUNDLE_BYTES:
                    fail(f"{info.filename} supera el límite de 20 MiB")
                contents[PurePosixPath(info.filename).name] = data
    except zipfile.BadZipFile:
        fail(f"{path.name} no es un ZIP válido")
    sums = {}
    for line in contents["SHA256SUMS"].decode("ascii", "replace").splitlines():
        digest, _, name = line.strip().partition("  ")
        if name:
            sums[name.lstrip("*")] = digest.lower()
    bundle = contents["bundle.json"]
    if sums.get("bundle.json") != hashlib.sha256(bundle).hexdigest():
        fail(f"bundle.json de {path.name} no coincide con su SHA256SUMS")
    return bundle


def stage_bundle() -> tuple[Path, str, str]:
    """Devuelve la ruta del bundle a importar y su SHA-256."""
    name = os.environ.get("FLAMELAB_BUNDLE", "").strip()
    if not name:
        candidates = sorted(p.name for p in IMPORT_DIR.glob("*") if p.suffix in {".json", ".zip"})
        if len(candidates) != 1:
            fail("define FLAMELAB_BUNDLE con el archivo de la carpeta de importación "
                 f"(encontrados: {', '.join(candidates) or 'ninguno'})")
        name = candidates[0]
    path = (IMPORT_DIR / name).resolve()
    if not path.is_relative_to(IMPORT_DIR) or not path.is_file():
        fail(f"no existe {name} en la carpeta de importación (FLAMELAB_IMPORT_DIR)")
    if path.suffix == ".zip":
        data = read_package(path)
        digest = hashlib.sha256(data).hexdigest()
        STAGING_DIR.mkdir(parents=True, exist_ok=True)
        staged = STAGING_DIR / f"{digest}.json"
        if not staged.exists():
            partial = staged.with_suffix(".part")
            partial.write_bytes(data)
            partial.replace(staged)
        return staged, digest, path.name
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return path, digest.hexdigest(), path.name


mode = os.environ.get("FLAMELAB_DATA", "catalog").strip().lower()
if mode not in MODES:
    sys.exit(f"FLAMELAB_DATA={mode!r} no válido; usar: {', '.join(MODES)}")

if "FLAMELAB_DATABASE_URL" not in os.environ:
    source = None
    if mode == "catalog":
        source, database = Path("/app/data/catalog/psi_metadata.json"), MODES[mode]
    elif mode == "bundle":
        source, digest, label = stage_bundle()
        # Una base por contenido: un bundle distinto nunca sustituye a otro (sin --replace).
        database = f"bundle-{digest[:12]}.db"
        print(f"Bundle {label}: SHA-256 {digest}", flush=True)
    else:
        database = MODES[mode]
    url = f"sqlite:////app/work/{database}"
    os.environ["FLAMELAB_DATABASE_URL"] = url
    os.environ["FLAMELAB_SEED_DEMO"] = "true" if mode == "demo" else "false"
    if source is not None:
        # Valida antes de escribir; idempotente con el mismo contenido.
        code = data_cli(["import", str(source), "--database-url", url])
        if code:
            sys.exit(code)

print(f"FlameLab API: datos={mode}, base={os.environ['FLAMELAB_DATABASE_URL'].split('/')[-1]}", flush=True)
uvicorn.run("flamelab.main:app", host="0.0.0.0", port=8000, proxy_headers=True)
