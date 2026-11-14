import io
import json
import stat
import zipfile
from pathlib import Path

import pytest
from sqlalchemy import func, select

from flamelab.config import Settings
from flamelab.data.cli import main
from flamelab.data.inventory import InventoryLimits, UnsafeArchive, inventory_zip
from flamelab.data.loader import load_bundle
from flamelab.storage.database import create_engine_and_session
from flamelab.storage.models import DatasetSnapshot
from flamelab.storage.repository import Repository

ROOT = Path(__file__).resolve().parents[3]
DEMO = ROOT / "data/fixtures/demo.json"
CATALOG = ROOT / "data/catalog/psi_metadata.json"


def test_fixture_provenance_and_known_zero():
    demo = load_bundle(DEMO)
    assert len(demo.trials) == 5
    assert len(demo.observations) == 6
    assert all(x.provenance == "synthetic" for x in demo.trials + demo.observations)
    assert all(x.source_url is None and x.provenance == "synthetic" for x in demo.evidence)
    zero = next(x for x in demo.observations if x.trial_id == "synthetic:trial-4")
    assert zero.value == 0 and zero.status == "known"
    missing = next(x for x in demo.observations if x.trial_id == "synthetic:trial-5")
    assert missing.value is None and missing.status == "not_measured"
    repeated = [x for x in demo.observations if x.trial_id == "synthetic:trial-1"]
    assert len(repeated) == 2


def test_real_catalog_does_not_claim_measurements():
    catalog = load_bundle(CATALOG)
    assert len(catalog.studies) == 24
    assert all(x.dataset_status == "metadata_only" for x in catalog.studies)
    assert not catalog.trials and not catalog.observations
    assert all(not x.reviewed for x in catalog.evidence)


@pytest.mark.parametrize("mutation", ["unknown_reference", "duplicate_id", "boolean_number"])
def test_loader_rejects_invalid_bundle(tmp_path, mutation):
    payload = json.loads(DEMO.read_text(encoding="utf-8"))
    if mutation == "unknown_reference":
        payload["observations"][0]["evidence_ids"] = ["invalid:missing"]
    elif mutation == "duplicate_id":
        payload["trials"][1]["id"] = payload["trials"][0]["id"]
    else:
        payload["observations"][0]["value"] = True
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(ValueError):
        load_bundle(path)


def test_loader_rejects_duplicate_json_keys(tmp_path):
    path = tmp_path / "duplicate.json"
    path.write_text('{"dataset_id":"a:x","dataset_id":"a:y"}', encoding="utf-8")
    with pytest.raises(ValueError, match="duplicate JSON key"):
        load_bundle(path)


@pytest.mark.parametrize("name", ["../escape.txt", "/absolute.txt", "C:/drive.txt",
                                  "safe/../../escape", "safe\\..\\escape", "NUL.txt",
                                  "stream:secret", "trailing./file", "foo//bar"])
def test_inventory_rejects_unsafe_paths_without_extracting(tmp_path, name):
    archive = tmp_path / "bad.zip"
    with zipfile.ZipFile(archive, "w") as target:
        target.writestr(name, b"not executed")
    with pytest.raises(UnsafeArchive):
        inventory_zip(archive)
    assert list(tmp_path.iterdir()) == [archive]


def test_inventory_rejects_symlink_and_case_alias(tmp_path):
    archive = tmp_path / "bad.zip"
    with zipfile.ZipFile(archive, "w") as target:
        link = zipfile.ZipInfo("link")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        target.writestr(link, "../target")
    with pytest.raises(UnsafeArchive, match="symbolic"):
        inventory_zip(archive)
    with zipfile.ZipFile(archive, "w") as target:
        target.writestr("A.txt", "first")
        target.writestr("a.txt", "second")
    with pytest.raises(UnsafeArchive, match="aliased"):
        inventory_zip(archive)


def test_inventory_rejects_bombs_and_total_budget(tmp_path):
    archive = tmp_path / "bomb.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as target:
        target.writestr("repeated.txt", b"A" * 100000)
    with pytest.raises(UnsafeArchive, match="expansion"):
        inventory_zip(archive)
    with zipfile.ZipFile(archive, "w") as target:
        target.writestr("a.txt", b"1" * 20)
        target.writestr("b.txt", b"2" * 20)
    with pytest.raises(UnsafeArchive, match="expanded-size"):
        inventory_zip(archive, InventoryLimits(max_total_bytes=30))
    with pytest.raises(UnsafeArchive, match="member-count"):
        inventory_zip(archive, InventoryLimits(max_members=1))


def test_inventory_checks_nested_zip_and_hashes(tmp_path):
    nested = io.BytesIO()
    with zipfile.ZipFile(nested, "w") as target:
        target.writestr("safe.txt", b"abc")
    archive = tmp_path / "nested.zip"
    with zipfile.ZipFile(archive, "w") as target:
        target.writestr("nested.zip", nested.getvalue())
    result = inventory_zip(archive)
    member = result["members"][0]["members"][0]
    assert member["sha256"] == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    assert result["nested_inclusive_members"] == 2
    assert result["extracted"] is False
    with pytest.raises(UnsafeArchive, match="depth"):
        inventory_zip(archive, InventoryLimits(max_nested_depth=0))
    nested = io.BytesIO()
    with zipfile.ZipFile(nested, "w") as target:
        target.writestr("../bad.txt", b"blocked")
    with zipfile.ZipFile(archive, "w") as target:
        target.writestr("nested.zip", nested.getvalue())
    with pytest.raises(UnsafeArchive):
        inventory_zip(archive)


def test_cli_import_is_idempotent_and_requires_explicit_replacement(tmp_path):
    url = "sqlite:///" + (tmp_path / "data.db").as_posix()
    args = ["import", str(DEMO), "--database-url", url]
    assert main(args) == 0
    assert main(args) == 0
    assert main(["import", str(CATALOG), "--database-url", url]) == 1
    engine, sessions = create_engine_and_session(Settings(database_url=url))
    try:
        with sessions() as session:
            assert Repository(session).get_bundle().dataset_id == "synthetic:demo-v1"
            assert session.scalar(select(func.count()).select_from(DatasetSnapshot)) == 1
        assert main(["import", str(CATALOG), "--database-url", url, "--replace"]) == 0
        with sessions() as session:
            assert Repository(session).get_bundle().dataset_id == "psi:local-catalog-v1"
            assert session.scalar(select(func.count()).select_from(DatasetSnapshot)) == 2
    finally:
        engine.dispose()


def test_invalid_import_does_not_create_database(tmp_path):
    data = tmp_path / "bad.json"
    data.write_text("{}", encoding="utf-8")
    db = tmp_path / "untouched.db"
    assert main(["import", str(data), "--database-url", "sqlite:///" + db.as_posix()]) == 1
    assert not db.exists()
