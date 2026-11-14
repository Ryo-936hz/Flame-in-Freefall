"""Real HTTP walkthrough against an isolated SQLite database, including server restart."""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time

import httpx

from flamelab.config import ROOT

RANKING = {
    "target": {"gravity_regime": "microgravity", "material": "demo_polymer", "geometry": "sheet"},
    "required_match": ["gravity_regime", "material", "geometry"],
    "vary": ["flow_velocity_cm_s"], "allow_synthetic": True, "limit": 3,
}


def walkthrough(url):
    with httpx.Client(base_url=url, timeout=15) as client:
        def get(path):
            response = client.get("/api/v1" + path)
            response.raise_for_status()
            return response
        def post(path, body):
            response = client.post("/api/v1" + path, json=body)
            response.raise_for_status()
            return response.json()
        health = get("/health").json()
        assert health["ai_provider"] == "demo" and health["data_mode"] == "synthetic"
        assert get("/studies").json()
        profile = get("/datasets/profile").json()
        ranking = post("/rankings", RANKING)
        assert len(ranking["items"]) == 3
        run = post("/research", {"question": "Comparar la serie sintética de ventilación", "ranking": RANKING})
        assert run["status"] == "completed" and run["provider"] == "demo"
        assert run["comparison"]["points"] and all(point["provenance"] == "synthetic" for point in run["comparison"]["points"])
        evidence = get("/evidence/" + run["evidence"][0]["id"] + "?research_id=" + run["id"]).json()
        assert evidence["provenance"] == "synthetic" and evidence["source_url"] is None
        report = get(f"/research/{run['id']}/report").text
        assert "SINTÉTICOS" in report
        replay = get(f"/research/{run['id']}/events")
        assert replay.headers["x-event-mode"] == "replay" and '"live":false' in replay.text
        lunar = {**RANKING, "target": {**RANKING["target"], "gravity_regime": "lunar"}}
        scenarios = post("/scenarios/compare", {"scenario_a": RANKING, "scenario_b": lunar})
        assert scenarios["ranking_a"]["items"] and not scenarios["ranking_b"]["items"]
        insufficient = post("/research", {"question": "Aplicación lunar sin evidencia directa", "ranking": lunar})
        assert insufficient["status"] == "insufficient_evidence"
        missing = client.get("/api/v1/evidence/missing:id")
        assert missing.status_code == 404 and missing.json()["request_id"]
        assert get(f"/research/{run['id']}").json() == run
        return {"health": health, "profile": profile, "research_id": run["id"], "points": len(run["comparison"]["points"]), "report": report}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", help="Use an already-running demo API; no restart check")
    args = parser.parse_args()
    if args.base_url:
        result = walkthrough(args.base_url)
        print(json.dumps({key: value for key, value in result.items() if key != "report"}, ensure_ascii=False, indent=2))
        return
    (ROOT / "work").mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="http-smoke-", dir=ROOT / "work") as temp:
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
        env = {key: value for key, value in os.environ.items() if not key.startswith("FLAMELAB_")}
        env.update(FLAMELAB_AI_PROVIDER="demo", FLAMELAB_SEED_DEMO="true", FLAMELAB_DATABASE_URL=f"sqlite:///{Path(temp).as_posix()}/smoke.db")
        url = f"http://127.0.0.1:{port}"
        def start():
            process = subprocess.Popen([sys.executable, "-m", "uvicorn", "flamelab.main:app", "--host", "127.0.0.1", "--port", str(port)], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            for _ in range(80):
                if process.poll() is not None:
                    raise RuntimeError("smoke API failed to start")
                try:
                    if httpx.get(url + "/api/v1/health", timeout=0.5).status_code == 200:
                        return process
                except httpx.HTTPError:
                    pass
                time.sleep(0.1)
            process.terminate()
            process.wait(timeout=10)
            raise RuntimeError("smoke API startup timed out")
        process = start()
        try:
            result = walkthrough(url)
        finally:
            process.terminate()
            process.wait(timeout=10)
        process = start()
        try:
            response = httpx.get(url + "/api/v1/research/" + result["research_id"] + "/report")
            response.raise_for_status()
            assert response.text == result["report"]
        finally:
            process.terminate()
            process.wait(timeout=10)
        result.pop("report")
        result["restart_persistence"] = "passed"
        (ROOT / "work/smoke-result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"health": result["health"], "n_trials": result["profile"]["n_trials"], "points": result["points"], "restart_persistence": result["restart_persistence"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
