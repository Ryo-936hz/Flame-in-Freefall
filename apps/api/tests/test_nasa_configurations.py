"""Behavior checks using invented input cells, with no NASA files required."""

import pytest

from flamelab.data.nasa_configurations import CFIG, FLAME_DESIGN, map_configurations
from flamelab.data.nasa_sources import SourceRecord, SourceTable


def _table(study, columns, rows):
    return SourceTable(study, "inputs/test.csv", tuple(columns), [
        SourceRecord(index, tuple(row), f"test:row:{index}")
        for index, row in enumerate(rows, 2)
    ])


def test_flame_design_keeps_ramps_and_thermochemistry_out_of_observations():
    table = _table(FLAME_DESIGN,
                   ["Test", "Flame Type", "Fuel", "mfuel (mg/s)", "mN2 (mg/s)",
                    "XO2 (init)", "XO2 (final)", "pmean (atm)", "mean Zst", "Tad (K)"],
                   [["A1", "Normal", "C2H4", "RAMPED", "0", "0.27", "0.25", "1", "0.1", "1800"]])
    trials, observations, report = map_configurations(table)
    condition = trials[0].conditions
    assert trials[0].independent_unit_status == "unresolved"
    assert trials[0].evidence_ids == ["test:row:2"]
    assert condition["test_configuration"].value == "normal"
    assert condition["pressure_kpa"].value == 101.325
    assert condition["oxygen_initial_pct"].value == 27
    assert condition["oxygen_final_pct"].value == 25
    assert "oxygen_pct" not in condition
    assert observations == []
    fields = report["records"][0]["fields"]
    assert fields["mfuel (mg/s)"]["status"] == "ramped"
    assert fields["mN2 (mg/s)"]["value"] == 0
    assert fields["Tad (K)"]["scope"] == "reported_derived_thermochemistry"


def test_cfig_ignition_peak_and_termination_are_distinct():
    table = _table(CFIG,
                   ["Test", "Flame Type", "Fuel", "XO2", "approx p (bar)", "Hot ignition", "TFP",
                    "Self -ext or flow term", "burn time (sec)", "Peak burner Temp (C)",
                    "Peak burner temp (K)", "Comments"],
                   [["A1", "Inverse", "ethane", "0.21", "1.1", "No", "No", "-", "0", "27", "300.15", ""],
                    ["A2", "Inverse", "ethane", "0.21", "1.1", "Yes", "No", "FT", "12", "127", "400.15", ""],
                    ["A3", "Inverse", "ethane", "0.21", "1.1", "yes", "Yes", "SE", "3", "127", "500", ""]])
    trials, observations, report = map_configurations(table)
    assert trials[1].conditions["test_end"].value == "FT"
    assert trials[1].conditions["pressure_kpa"].value == 110
    assert observations[0].original_value == "0"
    assert observations[0].value is None and observations[0].status == "not_extracted"
    assert observations[1].value is None
    assert observations[2].value == 12
    assert observations[3].value == 400.15 and observations[3].original_unit == "°C"
    assert observations[5].value is None
    assert report["records"][2]["fields"]["Peak burner Temp (C)"]["status"] == "source_disagreement"


def test_acme_conflicting_source_test_identity_fails():
    table = _table(FLAME_DESIGN, ["Test", "Flame Type"], [["A 1", "Normal"], ["A1", "Normal"]])
    with pytest.raises(ValueError, match="Ambiguous repeated ACME test identity"):
        map_configurations(table)


def test_flex2_design_ranges_do_not_expand_into_trials():
    table = _table("psi:PSI-68", ["Sample", "Pressure"], [["ethane", "1–2"]])
    trials, observations, report = map_configurations(table)
    assert trials == observations == []
    assert report["row_granularity"] == "design_range"
