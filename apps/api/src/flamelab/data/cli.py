"""Explicit local inventory, validation and transactional import commands."""

import argparse
import csv
import json
import sys
import zipfile
from pathlib import Path

from flamelab.data.inventory import inventory_zip
from flamelab.data.loader import load_bundle


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="flamelab-data")
    commands = parser.add_subparsers(dest="command", required=True)
    inventory = commands.add_parser("inventory", help="inspect a ZIP without extraction")
    inventory.add_argument("path", type=Path)
    inventory.add_argument("--output", type=Path)
    bass = commands.add_parser(
        "extract-bass-table51", help="build a local BASS-II bundle and quality report",
    )
    bass.add_argument("datasets", type=Path, help="directory containing the extracted PSI-25 sources")
    bass.add_argument("--catalog", type=Path, default=Path("data/catalog/psi_metadata.json"))
    bass.add_argument("--output-dir", type=Path, required=True, help="new output directory")
    nasa = commands.add_parser("extract-nasa", help="build the local 24-study NASA bundle")
    nasa.add_argument("datasets", type=Path, help="directory containing the extracted PSI sources")
    nasa.add_argument("--catalog", type=Path, default=Path("data/catalog/psi_metadata.json"))
    nasa.add_argument("--inventory", type=Path, default=Path("data/catalog/zip_inventory.json"))
    nasa.add_argument("--profiles", type=Path, default=Path("data/catalog/nasa_study_profiles.json"))
    nasa.add_argument("--output-dir", type=Path, required=True, help="new output directory")
    validate = commands.add_parser("validate", help="validate a canonical JSON bundle")
    validate.add_argument("path", type=Path)
    importer = commands.add_parser("import", help="validate before explicit local import")
    importer.add_argument("path", type=Path)
    importer.add_argument("--replace", action="store_true",
                          help="explicitly replace a different existing corpus")
    importer.add_argument("--database-url", help="override server database configuration")
    args = parser.parse_args(argv)
    if args.command == "extract-bass-table51":
        from flamelab.data.bass_table51 import extract

        try:
            counts = extract(args.datasets, args.catalog, args.output_dir)
        except (OSError, ValueError, csv.Error) as error:
            print(f"BASS-II extraction failed: {error}", file=sys.stderr)
            return 1
        print(json.dumps(counts, ensure_ascii=False))
        return 0
    if args.command == "extract-nasa":
        from flamelab.data.nasa_corpus import extract

        try:
            counts = extract(args.datasets, args.catalog, args.inventory, args.profiles, args.output_dir)
        except (OSError, ValueError, csv.Error) as error:
            print(f"NASA extraction failed: {error}", file=sys.stderr)
            return 1
        print(json.dumps(counts, ensure_ascii=False))
        return 0
    try:
        if args.command == "inventory":
            if args.output and args.output.resolve() == args.path.resolve():
                raise ValueError("inventory output must not overwrite its source")
            result = inventory_zip(args.path)
            rendered = json.dumps(result, ensure_ascii=False, indent=2)
            if args.output:
                args.output.parent.mkdir(parents=True, exist_ok=True)
                args.output.write_text(rendered + "\n", encoding="utf-8")
                print(f"Inventory saved: {args.output}")
            else:
                print(rendered)
        else:
            # Validation precedes migration, session creation and replacement.
            bundle = load_bundle(args.path)
            result = {"dataset_id": bundle.dataset_id, "studies": len(bundle.studies),
                      "trials": len(bundle.trials), "observations": len(bundle.observations)}
            if args.command == "import":
                from flamelab.config import Settings
                from flamelab.storage.database import create_engine_and_session, migrate
                from flamelab.storage.repository import Repository

                settings = Settings(**({"database_url": args.database_url}
                                       if args.database_url else {}))
                migrate(settings)
                engine, sessions = create_engine_and_session(settings)
                try:
                    with sessions() as session:
                        result["changed"] = Repository(session).replace_bundle(
                            bundle, allow_replace=args.replace,
                        )
                finally:
                    engine.dispose()
            print(json.dumps(result, ensure_ascii=False))
        return 0
    except (OSError, ValueError, zipfile.BadZipFile, NotImplementedError):
        # Do not expose raw corpus content or database credentials in CLI failures.
        print("Data operation failed: check input, archive limits and replacement policy.",
              file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
