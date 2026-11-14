"""Behavior tests use synthetic fixtures exclusively."""

import asyncio

import pytest
from pydantic import ValidationError

from flamelab.ai.engine import run_research
from flamelab.config import Settings
from flamelab.domain.contracts import (
    CONDITION_UNITS, ComparisonRequest, DatasetBundle, RankingRequest, ResearchRequest,
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


@pytest.fixture
def staged_data(science_bundle):
    data = science_bundle.model_dump()
    trial = data["trials"][0]
    evidence = data["evidence"][0]
    trial["condition_stages"] = []
    for order, flow in enumerate((0, 12), 1):
        stage_id = f"synthetic:stage-{order}"
        source = f"synthetic:stage-source-{order}"
        data["evidence"].append(dict(evidence, id=source))
        trial["condition_stages"].append({
            "id": stage_id, "order": order,
            "conditions": {
                "flow_velocity_cm_s": {"value": flow, "status": "known", "unit": "cm/s",
                                       "evidence_ids": [source]},
                "oxygen_pct": {"status": "not_measured"},
            },
        })
        obs = dict(
            data["observations"][0], id=f"synthetic:observation-{order}", condition_id=stage_id,
            value=order / 2, original_value=f"{order / 2:.2f}", original_unit="mm/s",
            evidence_ids=[source],
        )
        if order == 1:
            data["observations"][0] = obs
        else:
            data["observations"].append(obs)
    trial["conditions"]["oxygen_initial_pct"] = {
        "value": 23, "unit": "%", "status": "known", "evidence_ids": [evidence["id"]],
    }
    return data


@pytest.mark.parametrize("violation,error", [
    ("stage_order", "contiguous order"),
    ("duplicate_stage", "duplicate condition stage"),
    ("foreign_stage", "must belong to its trial"),
    ("missing_stage", "require a condition stage"),
    ("wrong_source", "evidence reference is missing"),
    ("oxygen_endpoint_at_stage", "trial-only conditions"),
])
def test_staged_bundle_rejects_ambiguous_conditions(staged_data, violation, error):
    trial = staged_data["trials"][0]
    stage = trial["condition_stages"][0]
    if violation == "stage_order":
        stage["order"] = 3
    elif violation == "duplicate_stage":
        trial["condition_stages"][1]["id"] = stage["id"]
    elif violation == "foreign_stage":
        staged_data["trials"].append(dict(
            trial, id="synthetic:foreign-trial",
            condition_stages=[dict(stage, id="synthetic:foreign-stage")],
        ))
        staged_data["observations"][0]["condition_id"] = "synthetic:foreign-stage"
    elif violation == "missing_stage":
        staged_data["observations"][0]["condition_id"] = None
    elif violation == "wrong_source":
        stage["conditions"]["flow_velocity_cm_s"]["evidence_ids"] = ["synthetic:unknown"]
    else:
        stage["conditions"]["oxygen_initial_pct"] = trial["conditions"]["oxygen_initial_pct"]
    with pytest.raises(ValidationError, match=error):
        DatasetBundle.model_validate(staged_data)


def test_comparison_joins_each_observation_to_its_stage(staged_data):
    bundle = DatasetBundle.model_validate(staged_data)
    result = _compare(bundle)
    assert [(point.condition_id, point.x, point.y) for point in result.points] == [
        ("synthetic:stage-1", 0, 0.5), ("synthetic:stage-2", 12, 1),
    ]
    group, = result.groups
    assert (group.n_trials, group.n_condition_stages, group.n_observations, group.n_independent_units) == (1, 2, 2, 1)
    assert "synthetic:stage-source-1" in result.points[0].evidence_ids
    assert "synthetic:stage-source-2" not in result.points[0].evidence_ids
    assert result.points[0].original_value == "0.50"
    assert result.points[0].original_unit == "mm/s"
    assert len(_compare(bundle, vary=[]).groups) == 2
    oxygen = _compare(bundle, x_condition="oxygen_pct", vary=["oxygen_pct"])
    assert all(point.x is None for point in oxygen.points)
    assert any("x_unavailable:synthetic:stage-1:oxygen_pct" in item for item in oxygen.warnings)
    profile = profile_dataset(bundle)
    assert (profile.n_trials, profile.n_condition_stages, profile.n_independent_units) == (1, 2, 1)
    assert profile.missing_by_stage_condition["oxygen_pct"]["not_measured"] == 2


def test_rank_and_research_only_use_matching_stages(staged_data):
    bundle = DatasetBundle.model_validate(staged_data)
    ranking = RankingRequest(
        target={"flow_velocity_cm_s": 12}, required_match=["flow_velocity_cm_s"], allow_synthetic=True,
    )
    request = ResearchRequest(question="Which evidence matches the required flow?", ranking=ranking)
    response = asyncio.run(run_research(request, bundle, Settings(_env_file=None, ai_provider="demo")))
    trial, = response.ranking.items
    assert trial.scored_condition_id == "synthetic:stage-2"
    assert trial.eligible_condition_ids == ["synthetic:stage-2"]
    assert "condition_stage_rejected:synthetic:stage-1:required_condition_mismatch:flow_velocity_cm_s" in trial.reasons
    assert [point.x for point in response.comparison.points] == [12]
    assert {evidence.id for evidence in response.evidence} == {
        "synthetic:evidence", "synthetic:stage-source-2",
    }
    oxygen = _rank(bundle, target={"oxygen_pct": 23}, required_match=["oxygen_pct"])
    assert oxygen.excluded[0].eligibility == "indeterminate"
    assert oxygen.excluded[0].coverage == 0


def test_comparison_rejects_stage_outside_selected_trials(staged_data):
    bundle = DatasetBundle.model_validate(staged_data)
    with pytest.raises(KeyError, match="unknown-stage"):
        _compare(bundle, condition_ids=["synthetic:unknown-stage"])
