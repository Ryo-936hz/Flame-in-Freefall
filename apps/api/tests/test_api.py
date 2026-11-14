"""Integrated HTTP journey on temporary SQLite with explicit synthetic fixtures."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from flamelab.ai.provider import ProviderFailure
from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.main import create_app
from flamelab.storage.repository import Repository

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture
def client(tmp_path):
    settings = Settings(_env_file=None, ai_provider="demo", seed_demo=True,
                        database_url="sqlite:///" + (tmp_path / "api.db").as_posix())
    with TestClient(create_app(settings)) as connected:
        yield connected


def ranking(**updates):
    result = {
        "target": {"material": "demo_polymer", "geometry": "sheet",
                   "gravity_regime": "microgravity", "flow_velocity_cm_s": 5},
        "required_match": ["material", "geometry", "gravity_regime"],
        "vary": ["flow_velocity_cm_s"], "allow_synthetic": True,
    }
    result.update(updates)
    return result


def research_payload():
    return {"question": "Comparar esta serie explícitamente sintética.", "ranking": ranking()}


def assert_error(response, status, code=None):
    assert response.status_code == status
    body = response.json()
    assert set(body) == {"code", "message", "request_id"}
    assert body["request_id"] == response.headers["x-request-id"]
    assert body["request_id"]
    if code:
        assert body["code"] == code


def test_health_catalog_and_entity_reads(client):
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["data_mode"] == "synthetic"
    assert health.json()["database"] == "sqlite"
    studies = client.get("/api/v1/studies").json()
    assert len(studies) == 2
    assert all(study["dataset_status"] == "synthetic" for study in studies)
    trials = client.get("/api/v1/trials", params={"study_id": "synthetic:flow-study"}).json()
    assert len(trials) == 3
    trial = client.get("/api/v1/trials/synthetic:trial-1").json()
    assert trial["conditions"]["flow_velocity_cm_s"]["value"] == 2
    profile = client.get("/api/v1/datasets/profile").json()
    assert (profile["n_trials"], profile["n_observations"], profile["n_independent_units"]) == (5, 6, 5)
    assert profile["synthetic_trials"] == 5


def test_research_evidence_report_and_events_survive_corpus_change(client):
    response = client.post("/api/v1/research", json=research_payload())
    assert response.status_code == 200
    run = response.json()
    assert run["status"] == "completed" and run["provider"] == "demo"
    assert run["ranking"]["dataset_id"] == "synthetic:demo-v1"
    assert run["comparison"]["points"]
    assert all(point["provenance"] == "synthetic" for point in run["comparison"]["points"])
    assert all(item["label"] == "prepared_demo_hypothesis" for item in run["hypotheses"])
    run_url = "/api/v1/research/" + run["id"]
    assert client.get(run_url).json() == run
    evidence_id = run["evidence"][0]["id"]
    expected_evidence = client.get("/api/v1/evidence/" + evidence_id).json()
    report = client.get(run_url + "/report")
    assert report.status_code == 200
    assert "text/markdown" in report.headers["content-type"]
    assert "DATOS SINTÉTICOS" in report.text
    assert expected_evidence["locator"] in report.text
    events = client.get(run_url + "/events")
    assert events.headers["x-event-mode"] == "replay"
    assert events.headers["cache-control"] == "no-store"
    payloads = [json.loads(line[6:]) for line in events.text.splitlines()
                if line.startswith("data: ")]
    assert payloads[0] == {"replay": True, "live": False}
    assert payloads[1:] == run["events"]

    with client.app.state.sessions() as session:
        Repository(session).replace_bundle(load_bundle(ROOT / "data/catalog/psi_metadata.json"),
                                           allow_replace=True)
    assert client.get("/api/v1/health").json()["data_mode"] == "metadata_only"
    assert len(client.get("/api/v1/studies").json()) == 24
    assert client.get("/api/v1/trials").json() == []
    assert client.get(run_url + "/report").text == report.text
    assert_error(client.get("/api/v1/evidence/" + evidence_id), 404)
    historical = client.get("/api/v1/evidence/" + evidence_id,
                            params={"research_id": run["id"]})
    assert historical.json() == expected_evidence


@pytest.mark.parametrize("path", ["/api/v1/trials/missing:trial", "/api/v1/evidence/missing:evidence",
                                  "/api/v1/research/missing:run", "/does-not-exist"])
def test_not_found_is_canonical(client, path):
    assert_error(client.get(path), 404)


def test_validation_does_not_echo_private_input(client):
    marker = "private-input-never-return-this-value"
    invalid = research_payload() | {"unexpected_secret": marker}
    result = client.post("/api/v1/research", json=invalid)
    assert_error(result, 422, "validation_error")
    assert marker not in result.text
    assert "unexpected_secret" not in result.text


@pytest.mark.parametrize("payload", [
    {"target": {"oxygen_pct": True}},
    {"target": {"unknown_condition": 5}},
    {"target": {"oxygen_pct": 21}, "required_match": ["oxygen_pct"], "vary": ["oxygen_pct"]},
    {"required_match": ["geometry"]},
    {"target": {"flow_velocity_cm_s": -1}},
])
def test_invalid_scientific_filter_is_422(client, payload):
    assert_error(client.post("/api/v1/rankings", json=payload), 422, "validation_error")


def test_synthetic_opt_in_is_required(client):
    ranked = client.post("/api/v1/rankings", json=ranking(allow_synthetic=False))
    assert ranked.status_code == 200
    assert ranked.json()["items"] == []
    assert len(ranked.json()["excluded"]) == 5
    research = client.post("/api/v1/research", json={
        "question": "No utilizar datos sintéticos.", "ranking": ranking(allow_synthetic=False),
    }).json()
    assert research["status"] == "insufficient_evidence"
    assert research["comparison"] is None
    assert not research["claims"]
    comparison = client.post("/api/v1/comparisons", json={"trial_ids": ["synthetic:trial-1"]})
    assert comparison.status_code == 200
    assert comparison.json()["points"] == []


def test_empty_corpus_does_not_seed_without_configuration(tmp_path):
    settings = Settings(_env_file=None, ai_provider="demo", seed_demo=False,
                        database_url="sqlite:///" + (tmp_path / "empty.db").as_posix())
    with TestClient(create_app(settings)) as empty:
        assert empty.get("/api/v1/health").json()["data_mode"] == "empty"
        assert empty.get("/api/v1/studies").json() == []
        result = empty.post("/api/v1/research", json=research_payload())
        assert result.status_code == 200
        assert result.json()["status"] == "insufficient_evidence"
        assert result.json()["ranking"]["dataset_id"] == "system:empty"
        assert result.json()["evidence"] == []


def test_scenario_targets_change_ranking_without_claiming_simulation(client):
    a = ranking(vary=[])
    b = ranking(vary=[])
    a["target"]["flow_velocity_cm_s"] = 2
    b["target"]["flow_velocity_cm_s"] = 10
    result = client.post("/api/v1/scenarios/compare", json={
        "name_a": "Flow 2", "name_b": "Flow 10", "scenario_a": a, "scenario_b": b,
    })
    assert result.status_code == 200
    body = result.json()
    assert body["ranking_a"]["items"][0]["trial_id"] == "synthetic:trial-1"
    assert body["ranking_b"]["items"][0]["trial_id"] == "synthetic:trial-3"
    assert body["label"] == "evidence_comparison_not_physical_simulation"


def test_provider_failure_uses_canonical_http_error_without_fallback(client, monkeypatch):
    async def failure(*_args, **_kwargs):
        raise ProviderFailure("provider_timeout", 504)

    monkeypatch.setattr("flamelab.main.run_research", failure)
    result = client.post("/api/v1/research", json=research_payload())
    assert_error(result, 504, "provider_timeout")
    assert "summary" not in result.json()
