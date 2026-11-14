"""Map explicitly identified NASA CSV columns into provisional experimental records."""

import re
from collections import Counter
from decimal import Decimal
from typing import NamedTuple

from flamelab.data.nasa_sources import SourceTable
from flamelab.domain.contracts import ConditionValue, Observation, Trial


class NumericField(NamedTuple):
    column: str
    key: str
    source_unit: str
    unit: str
    factor: Decimal = Decimal(1)


class Mapping(NamedTuple):
    id_column: str
    material_column: str
    conditions: tuple[NumericField, ...]
    metrics: tuple[NumericField, ...]
    limits: dict[str, str]


FLEX_DIAMETER = "flex_visible_flame_extinction_diameter_mm"
FLEX_IDENTIFIER = "FLEX Identifier"
SAME_R_ID = "SAME Test #"
FLEX_OUTCOME = "Test end"
MAPPINGS = {
    "psi:PSI-69": Mapping(
        "FLEX Test #", "Fuel",
        (
            NumericField("Ambient pressure; mmHg", "pressure_kpa", "mmHg", "kPa",
                         Decimal("0.133322387415")),
            NumericField("Droplet initial diameter; mm", "diameter_mm", "mm", "mm"),
        ),
        (
            NumericField("Burn time; s", "flex_burn_duration_s", "s", "s"),
            NumericField("Visible flame extinction diameter; mm", FLEX_DIAMETER, "mm", "mm"),
        ),
        {
            "Burning rate; mm": "The printed unit does not establish a rate definition.",
            "O initial ambient composition; mole fraction": "The species label is truncated.",
            "N initial ambient composition; mole fraction": "The species label is truncated.",
            "CO initial ambient composition; mole fraction": "The species label is unresolved.",
            "Test end": "Reported duration is stratified by reason for test termination. "
                        "The extinction diameter is eligible only for a recorded extinction.",
        },
    ),
    "psi:PSI-102": Mapping(
        "Sample #", "Sample Material  ",
        (
            NumericField("Air Flow (cm/s)", "flow_velocity_cm_s", "cm/s", "cm/s"),
            NumericField("Aging Duration (minutes)", "aging_duration_s", "min", "s", Decimal(60)),
        ),
        (NumericField("Weight loss rate (mg/min)", "same_reported_mass_loss_rate_mg_min",
                      "mg/min", "mg/min"),),
        {"Weight loss rate (mg/min)": "Reported table value. Whether measured or imposed is "
                                       "pending review. Configuration references stay documentary."},
    ),
    "psi:PSI-101": Mapping(
        SAME_R_ID, "Sample Type",
        (NumericField("Inlet velocity (cm/s)", "flow_velocity_cm_s", "cm/s", "cm/s"),),
        (
            NumericField("Duration (sec)", "samer_run_duration_s", "s", "s"),
            NumericField("Primary aging time (sec)", "samer_primary_aging_time_s", "s", "s"),
            NumericField("Primary mixing time (sec)", "samer_primary_mixing_time_s", "s", "s"),
            NumericField("Net aging time (sec)", "samer_net_aging_time_s", "s", "s"),
        ),
        {
            "Rt/R0": "The meaning and basis of the ratio require protocol review.",
            SAME_R_ID: "Suffixed records share a related stem. Both conflicting rows with "
                       "a repeated identifier stay documentary until identity is resolved.",
        },
    ),
    "psi:PSI-98": Mapping(
        "Sample Number ", "Material",
        (
            NumericField("Air Flow (cm/s)", "flow_velocity_cm_s", "cm/s", "cm/s"),
            NumericField("Ignition Power (W)", "ignition_power_w", "W", "W"),
            NumericField("Ignition Time (s)", "ignition_duration_s", "s", "s"),
        ),
        (NumericField("Burn Time (s)", "saffire_reported_burn_duration_s", "s", "s"),),
        {
            "Percent O2": "Range or approximation stays in original form, pending a range contract.",
            "Sample Thickness (cm)": "Reconcile the reported thickness and unit with the report.",
            "Sample Length (cm)": "Reported dimensions conflict with the corresponding report axes.",
            "Sample Width (cm)": "Reported dimensions conflict with the corresponding report axes.",
            "Burn Time (s)": "Reported burn duration. Termination reason and independence need review.",
        },
    ),
}


def _number(raw: str, field: NumericField):
    value = raw.strip()
    if value.casefold() in {"", "-", "–", "—", "n/a", "na"}:
        return None, "not_reported"
    if re.fullmatch(r"(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)", value):
        return float(Decimal(value) * field.factor), "known"
    return None, "not_extracted"


def _scalar(raw: str, evidence_id: str) -> ConditionValue:
    value = raw.strip().lower()
    return ConditionValue(
        value=value or None, status="known" if value else "not_reported",
        original_value=raw, evidence_ids=[evidence_id],
    )


def _unresolved(raw: str, original_unit: str, unit: str, evidence_id: str) -> ConditionValue:
    return ConditionValue(
        status="not_extracted" if raw.strip() else "not_reported",
        unit=unit, original_value=raw, original_unit=original_unit, evidence_ids=[evidence_id],
    )


def map_experiments(table: SourceTable) -> tuple[list[Trial], list[Observation], dict]:
    """Attach numerical fields to source identities without assuming independent repeats."""
    mapping = MAPPINGS.get(table.study_id)
    if mapping is None:
        return [], [], {}
    study = table.study_id
    columns = {header: index for index, header in enumerate(table.headers)}
    required = {mapping.id_column, mapping.material_column, *mapping.limits}
    required.update(field.column for field in (*mapping.conditions, *mapping.metrics))
    if study == "psi:PSI-69":
        required.update({FLEX_IDENTIFIER, FLEX_OUTCOME})
    if study == "psi:PSI-98":
        required.add("Flow Direction ")
    if not required <= columns.keys():
        raise ValueError(f"Unexpected header for {table.path}: {sorted(required - columns.keys())}")

    ids = Counter(record.cells[columns[mapping.id_column]].strip() for record in table.records
                  if record.duplicate_of is None)
    trials = []
    observations = []
    exclusions = []
    for record in table.records:
        row = dict(zip(table.headers, record.cells, strict=True))
        source_id = row[mapping.id_column].strip()
        reason = None
        if record.duplicate_of is not None:
            reason = "exact_duplicate_record"
        elif not re.fullmatch(r"[A-Za-z0-9_.-]+", source_id):
            reason = "missing_or_non_experimental_identifier"
        elif ids[source_id] > 1:
            reason = "unresolved_duplicate_identifier"
        elif study == "psi:PSI-69" and "CAL" in row[FLEX_IDENTIFIER].strip().upper():
            reason = "calibration_identifier"
        elif study == "psi:PSI-102" and ": same conditions as " in row[mapping.material_column]:
            reason = "configuration_reference"
        if reason:
            exclusions.append({"evidence_id": record.evidence_id, "reason": reason})
            continue

        ref = record.evidence_id
        base_id = f"{study}:test:{source_id}"
        sample = source_id
        conditions = {"material": _scalar(row[mapping.material_column], ref)}
        for field in mapping.conditions:
            raw = row[field.column]
            value, status = _number(raw, field)
            conditions[field.key] = ConditionValue(
                value=value, status=status, unit=field.unit, original_value=raw,
                original_unit=field.source_unit, evidence_ids=[ref],
            )
        if study == "psi:PSI-69":
            identifier = row[FLEX_IDENTIFIER].strip()
            if not re.fullmatch(r"[A-Za-z0-9_.-]+", identifier):
                exclusions.append({"evidence_id": ref, "reason": "unresolved_flex_identifier"})
                continue
            sample = identifier
            conditions["test_end"] = _scalar(row[FLEX_OUTCOME], ref)
            conditions["geometry"] = ConditionValue(
                value="droplet", status="known", original_value="Droplet initial diameter; mm",
                evidence_ids=[ref],
            )
            conditions["oxygen_pct"] = _unresolved(
                row["O initial ambient composition; mole fraction"], "mole fraction", "%", ref,
            )
        if study == "psi:PSI-101":
            stem = re.fullmatch(r"([0-9]+)[A-Za-z]?", source_id)
            if stem is None:
                exclusions.append({"evidence_id": ref, "reason": "unresolved_samer_identifier"})
                continue
            sample = stem[1]
        if study == "psi:PSI-98":
            conditions["flow_direction"] = _scalar(row["Flow Direction "], ref)
            conditions["oxygen_pct"] = _unresolved(row["Percent O2"], "%", "%", ref)
            conditions["sample_width_mm"] = _unresolved(row["Sample Width (cm)"], "cm", "mm", ref)
            conditions["thickness_mm"] = _unresolved(row["Sample Thickness (cm)"], "cm", "mm", ref)

        notes = list(mapping.limits.values())
        notes.append("Independent experimental unit unresolved. The source IDs represent records.")
        trials.append(Trial(
            id=base_id, study_id=study, label=source_id, sample_id=f"{study}:sample:{sample}",
            independent_unit_id=f"{study}:unresolved-units", independent_unit_status="unresolved",
            conditions=conditions, evidence_ids=[ref], provenance="published", notes=notes,
        ))
        for field in mapping.metrics:
            raw = row[field.column]
            value, status = _number(raw, field)
            if field.key == FLEX_DIAMETER and row[FLEX_OUTCOME].strip().lower() != "extinction":
                value, status = None, "not_applicable"
            observations.append(Observation(
                id=f"{base_id}:{field.key}", trial_id=base_id, metric=field.key,
                value=value, status=status, unit=field.unit, original_value=raw,
                original_unit=field.source_unit, evidence_ids=[ref], provenance="published",
            ))

    return trials, observations, {
        "records_mapped": len(trials),
        "observation_statuses": dict(Counter(item.status for item in observations)),
        "observations_by_metric": {
            field.key: dict(Counter(item.status for item in observations if item.metric == field.key))
            for field in mapping.metrics
        },
        "exclusions": exclusions,
        "scope_and_limits": mapping.limits,
        "independent_unit_status": "unresolved",
    }
