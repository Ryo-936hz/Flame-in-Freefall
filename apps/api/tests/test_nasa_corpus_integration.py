"""Opt-in end-to-end test against the extracted local NASA corpus."""

import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from flamelab.config import Settings
from flamelab.data.cli import main
from flamelab.main import create_app


def test_nasa_corpus_through_import_and_api(tmp_path, capsys):
    configured = os.getenv("FLAMELAB_NASA_BUNDLE")
    if not configured:
        pytest.skip("Set FLAMELAB_NASA_BUNDLE to the generated local NASA bundle")
    url = "sqlite:///" + (tmp_path / "nasa.db").as_posix()
    args = ["import", str(Path(configured)), "--database-url", url]
    for changed in (True, False):
        assert main(args) == 0
        assert json.loads(capsys.readouterr().out)["changed"] is changed

    settings = Settings(_env_file=None, database_url=url, ai_provider="demo", seed_demo=False)
    with TestClient(create_app(settings)) as client:
        prefix = "/api/v1"
        assert client.get(f"{prefix}/health").json()["schema_version"] == "1.1"
        studies = {item["id"]: item for item in client.get(f"{prefix}/studies").json()}
        assert len(studies) == 24
        bass = client.get(f"{prefix}/trials", params={"study_id": "psi:PSI-25"}).json()
        assert len(bass) == 20 and sum(len(trial["segments"]) for trial in bass) == 43
        for study_id in studies:
            page = client.get(f"{prefix}/studies/{study_id}/evidence", params={"limit": 1}).json()
            assert page["total"] >= 2
            assert page["items"][0]["study_id"] == study_id
        flex_url = f"{prefix}/studies/psi:PSI-69/observations"
        metric = "flex_visible_flame_extinction_diameter_mm"
        flex = client.get(flex_url, params={"metric": metric, "limit": 200}).json()
        second = client.get(flex_url, params={"metric": metric, "offset": 200}).json()
        assert flex["total"] == second["total"] > 200
        assert {row["id"] for row in flex["items"]}.isdisjoint(row["id"] for row in second["items"])
        record = next(row for row in flex["items"] if row["status"] == "known")
        assert record["unit"] == "mm" and record["original_value"]
        evidence = client.get(f"{prefix}/evidence/{record['evidence_ids'][0]}").json()
        assert evidence["study_id"] == "psi:PSI-69" and "CSV record" in evidence["locator"]
        catalog_only = client.get(f"{prefix}/studies/psi:PSI-68/observations").json()
        assert catalog_only["total"] == 0
        assert client.get(f"{prefix}/studies/missing:study/evidence").status_code == 404
        assert client.get(f"{prefix}/studies/psi:PSI-69/evidence?limit=201").status_code == 422

        response = client.post(f"{prefix}/comparisons", json={
            "trial_ids": [record["trial_id"], "psi:PSI-25:M1"],
            "metric": metric, "x_condition": "pressure_kpa",
        })
        assert response.status_code == 200, response.text
        body = response.json()
        assert {point["trial_id"] for point in body["points"]} == {record["trial_id"]}
        assert sum(group["n_independent_units"] for group in body["groups"]) == 0
        assert sum(group["n_trials_with_unresolved_independence"] for group in body["groups"]) == 1
        assert any("metric_outside_campaign" in warning for warning in body["warnings"])

        trial = client.get(f"{prefix}/trials/{record['trial_id']}").json()
        pressure = trial["conditions"]["pressure_kpa"]["value"]
        research = client.post(f"{prefix}/research", json={
            "question": "Show the reported FLEX extinction diameters at this pressure.",
            "metric": metric,
            "ranking": {"target": {"pressure_kpa": pressure}, "required_match": ["pressure_kpa"],
                        "vary": ["diameter_mm"]},
        })
        assert research.status_code == 200, research.text
        assert research.json()["status"] == "completed"
        assert all(item["trial_id"].startswith("psi:PSI-69:")
                   for item in research.json()["ranking"]["items"])
        assert research.json()["comparison"]["unit"] == "mm"
        assert research.json()["comparison"]["x_condition"] == "diameter_mm"
