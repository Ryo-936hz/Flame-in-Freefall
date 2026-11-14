"""Counts and explicit missingness, never imputation."""

from flamelab.domain.contracts import TRIAL_ONLY_CONDITIONS, DatasetBundle, ProfileResponse
from flamelab.science.common import CONDITION_KEYS, MISSING_STATUSES, effective_conditions


def _empty_counts():
    return {key: {status: 0 for status in MISSING_STATUSES} for key in CONDITION_KEYS}


def profile_dataset(bundle: DatasetBundle) -> ProfileResponse:
    counts = _empty_counts()
    stage_counts = {key: statuses.copy() for key, statuses in counts.items()
                    if key not in TRIAL_ONLY_CONDITIONS}
    by_study = {study.id: _empty_counts() for study in bundle.studies}
    issues = []
    for trial in bundle.trials:
        for key in CONDITION_KEYS:
            value = trial.conditions.get(key)
            status = value.status if value else "not_reported"
            counts[key][status] += 1
            by_study[trial.study_id][key][status] += 1
        for stage in trial.condition_stages:
            effective = effective_conditions(trial, stage)
            for key, statuses in stage_counts.items():
                value = effective.get(key)
                statuses[value.status if value else "not_reported"] += 1
    synthetic = sum(trial.provenance == "synthetic" for trial in bundle.trials)
    if synthetic:
        issues.append("Synthetic fixtures present; they are not NASA observations.")
    if not bundle.trials:
        issues.append("No trials available; metadata alone does not provide measured observations.")
    unavailable = sum(observation.status != "known" for observation in bundle.observations)
    if unavailable:
        issues.append(f"{unavailable} observations have an explicit missingness status.")
    if any(not evidence.reviewed for evidence in bundle.evidence):
        issues.append("Unreviewed evidence exists; identity validation is not scientific verification.")
    return ProfileResponse(
        dataset_id=bundle.dataset_id, n_studies=len(bundle.studies), n_trials=len(bundle.trials),
        n_condition_stages=sum(len(trial.condition_stages) for trial in bundle.trials),
        n_observations=len(bundle.observations),
        n_independent_units=len({(trial.study_id, trial.independent_unit_id) for trial in bundle.trials}),
        missing_by_condition=counts, missing_by_stage_condition=stage_counts, missing_by_study=by_study,
        issues=issues, synthetic_trials=synthetic,
    )
