"""Explicit eligibility followed by weighted Gower similarity."""

from flamelab.domain.contracts import (
    DatasetBundle, RankedTrial, RankingContribution, RankingRequest, RankingResponse,
)
from flamelab.science.common import GOWER_SCALES_V1, effective_conditions


def _score(conditions, request, total_weight, exclusions):
    reasons = list(exclusions)
    rejection = bool(exclusions)
    indeterminate = False
    for key in request.required_match:
        candidate = conditions.get(key)
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
        condition = conditions.get(key)
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
    return eligibility, similarity, coverage, reasons, contributions


def rank_trials(bundle: DatasetBundle, request: RankingRequest) -> RankingResponse:
    """Rank physical trials using their best eligible condition without mixing stages."""
    eligible = []
    excluded = []
    warnings = [
        "Gower v1 uses fixed software scales; similarity is not confidence, hazard or physical validity.",
        "Eligibility checks the explicit required_match filters; it does not prove physical comparability.",
    ]
    total_weight = sum(
        request.weights.get(key, 1.0) for key in request.target if key not in request.vary
    )
    observation_refs = {}
    for observation in bundle.observations:
        key = (observation.trial_id, observation.condition_id)
        observation_refs.setdefault(key, []).extend(observation.evidence_ids)
    trials_by_id = {trial.id: trial for trial in bundle.trials}
    for trial in sorted(bundle.trials, key=lambda item: item.id):
        exclusions = []
        if request.study_ids and trial.study_id not in request.study_ids:
            exclusions.append("study_not_selected")
        if trial.provenance == "synthetic" and not request.allow_synthetic:
            exclusions.append("synthetic_not_allowed")
        scores = []
        for stage in trial.condition_stages or [None]:
            conditions = effective_conditions(trial, stage)
            score = _score(conditions, request, total_weight, exclusions)
            scores.append((stage.id if stage else None, conditions, score))
        # max() retains the first stage on a tie, preserving source order.
        scored_id, _, score = max(scores, key=lambda item: (
            item[2][0] == "eligible", item[2][0] == "indeterminate",
            item[2][1] if item[2][1] is not None else -1.0, item[2][2],
        ))
        eligibility, similarity, coverage, score_reasons, contributions = score
        reasons = list(score_reasons)
        accepted = [item for item in scores if item[2][0] == "eligible"]
        evidence_ids = list(trial.evidence_ids)
        for stage_id, conditions, stage_score in scores:
            if not accepted or stage_score[0] == "eligible":
                evidence_ids.extend(ref for value in conditions.values() for ref in value.evidence_ids)
                evidence_ids.extend(observation_refs.get((trial.id, stage_id), []))
            if stage_id and stage_score[0] != "eligible" and not exclusions:
                reasons.extend(
                    f"condition_stage_rejected:{stage_id}:{reason}" for reason in stage_score[3]
                )
        result = RankedTrial(
            trial_id=trial.id, scored_condition_id=scored_id,
            eligible_condition_ids=[stage_id for stage_id, _, _ in accepted if stage_id is not None],
            similarity=similarity, coverage=coverage, eligibility=eligibility, reasons=reasons,
            contributions=contributions, evidence_ids=list(dict.fromkeys(evidence_ids)),
            provenance=trial.provenance,
        )
        (eligible if eligibility == "eligible" else excluded).append(result)
    eligible.sort(key=lambda item: (-item.similarity, -item.coverage, item.trial_id))
    items = eligible[:request.limit]
    if not items:
        warnings.append("No eligible evidence for the explicit filters and coverage requirement.")
    if any(item.provenance == "synthetic" for item in items):
        warnings.append("Synthetic fixtures are software examples, not NASA measurements.")
    if any(item.eligible_condition_ids for item in items):
        warnings.append("A staged trial's similarity describes its best eligible stage; stages share the same physical trial.")
    unverified_studies = {study.id for study in bundle.studies if study.dataset_status == "unverified"}
    unreviewed_evidence = {entry.id for entry in bundle.evidence if not entry.reviewed}
    if any(trials_by_id[item.trial_id].study_id in unverified_studies
           or unreviewed_evidence.intersection(item.evidence_ids) for item in items):
        warnings.append("Selected evidence includes unverified data awaiting scientific review.")
    warnings.extend(
        f"source_note:{item.trial_id}:{note}"
        for item in items for note in trials_by_id[item.trial_id].notes
    )
    return RankingResponse(
        dataset_id=bundle.dataset_id, items=items, excluded=excluded, warnings=warnings,
    )
