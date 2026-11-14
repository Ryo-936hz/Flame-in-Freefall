"""Mapping behavior with invented source cells modeling the published column layouts."""

import pytest

from flamelab.data.nasa_experiments import map_experiments
from flamelab.data.nasa_sources import SourceRecord, SourceTable


def table(study, headers, rows):
    study_id = f"psi:PSI-{study}"
    return SourceTable(study_id, "example.csv", headers, [
        SourceRecord(ordinal, cells, f"{study_id}:row:{ordinal}")
        for ordinal, cells in enumerate(rows, start=2)
    ])


def test_flex_only_assigns_extinction_diameter_to_recorded_extinctions():
    headers = (
        "FLEX Test #", "FLEX Identifier", "Fuel", "Ambient pressure; mmHg",
        "O initial ambient composition; mole fraction", "N initial ambient composition; mole fraction",
        "CO initial ambient composition; mole fraction", "Droplet initial diameter; mm",
        "Visible flame extinction diameter; mm", "Burning rate; mm", "Burn time; s", "Test end",
    )
    source = table(69, headers, [
        ("1", "001A", "Test material", "760", ".21", ".79", "0", "–", "1.2", "0.2", "5", "Extinction"),
        ("2", "001A", "Test material", "760", ".21", ".79", "0", "1.7", "0", "0.2", "~6", "Completion"),
        ("3", "99CAL01", "Test material", "760", ".21", ".79", "0", "1.7", "1", "0.2", "5", "Extinction"),
    ])
    trials, observations, quality = map_experiments(source)
    assert len(trials) == 2
    assert trials[0].sample_id == trials[1].sample_id
    assert trials[0].independent_unit_status == "unresolved"
    assert trials[0].conditions["pressure_kpa"].value == pytest.approx(101.325, abs=0.0001)
    assert trials[0].conditions["pressure_kpa"].original_unit == "mmHg"
    assert trials[0].conditions["diameter_mm"].original_value == "–"
    assert trials[0].conditions["diameter_mm"].status == "not_reported"
    assert trials[0].conditions["oxygen_pct"].status == "not_extracted"
    assert trials[0].conditions["test_end"].value == "extinction"
    assert [(item.value, item.status, item.original_value) for item in observations] == [
        (5, "known", "5"), (1.2, "known", "1.2"),
        (None, "not_extracted", "~6"), (None, "not_applicable", "0"),
    ]
    assert quality["exclusions"] == [
        {"evidence_id": "psi:PSI-69:row:4", "reason": "calibration_identifier"},
    ]


def test_same_preserves_zero_and_does_not_impute_configurations():
    source = table(102, (
        "Sample #", "Sample Material  ", "Air Flow (cm/s)",
        "Weight loss rate (mg/min)", "Aging Duration (minutes)",
    ), [("1", "Test material", "5", "0", "20"), ("2", "Another: same conditions as 1", "", "", "")])
    trials, observations, quality = map_experiments(source)
    assert len(trials) == 1
    assert trials[0].conditions["aging_duration_s"].value == 1200
    assert trials[0].conditions["aging_duration_s"].original_value == "20"
    assert (observations[0].value, observations[0].status) == (0, "known")
    assert observations[0].evidence_ids == ["psi:PSI-102:row:2"]
    assert quality["exclusions"][0]["reason"] == "configuration_reference"


def test_samer_records_related_stems_and_leaves_conflicting_ids_as_evidence():
    source = table(101, (
        "Sample Type", "SAME Test #", "Inlet velocity (cm/s)", "Rt/R0", "Duration (sec)",
        "Primary aging time (sec)", "Primary mixing time (sec)", "Net aging time (sec)",
    ), [
        ("Test material", "5", "8.1", "1.38", "60", "1", "2", "3"),
        ("Test material", "5a", "8.1", "1.38", "", "", "", "n/a"),
        ("Test material", "6", "8.1", "1.38", "60", "1", "2", "3"),
        ("Other material", "6", "8.1", "1.38", "60", "1", "2", "3"),
    ])
    trials, observations, quality = map_experiments(source)
    assert [trial.label for trial in trials] == ["5", "5a"]
    assert trials[0].sample_id == trials[1].sample_id
    assert {item.metric for item in observations} == {
        "samer_run_duration_s", "samer_primary_aging_time_s",
        "samer_primary_mixing_time_s", "samer_net_aging_time_s",
    }
    assert observations[-1].original_value == "n/a"
    assert observations[-1].status == "not_reported"
    assert all(row["reason"] == "unresolved_duplicate_identifier" for row in quality["exclusions"])
    assert len(quality["exclusions"]) == 2


def test_saffire_does_not_collapse_ranges_or_conflicting_dimensions():
    source = table(98, (
        "Sample Number ", "Material", "Air Flow (cm/s)", "Ignition Power (W)", "Ignition Time (s)",
        "Burn Time (s)", "Flow Direction ", "Percent O2", "Sample Thickness (cm)",
        "Sample Length (cm)", "Sample Width (cm)",
    ), [
        ("S1", "Test fabric", "20", "180", "8", "55", "Opposed", "21.5 - 21.7", "0.37", "40", "90"),
        ("F1/F2", "Flow visualization", "", "", "", "", "", "", "", "", ""),
    ])
    trials, observations, quality = map_experiments(source)
    assert len(trials) == 1
    assert trials[0].conditions["flow_direction"].value == "opposed"
    for key in ("sample_width_mm", "thickness_mm", "oxygen_pct"):
        assert trials[0].conditions[key].status == "not_extracted"
    assert trials[0].conditions["oxygen_pct"].original_value == "21.5 - 21.7"
    assert observations[0].metric == "saffire_reported_burn_duration_s"
    assert observations[0].value == 55
    assert quality["exclusions"][0]["reason"] == "missing_or_non_experimental_identifier"
