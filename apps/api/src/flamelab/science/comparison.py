"""Conservative strata of observations with explicit, source-reported conditions."""

import hashlib
import json
from fractions import Fraction

from flamelab.domain.contracts import (
    ComparisonGroup, ComparisonRequest, ComparisonResponse, DatasetBundle, PlotPoint,
)
from flamelab.science.common import CONDITION_KEYS, CONDITION_UNITS, METRIC_UNITS

TRIAL_ONLY_CONDITIONS = frozenset({"oxygen_initial_pct", "oxygen_final_pct"})
OPTIONAL_V11_CONTROLS = TRIAL_ONLY_CONDITIONS | {"combustion_face"}


def _stratum(trial, vary, provenance, effective, available_controls, segment=None, observation=None):
    grade_unknown = not trial.material_grade or not trial.material_grade.strip()
    conditions = {
        "study_id": trial.study_id,
        "material_grade": "not_reported" if grade_unknown else trial.material_grade,
        "provenance": trial.provenance, "observation_provenance": provenance,
    }
    unresolved = ["material_grade_unresolved"] if grade_unknown else []
    unassigned = bool(trial.segments and observation and segment is None)
    if segment is not None:
        conditions["condition_scope"] = "segment"
    elif unassigned:
        conditions["condition_scope"] = "trial_unassigned"
        unresolved.append(f"segment_unassigned:{observation.id}")
    for key in CONDITION_KEYS:
        if key in vary or (key in OPTIONAL_V11_CONTROLS and key not in available_controls):
            continue
        # Endpoints describe the whole trial, never effective oxygen in a segment.
        source = trial.conditions if key in TRIAL_ONLY_CONDITIONS else effective
        condition = source.get(key)
        if key in TRIAL_ONLY_CONDITIONS:
            conditions[f"{key}_scope"] = "trial"
        status = condition.status if condition else "not_reported"
        conditions[f"{key}_status"] = status
        if condition is None or condition.status != "known":
            conditions[key] = status
            if status != "not_applicable":
                unresolved.append(f"control_unresolved:{key}:{status}")
        else:
            value = condition.value
            if isinstance(value, (int, float)):
                conditions[key] = str(int(value)) if value == int(value) else repr(value)
            else:
                conditions[key] = value
    key_conditions = dict(conditions)
    if unresolved:
        key_conditions["unresolved_trial_id"] = trial.id
        # Unknown controls in separate segments cannot establish compatibility,
        # even when the measurements share a physical specimen.
        if segment is not None:
            key_conditions["unresolved_segment_id"] = segment.id
        elif unassigned:
            key_conditions["unassigned_observation_id"] = observation.id
    digest = hashlib.sha256(json.dumps(key_conditions, sort_keys=True).encode()).hexdigest()[:16]
    return f"group:{digest}", conditions, unresolved


def _median(values):
    """Descriptive median with an exact midpoint before conversion to wire numbers."""
    if not values:
        return None
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    lower, upper = ordered[middle - 1], ordered[middle]
    midpoint = (Fraction(lower) + Fraction(upper)) / 2
    if isinstance(lower, int) and isinstance(upper, int) and midpoint.denominator == 1:
        return midpoint.numerator
    return float(midpoint)


def compare_trials(bundle: DatasetBundle, request: ComparisonRequest) -> ComparisonResponse:
    trials_by_id = {trial.id: trial for trial in bundle.trials}
    selected_ids = sorted(set(request.trial_ids))
    for trial_id in selected_ids:
        if trial_id not in trials_by_id:
            raise KeyError(trial_id)
    warnings = [
        "Groups are descriptive strata, not evidence of causal effects or physical equivalence.",
        "Intervals are not implemented; repeated observations are not independent replicates.",
        "Independent-unit counts are per stratum; do not sum them across segments or source representations.",
    ]
    unit = METRIC_UNITS.get(request.metric, "unsupported")
    x_unit = CONDITION_UNITS.get(request.x_condition)
    if request.metric not in METRIC_UNITS:
        return ComparisonResponse(
            metric=request.metric, unit=unit, x_condition=request.x_condition, x_unit=x_unit,
            groups=[], points=[], warnings=warnings + ["unsupported_metric:other has no defined semantic unit"],
        )
    if x_unit is None:
        warnings.append("categorical_x_axis_not_supported: x values remain null; use groups for categories")
    permitted = [trials_by_id[item] for item in selected_ids
                 if request.allow_synthetic or trials_by_id[item].provenance != "synthetic"]
    # Legacy bundles with none of these optional v1.1 controls retain their strata.
    # Once reported anywhere in the selection, missing counterparts are unresolved.
    available_controls = {
        key for trial in permitted
        for source in [trial.conditions, *(segment.conditions for segment in trial.segments)]
        for key in source if key in OPTIONAL_V11_CONTROLS
    }
    if any(trial.segments for trial in permitted):
        available_controls.add("combustion_face")
        warnings.extend([
            "Segment sequence is source-reported order, not measured time or independent replication.",
            "Segment conditions are explicit; trial conditions are not inherited.",
        ])
    group_data = {}
    points = []
    observations_by_trial = {}
    for observation in bundle.observations:
        observations_by_trial.setdefault(observation.trial_id, []).append(observation)
    for trial_id in selected_ids:
        trial = trials_by_id[trial_id]
        if trial.provenance == "synthetic" and not request.allow_synthetic:
            warnings.append(f"synthetic_not_allowed:{trial_id}")
            continue
        segments = {segment.id: segment for segment in trial.segments}
        matching = [item for item in observations_by_trial.get(trial.id, []) if item.metric == request.metric]
        matching.sort(key=lambda item: (
            item.segment_id is None,
            segments[item.segment_id].sequence if item.segment_id is not None else 0,
            item.id,
        ))
        if len({item.provenance for item in matching}) > 1:
            warnings.append(f"observation_provenance_split:{trial_id}")
        for observation in matching or [None]:
            segment = segments.get(observation.segment_id) if observation else None
            effective = segment.conditions if segment is not None else trial.conditions
            provenance = observation.provenance if observation else "not_reported"
            group_id, conditions, unknown = _stratum(
                trial, request.vary, provenance, effective, available_controls, segment, observation,
            )
            group = group_data.setdefault(group_id, {
                "conditions": conditions, "trials": set(), "units": set(), "values": [], "warnings": [],
            })
            group["trials"].add(trial.id)
            group["units"].add((trial.study_id, trial.independent_unit_id))
            if unknown:
                group["warnings"].append("Incomplete or unassigned controls; this condition scope is isolated, not pooled.")
            group["warnings"].extend(unknown)
            if observation and trial.segments and segment is None:
                warnings.append(f"segment_unassigned:{observation.id}:explicit_trial_conditions_only")
            x_value = effective.get(request.x_condition)
            if segment is not None and request.x_condition in TRIAL_ONLY_CONDITIONS:
                x_value = None
                warnings.append(f"trial_level_axis_not_available_for_segment:{observation.id}:{request.x_condition}")
            x = x_value.value if x_unit and x_value and x_value.status == "known" else None
            if x is None:
                warnings.append(f"x_unavailable:{trial_id}:{request.x_condition}")
                if observation and trial.segments:
                    warnings.append(f"x_unavailable_for_observation:{observation.id}:{request.x_condition}")
            if observation is None:
                group["warnings"].append(f"metric_not_reported:{trial_id}:{request.metric}")
                continue
            if observation.status != "known":
                group["warnings"].append(f"observation_missing:{observation.id}:{observation.status}")
                continue
            if observation.unit != unit:
                group["warnings"].append(f"incompatible_unit:{observation.id}:{observation.unit}")
                continue
            if observation.provenance == "synthetic" and not request.allow_synthetic:
                group["warnings"].append(f"synthetic_not_allowed:{observation.id}")
                continue
            # Include sources for both the measurement and controls, retaining the
            # original values/units on the unchanged bundle rather than normalizing again.
            sources = {key: value for key, value in effective.items() if key not in TRIAL_ONLY_CONDITIONS}
            sources.update({key: trial.conditions[key] for key in TRIAL_ONLY_CONDITIONS if key in trial.conditions})
            evidence_ids = sorted(set(
                observation.evidence_ids + trial.evidence_ids
                + (segment.evidence_ids if segment else [])
                + [ref for value in sources.values() for ref in value.evidence_ids]
            ))
            points.append(PlotPoint(
                trial_id=trial.id, observation_id=observation.id, segment_id=observation.segment_id,
                independent_unit_id=trial.independent_unit_id, x=x, y=observation.value,
                group_id=group_id, evidence_ids=evidence_ids, provenance=observation.provenance,
            ))
            group["values"].append(observation.value)
    groups = []
    for group_id, group in sorted(group_data.items()):
        try:
            descriptive_median = _median(group["values"])
        except OverflowError:
            descriptive_median = None
            group["warnings"].append("median_unrepresentable: midpoint exceeds the numeric response range")
        groups.append(ComparisonGroup(
            id=group_id, conditions=group["conditions"], trial_ids=sorted(group["trials"]),
            n_trials=len(group["trials"]), n_observations=len(group["values"]),
            n_independent_units=len(group["units"]), median=descriptive_median,
            interval=None, warnings=sorted(set(group["warnings"])),
        ))
    if not points:
        warnings.append("No supported known observations remain for comparison.")
    if any(point.provenance == "synthetic" for point in points):
        warnings.append("Synthetic points are software fixtures, not NASA measurements.")
    return ComparisonResponse(
        metric=request.metric, unit=unit, x_condition=request.x_condition, x_unit=x_unit,
        groups=groups, points=points, warnings=list(dict.fromkeys(warnings)),
    )
