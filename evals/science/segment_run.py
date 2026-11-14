"""Evaluate contract 1.1 segments against explicit synthetic expectations, offline."""

import argparse
import asyncio
import hashlib
import json
from pathlib import Path

from run import _differences

from flamelab.ai.engine import run_research
from flamelab.config import Settings
from flamelab.domain.contracts import DatasetBundle, ResearchRequest
from flamelab.science.profiling import profile_dataset

HERE = Path(__file__).resolve().parent


def _summary(response, bundle) -> dict:
    comparison = response.comparison
    points = comparison.points if comparison else []
    groups = comparison.groups if comparison else []
    segments = {segment.id: segment for trial in bundle.trials for segment in trial.segments}
    studies_by_trial = {trial.id: trial.study_id for trial in bundle.trials}
    group_summaries = [{
        "trial_ids": group.trial_ids,
        **{key: group.conditions.get(key) for key in (
            "geometry", "combustion_face", "oxygen_initial_pct", "oxygen_final_pct",
        )},
        "n_trials": group.n_trials, "n_observations": group.n_observations,
        "n_independent_units": group.n_independent_units,
        "median": group.median, "interval": group.interval,
    } for group in groups]
    group_summaries.sort(key=lambda group: (
        group["geometry"] or "", group["combustion_face"] or "", tuple(group["trial_ids"]),
    ))
    return {
        "status": response.status, "provider": response.provider,
        "selected_trial_ids": [item.trial_id for item in response.ranking.items],
        "similarities": [item.similarity for item in response.ranking.items],
        "coverages": [item.coverage for item in response.ranking.items],
        "comparison_units": {"x": comparison.x_unit, "y": comparison.unit} if comparison else None,
        # Preserve service order to verify reported sequence, including gaps and IDs
        # deliberately ordered opposite to sequence in the source fixture.
        "points": [{
            "observation_id": point.observation_id, "trial_id": point.trial_id,
            "segment_id": point.segment_id,
            "sequence": segments[point.segment_id].sequence if point.segment_id else None,
            "independent_unit_id": point.independent_unit_id,
            "x": point.x, "y": point.y, "provenance": point.provenance,
            "evidence_ids": sorted(point.evidence_ids),
        } for point in points],
        "groups": group_summaries,
        "observed_independent_units": len({
            (studies_by_trial[point.trial_id], point.independent_unit_id) for point in points
        }),
        "retrieved_evidence_ids": sorted(item.id for item in response.evidence),
        "missing_x_reported": bool(comparison and any(
            warning.startswith("x_unavailable:") for warning in comparison.warnings
        )),
        "hypothesis_count": len(response.hypotheses),
    }


def evaluate(suite_path: Path, fixture_path: Path) -> dict:
    suite_bytes = suite_path.read_bytes()
    fixture_bytes = fixture_path.read_bytes()
    suite = json.loads(suite_bytes)
    cases = suite["cases"]
    if not isinstance(cases, list) or not cases:
        raise ValueError("evaluation requires nonempty cases")
    identifiers = [case["id"] for case in cases]
    if len(set(identifiers)) != len(identifiers):
        raise ValueError("case IDs must be unique")
    bundle = DatasetBundle.model_validate_json(fixture_bytes)
    if (not bundle.studies
            or any(study.dataset_status != "synthetic" for study in bundle.studies)
            or any(item.provenance != "synthetic"
                   for item in bundle.trials + bundle.observations + bundle.evidence)):
        raise ValueError("this suite accepts only explicitly synthetic fixtures")
    profile = profile_dataset(bundle)
    profile_summary = {key: getattr(profile, key) for key in (
        "n_studies", "n_trials", "n_observations", "n_independent_units", "synthetic_trials",
    )}
    profile_failures = _differences(suite["expected_profile"], profile_summary, "profile")
    settings = Settings(ai_provider="demo", seed_demo=False)
    results = []
    for case in cases:
        request = ResearchRequest.model_validate(case["request"])
        response = asyncio.run(run_research(request, bundle, settings))
        actual = _summary(response, bundle)
        failures = _differences(case["expected"], actual)
        results.append({"id": case["id"], "passed": not failures,
                        "rationale": case["rationale"], "failures": failures, "actual": actual})
    return {
        "evaluation_kind": "synthetic_segment_software_regression_not_NASA_validation",
        "dataset_id": bundle.dataset_id,
        "inputs": {"suite_sha256": hashlib.sha256(suite_bytes).hexdigest(),
                   "fixture_sha256": hashlib.sha256(fixture_bytes).hexdigest()},
        "passed": not profile_failures and all(result["passed"] for result in results),
        "case_count": len(results), "profile": profile_summary,
        "profile_failures": profile_failures, "cases": results,
        "limits": [
            "No NASA measurements, physical prediction or real-data review are validated.",
            "Ranking and profile missingness remain trial-level; comparison uses explicit segment controls.",
            "Reported sequence is not elapsed time; repeated observations are not independent units.",
            "x=null observations remain visible but are not quantitative pairs.",
            "Expected answers are fixed synthetic regressions, not an independent scientific benchmark.",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, default=HERE / "segment_cases.json")
    parser.add_argument("--fixture", type=Path, default=HERE / "segment_fixture.json")
    args = parser.parse_args(argv)
    try:
        report = evaluate(args.cases, args.fixture)
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"passed": False, "error": type(error).__name__,
                          "message": "Invalid evaluation input; inspect cases and synthetic fixture."}))
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
