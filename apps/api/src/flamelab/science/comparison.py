"""Conservative stratification and descriptive summaries of selected observations."""

import hashlib
import json
from statistics import median

from flamelab.domain.contracts import (
    ComparisonGroup, ComparisonRequest, ComparisonResponse, DatasetBundle, PlotPoint,
    TRIAL_ONLY_CONDITIONS,
)
from flamelab.science.common import CONDITION_KEYS, CONDITION_UNITS, METRIC_UNITS, effective_conditions


RUN_SUMMARY_FIELDS = {"oxygen_initial_pct", "oxygen_final_pct", "burn_duration_s"}


def _stratum(trial, stage, effective, vary):
    conditions = {
        "study_id": trial.study_id, "material_grade": trial.material_grade or "not_reported",
        "provenance": trial.provenance,
    }
    unknown = trial.material_grade is None
    for key in CONDITION_KEYS:
        if key in vary or key in RUN_SUMMARY_FIELDS:
            continue
        if stage is None and key in TRIAL_ONLY_CONDITIONS and key not in effective:
            continue
        condition = effective.get(key)
        if condition is None or condition.status != "known":
            status = condition.status if condition else "not_reported"
            conditions[key] = status
            # Explicit not_applicable can match another not_applicable. Other missingness
            # cannot demonstrate equivalent control conditions.
            unknown = unknown or status != "not_applicable"
        else:
            value = condition.value
            if isinstance(value, (int, float)):
                # Canonicalize 21 and 21.0 without rounding distinct control values.
                conditions[key] = str(int(value)) if value == int(value) else repr(value)
            else:
                conditions[key] = value
    key_conditions = dict(conditions)
    if unknown:
        key_conditions["unresolved_trial_id"] = trial.id
    digest = hashlib.sha256(json.dumps(key_conditions, sort_keys=True).encode()).hexdigest()[:16]
    return f"group:{digest}", conditions, unknown


def compare_trials(bundle: DatasetBundle, request: ComparisonRequest) -> ComparisonResponse:
    trials_by_id = {trial.id: trial for trial in bundle.trials}
    selected_ids = list(dict.fromkeys(request.trial_ids))
    for trial_id in selected_ids:
        if trial_id not in trials_by_id:
            raise KeyError(trial_id)
    selected_stages = set(request.condition_ids)
    relevant_stages = {
        stage.id for trial_id in selected_ids for stage in trials_by_id[trial_id].condition_stages
    }
    if selected_stages - relevant_stages:
        raise KeyError(sorted(selected_stages - relevant_stages)[0])
    warnings = [
        "Groups are descriptive strata, not evidence of causal effects or physical equivalence.",
        "Intervals are not implemented; repeated observations are not independent replicates.",
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
    if relevant_stages:
        warnings.append("Successive conditions share their physical trial and independent unit. Changes across stages may also reflect elapsed burn time or other unmeasured conditions.")
    study_status = {study.id: study.dataset_status for study in bundle.studies}
    if any(study_status[trials_by_id[trial_id].study_id] == "unverified" for trial_id in selected_ids):
        warnings.append("Selected evidence includes unverified data awaiting scientific review.")
    group_data = {}
    points = []
    observations_by_trial = {}
    for observation in bundle.observations:
        if observation.metric == request.metric:
            key = (observation.trial_id, observation.condition_id)
            observations_by_trial.setdefault(key, []).append(observation)
    for trial_id in selected_ids:
        trial = trials_by_id[trial_id]
        if trial.provenance == "synthetic" and not request.allow_synthetic:
            warnings.append(f"synthetic_not_allowed:{trial_id}")
            continue
        warnings.extend(f"source_note:{trial_id}:{note}" for note in trial.notes)
        for stage in trial.condition_stages or [None]:
            stage_id = stage.id if stage else None
            if stage_id is not None and selected_stages and stage_id not in selected_stages:
                continue
            effective = effective_conditions(trial, stage)
            group_id, conditions, unknown = _stratum(trial, stage, effective, request.vary)
            group = group_data.setdefault(group_id, {
                "conditions": conditions, "trials": {}, "stages": set(), "units": set(),
                "values": [], "warnings": [],
            })
            group["trials"][trial.id] = None
            if stage_id is not None:
                group["stages"].add(stage_id)
            group["units"].add(trial.independent_unit_id)
            if unknown and not group["warnings"]:
                group["warnings"].append("Incomplete control conditions; this trial is isolated, not pooled.")
                if stage:
                    warnings.append("Some stage comparisons have incomplete controls. Their physical trials are isolated for descriptive comparison.")
            x_value = effective.get(request.x_condition)
            x = x_value.value if x_unit and x_value and x_value.status == "known" else None
            if x is None:
                warnings.append(f"x_unavailable:{stage_id or trial_id}:{request.x_condition}")
            matching = observations_by_trial.get((trial.id, stage_id), [])
            if not matching:
                group["warnings"].append(f"metric_not_reported:{stage_id or trial_id}:{request.metric}")
            for observation in matching:
                if observation.status != "known":
                    group["warnings"].append(f"observation_missing:{observation.id}:{observation.status}")
                    continue
                if observation.unit != unit:
                    group["warnings"].append(f"incompatible_unit:{observation.id}:{observation.unit}")
                    continue
                # Each point retains both the measurement and the axis source.
                evidence_ids = list(dict.fromkeys(
                    observation.evidence_ids + trial.evidence_ids + (x_value.evidence_ids if x_value else [])
                ))
                points.append(PlotPoint(
                    trial_id=trial.id, observation_id=observation.id, condition_id=stage_id,
                    independent_unit_id=trial.independent_unit_id, x=x, y=observation.value,
                    original_value=observation.original_value, original_unit=observation.original_unit,
                    group_id=group_id, evidence_ids=evidence_ids, provenance=observation.provenance,
                ))
                group["values"].append(observation.value)
    groups = []
    for group_id, group in sorted(group_data.items()):
        groups.append(ComparisonGroup(
            id=group_id, conditions=group["conditions"], trial_ids=list(group["trials"]),
            n_trials=len(group["trials"]), n_observations=len(group["values"]),
            n_condition_stages=len(group["stages"]),
            n_independent_units=len(group["units"]),
            median=median(group["values"]) if group["values"] else None,
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
