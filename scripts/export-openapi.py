"""Generate a stable schema without opening a database or requiring credentials."""
import argparse
import json
from pathlib import Path

from flamelab.config import ROOT, Settings
from flamelab.main import create_app

parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
app = create_app(Settings(_env_file=None, ai_provider="demo", seed_demo=False))
content = json.dumps(app.openapi(), indent=2, sort_keys=True, ensure_ascii=False) + "\n"
path: Path = ROOT / "packages/contracts/openapi.json"
if args.check:
    if not path.exists() or path.read_text(encoding="utf-8") != content:
        raise SystemExit("OpenAPI drift: regenerate scripts/export-openapi.py")
    print("OpenAPI matches canonical contracts")
else:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    print(path)
