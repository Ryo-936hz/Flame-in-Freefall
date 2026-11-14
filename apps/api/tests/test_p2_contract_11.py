"""Compatibility checks for the shared segment contract and P2 additions."""

import copy

import pytest
from pydantic import ValidationError

from flamelab.config import ROOT
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import DatasetBundle


@pytest.fixture
def segmented_payload():
    payload = load_bundle(ROOT / "data/fixtures/demo.json").model_dump(mode="json")
    payload["schema_version"] = "1.1"
    trial = payload["trials"][0]
    flow = trial["conditions"]["flow_velocity_cm_s"]
    evidence_ids = trial["evidence_ids"]
    trial["segments"] = [
        {"id": "synthetic:first", "sequence": 1, "evidence_ids": evidence_ids,
         "conditions": {"flow_velocity_cm_s": flow}},
        {"id": "synthetic:second", "sequence": 2, "evidence_ids": evidence_ids,
         "conditions": {"burning_faces": {"value": 2, "status": "known", "unit": "count",
                                           "evidence_ids": evidence_ids},
                        "combustion_face": {"value": "upper", "status": "known",
                                            "evidence_ids": evidence_ids}}},
    ]
    payload["observations"][0]["segment_id"] = "synthetic:first"
    return payload


def test_segment_contract_preserves_face_count_identity_and_unlinked_observations(segmented_payload):
    bundle = DatasetBundle.model_validate(segmented_payload)
    count, identity = (bundle.trials[0].segments[1].conditions[key]
                       for key in ("burning_faces", "combustion_face"))
    assert bundle.schema_version == "1.1"
    assert (count.value, count.unit, identity.value, identity.unit) == (2, "count", "upper", None)
    assert [obs.segment_id for obs in bundle.observations if obs.trial_id == bundle.trials[0].id] == [
        "synthetic:first", None,
    ]
    assert load_bundle(ROOT / "data/fixtures/demo.json").schema_version == "1.0"


@pytest.mark.parametrize("violation", ["duplicate_sequence", "duplicate_id", "unbacked_segment", "cross_trial"])
def test_segment_contract_rejects_invalid_identity_and_evidence(segmented_payload, violation):
    segments = segmented_payload["trials"][0]["segments"]
    if violation == "duplicate_sequence":
        segments[1]["sequence"] = segments[0]["sequence"]
    elif violation == "duplicate_id":
        segmented_payload["trials"][1]["segments"] = copy.deepcopy(segments[:1])
    elif violation == "unbacked_segment":
        segments[0]["evidence_ids"] = ["synthetic:missing"]
    else:
        other_observation = next(obs for obs in segmented_payload["observations"]
                                 if obs["trial_id"] == segmented_payload["trials"][1]["id"])
        other_observation["segment_id"] = segments[0]["id"]
    with pytest.raises(ValidationError):
        DatasetBundle.model_validate(segmented_payload)
