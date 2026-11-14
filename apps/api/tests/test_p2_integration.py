"""Opt-in real-source journey; CI does not require or redistribute the local PDFs."""

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from flamelab.config import Settings
from flamelab.data.cli import main
from flamelab.data.loader import load_bundle
from flamelab.main import create_app
from flamelab.storage.repository import Repository

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture
def bass_bundle_path():
    configured = os.environ.get("FLAMELAB_BASS_BUNDLE")
    if not configured:
        pytest.skip("Set FLAMELAB_BASS_BUNDLE to the locally extracted BASS-II bundle")
    path = Path(configured)
    assert path.is_file(), f"Configured BASS-II bundle does not exist: {path}"
    return path


def test_real_bass_import_research_sources_scenario_and_restart(bass_bundle_path, tmp_path):
    bundle = load_bundle(bass_bundle_path)
    assert len(bundle.trials) == 20
    assert len({trial.independent_unit_id for trial in bundle.trials}) == 20
    assert len(bundle.observations) == 43
    assert sum(obs.status == "known" for obs in bundle.observations) == 39
    assert all(trial.provenance == "published" for trial in bundle.trials)
    assert all(obs.condition_id for obs in bundle.observations)
    assert all(obs.original_value is not None for obs in bundle.observations)

    url = "sqlite:///" + (tmp_path / "bass.db").as_posix()
    assert main(["import", str(bass_bundle_path), "--database-url", url]) == 0
    assert main(["import", str(bass_bundle_path), "--database-url", url]) == 0
    settings = Settings(_env_file=None, database_url=url, ai_provider="demo", seed_demo=False)
    filters = {
        "target": {"flow_velocity_cm_s": 6},
        "required_match": ["flow_velocity_cm_s"],
        "allow_synthetic": False,
        "limit": 50,
    }
    with TestClient(create_app(settings)) as client:
        assert len(client.get("/api/v1/trials").json()) == 20
        profile = client.get("/api/v1/datasets/profile").json()
        assert profile["n_independent_units"] == 20
        assert profile["synthetic_trials"] == 0
        response = client.post("/api/v1/research", json={
            "question": "Show the published BASS-II observations at a flow of 6 cm/s.",
            "ranking": filters,
        })
        assert response.status_code == 200, response.text
        run = response.json()
        assert run["status"] == "completed"
        assert run["comparison"]["points"]
        assert {point["x"] for point in run["comparison"]["points"]} == {6}
        assert all(point["condition_id"] for point in run["comparison"]["points"])
        assert any("awaiting scientific review" in warning.lower() for warning in run["warnings"])
        assert any("Figure 5.2" in warning for warning in run["warnings"])
        evidence = next(item for item in run["evidence"] if item["page"] == 65)
        source_url = "/api/v1/evidence/" + evidence["id"]
        assert client.get(source_url).json() == evidence
        assert "5.1" in evidence["locator"]
        run_url = "/api/v1/research/" + run["id"]
        report = client.get(run_url + "/report")
        assert report.status_code == 200
        assert evidence["locator"] in report.text

        lunar = dict(filters, target={"gravity_regime": "lunar"},
                     required_match=["gravity_regime"])
        changed = client.post("/api/v1/scenarios/compare", json={
            "scenario_a": filters, "scenario_b": lunar,
        }).json()
        assert changed["ranking_a"]["items"]
        assert not changed["ranking_b"]["items"]
        insufficient = client.post("/api/v1/research", json={
            "question": "Show comparable lunar evidence.", "ranking": lunar,
        }).json()
        assert insufficient["status"] == "insufficient_evidence"
        with client.app.state.sessions() as session:
            repository = Repository(session)
            assert repository.replace_bundle(bundle) is False
            repository.replace_bundle(load_bundle(ROOT / "data/catalog/psi_metadata.json"),
                                      allow_replace=True)

    with TestClient(create_app(settings)) as reopened:
        assert reopened.get(run_url).json() == run
        assert reopened.get(run_url + "/report").text == report.text
        assert reopened.get(source_url, params={"research_id": run["id"]}).json() == evidence
        assert reopened.get("/api/v1/trials").json() == []
