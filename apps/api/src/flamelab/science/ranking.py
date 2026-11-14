"""Explicit eligibility followed by weighted Gower similarity."""

from fractions import Fraction

from flamelab.domain.contracts import (
    METRIC_STUDIES, METRIC_UNITS, TRIAL_ONLY_CONDITIONS, DatasetBundle, Metric,
    RankedTrial, RankingContribution, RankingRequest,
    RankingResponse,
)
from flamelab.science.common import GOWER_SCALES_V1


def _score_conditions(conditions, request, active, total_weight, exclusions):
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
    # Exact intermediate sums avoid inf/inf and preserve tiny known weights
    # when a much larger weight belongs to an unavailable condition.
    known_weight = Fraction(0)
    weighted_distance = Fraction(0)
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
    return eligibility, similarity, coverage, reasons, contributions


def rank_trials(bundle: DatasetBundle, request: RankingRequest,
                metric_trial_ids: set[str] | None = None, *,
                metric: Metric | None = None) -> RankingResponse:
    """Rank physical trials; an explicit metric gates availability before top-k."""
    segment_mode = request.condition_scope == "segment"
    warnings = [
        "Gower v1 uses fixed software scales; similarity is not confidence, hazard or physical validity.",
        "Eligibility checks the explicit required_match filters; it does not prove physical comparability.",
    ]
    if segment_mode:
        warnings.append("segment_level_ranking: each trial score uses its best eligible explicit segment.")
        if metric_trial_ids is not None and metric is None:
            warnings.append("metric_availability_trial_only: metric_trial_ids cannot verify "
                            "availability within an eligible segment; pass metric explicitly.")
    elif any(trial.segments for trial in bundle.trials):
        warnings.append("trial_level_ranking: filters and Gower use explicit trial conditions; "
                        "segment conditions are not substituted or ranked independently.")
    active = {
        key: Fraction(request.weights.get(key, 1.0)) for key in request.target
        if key not in request.vary and request.weights.get(key, 1.0) > 0
    }
    total_weight = sum(active.values())
    trials = {trial.id: trial for trial in bundle.trials}
    metric_trials = set()
    metric_segments = set()
    metric_unit = METRIC_UNITS.get(metric)
    metric_studies = METRIC_STUDIES.get(metric)
    trial_refs = {}
    segment_refs = {}
    for obs in bundle.observations:
        trial_refs.setdefault(obs.trial_id, []).extend(obs.evidence_ids)
        if obs.segment_id is not None:
            segment_refs.setdefault(obs.segment_id, []).extend(obs.evidence_ids)
        if (metric is not None and metric_unit is not None and obs.metric == metric
                and obs.status == "known" and obs.unit == metric_unit
                and (request.allow_synthetic or obs.provenance != "synthetic")
                and (not metric_studies or trials[obs.trial_id].study_id in metric_studies)):
            metric_trials.add(obs.trial_id)
            # An unassigned observation never proves a segment's metric availability.
            if obs.segment_id is not None:
                metric_segments.add(obs.segment_id)
    eligible, excluded = [], []
    for trial in sorted(bundle.trials, key=lambda item: item.id):
        exclusions = []
        if request.study_ids and trial.study_id not in request.study_ids:
            exclusions.append("study_not_selected")
        if trial.provenance == "synthetic" and not request.allow_synthetic:
            exclusions.append("synthetic_not_allowed")
        if ((metric_trial_ids is not None and trial.id not in metric_trial_ids)
                or (metric is not None and trial.id not in metric_trials)):
            exclusions.append("requested_metric_unavailable")
        segments = sorted(trial.segments, key=lambda segment: segment.sequence)
        scored_segment = None
        accepted = []
        segment_reasons = []
        if segment_mode and segments:
            scored = [
                (segment, _score_conditions(
                    {key: value for key, value in segment.conditions.items()
                     if key not in TRIAL_ONLY_CONDITIONS},
                    request, active, total_weight,
                    [*exclusions, "requested_metric_unavailable_for_segment"]
                    if metric is not None and segment.id not in metric_segments else exclusions,
                ))
                for segment in segments
            ]
            accepted = [segment for segment, score in scored if score[0] == "eligible"]
            scored_segment, assessment = max(scored, key=lambda item: (
                item[1][0] == "eligible", item[1][0] == "indeterminate",
                item[1][1] if item[1][1] is not None else -1.0, item[1][2],
            ))
            segment_reasons = [
                f"segment_rejected:{segment.id}:{reason}"
                for segment, score in scored if score[0] != "eligible" and not exclusions
                for reason in score[3]
            ]
        elif segment_mode:
            assessment = _score_conditions({}, request, active, total_weight,
                                           [*exclusions, "trial_has_no_segments"])
        else:
            assessment = _score_conditions(trial.conditions, request, active, total_weight, exclusions)
        eligibility, similarity, coverage, reasons, contributions = assessment
        refs = [*trial.evidence_ids,
                *(ref for condition in trial.conditions.values() for ref in condition.evidence_ids)]
        for segment in accepted or segments:
            refs.extend(segment.evidence_ids)
            refs.extend(ref for condition in segment.conditions.values() for ref in condition.evidence_ids)
            if segment_mode:
                refs.extend(segment_refs.get(segment.id, []))
        if not segment_mode:
            refs.extend(trial_refs.get(trial.id, []))
        item = RankedTrial(
            trial_id=trial.id, similarity=similarity, coverage=coverage,
            scored_segment_id=scored_segment.id if scored_segment else None,
            eligible_segment_ids=[segment.id for segment in accepted],
            eligibility=eligibility, reasons=[*reasons, *segment_reasons], contributions=contributions,
            evidence_ids=sorted(set(refs)), provenance=trial.provenance,
        )
        (eligible if eligibility == "eligible" else excluded).append(item)
    eligible.sort(key=lambda item: (-item.similarity, -item.coverage, item.trial_id))
    items = eligible[:request.limit]
    if not eligible:
        warnings.append("No eligible evidence for the explicit filters and coverage requirement.")
    if any(item.provenance == "synthetic" for item in items):
        warnings.append("Synthetic fixtures are software examples, not NASA measurements.")
    unverified = {study.id for study in bundle.studies if study.dataset_status == "unverified"}
    if any(trials[item.trial_id].study_id in unverified for item in items):
        warnings.append("Selected evidence includes unverified data awaiting scientific review.")
    warnings.extend(f"source_note:{item.trial_id}:{note}"
                    for item in items for note in trials[item.trial_id].notes)
    return RankingResponse(dataset_id=bundle.dataset_id, items=items, excluded=excluded, warnings=warnings)
