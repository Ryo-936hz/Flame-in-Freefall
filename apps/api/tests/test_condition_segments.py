"""Artificial segment regressions only; these numbers are not NASA measurements."""

from copy import deepcopy

import pytest

from flamelab.domain.contracts import (
    CONDITION_UNITS, ComparisonRequest, DatasetBundle, RankingRequest,
)
from flamelab.science.comparison import compare_trials
from flamelab.science.profiling import profile_dataset
from flamelab.science.ranking import rank_trials


SOURCES = {name: f"synthetic:{name}-source" for name in
           ("trial", "segment", "control", "x", "observation", "endpoint")}


def _condition(key, value, source="control"):
    return {
        "value": value, "status": "known", "unit": CONDITION_UNITS.get(key),
        "original_value": str(value), "original_unit": CONDITION_UNITS.get(key),
        "evidence_ids": [SOURCES[source]],
    }


@pytest.fixture

def segmented_bundle():
    controls = {
        "oxygen_pct": 21, "pressure_kpa": 101.3, "material": "fictional_material",
        "geometry": "flat", "combustion_face": "face_a", "thickness_mm": 2,
        "sample_width_mm": 12, "flow_direction": "opposed", "gravity_regime": "microgravity",
    }
    values = {key: _condition(key, value) for key, value in controls.items()}
    values["diameter_mm"] = {"status": "not_applicable", "value": None, "unit": "mm"}
    trial_values = deepcopy(values)
    trial_values["flow_velocity_cm_s"] = _condition("flow_velocity_cm_s", 50, "trial")
    trial_values["oxygen_initial_pct"] = _condition("oxygen_initial_pct", 23, "endpoint")
    trial_values["oxygen_final_pct"] = _condition("oxygen_final_pct", 18, "endpoint")
    segments, observations = [], []
    # IDs and gaps deliberately disagree with order: sequence is source order, not time.
    for suffix, sequence, x, y in [("z", 2, 0, 1), ("a", 5, 5, 3), ("m", 9, 10, 5)]:
        conditions = deepcopy(values)
        conditions["flow_velocity_cm_s"] = _condition("flow_velocity_cm_s", x, "x")
        segments.append({
            "id": f"synthetic:segment-{suffix}", "sequence": sequence,
            "conditions": conditions, "evidence_ids": [SOURCES["segment"]],
        })
        observations.append({
            "id": f"synthetic:observation-{suffix}", "trial_id": "synthetic:trial-1",
            "segment_id": f"synthetic:segment-{suffix}", "metric": "flame_spread_rate_mm_s",
            "value": y, "unit": "mm/s", "evidence_ids": [SOURCES["observation"]],
            "provenance": "synthetic",
        })
    return DatasetBundle.model_validate({
        "schema_version": "1.1", "dataset_id": "synthetic:segment-regressions",
        "description": "Artificial test values only; no NASA measurement or scientific validation.",
        "studies": [{"id": "synthetic:study", "title": "Synthetic study", "family": "synthetic",
                     "dataset_status": "synthetic"}],
        "evidence": [{
            "id": ref, "study_id": "synthetic:study", "title": f"Synthetic {name} source",
            "text": "Invented for segment software tests.", "locator": "test_condition_segments.py",
            "provenance": "synthetic",
        } for name, ref in SOURCES.items()],
        "trials": [{
            "id": "synthetic:trial-1", "study_id": "synthetic:study",
            "sample_id": "synthetic:sample-1", "independent_unit_id": "synthetic:unit-1",
            "label": "One fictional specimen", "material_grade": "fixture-grade",
            "conditions": trial_values, "segments": segments,
            "evidence_ids": [SOURCES["trial"]], "provenance": "synthetic",
        }],
        "observations": observations,
    })


def _compare(bundle, **overrides):
    args = {
        "trial_ids": [trial.id for trial in bundle.trials],
        "x_condition": "flow_velocity_cm_s", "vary": ["flow_velocity_cm_s"],
        "allow_synthetic": True,
    }
    args.update(overrides)
    return compare_trials(bundle, ComparisonRequest(**args))


def _point_group(result, observation_id):
    point = next(point for point in result.points if point.observation_id == observation_id)
    return next(group for group in result.groups if group.id == point.group_id)


def test_three_segments_are_one_trial_and_one_independent_unit(segmented_bundle):
    result = _compare(segmented_bundle)
    assert len(result.groups) == 1
    group = result.groups[0]
    assert group.trial_ids == ["synthetic:trial-1"]
    assert group.n_trials == group.n_independent_units == 1
    assert group.n_observations == len(result.points) == 3
    assert group.median == 3 and group.interval is None
    assert [(point.x, point.y) for point in result.points] == [(0, 1), (5, 3), (10, 5)]
    assert {point.independent_unit_id for point in result.points} == {"synthetic:unit-1"}
    assert all(point.provenance == "synthetic" for point in result.points)


@pytest.mark.parametrize("key,value", [
    ("geometry", "cylinder"), ("combustion_face", "face_b"), ("pressure_kpa", 80),
    ("oxygen_pct", 19), ("flow_direction", "concurrent"), ("thickness_mm", 3),
])
def test_effective_segment_controls_split_groups(segmented_bundle, key, value):
    data = segmented_bundle.model_dump()
    data["trials"][0]["segments"][1]["conditions"][key] = _condition(key, value)
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 2
    changed = _point_group(result, "synthetic:observation-a")
    original = _point_group(result, "synthetic:observation-z")
    assert changed.id != original.id
    assert changed.conditions[key] == str(value)
    assert changed.n_trials == changed.n_independent_units == changed.n_observations == 1
    assert original.n_observations == 2
    assert all(group.n_independent_units == 1 for group in result.groups)


def test_flow_is_control_when_only_oxygen_is_varied(segmented_bundle):
    result = _compare(segmented_bundle, x_condition="oxygen_pct", vary=["oxygen_pct"])
    assert len(result.groups) == 3
    assert {group.conditions["flow_velocity_cm_s"] for group in result.groups} == {"0", "5", "10"}
    assert {point.x for point in result.points} == {21}


def test_missing_segment_control_does_not_inherit_from_trial(segmented_bundle):
    data = segmented_bundle.model_dump()
    del data["trials"][0]["segments"][0]["conditions"]["geometry"]
    result = _compare(DatasetBundle.model_validate(data))
    missing = _point_group(result, "synthetic:observation-z")
    assert missing.conditions["geometry_status"] == "not_reported"
    assert "control_unresolved:geometry:not_reported" in missing.warnings
    assert missing.n_observations == 1
    assert len(result.groups) == 2


def test_unresolved_segments_are_not_pooled_within_one_trial(segmented_bundle):
    data = segmented_bundle.model_dump()
    for segment in data["trials"][0]["segments"]:
        del segment["conditions"]["pressure_kpa"]
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 3
    assert all(group.n_observations == group.n_trials == group.n_independent_units == 1
               for group in result.groups)
    assert all("control_unresolved:pressure_kpa:not_reported" in group.warnings
               for group in result.groups)


def test_missing_segment_x_is_null_not_trial_value_or_sequence(segmented_bundle):
    data = segmented_bundle.model_dump()
    del data["trials"][0]["segments"][0]["conditions"]["flow_velocity_cm_s"]
    result = _compare(DatasetBundle.model_validate(data))
    point = next(point for point in result.points if point.observation_id == "synthetic:observation-z")
    assert point.segment_id == "synthetic:segment-z"
    assert point.x is None and point.y == 1
    assert any("x_unavailable" in warning and "flow_velocity_cm_s" in warning
               for warning in result.warnings)


def test_unassigned_observation_keeps_trial_context_without_guessing_segment(segmented_bundle):
    data = segmented_bundle.model_dump()
    data["observations"][0]["segment_id"] = None
    result = _compare(DatasetBundle.model_validate(data))
    point = next(point for point in result.points if point.observation_id == "synthetic:observation-z")
    assert point.segment_id is None
    assert point.trial_id == "synthetic:trial-1" and point.independent_unit_id == "synthetic:unit-1"
    assert point.x == 50 and point.y == 1
    assert any("unassigned" in warning for warning in result.warnings)


@pytest.mark.parametrize("key,value", [("oxygen_initial_pct", "23"), ("oxygen_final_pct", "18")])
def test_trial_oxygen_endpoints_are_context_not_segment_x(segmented_bundle, key, value):
    result = _compare(segmented_bundle)
    assert all(group.conditions[key] == value for group in result.groups)
    endpoint_axis = _compare(segmented_bundle, x_condition=key, vary=[key])
    assert endpoint_axis.points and all(point.x is None for point in endpoint_axis.points)
    assert endpoint_axis.x_unit == "%"
    assert any("x_unavailable" in warning for warning in endpoint_axis.warnings)
    assert all(key not in segment.conditions for segment in segmented_bundle.trials[0].segments)


def test_sequence_orders_points_but_does_not_replace_x(segmented_bundle):
    data = segmented_bundle.model_dump()
    data["trials"][0]["segments"].reverse()
    data["observations"].reverse()
    result = _compare(DatasetBundle.model_validate(data))
    assert [point.segment_id for point in result.points] == [
        "synthetic:segment-z", "synthetic:segment-a", "synthetic:segment-m",
    ]
    assert [point.x for point in result.points] == [0, 5, 10]


def test_reordering_bundle_and_references_preserves_comparison(segmented_bundle):
    data = segmented_bundle.model_dump()
    second_trial = deepcopy(data["trials"][0])
    second_trial["id"] = "synthetic:trial-2"
    second_trial["sample_id"] = "synthetic:sample-2"
    # A second recorded trial on the same independent specimen is still one unit.
    for segment in second_trial["segments"]:
        segment["id"] += "-second"
    data["trials"].append(second_trial)
    for observation in deepcopy(data["observations"]):
        observation["id"] += "-second"
        observation["trial_id"] = second_trial["id"]
        observation["segment_id"] += "-second"
        data["observations"].append(observation)
    for trial in data["trials"]:
        trial["evidence_ids"].append(SOURCES["control"])
        for segment in trial["segments"]:
            segment["evidence_ids"].append(SOURCES["x"])
    forward = _compare(DatasetBundle.model_validate(data))
    data["trials"].reverse()
    data["observations"].reverse()
    data["evidence"].reverse()
    for trial in data["trials"]:
        trial["evidence_ids"].reverse()
        trial["segments"].reverse()
        for segment in trial["segments"]:
            segment["evidence_ids"].reverse()
    backward = _compare(DatasetBundle.model_validate(data),
                        trial_ids=["synthetic:trial-2", "synthetic:trial-1", "synthetic:trial-2"])
    assert backward.model_dump() == forward.model_dump()
    assert len(forward.groups) == 1
    assert forward.groups[0].n_trials == 2
    assert forward.groups[0].n_independent_units == 1
    assert forward.groups[0].n_observations == 6


def test_point_references_cover_values_controls_and_trial_context_without_mutation(segmented_bundle):
    source = segmented_bundle.model_dump()
    result = _compare(segmented_bundle)
    for point in result.points:
        assert set(SOURCES.values()).issubset(point.evidence_ids)
        assert point.evidence_ids == sorted(set(point.evidence_ids))
    assert segmented_bundle.model_dump() == source
    condition = segmented_bundle.trials[0].segments[1].conditions["flow_velocity_cm_s"]
    assert condition.original_value == "5" and condition.original_unit == "cm/s"


def test_representations_of_segment_observations_keep_separate_medians(segmented_bundle):
    # Artificial labels test the schema; this is not a reviewed scientific corpus.
    data = segmented_bundle.model_dump()
    data["description"] = "Artificial provenance regression, not measured data."
    data["studies"][0]["dataset_status"] = "unverified"
    data["trials"][0]["provenance"] = "published"
    for evidence in data["evidence"]:
        evidence["provenance"] = "published"
    for observation in data["observations"]:
        observation["provenance"] = "published"
    data["observations"].append(dict(
        data["observations"][0], id="synthetic:derived-observation", value=99, provenance="derived",
    ))
    bundle = DatasetBundle.model_validate(data)
    result = _compare(bundle, allow_synthetic=False)
    assert len(result.groups) == 2
    assert {group.conditions["observation_provenance"]: group.median for group in result.groups} == {
        "published": 3, "derived": 99,
    }
    assert all(group.n_independent_units == group.n_trials == 1 for group in result.groups)
    assert profile_dataset(bundle).n_independent_units == 1


def test_ranking_keeps_trial_identity_and_recovers_segment_sources(segmented_bundle):
    result = rank_trials(segmented_bundle, RankingRequest(
        target={"material": "fictional_material", "flow_velocity_cm_s": 5},
        required_match=["material"], vary=["flow_velocity_cm_s"], allow_synthetic=True,
    ))
    assert [item.trial_id for item in result.items] == ["synthetic:trial-1"]
    assert set(SOURCES.values()).issubset(result.items[0].evidence_ids)
    assert result.items[0].similarity == result.items[0].coverage == 1


def test_profile_counts_trials_and_observations_without_segment_pseudoreplication(segmented_bundle):
    result = profile_dataset(segmented_bundle)
    assert result.n_trials == result.n_independent_units == 1
    assert result.n_observations == 3
    assert result.synthetic_trials == 1
    assert result.missing_by_condition["oxygen_initial_pct"]["known"] == 1


def test_segment_oxygen_absence_is_not_filled_from_trial_endpoints(segmented_bundle):
    data = segmented_bundle.model_dump()
    for segment in data["trials"][0]["segments"]:
        del segment["conditions"]["oxygen_pct"]
    result = _compare(DatasetBundle.model_validate(data), x_condition="oxygen_pct", vary=["oxygen_pct"])
    assert len(result.points) == 3
    assert all(point.x is None for point in result.points)
    assert {point.y for point in result.points} == {1, 3, 5}
    assert any("x_unavailable" in warning and "oxygen_pct" in warning for warning in result.warnings)


def test_missing_measurement_does_not_add_a_numeric_observation(segmented_bundle):
    data = segmented_bundle.model_dump()
    data["observations"][1].update(value=None, status="not_measured")
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 1
    group = result.groups[0]
    assert group.n_trials == group.n_independent_units == 1
    assert group.n_observations == len(result.points) == 2
    assert {point.y for point in result.points} == {1, 5}
    assert group.median == 3
    assert any("observation_missing:synthetic:observation-a:not_measured" in warning
               for warning in group.warnings)
