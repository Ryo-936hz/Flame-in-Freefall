"""Map the four ACME source tables and label documentary configurations."""

import re
from collections import Counter
from decimal import Decimal, DecimalException, InvalidOperation
from math import isfinite
from typing import TYPE_CHECKING

from flamelab.domain.contracts import ConditionValue, Observation, Trial

if TYPE_CHECKING:
    from flamelab.data.nasa_sources import SourceTable


FLAME_DESIGN = "psi:PSI-10"
CFIG = "psi:PSI-159"

# Column names are matched after stripping their outer whitespace only.
FRACTIONS = {
    "XO2", "XO2 (init)", "XO2 (final)", "XO2 before test", "XO2  after test",
    "Xfuel", "Xf", "Xf  before test", "Xf  after test", "XC2H4 initial", "XC2H4 final",
}
FLOWS = {
    "mO2 (mg/s)", "mN2 (mg/s)", "mtot (mg/s)", "mfuel (mg/s)", "mHC (mg/s)",
    "HC burnrate (mg/s)", "O2 flow rate (mg/s)",
}
PRESSURES = {"pinit (atm)", "pfinal (atm)", "pmean (atm)", "approx p (bar)"}
OXYGEN_KEYS = {
    "XO2": "oxygen_pct",
    "XO2 (init)": "oxygen_initial_pct",
    "XO2 before test": "oxygen_initial_pct",
    "XO2 (final)": "oxygen_final_pct",
    "XO2  after test": "oxygen_final_pct",
}

# These source rows are retained as evidence. Their granularity does not support
# instantiating a Trial or an Observation from each record.
DOCUMENTARY = {
    "psi:PSI-99": ("mixed_sample_and_notes", "Resolve gravity, spread headings and embedded units before extracting measurements."),
    "psi:PSI-107": ("event_configuration", "Resolve repeated ignition/off events and test identity before counting trials."),
    "psi:PSI-100": ("sample_configuration", "Verify SIBAL dimensions, orientation and airflow against the report."),
    "psi:PSI-39": ("test_configuration", "Resolve duplicates, pressure text and support fiber; the CSV has no response measurement."),
    "psi:PSI-68": ("design_range", "Published ranges and sets do not establish which combinations were actually tested."),
    "psi:PSI-26": ("as_run_index", "Resolve as-run, test and sample identities before attaching results."),
    "psi:PSI-20": ("campaign_summary", "Ignition counts aggregate a day; pressure differs and is unresolved by test."),
    "psi:PSI-21": ("campaign_summary", "Controller capacities and concentration ranges do not measure actual test flows."),
    "psi:PSI-22": ("campaign_summary", "Polarity and daily ignition counts do not specify field magnitude or a per-test response."),
    "psi:PSI-23": ("campaign_summary", "Daily summaries do not supply per-test atmosphere or flame structure."),
    "psi:PSI-106": ("session_index", "Date and fuel index the sessions; measurements require another source."),
    "psi:PSI-47": ("sampling_session", "The table reports sampling hardware, material and location, with no detected aerosol values."),
}


def _quantity(raw, original_unit, unit, scope, *, factor=Decimal(1), offset=Decimal(0),
              maximum=None, minimum=Decimal(0)):
    stripped = raw.strip()
    value = None
    if stripped in {"", "-"}:
        status = "not_reported"
    elif stripped.upper() in {"RAMP", "RAMPED"}:
        status = "ramped"
    elif stripped.upper() == "LOW O2":
        status = "qualitative_source_value"
    else:
        try:
            number = Decimal(stripped)
            if not number.is_finite() or number < minimum or (maximum is not None and number > maximum):
                raise InvalidOperation
            normalized = float(number * factor + offset)
            if not isfinite(normalized):
                raise InvalidOperation
            value = normalized
            status = "known"
        except (DecimalException, OverflowError):
            status = "invalid_source_value"
    return {"value": value, "unit": unit, "original_value": raw, "original_unit": original_unit,
            "status": status, "scope": scope}


def _condition(field, evidence):
    return ConditionValue(value=field["value"], unit=field["unit"],
                          original_value=field["original_value"], original_unit=field["original_unit"],
                          status="known" if field["status"] == "known" else "not_reported"
                          if field["status"] == "not_reported" else "not_extracted",
                          evidence_ids=[evidence])


def _text_condition(value, original, evidence):
    return ConditionValue(value=value, original_value=original, status="known", evidence_ids=[evidence])


def _configuration(row, evidence):
    fields = {}
    conditions = {"test_configuration": _text_condition(row["Flame Type"].strip().lower(), row["Flame Type"], evidence)}
    if row.get("Fuel", "").strip():
        conditions["material"] = _text_condition(row["Fuel"].strip(), row["Fuel"], evidence)
    for header, original in row.items():
        if header in FRACTIONS:
            factor = Decimal(100) if header in OXYGEN_KEYS else Decimal(1)
            field = _quantity(original, "fraction", "%" if header in OXYGEN_KEYS else "fraction",
                              "configuration", factor=factor, maximum=Decimal(1))
            if header in OXYGEN_KEYS:
                conditions[OXYGEN_KEYS[header]] = _condition(field, evidence)
        elif header in PRESSURES:
            unit = "atm" if header.endswith("(atm)") else "bar"
            field = _quantity(original, unit, "kPa", "configuration",
                              factor=Decimal("101.325") if unit == "atm" else Decimal(100))
            if header in {"pmean (atm)", "approx p (bar)"}:
                conditions["pressure_kpa"] = _condition(field, evidence)
        elif header in FLOWS:
            # Preserve the source label HC burnrate without treating it as an outcome.
            field = _quantity(original, "mg/s", "mg/s", "reported_flow_or_rate_context")
        elif header in {"Tad (K)", "mean Zst", "Zst"}:
            unit = "K" if header == "Tad (K)" else "fraction"
            field = _quantity(original, unit, unit, "reported_derived_thermochemistry",
                              maximum=Decimal(1) if unit == "fraction" else None)
        else:
            continue
        fields[header] = field
    return conditions, fields


def _outcomes(row, fields, conditions, evidence):
    ignition = row["Hot ignition"]
    end_header = "Self -ext or flow term" if "Self -ext or flow term" in row else "Self-ext or flow term"
    end = row[end_header].strip()
    if end in {"SE", "FT"}:
        conditions["test_end"] = _text_condition(end, row[end_header], evidence)
    duration = _quantity(row["burn time (sec)"], "s", "s", "reported_run_outcome")
    temp_header = "Peak burner Temp (C)" if "Peak burner Temp (C)" in row else "Peak burner T (C )"
    peak = _quantity(row[temp_header], "°C", "K", "reported_peak_burner_temperature",
                     offset=Decimal("273.15"), minimum=Decimal("-273.15"))
    if "Peak burner temp (K)" in row:
        kelvin = _quantity(row["Peak burner temp (K)"], "K", "K", "alternate_reported_peak")
        fields["Peak burner temp (K)"] = kelvin
        if peak["status"] == kelvin["status"] == "known" and abs(peak["value"] - kelvin["value"]) > 0.01:
            peak["value"] = None
            peak["status"] = "source_disagreement"
    fields["burn time (sec)"] = duration
    fields[temp_header] = peak
    for metric, field in (("cfig_reported_run_duration_s", duration), ("peak_burner_temperature_k", peak)):
        if ignition.strip().casefold() != "yes" or (metric == "cfig_reported_run_duration_s" and field["value"] == 0):
            yield metric, field, "not_extracted", None
        else:
            status = field["status"] if field["status"] in {"known", "not_reported"} else "not_extracted"
            yield metric, field, status, field["value"]


def map_configurations(table: "SourceTable") -> tuple[list[Trial], list[Observation], dict]:
    study = table.study_id
    if study in DOCUMENTARY:
        granularity, limitation = DOCUMENTARY[study]
        return [], [], {"role": "documentary", "row_granularity": granularity, "limitation": limitation}
    if study not in {FLAME_DESIGN, CFIG}:
        return [], [], {}

    headers = [header.strip() for header in table.headers]
    trials, observations, records = [], [], []
    seen = set()
    for source in table.records:
        row = dict(zip(headers, source.cells, strict=True))
        source_test = row["Test"]
        configuration = row["Flame Type"].strip().lower()
        test = re.sub(r"\s+", "", source_test).upper()
        record = {"ordinal": source.ordinal, "evidence_id": source.evidence_id,
                  "original_test": source_test, "configuration": configuration}
        records.append(record)
        if source.duplicate_of is not None:
            record["status"] = "duplicate_source_record"
            continue
        if configuration not in {"normal", "inverse"} or not re.fullmatch(r"[A-Z0-9_]+", test):
            record["status"] = "unresolved_test_identity"
            continue
        trial_id = f"{study}:{configuration}:{test}"
        if trial_id in seen:
            raise ValueError(f"Ambiguous repeated ACME test identity in {table.path}: record {source.ordinal}")
        seen.add(trial_id)
        conditions, fields = _configuration(row, source.evidence_id)
        record.update(status="mapped", trial_id=trial_id, fields=fields)
        notes = ["Sample identity and independence are unresolved. Counts of distinct test IDs are not replicate counts."]
        if study == CFIG:
            record.update(ignition=row["Hot ignition"], end=row.get("Self -ext or flow term", row.get("Self-ext or flow term")),
                          tfp=row["TFP"], cool_flame=row.get("Cool flame?"), comments=row["Comments"])
            for metric, field, status, value in _outcomes(row, fields, conditions, source.evidence_id):
                field["observation_status"] = status
                observations.append(Observation(
                    id=f"{trial_id}:{metric}", trial_id=trial_id, metric=metric, value=value, status=status,
                    unit=field["unit"], original_value=field["original_value"], original_unit=field["original_unit"],
                    evidence_ids=[source.evidence_id], provenance="published",
                ))
            notes.append("Reported durations use source termination codes and do not estimate a common extinction time.")
        trials.append(Trial(
            id=trial_id, study_id=study, label=source_test,
            sample_id=f"{study}:sample-unresolved", independent_unit_id=f"{study}:unit-unresolved",
            independent_unit_status="unresolved", conditions=conditions, evidence_ids=[source.evidence_id],
            provenance="published", notes=notes,
        ))
    return trials, observations, {
        "role": "configuration_and_reported_outcomes" if study == CFIG else "configuration",
        "row_granularity": "source_test_attempt",
        "configuration_pressure": "approximate bar" if study == CFIG else "mean atm",
        "limitations": [
            "Normal and inverse source tables describe different configurations.",
            "Tad and Zst remain reported thermochemistry context rather than measured outcomes.",
            "CFI-G outcomes are limited to affirmative hot ignition, positive reported durations and usable burner temperatures. Termination and comments require review for censoring.",
        ],
        "trials": len(trials), "observations": dict(Counter(obs.status for obs in observations)),
        "records": records,
    }
