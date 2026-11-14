"""Behavior tests use synthetic fixtures exclusively; no NASA validation is claimed."""

import pytest

from flamelab.domain.contracts import (
    CONDITION_UNITS, ComparisonRequest, DatasetBundle, RankingRequest,
)
from flamelab.science.comparison import compare_trials
from flamelab.science.profiling import profile_dataset
from flamelab.science.ranking import rank_trials


@pytest.fixture
def science_bundle():
    conditions = {
        "oxygen_pct": 21, "pressure_kpa": 101.3, "flow_velocity_cm_s": 5,
        "material": "fictional_material", "geometry": "flat",
        "thickness_mm": 2, "sample_width_mm": 12, "flow_direction": "opposed",
        "gravity_regime": "microgravity",
    }
    values = {
        key: {"value": value, "status": "known", "unit": CONDITION_UNITS.get(key),
              "evidence_ids": ["synthetic:evidence"]}
        for key, value in conditions.items()
    }
    values["diameter_mm"] = {"value": None, "status": "not_applicable", "unit": "mm"}
    data = {
        "dataset_id": "synthetic:science-tests", "description": "Synthetic software tests only",
        "studies": [{"id": "synthetic:study", "title": "Synthetic study", "family": "synthetic",
                     "dataset_status": "synthetic"}],
        "evidence": [{"id": "synthetic:evidence", "study_id": "synthetic:study",
                      "title": "Synthetic evidence", "text": "Numbers invented for software tests.",
                      "locator": "test_science.py", "provenance": "synthetic", "reviewed": True}],
        "trials": [{"id": "synthetic:trial-1", "study_id": "synthetic:study",
                    "sample_id": "synthetic:sample-1", "independent_unit_id": "synthetic:unit-1",
                    "label": "Synthetic trial 1", "conditions": values, "material_grade": "fixture",
                    "evidence_ids": ["synthetic:evidence"], "provenance": "synthetic"}],
        "observations": [{"id": "synthetic:observation-1", "trial_id": "synthetic:trial-1",
                          "metric": "flame_spread_rate_mm_s", "value": 0.0, "unit": "mm/s",
                          "evidence_ids": ["synthetic:evidence"], "provenance": "synthetic"}],
    }
    return DatasetBundle.model_validate(data)


def _clone_trial(bundle, *, trial_id="synthetic:trial-2", x=10, y=0.5, same_unit=False):
    data = bundle.model_dump()
    trial = bundle.trials[0].model_dump()
    trial["id"] = trial_id
    trial["conditions"]["flow_velocity_cm_s"]["value"] = x
    if not same_unit:
        trial["independent_unit_id"] = "synthetic:unit-2"
        trial["sample_id"] = "synthetic:sample-2"
    data["trials"].append(trial)
    observation = bundle.observations[0].model_dump()
    observation.update(id="synthetic:observation-2", trial_id=trial_id, value=y)
    data["observations"].append(observation)
    return DatasetBundle.model_validate(data)


def _rank(bundle, **kwargs):
    kwargs.setdefault("target", {"flow_velocity_cm_s": 5})
    kwargs.setdefault("allow_synthetic", True)
    return rank_trials(bundle, RankingRequest(**kwargs))


def _compare(bundle, **kwargs):
    kwargs.setdefault("trial_ids", [trial.id for trial in bundle.trials])
    kwargs.setdefault("allow_synthetic", True)
    kwargs.setdefault("vary", ["flow_velocity_cm_s"])
    return compare_trials(bundle, ComparisonRequest(**kwargs))


def test_opt_in_segment_ranking_only_selects_explicit_matches(science_bundle):
    data = science_bundle.model_dump()
    trial = data["trials"][0]
    trial["segments"] = [
        {"id": "synthetic:explicit", "sequence": 1, "evidence_ids": trial["evidence_ids"],
         "conditions": {"flow_velocity_cm_s": trial["conditions"]["flow_velocity_cm_s"]}},
        {"id": "synthetic:unknown", "sequence": 2, "evidence_ids": trial["evidence_ids"],
         "conditions": {}},
    ]
    first = data["observations"][0]
    first["segment_id"] = "synthetic:explicit"
    data["observations"].append({**first, "id": "synthetic:unknown-observation",
                                 "segment_id": "synthetic:unknown"})
    bundle = DatasetBundle.model_validate(data)
    trial_ranking = _rank(bundle, required_match=["flow_velocity_cm_s"])
    assert len(trial_ranking.items) == 1
    assert trial_ranking.items[0].eligible_segment_ids == []
    ranking = _rank(bundle, condition_scope="segment", required_match=["flow_velocity_cm_s"])
    assert len(ranking.items) == 1
    assert ranking.items[0].scored_segment_id == "synthetic:explicit"
    assert ranking.items[0].eligible_segment_ids == ["synthetic:explicit"]
    all_points = _compare(bundle).points
    assert [(point.segment_id, point.x) for point in all_points] == [
        ("synthetic:explicit", 5), ("synthetic:unknown", None),
    ]
    filtered = _compare(bundle, segment_ids=ranking.items[0].eligible_segment_ids)
    assert [point.segment_id for point in filtered.points] == ["synthetic:explicit"]
    assert filtered.groups[0].n_segments == 1


def test_zero_is_known_and_not_imputed(science_bundle):
    result = _compare(science_bundle)
    assert result.points[0].y == 0
    assert result.groups[0].median == 0
    assert result.points[0].provenance == "synthetic"


def test_synthetic_requires_explicit_permission(science_bundle):
    result = _rank(science_bundle, allow_synthetic=False)
    assert not result.items
    assert result.excluded[0].eligibility == "excluded"
    assert "synthetic_not_allowed" in result.excluded[0].reasons
    assert not _compare(science_bundle, allow_synthetic=False).points


@pytest.mark.parametrize("target,weights,vary", [({}, {}, []), ({"oxygen_pct": 21}, {"oxygen_pct": 0}, []),
                                                   ({"oxygen_pct": 21}, {}, ["oxygen_pct"])])
def test_no_active_information_is_not_perfect_similarity(science_bundle, target, weights, vary):
    result = _rank(science_bundle, target=target, weights=weights, vary=vary)
    assert not result.items
    assert result.excluded[0].eligibility == "indeterminate"
    assert result.excluded[0].similarity is None
    assert result.excluded[0].coverage == 0


def test_required_condition_filters_even_at_zero_weight(science_bundle):
    result = _rank(science_bundle, target={"oxygen_pct": 30, "material": "fictional_material"},
                   weights={"oxygen_pct": 0}, required_match=["oxygen_pct"])
    assert not result.items
    assert result.excluded[0].eligibility == "excluded"
    assert "required_condition_mismatch:oxygen_pct" in result.excluded[0].reasons


def test_missing_critical_condition_is_indeterminate(science_bundle):
    data = science_bundle.model_dump()
    data["trials"][0]["conditions"]["oxygen_pct"] = {"status": "not_measured", "value": None}
    bundle = DatasetBundle.model_validate(data)
    result = _rank(bundle, target={"oxygen_pct": 21, "material": "fictional_material"},
                   required_match=["oxygen_pct"], minimum_coverage=0)
    assert result.excluded[0].eligibility == "indeterminate"
    assert result.excluded[0].coverage == 0.5


def test_missing_noncritical_condition_reduces_coverage(science_bundle):
    data = science_bundle.model_dump()
    del data["trials"][0]["conditions"]["oxygen_pct"]
    result = _rank(DatasetBundle.model_validate(data),
                   target={"oxygen_pct": 21, "material": "fictional_material"}, minimum_coverage=0.4)
    assert result.items[0].coverage == 0.5
    assert result.items[0].similarity == 1
    assert result.items[0].contributions[0].distance is None


def test_vary_removes_penalty_and_coverage_requirement(science_bundle):
    result = _rank(science_bundle, target={"oxygen_pct": 99, "material": "fictional_material"},
                   vary=["oxygen_pct"], required_match=["material"])
    assert result.items[0].coverage == 1
    assert result.items[0].similarity == 1
    assert result.items[0].contributions[0].weight == 0


def test_numeric_scale_is_stable_across_limit_and_corpus(science_bundle):
    bundle = _clone_trial(science_bundle)
    narrow = _rank(bundle, limit=1)
    wide = _rank(bundle, limit=50)
    assert narrow.items[0] == wide.items[0]
    assert wide.items[1].similarity == pytest.approx(0.95)
    filtered_data = bundle.model_dump()
    filtered_data["trials"] = filtered_data["trials"][1:]
    filtered_data["observations"] = filtered_data["observations"][1:]
    filtered = _rank(DatasetBundle.model_validate(filtered_data))
    assert filtered.items[0].similarity == wide.items[1].similarity


def test_study_filter_excludes_different_study(science_bundle):
    result = _rank(science_bundle, study_ids=["synthetic:unknown-study"])
    assert not result.items
    assert "study_not_selected" in result.excluded[0].reasons


def test_same_physical_unit_is_not_multiple_replicates(science_bundle):
    bundle = _clone_trial(science_bundle, same_unit=True)
    result = _compare(bundle)
    assert len(result.groups) == 1
    assert result.groups[0].n_trials == 2
    assert result.groups[0].n_observations == 2
    assert result.groups[0].n_independent_units == 1
    assert result.groups[0].median == 0.25
    assert result.groups[0].interval is None
    assert profile_dataset(bundle).n_independent_units == 1


def test_distinct_studies_and_grades_are_not_pooled(science_bundle):
    bundle = _clone_trial(science_bundle)
    data = bundle.model_dump()
    data["trials"][1]["material_grade"] = "other-formulation"
    assert len(_compare(DatasetBundle.model_validate(data)).groups) == 2
    data = bundle.model_dump()
    other_study = dict(data["studies"][0], id="synthetic:other-study")
    data["studies"].append(other_study)
    data["evidence"].append(dict(data["evidence"][0], id="synthetic:other-evidence",
                                 study_id="synthetic:other-study"))
    trial = data["trials"][1]
    trial["study_id"] = "synthetic:other-study"
    trial["evidence_ids"] = ["synthetic:other-evidence"]
    for condition in trial["conditions"].values():
        if condition["status"] == "known":
            condition["evidence_ids"] = ["synthetic:other-evidence"]
    data["observations"][1]["evidence_ids"] = ["synthetic:other-evidence"]
    assert len(_compare(DatasetBundle.model_validate(data)).groups) == 2


def test_missing_controls_are_not_treated_as_equal(science_bundle):
    bundle = _clone_trial(science_bundle)
    data = bundle.model_dump()
    for trial in data["trials"]:
        del trial["conditions"]["pressure_kpa"]
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 2
    assert all("isolated" in group.warnings[0] for group in result.groups)


def test_changing_axis_keeps_units_and_values(science_bundle):
    result = _compare(science_bundle, x_condition="oxygen_pct")
    assert result.x_condition == "oxygen_pct"
    assert result.x_unit == "%"
    assert result.points[0].x == 21
    assert result.unit == "mm/s"


def test_categorical_axis_does_not_fabricate_numeric_encoding(science_bundle):
    result = _compare(science_bundle, x_condition="material")
    assert result.x_unit is None
    assert result.points[0].x is None
    assert any("categorical_x_axis_not_supported" in warning for warning in result.warnings)


def test_unsupported_metric_does_not_mix_units(science_bundle):
    result = _compare(science_bundle, metric="other")
    assert not result.points and not result.groups
    assert any("unsupported_metric" in warning for warning in result.warnings)


def test_unknown_trial_has_explicit_error(science_bundle):
    with pytest.raises(KeyError, match="unknown"):
        _compare(science_bundle, trial_ids=["synthetic:unknown"])


def test_repeated_selection_does_not_duplicate_observations(science_bundle):
    result = _compare(science_bundle, trial_ids=["synthetic:trial-1", "synthetic:trial-1"])
    assert len(result.points) == result.groups[0].n_trials == 1


def test_missing_observation_stays_null(science_bundle):
    data = science_bundle.model_dump()
    data["observations"][0].update(value=None, status="not_extracted")
    result = _compare(DatasetBundle.model_validate(data))
    assert not result.points
    assert result.groups[0].median is None
    assert result.groups[0].n_observations == 0


def test_profile_counts_every_missing_state_and_known(science_bundle):
    data = science_bundle.model_dump()
    del data["trials"][0]["conditions"]["pressure_kpa"]
    result = profile_dataset(DatasetBundle.model_validate(data))
    assert result.missing_by_condition["pressure_kpa"]["not_reported"] == 1
    assert result.missing_by_condition["oxygen_pct"]["known"] == 1
    assert result.missing_by_condition["diameter_mm"]["not_applicable"] == 1
    assert result.missing_by_study["synthetic:study"]["oxygen_pct"]["known"] == 1
    assert result.synthetic_trials == 1


def test_empty_bundle_profile_and_ranking_are_explicit():
    bundle = DatasetBundle(dataset_id="empty:dataset", description="No observations")
    profile = profile_dataset(bundle)
    ranking = rank_trials(bundle, RankingRequest())
    assert profile.n_trials == profile.n_observations == profile.n_independent_units == 0
    assert not ranking.items and ranking.warnings


def _artificial_mixed_source_bundle(bundle):
    """Exercise non-synthetic provenance enums with invented numbers, never NASA data."""
    data = bundle.model_dump()
    data["description"] = "ARTIFICIAL regression case; published/derived labels test schema behavior."
    data["studies"][0]["dataset_status"] = "unverified"
    data["evidence"][0].update(provenance="published", reviewed=False)
    data["trials"][0]["provenance"] = "published"
    data["observations"][0].update(value=2.0, provenance="published")
    for index, provenance, value in [(2, "derived", 20.0), (3, "digitized", 200.0)]:
        ref = f"synthetic:artificial-source-{index}"
        data["evidence"].append(dict(data["evidence"][0], id=ref, provenance=provenance))
        data["observations"].append(dict(
            data["observations"][0], id=f"synthetic:observation-{index}",
            provenance=provenance, evidence_ids=[ref], value=value,
        ))
    return DatasetBundle.model_validate(data)


def test_measurement_provenances_do_not_share_a_median(science_bundle):
    bundle = _artificial_mixed_source_bundle(science_bundle)
    result = _compare(bundle)
    assert len(result.groups) == 3
    medians = {group.conditions["observation_provenance"]: group.median for group in result.groups}
    assert medians == {"published": 2.0, "derived": 20.0, "digitized": 200.0}
    assert all(group.n_trials == group.n_observations == group.n_independent_units == 1
               for group in result.groups)
    # Source representations of one trial do not create three physical units.
    assert profile_dataset(bundle).n_independent_units == 1
    groups = {group.id: group for group in result.groups}
    for point in result.points:
        assert groups[point.group_id].conditions["observation_provenance"] == point.provenance
    assert any("observation_provenance_split" in warning for warning in result.warnings)


def test_missing_derived_observation_does_not_borrow_published_value(science_bundle):
    data = _artificial_mixed_source_bundle(science_bundle).model_dump()
    data["observations"][1].update(value=None, status="not_extracted")
    result = _compare(DatasetBundle.model_validate(data))
    derived = next(group for group in result.groups
                   if group.conditions["observation_provenance"] == "derived")
    assert derived.n_observations == 0 and derived.median is None
    assert not any(point.provenance == "derived" for point in result.points)
    assert any("not_extracted" in warning for warning in derived.warnings)


def test_comparison_is_stable_under_equivalent_input_order(science_bundle):
    bundle = _clone_trial(science_bundle)
    forward = _compare(bundle)
    data = bundle.model_dump()
    data["trials"].reverse()
    data["observations"].reverse()
    backward = _compare(DatasetBundle.model_validate(data),
                        trial_ids=["synthetic:trial-2", "synthetic:trial-1", "synthetic:trial-2"])
    assert backward.model_dump() == forward.model_dump()


def test_three_observations_of_one_trial_are_not_three_replicates(science_bundle):
    data = science_bundle.model_dump()
    for index, value in [(2, 0.2), (3, 0.4)]:
        data["observations"].append(dict(data["observations"][0],
                                         id=f"synthetic:observation-{index}", value=value))
    bundle = DatasetBundle.model_validate(data)
    result = _compare(bundle)
    group = result.groups[0]
    assert len(result.points) == group.n_observations == 3
    assert group.n_trials == group.n_independent_units == 1
    assert group.median == 0.2 and group.interval is None
    assert profile_dataset(bundle).n_independent_units == 1
    # These are repeat observations at the same static X, not invented BASS segments.
    assert {point.x for point in result.points} == {5}


@pytest.mark.parametrize("scale", [1e-308, 1.0, 1e308])
def test_common_weight_scaling_preserves_scores_and_missing_coverage(science_bundle, scale):
    data = science_bundle.model_dump()
    del data["trials"][0]["conditions"]["pressure_kpa"]
    bundle = DatasetBundle.model_validate(data)
    result = _rank(bundle, target={"flow_velocity_cm_s": 15, "pressure_kpa": 100},
                   weights={"flow_velocity_cm_s": scale, "pressure_kpa": scale},
                   minimum_coverage=0.4)
    assert len(result.items) == 1
    item = result.items[0]
    assert item.coverage == 0.5
    assert item.similarity == pytest.approx(0.9)
    assert item.contributions[0].weight == scale


def test_large_finite_weights_do_not_make_coverage_nan(science_bundle):
    result = _rank(science_bundle, target={"material": "fictional_material", "oxygen_pct": 21},
                   weights={"material": 1e308, "oxygen_pct": 1e308})
    assert result.items[0].coverage == result.items[0].similarity == 1


def test_tiny_known_weight_is_not_a_missing_condition(science_bundle):
    data = science_bundle.model_dump()
    del data["trials"][0]["conditions"]["pressure_kpa"]
    result = _rank(DatasetBundle.model_validate(data),
                   target={"material": "fictional_material", "pressure_kpa": 100},
                   weights={"material": 1e-308, "pressure_kpa": 1e308}, minimum_coverage=0)
    assert len(result.items) == 1
    assert result.items[0].similarity == 1
    # Float coverage rounds down, but known information is not falsely declared absent.
    assert result.items[0].coverage == 0
    assert "no_known_target_conditions" not in result.items[0].reasons


@pytest.mark.parametrize("values,expected", [([1e308, 1e308], 1e308),
                                            ([5e-324, 1e-323], 1e-323),
                                            ([0, 2], 1)])
def test_finite_median_avoids_intermediate_overflow_and_underflow(science_bundle, values, expected):
    data = science_bundle.model_dump()
    data["observations"][0]["value"] = values[0]
    data["observations"].append(dict(data["observations"][0],
                                     id="synthetic:observation-2", value=values[1]))
    result = _compare(DatasetBundle.model_validate(data))
    assert result.groups[0].median == expected
    assert [point.y for point in result.points] == values


def test_known_literal_and_missing_state_are_not_pooled(science_bundle):
    data = _clone_trial(science_bundle).model_dump()
    data["trials"][0]["conditions"]["geometry"]["value"] = "not_applicable"
    data["trials"][1]["conditions"]["geometry"] = {"status": "not_applicable", "value": None}
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 2
    assert {group.conditions["geometry_status"] for group in result.groups} == {"known", "not_applicable"}


@pytest.mark.parametrize("grade", ["", "   "])
def test_blank_material_grade_cannot_prove_control_equivalence(science_bundle, grade):
    data = _clone_trial(science_bundle).model_dump()
    for trial in data["trials"]:
        trial["material_grade"] = grade
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 2
    assert all("material_grade_unresolved" in group.warnings for group in result.groups)


def test_missing_control_warning_identifies_variable_and_status(science_bundle):
    data = science_bundle.model_dump()
    data["trials"][0]["conditions"]["pressure_kpa"] = {"status": "not_measured", "value": None}
    result = _compare(DatasetBundle.model_validate(data))
    assert "control_unresolved:pressure_kpa:not_measured" in result.groups[0].warnings


def test_equivalent_numeric_controls_keep_one_group(science_bundle):
    data = _clone_trial(science_bundle).model_dump()
    data["trials"][1]["conditions"]["oxygen_pct"]["value"] = 21.0
    result = _compare(DatasetBundle.model_validate(data))
    assert len(result.groups) == 1


def test_unrepresentable_midpoint_is_explicit_instead_of_infinite(science_bundle):
    data = science_bundle.model_dump()
    huge = 10 ** 400
    data["observations"][0]["value"] = huge
    data["observations"].append(dict(data["observations"][0],
                                     id="synthetic:observation-2", value=huge + 1))
    result = _compare(DatasetBundle.model_validate(data))
    assert [point.y for point in result.points] == [huge, huge + 1]
    assert result.groups[0].median is None
    assert any(warning.startswith("median_unrepresentable:") for warning in result.groups[0].warnings)


def test_rounding_cannot_turn_incomplete_information_into_full_coverage(science_bundle):
    data = science_bundle.model_dump()
    del data["trials"][0]["conditions"]["pressure_kpa"]
    result = _rank(DatasetBundle.model_validate(data),
                   target={"material": "fictional_material", "pressure_kpa": 100},
                   weights={"material": 1, "pressure_kpa": 1e-20}, minimum_coverage=1)
    assert not result.items
    assert result.excluded[0].coverage == 1  # Float display rounded; exact eligibility did not.
    assert "coverage_below_minimum" in result.excluded[0].reasons
    assert "coverage_rounded_to_threshold" in result.excluded[0].reasons


@pytest.mark.parametrize("minimum,eligible", [(0.1, True), (0.10000000000000002, False)])
def test_coverage_decimal_boundary_is_not_shifted_by_binary_threshold(science_bundle, minimum, eligible):
    data = science_bundle.model_dump()
    del data["trials"][0]["conditions"]["pressure_kpa"]
    result = _rank(DatasetBundle.model_validate(data),
                   target={"material": "fictional_material", "pressure_kpa": 100},
                   weights={"material": 1, "pressure_kpa": 9}, minimum_coverage=minimum)
    assert bool(result.items) is eligible
