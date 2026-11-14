"""HTTP acceptance checks for the P1/P3/P4 demo; all measurements are synthetic."""

import json
from copy import deepcopy
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import DatasetBundle
from flamelab.main import create_app
from flamelab.storage.models import ResearchRun
from flamelab.storage.repository import Repository

ROOT = Path(__file__).resolve().parents[3]


def settings_for(tmp_path):
    return Settings(_env_file=None, ai_provider="demo", seed_demo=True,
                    database_url="sqlite:///" + (tmp_path / "integrated-demo.db").as_posix())


def catalog_request():
    return {
        "question": "Comparar el flujo de los ensayos sintéticos.", "planning_mode": "catalog",
        "ranking": {
            "target": {"material": "demo_polymer", "geometry": "sheet",
                       "gravity_regime": "microgravity"},
            "required_match": ["material", "geometry", "gravity_regime"],
            "allow_synthetic": True,
        },
    }


def test_plan_preview_is_pure_and_does_not_execute_research(tmp_path, monkeypatch):
    def forbidden(*_args, **_kwargs):
        raise AssertionError("Preview must not query the corpus or run research")

    with TestClient(create_app(settings_for(tmp_path))) as client:
        monkeypatch.setattr("flamelab.main.Repository", forbidden)
        monkeypatch.setattr("flamelab.main.run_research", forbidden)
        response = client.post("/api/v1/research/plan", json=catalog_request())

        assert response.status_code == 200, response.text
        plan = response.json()
        assert plan["intent"] == "compare_varying_flow"
        assert plan["planning_mode"] == "catalog" and plan["blocked"] is False
        assert plan["x_condition"] == "flow_velocity_cm_s"
        assert plan["ranking"]["vary"] == ["flow_velocity_cm_s"]
        assert plan["metric"] == "flame_spread_rate_mm_s"
        with client.app.state.sessions() as session:
            assert session.scalar(select(func.count()).select_from(ResearchRun)) == 0


def test_catalog_plan_report_and_evidence_survive_corpus_replacement_and_restart(tmp_path):
    settings = settings_for(tmp_path)
    request = catalog_request()
    with TestClient(create_app(settings)) as client:
        preview = client.post("/api/v1/research/plan", json=request)
        assert preview.status_code == 200, preview.text
        response = client.post("/api/v1/research", json=request)
        assert response.status_code == 200, response.text
        run = response.json()
        assert run["status"] == "completed" and run["provider"] == "demo"
        assert run["plan"] == preview.json()
        assert len(run["comparison"]["points"]) == 4
        run_url = "/api/v1/research/" + run["id"]
        report = client.get(run_url + "/report").text
        assert run["plan"]["message"] in report
        source = run["evidence"][0]
        assert source["provenance"] == "synthetic"
        assert source["locator"] in report
        replay = client.get(run_url + "/events").text
        with client.app.state.sessions() as session:
            Repository(session).replace_bundle(load_bundle(ROOT / "data/catalog/psi_metadata.json"),
                                               allow_replace=True)

    with TestClient(create_app(settings)) as reopened:
        assert reopened.get("/api/v1/health").json()["data_mode"] == "metadata_only"
        assert reopened.get(run_url).json() == run
        assert reopened.get(run_url + "/report").text == report
        assert reopened.get(run_url + "/events").text == replay
        evidence_url = "/api/v1/evidence/" + source["id"]
        assert reopened.get(evidence_url).status_code == 404
        assert reopened.get(evidence_url, params={"research_id": run["id"]}).json() == source


def test_conflicting_catalog_plan_never_executes_analysis_or_provider(tmp_path, monkeypatch):
    def forbidden(*_args, **_kwargs):
        raise AssertionError("A blocked plan must not execute analysis or call a provider")

    request = catalog_request()
    request["ranking"]["target"]["flow_velocity_cm_s"] = 5
    request["ranking"]["required_match"].append("flow_velocity_cm_s")
    for name in ("rank_trials", "compare_trials", "profile_dataset", "synthesize"):
        monkeypatch.setattr("flamelab.ai.engine." + name, forbidden)
    with TestClient(create_app(settings_for(tmp_path))) as client:
        preview = client.post("/api/v1/research/plan", json=request)
        assert preview.status_code == 200 and preview.json()["blocked"] is True
        response = client.post("/api/v1/research", json=request)
        assert response.status_code == 200, response.text
        run = response.json()
        assert run["plan"] == preview.json()
        assert run["status"] == "insufficient_evidence"
        assert run["comparison"] is None
        assert not run["ranking"]["items"]
        assert not run["claims"] and not run["hypotheses"] and not run["evidence"]
        assert not {"retrieve", "analyze"}.intersection(event["stage"] for event in run["events"])


def test_omitted_planning_mode_preserves_explicit_filters(tmp_path):
    request = catalog_request()
    request.pop("planning_mode")
    request["ranking"]["target"]["flow_velocity_cm_s"] = 5
    request["ranking"]["required_match"].append("flow_velocity_cm_s")
    with TestClient(create_app(settings_for(tmp_path))) as client:
        response = client.post("/api/v1/research", json=request)
        assert response.status_code == 200, response.text
        run = response.json()
        assert run["status"] == "completed"
        assert run["plan"]["planning_mode"] == "explicit"
        assert run["plan"]["ranking"]["target"] == request["ranking"]["target"]
        assert run["plan"]["ranking"]["required_match"] == request["ranking"]["required_match"]
        assert run["plan"]["ranking"]["vary"] == []
        assert [point["trial_id"] for point in run["comparison"]["points"]] == ["synthetic:trial-2"]


def metric_bundle(metric):
    data = json.loads((ROOT / "evals/science/segment_fixture.json").read_text(encoding="utf-8"))
    first = data["trials"][0]
    original = [item for item in data["observations"] if item["trial_id"] == first["id"]]
    second = deepcopy(first)
    second.update(id="synthetic:z-supported-trial", sample_id="synthetic:supported-sample",
                  independent_unit_id="synthetic:supported-unit")
    for segment in second["segments"]:
        segment["id"] = segment["id"].replace("reference", "supported")
    missing_scope = next(item for item in original if item["segment_id"] == "synthetic:reference-segment-z")
    supported = deepcopy(next(item for item in original
                              if item["segment_id"] == "synthetic:reference-segment-a"))
    supported.update(id="synthetic:supported-observation", trial_id=second["id"],
                     segment_id="synthetic:supported-segment-a")
    data["trials"], data["observations"] = [first, second], [missing_scope, supported]
    if metric == "flex_burn_duration_s":
        old_study = first["study_id"]
        for item in data["trials"] + data["evidence"]:
            if item["study_id"] == old_study:
                item["study_id"] = "psi:PSI-69"
        for study in data["studies"]:
            if study["id"] == old_study:
                study["id"] = "psi:PSI-69"
        for observation in data["observations"]:
            observation.update(metric=metric, unit="s")
    return DatasetBundle.model_validate(data)


@pytest.mark.parametrize("metric", ["flame_spread_rate_mm_s", "flex_burn_duration_s"])
def test_http_research_applies_metric_at_selected_segment_before_limit(tmp_path, metric):
    with TestClient(create_app(settings_for(tmp_path))) as client:
        with client.app.state.sessions() as session:
            Repository(session).replace_bundle(metric_bundle(metric), allow_replace=True)
        request = {
            "question": "Synthetic explicit metric availability check.", "metric": metric,
            "ranking": {"condition_scope": "segment", "target": {"flow_velocity_cm_s": 10},
                        "required_match": ["flow_velocity_cm_s"], "limit": 1, "allow_synthetic": True},
        }
        response = client.post("/api/v1/research", json=request)
        assert response.status_code == 200, response.text
        run = response.json()
        assert run["status"] == "completed"
        assert run["plan"]["metric"] == run["comparison"]["metric"] == metric
        assert [item["trial_id"] for item in run["ranking"]["items"]] == ["synthetic:z-supported-trial"]
        point, = run["comparison"]["points"]
        assert (point["trial_id"], point["segment_id"], point["x"], point["y"]) == (
            "synthetic:z-supported-trial", "synthetic:supported-segment-a", 10, 3,
        )
        assert run["ranking"]["items"][0]["eligible_segment_ids"] == [point["segment_id"]]
        assert client.get("/api/v1/research/" + run["id"]).json() == run


def test_plan_preview_uses_canonical_sanitized_validation_errors(tmp_path):
    request = catalog_request() | {"planning_mode": "private-invalid-mode-marker"}
    with TestClient(create_app(settings_for(tmp_path))) as client:
        response = client.post("/api/v1/research/plan", json=request)
        assert response.status_code == 422
        assert response.json()["code"] == "validation_error"
        assert response.json()["request_id"] == response.headers["x-request-id"]
        assert request["planning_mode"] not in response.text



def test_http_scenarios_apply_optional_metric_to_both_condition_selections(tmp_path):
    first_id, second_id = "synthetic:reference-trial", "synthetic:z-supported-trial"
    scenario_a = {
        "condition_scope": "segment", "target": {"flow_velocity_cm_s": 10},
        "required_match": ["flow_velocity_cm_s"], "limit": 50, "allow_synthetic": True,
    }
    scenario_b = deepcopy(scenario_a)
    scenario_b["target"]["flow_velocity_cm_s"] = 0
    request = {"scenario_a": scenario_a, "scenario_b": scenario_b}
    with TestClient(create_app(settings_for(tmp_path))) as client:
        with client.app.state.sessions() as session:
            Repository(session).replace_bundle(metric_bundle("flame_spread_rate_mm_s"), allow_replace=True)

        unfiltered = client.post("/api/v1/scenarios/compare", json=request)
        assert unfiltered.status_code == 200, unfiltered.text
        assert unfiltered.json()["metric"] is None
        for key in ("ranking_a", "ranking_b"):
            assert {item["trial_id"] for item in unfiltered.json()[key]["items"]} == {first_id, second_id}

        filtered = client.post("/api/v1/scenarios/compare", json={
            **request, "metric": "flame_spread_rate_mm_s",
        })
        assert filtered.status_code == 200, filtered.text
        result = filtered.json()
        assert result["metric"] == "flame_spread_rate_mm_s"
        assert result["label"] == "evidence_comparison_not_physical_simulation"
        assert [item["trial_id"] for item in result["ranking_a"]["items"]] == [second_id]
        assert [item["trial_id"] for item in result["ranking_b"]["items"]] == [first_id]
        assert result["ranking_a"]["items"][0]["eligible_segment_ids"] == ["synthetic:supported-segment-a"]
        assert result["ranking_b"]["items"][0]["eligible_segment_ids"] == ["synthetic:reference-segment-z"]
