"""Conservative stratification and descriptive summaries of selected observations."""

import hashlib
import json
from fractions import Fraction

from flamelab.domain.contracts import (
    ComparisonGroup, ComparisonRequest, ComparisonResponse, DatasetBundle, PlotPoint,
)
from flamelab.science.common import CONDITION_KEYS, CONDITION_UNITS, METRIC_UNITS


def _stratum(trial, vary, observation_provenance):
    grade_unknown = not trial.material_grade or not trial.material_grade.strip()
    conditions = {
        "study_id": trial.study_id, "material_grade": "not_reported" if grade_unknown else trial.material_grade,
        "provenance": trial.provenance, "observation_provenance": observation_provenance,
    }
    unresolved = ["material_grade_unresolved"] if grade_unknown else []
    for key in CONDITION_KEYS:
        if key in vary:
            continue
        condition = trial.conditions.get(key)
        status = condition.status if condition else "not_reported"
        # Value and missingness are distinct, even for categorical literals that
        # happen to spell "not_applicable". Both remain visible in the same map.
        conditions[f"{key}_status"] = status
        if condition is None or condition.status != "known":
            conditions[key] = status
            # Explicit not_applicable can match another not_applicable. Other missingness
            # cannot demonstrate equivalent control conditions.
            if status != "not_applicable":
                unresolved.append(f"control_unresolved:{key}:{status}")
        else:
            value = condition.value
            if isinstance(value, (int, float)):
                # Canonicalize 21 and 21.0 without rounding distinct control values.
                conditions[key] = str(int(value)) if value == int(value) else repr(value)
            else:
                conditions[key] = value
    key_conditions = dict(conditions)
    if unresolved:
        key_conditions["unresolved_trial_id"] = trial.id
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
    # The caller reports an unrepresentable midpoint explicitly instead of
    # turning huge integer inputs into infinity or an invented finite estimate.
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
        "Independent-unit counts are per stratum; do not sum them across source representations.",
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
    group_data = {}
    points = []
    observations_by_trial = {}
    for observation in sorted(bundle.observations, key=lambda item: item.id):
        observations_by_trial.setdefault(observation.trial_id, []).append(observation)
    for trial_id in selected_ids:
        trial = trials_by_id[trial_id]
        if trial.provenance == "synthetic" and not request.allow_synthetic:
            warnings.append(f"synthetic_not_allowed:{trial_id}")
            continue
        x_value = trial.conditions.get(request.x_condition)
        x = x_value.value if x_unit and x_value and x_value.status == "known" else None
        if x is None:
            warnings.append(f"x_unavailable:{trial_id}:{request.x_condition}")
        matching = [item for item in observations_by_trial.get(trial.id, []) if item.metric == request.metric]
        by_provenance = {}
        for observation in matching:
            by_provenance.setdefault(observation.provenance, []).append(observation)
        if not matching:
            by_provenance["not_reported"] = []
        if len(by_provenance) > 1:
            warnings.append(f"observation_provenance_split:{trial_id}")
        for provenance, observations in sorted(by_provenance.items()):
            # A published trial may legally carry derived/digitized observations.
            # Their provenance, not just the trial's, must constrain the median.
            group_id, conditions, unknown = _stratum(trial, request.vary, provenance)
            group = group_data.setdefault(group_id, {
                "conditions": conditions, "trials": [], "units": set(), "values": [], "warnings": [],
            })
            group["trials"].append(trial.id)
            group["units"].add(trial.independent_unit_id)
            if unknown and not group["warnings"]:
                group["warnings"].append("Incomplete control conditions; this trial is isolated, not pooled.")
            group["warnings"].extend(unknown)
            if not observations:
                group["warnings"].append(f"metric_not_reported:{trial_id}:{request.metric}")
            for observation in observations:
                if observation.status != "known":
                    group["warnings"].append(f"observation_missing:{observation.id}:{observation.status}")
                    continue
                if observation.unit != unit:
                    group["warnings"].append(f"incompatible_unit:{observation.id}:{observation.unit}")
                    continue
                if observation.provenance == "synthetic" and not request.allow_synthetic:
                    group["warnings"].append(f"synthetic_not_allowed:{observation.id}")
                    continue
                # Retain measurement and X-coordinate sources in a stable order.
                evidence_ids = sorted(set(
                    observation.evidence_ids + trial.evidence_ids
                    + (x_value.evidence_ids if x_value else [])
                ))
                points.append(PlotPoint(
                    trial_id=trial.id, observation_id=observation.id,
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
            id=group_id, conditions=group["conditions"], trial_ids=group["trials"],
            n_trials=len(group["trials"]), n_observations=len(group["values"]),
            n_independent_units=len(group["units"]),
            median=descriptive_median,
            interval=None, warnings=list(dict.fromkeys(group["warnings"])),
        ))
    if not points:
        warnings.append("No supported known observations remain for comparison.")
    if any(point.provenance == "synthetic" for point in points):
        warnings.append("Synthetic points are software fixtures, not NASA measurements.")
    return ComparisonResponse(
        metric=request.metric, unit=unit, x_condition=request.x_condition, x_unit=x_unit,
        groups=groups, points=points, warnings=list(dict.fromkeys(warnings)),
    )
