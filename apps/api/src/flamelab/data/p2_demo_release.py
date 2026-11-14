"""Assemble the reviewed P2 demo handoff from the pinned NASA extraction."""

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from flamelab.domain.contracts import DatasetBundle

SOURCE_HASHES = {
    "bundle.json": "7dc69717b4bc6151025df2993d9cf66622db3a8b7242798a1d7bfe8b8e335781",
    "quality.json": "8b44ddd333912f4b4849b82c5d2df29ec1b1d38de6bf8d5191ef9e8afbd57ee9",
}
M8_POINTS = {"psi:PSI-25:M8:stage:2:table51", "psi:PSI-25:M8:stage:3:table51"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("extraction", type=Path)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()

    files = {name: (args.extraction / name).read_bytes() for name in SOURCE_HASHES}
    for name, source_hash in SOURCE_HASHES.items():
        if hashlib.sha256(files[name]).hexdigest() != source_hash:
            parser.error(f"{name} differs from the extraction reviewed by P3")

    files["cases.json"] = Path("data/catalog/p2-demo-cases-v1.1.0.json").read_bytes()
    files["demo-copy.json"] = Path("data/catalog/p2-demo-copy-v1.1.1.json").read_bytes()
    files["README.md"] = Path("docs/handoffs/P2_DEMO.md").read_text(encoding="utf-8").encode("utf-8")
    files["P3_BASS_II_DECISION_DEMO.md"] = Path(
        "docs/handoffs/P3_BASS_II_DECISION_DEMO.md",
    ).read_text(encoding="utf-8").encode("utf-8")
    copy = json.loads(files["demo-copy.json"])
    bundle = DatasetBundle.model_validate_json(files["bundle.json"])
    amended = set()
    for evidence in bundle.evidence:
        if evidence.id in M8_POINTS:
            evidence.text += f"\n\n{copy['m8_notice']}"
            amended.add(evidence.id)
    if amended != M8_POINTS:
        parser.error("Both M8 evidence records must exist in the reviewed extraction")
    files["bundle.json"] = (bundle.model_dump_json(indent=2) + "\n").encode("utf-8")
    files["SHA256SUMS"] = "".join(
        f"{hashlib.sha256(contents).hexdigest()}  {name}\n" for name, contents in files.items()
    ).encode("ascii")

    with ZipFile(args.archive, "x") as archive:
        for name, contents in files.items():
            archive.writestr(ZipInfo(name), contents, compress_type=ZIP_DEFLATED)


if __name__ == "__main__":
    main()
