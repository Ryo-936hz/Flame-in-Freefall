"""Selection regressions use invented fixtures, never validated NASA measurements."""

import json
from copy import deepcopy
from pathlib import Path

import pytest

from flamelab.domain.contracts import METRIC_UNITS, ComparisonRequest, DatasetBundle, RankingRequest
from flamelab.science.comparison import compare_trials
from flamelab.science.ranking import rank_trials


@pytest.fixture
def selection_data():
    path = Path(__file__).resolve().parents[3] / "evals/science/segment_fixture.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    trial = data["trials"][0]
    data["trials"] = [trial]
    data["observations"] = [
        item for item in data["observations"] if item["trial_id"] == trial["id"]
    ]
    return data


def _compare(data, *, segment_ids=None, metric="flame_spread_rate_mm_s"):
    return compare_trials(DatasetBundle.model_validate(data), ComparisonRequest(
        trial_ids=[trial["id"] for trial in data["trials"]],
        segment_ids=segment_ids or [], metric=metric,
        vary=["flow_velocity_cm_s"], allow_synthetic=True,
    ))


def test_explicit_segment_selection_excludes_unsegmented_observations(selection_data):
    trial = selection_data["trials"][0]
    plain = deepcopy(trial)
    plain.update(id="synthetic:plain-trial", independent_unit_id="synthetic:plain-unit",
                 sample_id="synthetic:plain-sample", segments=[])
    selection_data["trials"].append(plain)
    observation = deepcopy(selection_data["observations"][0])
    observation.update(id="synthetic:plain-observation", trial_id=plain["id"], segment_id=None)
    selection_data["observations"].append(observation)
    selected_id = trial["segments"][0]["id"]

    unrestricted = _compare(selection_data)
    assert any(point.trial_id == plain["id"] for point in unrestricted.points)
    restricted = _compare(selection_data, segment_ids=[selected_id])

    assert [(point.trial_id, point.segment_id) for point in restricted.points] == [
        (trial["id"], selected_id),
    ]
    assert all(group.trial_ids == [trial["id"]] for group in restricted.groups)


def test_unselected_segment_controls_do_not_change_selected_groups(selection_data):
    trial = selection_data["trials"][0]
    selected_ids = [segment["id"] for segment in trial["segments"][:2]]
    before = _compare(selection_data, segment_ids=selected_ids)
    assert len(before.groups) == 1
    assert before.groups[0].n_observations == before.groups[0].n_segments == 2
    assert before.groups[0].n_independent_units == 1
    excluded = trial["segments"][2]
    excluded["conditions"]["ignition_power_w"] = {
        "status": "known", "value": 10, "unit": "W",
        "evidence_ids": excluded["evidence_ids"],
    }

    after = _compare(selection_data, segment_ids=selected_ids)

    assert after.points == before.points
    assert after.groups == before.groups


def test_segment_controls_do_not_inherit_optional_trial_controls(selection_data):
    trial = selection_data["trials"][0]
    selected_ids = [segment["id"] for segment in trial["segments"][:2]]
    before = _compare(selection_data, segment_ids=selected_ids)
    assert len(before.groups) == 1
    trial["conditions"]["ignition_power_w"] = {
        "status": "known", "value": 10, "unit": "W", "evidence_ids": trial["evidence_ids"],
    }

    after = _compare(selection_data, segment_ids=selected_ids)

    assert after.points == before.points
    assert after.groups == before.groups


def test_campaign_excluded_trial_controls_do_not_change_metric_groups(selection_data):
    # The campaign ID satisfies the metric contract; every value remains synthetic.
    campaign = "psi:PSI-69"
    trial = selection_data["trials"][0]
    old_study = trial["study_id"]
    trial["study_id"] = campaign
    for study in selection_data["studies"]:
        if study["id"] == old_study:
            study["id"] = campaign
    for evidence in selection_data["evidence"]:
        if evidence["study_id"] == old_study:
            evidence["study_id"] = campaign
    for observation in selection_data["observations"]:
        observation.update(metric="flex_burn_duration_s", unit="s")
    before = _compare(selection_data, metric="flex_burn_duration_s")
    assert len(before.groups) == 1

    other_study, other_source = "synthetic:other-study", "synthetic:other-source"
    selection_data["studies"].append({
        "id": other_study, "title": "Other synthetic campaign", "family": "synthetic",
        "dataset_status": "synthetic",
    })
    selection_data["evidence"].append({
        "id": other_source, "study_id": other_study, "title": "Synthetic source",
        "text": "Invented configuration outside the requested metric campaign.",
        "locator": "test_science_selection.py", "provenance": "synthetic",
    })
    selection_data["trials"].append({
        "id": "synthetic:other-trial", "study_id": other_study,
        "sample_id": "synthetic:other-sample", "independent_unit_id": "synthetic:other-unit",
        "label": "Excluded synthetic campaign", "material_grade": "fixture",
        "conditions": {"ignition_power_w": {
            "status": "known", "value": 10, "unit": "W", "evidence_ids": [other_source],
        }},
        "evidence_ids": [other_source], "provenance": "synthetic",
    })

    after = _compare(selection_data, metric="flex_burn_duration_s")

    assert any("metric_outside_campaign" in warning for warning in after.warnings)
    assert after.points == before.points
    assert after.groups == before.groups


def _with_metric(data, metric):
    data = deepcopy(data)
    if metric == "flex_burn_duration_s":
        old_study = data["trials"][0]["study_id"]
        for trial in data["trials"]:
            trial["study_id"] = "psi:PSI-69"
        for study in data["studies"]:
            if study["id"] == old_study:
                study["id"] = "psi:PSI-69"
        for evidence in data["evidence"]:
            if evidence["study_id"] == old_study:
                evidence["study_id"] = "psi:PSI-69"
    for observation in data["observations"]:
        observation.update(metric=metric, unit=METRIC_UNITS[metric])
    return data


def _segment_ranking(**overrides):
    args = {
        "condition_scope": "segment", "target": {"flow_velocity_cm_s": 10},
        "required_match": ["flow_velocity_cm_s"], "allow_synthetic": True, "limit": 1,
    }
    args.update(overrides)
    return RankingRequest(**args)


@pytest.mark.parametrize("metric", ["flame_spread_rate_mm_s", "flex_burn_duration_s"])
def test_metric_availability_on_eligible_segment_precedes_limit(selection_data, metric):
    data = _with_metric(selection_data, metric)
    first = data["trials"][0]
    second = deepcopy(first)
    second.update(id="synthetic:z-supported-trial", sample_id="synthetic:supported-sample",
                  independent_unit_id="synthetic:supported-unit")
    for segment in second["segments"]:
        segment["id"] = segment["id"].replace("reference", "supported")
    original = data["observations"]
    # The lexically first trial has the metric only on a rejected flow=0 segment.
    first_metric = next(o for o in original if o["segment_id"] == "synthetic:reference-segment-z")
    supported = deepcopy(next(o for o in original
                              if o["segment_id"] == "synthetic:reference-segment-a"))
    supported.update(id="synthetic:supported-observation", trial_id=second["id"],
                     segment_id="synthetic:supported-segment-a")
    data["trials"].append(second)
    data["observations"] = [first_metric, supported]

    result = rank_trials(DatasetBundle.model_validate(data), _segment_ranking(), metric=metric)

    assert [item.trial_id for item in result.items] == [second["id"]]
    assert result.items[0].eligible_segment_ids == ["synthetic:supported-segment-a"]
    rejected = next(item for item in result.excluded if item.trial_id == first["id"])
    assert any("requested_metric_unavailable_for_segment" in reason for reason in rejected.reasons)


def test_ranking_scores_best_segment_with_requested_measurement(selection_data):
    selection_data["observations"] = [
        item for item in selection_data["observations"]
        if item["segment_id"] == "synthetic:reference-segment-m"
    ]
    result = rank_trials(DatasetBundle.model_validate(selection_data),
                         _segment_ranking(required_match=[]), metric="flame_spread_rate_mm_s")

    assert result.items[0].scored_segment_id == "synthetic:reference-segment-m"
    assert result.items[0].eligible_segment_ids == ["synthetic:reference-segment-m"]
    assert result.items[0].contributions[0].candidate == 5


def test_unassigned_metric_is_available_to_trial_but_never_assigned_to_segment(selection_data):
    observation = deepcopy(selection_data["observations"][0])
    observation["segment_id"] = None
    selection_data["observations"] = [observation]
    bundle = DatasetBundle.model_validate(selection_data)

    segmented = rank_trials(bundle, _segment_ranking(), metric="flame_spread_rate_mm_s")
    trial_level = rank_trials(bundle, _segment_ranking(
        condition_scope="trial", target={"flow_velocity_cm_s": 99},
    ), metric="flame_spread_rate_mm_s")

    assert not segmented.items
    assert segmented.excluded[0].eligible_segment_ids == []
    assert len(trial_level.items) == 1
    assert bundle.observations[0].segment_id is None


@pytest.mark.parametrize("status,value,eligible", [("known", 0, True), ("not_reported", None, False)])
def test_metric_availability_requires_known_value_and_preserves_zero(
    selection_data, status, value, eligible,
):
    observation = next(item for item in selection_data["observations"]
                       if item["segment_id"] == "synthetic:reference-segment-a")
    observation.update(status=status, value=value)
    selection_data["observations"] = [observation]

    result = rank_trials(DatasetBundle.model_validate(selection_data), _segment_ranking(),
                         metric="flame_spread_rate_mm_s")

    assert bool(result.items) is eligible


def test_trial_only_metric_gate_warns_without_changing_legacy_segment_selection(selection_data):
    bundle = DatasetBundle.model_validate(selection_data)
    result = rank_trials(bundle, _segment_ranking(), {bundle.trials[0].id})

    assert len(result.items) == 1
    assert result.items[0].eligible_segment_ids == ["synthetic:reference-segment-a"]
    assert any("metric_availability_trial_only" in warning for warning in result.warnings)


def test_explicit_metric_respects_legacy_trial_gate_and_synthetic_permission(selection_data):
    bundle = DatasetBundle.model_validate(selection_data)
    gated = rank_trials(bundle, _segment_ranking(), set(), metric="flame_spread_rate_mm_s")
    denied = rank_trials(bundle, _segment_ranking(allow_synthetic=False),
                         metric="flame_spread_rate_mm_s")

    assert not gated.items and not denied.items
    assert "requested_metric_unavailable" in gated.excluded[0].reasons
    assert "synthetic_not_allowed" in denied.excluded[0].reasons


def test_unknown_metric_semantics_cannot_establish_availability(selection_data):
    for observation in selection_data["observations"]:
        observation.update(metric="other", unit="undefined")
    result = rank_trials(DatasetBundle.model_validate(selection_data), _segment_ranking(), metric="other")

    assert not result.items
    assert "requested_metric_unavailable" in result.excluded[0].reasons
