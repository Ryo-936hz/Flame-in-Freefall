import copy
import math

import pytest
from pydantic import ValidationError

from flamelab.config import ROOT, Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import ConditionValue, DatasetBundle, Observation, RankingRequest, Study
from flamelab.domain.contracts import ComparisonRequest, ConditionSegment, Trial
from flamelab.science.comparison import compare_trials


@pytest.mark.parametrize("value", [True, False, math.nan, math.inf, -math.inf])
def test_numeric_conditions_reject_nonfinite_and_booleans(value):
    with pytest.raises(ValidationError):
        RankingRequest(target={"oxygen_pct": value})


@pytest.mark.parametrize("payload", [
    {"target": {"oxygen_pct": "21"}},
    {"target": {"gravity_regime": 0}},
    {"target": {"unrecognized": 1}},
    {"target": {"oxygen_pct": 21}, "weights": {"oxygen_pct": -1}},
    {"target": {"oxygen_pct": 21}, "required_match": ["material"]},
    {"target": {"oxygen_pct": 21}, "required_match": ["oxygen_pct"], "vary": ["oxygen_pct"]},
    {"target": {}, "weights": {"oxygen_pct": 1}},
])
def test_ranking_constraints(payload):
    with pytest.raises(ValidationError):
        RankingRequest.model_validate(payload)


def test_zero_is_known_and_null_is_missing():
    assert ConditionValue(value=0, status="known").value == 0
    for payload in ({"status": "known"}, {"value": 0, "status": "not_measured"}):
        with pytest.raises(ValidationError):
            ConditionValue.model_validate(payload)


@pytest.mark.parametrize("mutation", ["duplicate", "reference", "provenance", "unit", "known_without_evidence"])
def test_bundle_rejects_integrity_violations(mutation):
    data = load_bundle(ROOT / "data/fixtures/demo.json").model_dump(mode="json")
    if mutation == "duplicate":
        data["trials"].append(copy.deepcopy(data["trials"][0]))
    elif mutation == "reference":
        data["observations"][0]["trial_id"] = "unknown:trial"
    elif mutation == "provenance":
        data["observations"][0]["provenance"] = "published"
    elif mutation == "unit":
        data["trials"][0]["conditions"]["pressure_kpa"]["unit"] = "atm"
    else:
        data["trials"][0]["conditions"]["pressure_kpa"]["evidence_ids"] = []
    with pytest.raises(ValidationError):
        DatasetBundle.model_validate(data)


def test_uncertainty_and_unknown_metric_not_fabricated():
    with pytest.raises(ValidationError):
        Observation(id="test:o", trial_id="test:t", metric="heat_release_w", value=2, unit="W", evidence_ids=["test:e"], provenance="synthetic", uncertainty=0.1)


def test_catalog_urls_cannot_execute_script():
    with pytest.raises(ValidationError):
        Study(id="test:s", title="title", family="test", dataset_status="metadata_only", source_urls=["javascript:alert(1)"])


def test_sequential_segments_keep_one_trial_unit_and_observation_links():
    bundle = load_bundle(ROOT / "docs/examples/sequential_conditions.json")
    trial = bundle.trials[0]
    assert bundle.schema_version == "1.1"
    assert len(bundle.trials) == 1
    assert {observation.trial_id for observation in bundle.observations} == {trial.id}
    assert [segment.sequence for segment in trial.segments] == [1, 2]
    assert [observation.segment_id for observation in bundle.observations] == [
        segment.id for segment in trial.segments
    ]
    assert trial.conditions["oxygen_initial_pct"].value == 21
    assert trial.conditions["oxygen_final_pct"].value == 18
    comparison = compare_trials(
        bundle,
        ComparisonRequest(
            trial_ids=[trial.id], metric="flame_spread_rate_mm_s",
            x_condition="oxygen_pct", allow_synthetic=True,
        ),
    )
    assert [(point.x, point.segment_id) for point in comparison.points] == [
        (20, trial.segments[0].id), (19, trial.segments[1].id),
    ]


def test_observation_cannot_reference_a_segment_from_another_or_missing_trial():
    data = load_bundle(ROOT / "docs/examples/sequential_conditions.json").model_dump(mode="json")
    data["observations"][0]["segment_id"] = "demo:missing-segment"
    with pytest.raises(ValidationError, match="segment reference"):
        DatasetBundle.model_validate(data)


def test_invalid_configuration_does_not_print_server_secret():
    with pytest.raises(ValidationError) as caught:
        Settings(_env_file=None, ai_provider="openai", openai_api_key="sensitive-sentinel", openai_model=None)
    assert "sensitive-sentinel" not in str(caught.value)


@pytest.mark.parametrize("key", ["oxygen_pct", "oxygen_initial_pct", "oxygen_final_pct"])
@pytest.mark.parametrize("value", [0, 100])
def test_oxygen_bounds_are_accepted_in_trials_and_targets(key, value):
    trial = load_bundle(ROOT / "docs/examples/sequential_conditions.json").trials[0]
    data = trial.model_dump()
    data["conditions"][key] = {
        "value": value, "status": "known", "unit": "%",
        "original_value": str(value), "original_unit": "%",
        "evidence_ids": trial.evidence_ids,
    }
    assert Trial.model_validate(data).conditions[key].value == value
    assert RankingRequest(target={key: value}).target[key] == value


@pytest.mark.parametrize("key", ["oxygen_pct", "oxygen_initial_pct", "oxygen_final_pct"])
@pytest.mark.parametrize("value", [-1, 100.1, 150])
def test_oxygen_outside_bounds_is_rejected_in_trials_and_targets(key, value):
    trial = load_bundle(ROOT / "docs/examples/sequential_conditions.json").trials[0]
    data = trial.model_dump()
    data["conditions"][key] = {
        "value": value, "status": "known", "unit": "%",
        "evidence_ids": trial.evidence_ids,
    }
    with pytest.raises(ValidationError, match="admissible range"):
        Trial.model_validate(data)
    with pytest.raises(ValidationError, match="admissible range"):
        RankingRequest(target={key: value})


@pytest.mark.parametrize("key", ["oxygen_initial_pct", "oxygen_final_pct"])
@pytest.mark.parametrize("status,value", [("known", 21), ("not_reported", None)])
def test_trial_oxygen_endpoints_cannot_be_declared_in_segments(key, status, value):
    segment = load_bundle(ROOT / "docs/examples/sequential_conditions.json").trials[0].segments[0]
    data = segment.model_dump()
    data["conditions"][key] = {
        "value": value, "status": status, "unit": "%",
        "evidence_ids": segment.evidence_ids,
    }
    with pytest.raises(ValidationError):
        ConditionSegment.model_validate(data)


@pytest.mark.parametrize("value", [0, 100])
def test_effective_oxygen_is_allowed_in_segments(value):
    segment = load_bundle(ROOT / "docs/examples/sequential_conditions.json").trials[0].segments[0]
    data = segment.model_dump()
    data["conditions"]["oxygen_pct"]["value"] = value
    assert ConditionSegment.model_validate(data).conditions["oxygen_pct"].value == value


def test_legacy_bundle_remains_readable_without_segment_fields():
    data = load_bundle(ROOT / "data/fixtures/demo.json").model_dump()
    data["schema_version"] = "1.0"
    for trial in data["trials"]:
        trial.pop("segments")
    for observation in data["observations"]:
        observation.pop("segment_id")
    bundle = DatasetBundle.model_validate(data)
    assert bundle.schema_version == "1.0"
    assert all(not trial.segments for trial in bundle.trials)
    assert all(observation.segment_id is None for observation in bundle.observations)


def test_reported_sequence_can_have_gaps_and_observation_can_remain_unassigned():
    data = load_bundle(ROOT / "docs/examples/sequential_conditions.json").model_dump()
    data["trials"][0]["segments"][0]["sequence"] = 3
    data["trials"][0]["segments"][1]["sequence"] = 8
    data["observations"][0]["segment_id"] = None
    bundle = DatasetBundle.model_validate(data)
    assert [segment.sequence for segment in bundle.trials[0].segments] == [3, 8]
    assert bundle.observations[0].segment_id is None
    assert bundle.observations[1].segment_id == bundle.trials[0].segments[1].id


@pytest.mark.parametrize("key,model", [(" ", "mock"), ("test-only-sentinel", " "),
                                      ("\t", "\n")])
def test_blank_provider_configuration_is_rejected_without_exposing_key(key, model):
    with pytest.raises(ValidationError) as caught:
        Settings(_env_file=None, ai_provider="openai", openai_api_key=key, openai_model=model)
    assert "test-only-sentinel" not in str(caught.value)


def test_explicit_provider_model_surrounding_whitespace_is_normalized():
    settings = Settings(_env_file=None, ai_provider="openai", openai_api_key="test-only",
                        openai_model="  mock  ")
    assert settings.openai_model == "mock"
