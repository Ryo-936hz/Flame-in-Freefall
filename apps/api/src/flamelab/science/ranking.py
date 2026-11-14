"""Explicit eligibility followed by weighted Gower similarity."""

from fractions import Fraction

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
    if any(trial.segments for trial in bundle.trials):
        warnings.append(
            "trial_level_ranking: filters and Gower use explicit trial conditions; "
            "segment conditions are not substituted or ranked independently."
        )
    active = {
        key: Fraction(request.weights.get(key, 1.0))
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
        # Exact intermediate sums avoid inf/inf and preserve tiny known weights
        # when a much larger weight belongs to an unavailable condition.
        known_weight = Fraction(0)
        weighted_distance = Fraction(0)
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
                known_weight += active[key]
                if key in GOWER_SCALES_V1:
                    raw_distance = abs(Fraction(target) - Fraction(candidate)) / Fraction(GOWER_SCALES_V1[key])
                    exact_distance = min(Fraction(1), raw_distance)
                    note = "fixed_numeric_scale_v1"
                    if raw_distance > 1.0:
                        note += ":distance_clipped_at_one"
                else:
                    exact_distance = Fraction(0 if target == candidate else 1)
                    note = "categorical_equality"
                distance = float(exact_distance)
                weighted_distance += active[key] * exact_distance
            contributions.append(RankingContribution(
                variable=key, target=target, candidate=candidate, weight=weight,
                distance=distance, note=note,
            ))
        exact_coverage = known_weight / total_weight if total_weight else Fraction(0)
        coverage = float(exact_coverage)
        # Interpret the threshold's public decimal representation without letting
        # output rounding make incomplete evidence satisfy full coverage.
        minimum_coverage = Fraction(str(request.minimum_coverage))
        if not total_weight:
            indeterminate = True
            reasons.append("no_active_target_weights")
        elif not known_weight:
            indeterminate = True
            reasons.append("no_known_target_conditions")
        elif exact_coverage < minimum_coverage:
            indeterminate = True
            reasons.append("coverage_below_minimum")
            if coverage >= request.minimum_coverage:
                reasons.append("coverage_rounded_to_threshold")
        eligibility = "excluded" if rejection else "indeterminate" if indeterminate else "eligible"
        similarity = (
            float(1 - weighted_distance / known_weight)
            if eligibility == "eligible" else None
        )
        if eligibility == "eligible":
            reasons.append("explicit_requirements_satisfied")
        result = RankedTrial(
            trial_id=trial.id, similarity=similarity, coverage=coverage,
            eligibility=eligibility, reasons=reasons, contributions=contributions,
            evidence_ids=sorted(set(
                trial.evidence_ids
                + [ref for condition in trial.conditions.values() for ref in condition.evidence_ids]
                + [ref for segment in trial.segments for ref in segment.evidence_ids]
                + [ref for segment in trial.segments for condition in segment.conditions.values()
                   for ref in condition.evidence_ids]
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
