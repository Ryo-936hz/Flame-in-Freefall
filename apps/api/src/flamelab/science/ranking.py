"""Explicit eligibility followed by weighted Gower similarity."""

from flamelab.domain.contracts import (
    DatasetBundle, RankedTrial, RankingContribution, RankingRequest, RankingResponse,
)
from flamelab.science.common import GOWER_SCALES_V1


def rank_trials(bundle: DatasetBundle, request: RankingRequest) -> RankingResponse:
    """Rank the validated bundle without changing distances when the result limit changes."""
    eligible = []
    excluded = []
    warnings = [
        "Gower v1 uses fixed software scales; similarity is not confidence, hazard or physical validity.",
        "Eligibility checks the explicit required_match filters; it does not prove physical comparability.",
    ]
    active = {
        key: request.weights.get(key, 1.0)
        for key in request.target
        if key not in request.vary and request.weights.get(key, 1.0) > 0
    }
    total_weight = sum(active.values())
    observation_refs = {}
    for observation in bundle.observations:
        observation_refs.setdefault(observation.trial_id, []).extend(observation.evidence_ids)
    for trial in sorted(bundle.trials, key=lambda item: item.id):
        reasons = []
        rejection = False
        indeterminate = False
        if request.study_ids and trial.study_id not in request.study_ids:
            rejection = True
            reasons.append("study_not_selected")
        if trial.provenance == "synthetic" and not request.allow_synthetic:
            rejection = True
            reasons.append("synthetic_not_allowed")
        for key in request.required_match:
            candidate = trial.conditions.get(key)
            if candidate is None or candidate.status != "known":
                indeterminate = True
                reasons.append(f"required_condition_missing:{key}")
            elif candidate.value != request.target[key]:
                rejection = True
                reasons.append(f"required_condition_mismatch:{key}")
        contributions = []
        known_weight = 0.0
        weighted_distance = 0.0
        for key, target in request.target.items():
            condition = trial.conditions.get(key)
            candidate = condition.value if condition and condition.status == "known" else None
            weight = request.weights.get(key, 1.0)
            distance = None
            if key in request.vary:
                weight = 0.0
                note = "varied_condition_not_scored"
            elif weight == 0:
                note = "zero_weight_not_scored"
            elif candidate is None:
                note = "missing_condition_reduces_coverage"
            else:
                known_weight += weight
                if key in GOWER_SCALES_V1:
                    raw_distance = abs(float(target) - float(candidate)) / GOWER_SCALES_V1[key]
                    distance = min(1.0, raw_distance)
                    note = "fixed_numeric_scale_v1"
                    if raw_distance > 1.0:
                        note += ":distance_clipped_at_one"
                else:
                    distance = 0.0 if target == candidate else 1.0
                    note = "categorical_equality"
                weighted_distance += weight * distance
            contributions.append(RankingContribution(
                variable=key, target=target, candidate=candidate, weight=weight,
                distance=distance, note=note,
            ))
        coverage = known_weight / total_weight if total_weight else 0.0
        if not total_weight:
            indeterminate = True
            reasons.append("no_active_target_weights")
        elif not known_weight:
            indeterminate = True
            reasons.append("no_known_target_conditions")
        elif coverage < request.minimum_coverage:
            indeterminate = True
            reasons.append("coverage_below_minimum")
        eligibility = "excluded" if rejection else "indeterminate" if indeterminate else "eligible"
        similarity = (
            max(0.0, min(1.0, 1.0 - weighted_distance / known_weight))
            if eligibility == "eligible" else None
        )
        if eligibility == "eligible":
            reasons.append("explicit_requirements_satisfied")
        result = RankedTrial(
            trial_id=trial.id, similarity=similarity, coverage=coverage,
            eligibility=eligibility, reasons=reasons, contributions=contributions,
            evidence_ids=list(dict.fromkeys(
                trial.evidence_ids
                + [ref for condition in trial.conditions.values() for ref in condition.evidence_ids]
                + observation_refs.get(trial.id, [])
            )), provenance=trial.provenance,
        )
        (eligible if eligibility == "eligible" else excluded).append(result)
    eligible.sort(key=lambda item: (-item.similarity, -item.coverage, item.trial_id))
    if not eligible:
        warnings.append("No eligible evidence for the explicit filters and coverage requirement.")
    if any(item.provenance == "synthetic" for item in eligible):
        warnings.append("Synthetic fixtures are software examples, not NASA measurements.")
    return RankingResponse(
        dataset_id=bundle.dataset_id, items=eligible[:request.limit], excluded=excluded,
        warnings=warnings,
    )
