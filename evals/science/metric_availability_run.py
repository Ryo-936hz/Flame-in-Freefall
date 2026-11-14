"""Reproduce metric/segment top-k starvation with synthetic data and the demo engine."""

import asyncio
import json
from copy import deepcopy
from pathlib import Path

from flamelab.ai.engine import run_research
from flamelab.config import Settings
from flamelab.domain.contracts import DatasetBundle, ResearchRequest


async def main():
    repo = Path(__file__).resolve().parents[2]
    data = json.loads((repo / "evals/science/segment_fixture.json").read_text(encoding="utf-8"))
    first = data["trials"][0]
    old_study, campaign = first["study_id"], "psi:PSI-69"
    first["study_id"] = campaign
    data["trials"] = [first]
    for study in data["studies"]:
        if study["id"] == old_study:
            study["id"] = campaign
    for evidence in data["evidence"]:
        if evidence["study_id"] == old_study:
            evidence["study_id"] = campaign
    # First trial has a matching flow=10 segment but its metric exists only at flow=0.
    first_observations = [o for o in data["observations"] if o["trial_id"] == first["id"]]
    first_metric = deepcopy(next(o for o in first_observations
                                 if o["segment_id"] == "synthetic:reference-segment-z"))
    first_metric.update(metric="flex_burn_duration_s", unit="s")
    data["observations"] = [first_metric]
    # Second trial has the requested metric at the eligible flow=10 segment.
    second = deepcopy(first)
    second.update(id="synthetic:z-supported-trial", sample_id="synthetic:supported-sample",
                  independent_unit_id="synthetic:supported-unit")
    for segment in second["segments"]:
        segment["id"] = segment["id"].replace("reference", "supported")
    supported = deepcopy(next(o for o in first_observations
                              if o["segment_id"] == "synthetic:reference-segment-a"))
    supported.update(id="synthetic:supported-observation", trial_id=second["id"],
                     segment_id="synthetic:supported-segment-a",
                     metric="flex_burn_duration_s", unit="s")
    data["trials"].append(second)
    data["observations"].append(supported)
    bundle = DatasetBundle.model_validate(data)
    request = ResearchRequest.model_validate({
        "question": "Synthetic test: duration at explicitly reported flow 10 cm/s.",
        "metric": "flex_burn_duration_s", "include_hypotheses": False,
        "ranking": {
            "condition_scope": "segment", "target": {"flow_velocity_cm_s": 10},
            "required_match": ["flow_velocity_cm_s"], "allow_synthetic": True, "limit": 1,
        },
    })
    settings = Settings(_env_file=None, ai_provider="demo")
    one = await run_research(request, bundle, settings)
    two_request = request.model_copy(update={"ranking": request.ranking.model_copy(update={"limit": 2})})
    two = await run_research(two_request, bundle, settings)

    def compact(result):
        return {
            "status": result.status,
            "selected": [{"trial_id": item.trial_id, "eligible_segment_ids": item.eligible_segment_ids}
                         for item in result.ranking.items],
            "points": [{"trial_id": point.trial_id, "segment_id": point.segment_id,
                        "x": point.x, "y": point.y} for point in result.comparison.points] if result.comparison else [],
            "warnings": result.comparison.warnings if result.comparison else [],
        }

    output = {
        "synthetic_only": True,
        "request": request.model_dump(mode="json"),
        "observations": [{"trial_id": o.trial_id, "segment_id": o.segment_id,
                          "metric": o.metric, "value": o.value} for o in bundle.observations],
        "limit_1": compact(one), "limit_2": compact(two),
        "expected": "Metric availability is checked for eligible segments before applying limit; "
                    "limit=1 should retain the supported second trial.",
    }
    # Fail if the coordinator stops forwarding the metric before top-k.
    output["passed"] = (
        one.status == "completed" and two.status == "completed"
        and [item.trial_id for item in one.ranking.items] == [second["id"]]
        and [item.trial_id for item in two.ranking.items] == [second["id"]]
        and one.ranking.items[0].eligible_segment_ids == [supported["segment_id"]]
        and one.comparison is not None and len(one.comparison.points) == 1
        and two.comparison is not None and two.comparison.points == one.comparison.points
        and one.comparison.points[0].trial_id == second["id"]
        and one.comparison.points[0].segment_id == supported["segment_id"]
        and one.comparison.points[0].x == 10 and one.comparison.points[0].y == 3
    )
    print(json.dumps(output, indent=2, ensure_ascii=False, allow_nan=False))
    return 0 if output["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
