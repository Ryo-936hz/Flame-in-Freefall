"""Source ingestion tests using small invented documents and CSV files."""

import hashlib
import json

import pytest

from flamelab.data.nasa_sources import load_sources
from flamelab.domain.contracts import DatasetBundle, Study


def test_sources_preserve_duplicate_records_blank_cells_and_physical_lines(tmp_path):
    study_id = "psi:PSI-69"
    csv_path = "PSI-69/Experimental table/PSI-69_Experimental table_FLEX.csv"
    report_path = "PSI-69/report.pdf"
    members = []
    for relative, content in (
        (csv_path, 'id,comment,diameter\r\n1,"first\r\nsecond",–\r\n,,\r\n1,"first\r\nsecond",–\r\n2,,\r\n'.encode("cp1252")),
        (report_path, b"invented report body"),
    ):
        source = tmp_path / relative
        source.parent.mkdir(exist_ok=True, parents=True)
        source.write_bytes(content)
        members.append({"path": relative, "directory": False, "bytes": len(content),
                        "sha256": hashlib.sha256(content).hexdigest()})
    inventory = tmp_path / "inventory.json"
    inventory.write_text(json.dumps({"members": members}), encoding="utf-8")
    profiles = tmp_path / "profiles.json"
    profiles.write_text(json.dumps({study_id: {
        "role": "numeric_candidate", "question": "Which widths are reported?",
        "variables": "Diameter", "record_scope": "Record", "related_studies": [],
        "limits": "Invented fixture",
    }}), encoding="utf-8")
    catalog = DatasetBundle(dataset_id="test:catalog", description="Invented input", studies=[
        Study(id=study_id, title="Test study", family="test", dataset_status="metadata_only"),
    ])
    tables, evidence, quality = load_sources(tmp_path, inventory, catalog, profiles)
    assert len(tables) == 1 and quality["verified_sources"] == 2
    first, duplicate, last = tables[0].records
    assert (first.ordinal, first.start_line, first.end_line) == (2, 2, 3)
    assert first.cells == ("1", "first\r\nsecond", "–")
    assert (duplicate.ordinal, duplicate.start_line, duplicate.end_line) == (4, 5, 6)
    assert duplicate.duplicate_of == first.ordinal
    assert last.cells == ("2", "", "")
    assert quality["csv_tables"][0]["blank_records"] == [3]
    assert quality["csv_tables"][0]["exact_duplicate_records"] == [{"ordinal": 4, "first_ordinal": 2}]
    source = next(item for item in evidence if item.id == first.evidence_id)
    assert json.loads(source.text) == [["id", "1"], ["comment", "first\r\nsecond"], ["diameter", "–"]]
    assert "physical lines 2-3" in source.locator
    assert all("invented report body" not in item.text for item in evidence)
    assert quality["study_profiles"][study_id]["files"][1]["path"] == report_path

    (tmp_path / report_path).write_bytes(b"x" * members[1]["bytes"])
    with pytest.raises(ValueError, match="Source inventory mismatch"):
        load_sources(tmp_path, inventory, catalog, profiles)
