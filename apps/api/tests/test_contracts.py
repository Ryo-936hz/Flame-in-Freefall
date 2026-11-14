import copy
import math

import pytest
from pydantic import ValidationError

from flamelab.config import ROOT, Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import ConditionValue, DatasetBundle, Observation, RankingRequest, Study


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


def test_invalid_configuration_does_not_print_server_secret():
    with pytest.raises(ValidationError) as caught:
        Settings(_env_file=None, ai_provider="openai", openai_api_key="sensitive-sentinel", openai_model=None)
    assert "sensitive-sentinel" not in str(caught.value)
