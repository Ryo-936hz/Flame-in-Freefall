"""Importer tests with invented source cells; the real corpus check is opt-in."""

import csv
from io import StringIO
from pathlib import Path

import pytest

from flamelab.data.bass_table51 import (
    CSV_COLUMNS, CSV_MEMBER, FINAL_O2, HEADERS, INITIAL_O2, PDF_MEMBER, STUDY,
    TEST_IDS, build_bundle,
)
from flamelab.data.cli import main
from flamelab.data.loader import load_bundle

CATALOG = Path(__file__).resolve().parents[3] / "data/catalog/psi_metadata.json"


@pytest.fixture
def source_cells():
    table = [
        list(HEADERS),
        *[[test, "2", "1.2", "2", "0 and 7", "0 and 0.013", "2.5", "23.2", "21.1"]
          for test in TEST_IDS],
    ]
    # These test-only cells exercise the validation paths with no NASA PDFs in CI.
    table[6][5] = "Not tracked"
    operating = [
        {
            "PI": "Miller", "Test #": test, "Sample #": str(900 + index),
            "Fuel Sample Material": "1 cm wide", "Fan display": "12", "Air display": "0 7",
            INITIAL_O2: "23.20", FINAL_O2: "21.1",
        }
        for index, test in enumerate(TEST_IDS)
    ]
    return table, operating


def _build(table, operating):
    target = StringIO(newline="")
    writer = csv.DictWriter(target, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    writer.writerows(operating)
    target.seek(0)
    return build_bundle(table, csv.DictReader(target, strict=True), load_bundle(CATALOG))


def test_staged_trial_preserves_originals_source_scope_and_absence(source_cells):
    bundle, quality = _build(*source_cells)
    trial = bundle.trials[0]
    first, second = trial.condition_stages
    assert [first.order, second.order] == [1, 2]
    assert trial.id == f"{STUDY}:M1"
    assert trial.sample_id == trial.independent_unit_id == f"{STUDY}:sample:900"
    assert first.conditions["flow_velocity_cm_s"].value == 0
    assert second.conditions["flow_velocity_cm_s"].value == 7
    stage_o2 = second.conditions["oxygen_pct"]
    assert stage_o2.value is None
    assert stage_o2.status == "not_measured"
    assert "oxygen_pct" not in trial.conditions
    assert trial.conditions["oxygen_initial_pct"].value == 23.2
    assert trial.conditions["oxygen_initial_pct"].original_unit == "vol%"
    assert trial.conditions["oxygen_final_pct"].value == 21.1
    width = trial.conditions["sample_width_mm"]
    assert (width.value, width.unit, width.original_value, width.original_unit) == (
        12, "mm", "1.2", "cm",
    )
    assert trial.conditions["burn_duration_s"].value == 150
    assert trial.conditions["burning_faces"].value == 2

    obs = bundle.observations[0]
    assert (obs.trial_id, obs.condition_id) == (trial.id, first.id)
    assert (obs.value, obs.status, obs.original_value, obs.original_unit) == (0, "known", "0", "mm/s")
    evidence = {item.id: item for item in bundle.evidence}
    source = evidence[obs.evidence_ids[0]]
    assert source.page == 65
    assert source.source_url.endswith("#page=65")
    assert "Table 5.1, data row 1, test M1" in source.locator
    assert "Spread rate cell (mm/s): 0 and 0.013" in source.text
    assert "CSV line 2" in evidence[f"{trial.id}:operational"].locator
    assert "Sample #: 900" in evidence[f"{trial.id}:operational"].text
    assert not source.reviewed

    absent = [row for row in bundle.observations if row.trial_id == f"{STUDY}:M6"]
    assert len(absent) == 2
    assert all(row.value is None and row.status == "not_measured" for row in absent)
    assert all(row.original_value == "Not tracked" for row in absent)
    assert quality["counts"]["spread_status"] == {"known": 38, "not_measured": 2}
    assert {row.dataset_status for row in bundle.studies} == {"metadata_only", "unverified"}


def test_issues_and_reused_samples_keep_both_distinct_physical_tests(source_cells):
    table, operating = source_cells
    operating[1]["Sample #"] = operating[0]["Sample #"]
    operating[0][INITIAL_O2] = ""
    operating[0][FINAL_O2] = "22.1"
    bundle, quality = _build(table, operating)
    first, second = bundle.trials[:2]
    assert first.id != second.id
    assert first.independent_unit_id == second.independent_unit_id
    assert quality["reused_sample_ids"] == [first.sample_id]
    assert quality["counts"]["sample_based_independent_units"] == 19
    assert "initial_oxygen_csv_absent" in quality["trials"][0]["issues"]
    assert "final_oxygen_disagrees" in quality["trials"][0]["issues"]
    assert first.conditions["oxygen_final_pct"].value == 21.1


@pytest.mark.parametrize(
    ("defect", "error"),
    [
        ("duplicate_pdf", "once in source order"),
        ("duplicate_csv", "Duplicate Miller"),
        ("missing_csv", "operational records"),
        ("missing_sample", "sample number"),
        ("missing_rate", "counts differ"),
        ("invalid_oxygen", "admissible range"),
    ],
)
def test_rejects_ambiguous_or_invalid_sources(source_cells, defect, error):
    table, operating = source_cells
    if defect == "duplicate_pdf":
        table[2][0] = table[1][0]
    elif defect == "duplicate_csv":
        operating.append(dict(operating[0]))
    elif defect == "missing_csv":
        operating.pop()
    elif defect == "missing_sample":
        operating[0]["Sample #"] = ""
    elif defect == "missing_rate":
        table[1][5] = "0.013"
    else:
        table[1][7] = "101"
    with pytest.raises(ValueError, match=error):
        _build(table, operating)


def test_cli_rejects_wrong_source_before_creating_outputs(tmp_path, capsys):
    datasets = tmp_path / "datasets"
    for member in (PDF_MEMBER, CSV_MEMBER):
        file = datasets / member
        file.parent.mkdir(parents=True)
        file.write_bytes(b"substituted input")
    output = tmp_path / "output"
    args = ["extract-bass-table51", str(datasets), "--catalog", str(CATALOG), "--output-dir"]
    assert main([*args, str(output)]) == 1
    assert "Source does not match the inspected version" in capsys.readouterr().err
    assert not output.exists()
