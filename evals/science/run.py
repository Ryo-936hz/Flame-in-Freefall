"""Reproducible software evaluation against explicit synthetic expectations."""

import argparse
import asyncio
import hashlib
import json
import math
from pathlib import Path

from flamelab.ai.engine import run_research
from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import ResearchRequest
from flamelab.science.profiling import profile_dataset

HERE = Path(__file__).resolve().parent
DEFAULT_FIXTURE = HERE.parents[1] / "data/fixtures/demo.json"


def _differences(expected, actual, path="result") -> list[dict]:
    if isinstance(expected, dict) and isinstance(actual, dict):
        if expected.keys() != actual.keys():
            return [{"path": path + ".keys", "expected": sorted(expected), "actual": sorted(actual)}]
        return [difference for key in expected
                for difference in _differences(expected[key], actual[key], f"{path}.{key}")]
    if isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            return [{"path": path + ".length", "expected": len(expected), "actual": len(actual)}]
        return [difference for index, (left, right) in enumerate(zip(expected, actual, strict=True))
                for difference in _differences(left, right, f"{path}[{index}]")]
    numeric = (isinstance(expected, (int, float)) and not isinstance(expected, bool)
               and isinstance(actual, (int, float)) and not isinstance(actual, bool))
    if numeric and math.isclose(expected, actual, rel_tol=1e-12, abs_tol=1e-12):
        return []
    if not numeric and type(expected) is type(actual) and expected == actual:
        return []
    return [{"path": path, "expected": expected, "actual": actual}]


def _summary(response) -> dict:
    comparison = response.comparison
    groups = sorted(comparison.groups, key=lambda group: tuple(sorted(group.trial_ids))) if comparison else []
    points = sorted(comparison.points, key=lambda point: point.observation_id) if comparison else []
    return {
        "status": response.status,
        "provider": response.provider,
        "selected_trial_ids": [item.trial_id for item in response.ranking.items],
        "similarities": [item.similarity for item in response.ranking.items],
        "coverages": [item.coverage for item in response.ranking.items],
        "excluded": [{"trial_id": item.trial_id, "eligibility": item.eligibility,
                      "reasons": sorted(item.reasons)} for item in response.ranking.excluded],
        "comparison_units": {"x": comparison.x_unit, "y": comparison.unit} if comparison else None,
        "points": [{"id": point.observation_id, "x": point.x, "y": point.y,
                    "independent_unit_id": point.independent_unit_id,
                    "evidence_ids": sorted(point.evidence_ids), "provenance": point.provenance}
                   for point in points],
        "groups": [{"trial_ids": sorted(group.trial_ids), "n_trials": group.n_trials,
                    "n_observations": group.n_observations,
                    "n_independent_units": group.n_independent_units,
                    "median": group.median, "interval": group.interval} for group in groups],
        "retrieved_evidence_ids": sorted(item.id for item in response.evidence),
        "hypothesis_count": len(response.hypotheses),
    }


def evaluate(suite_path: Path, fixture_path: Path) -> dict:
    suite_bytes = suite_path.read_bytes()
    suite = json.loads(suite_bytes.decode("utf-8"))
    cases = suite["cases"]
    if not isinstance(cases, list) or not cases:
        raise ValueError("evaluation requires nonempty cases")
    identifiers = [case["id"] for case in cases]
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("case IDs must be unique")
    with fixture_path.open("rb") as source:
        fixture_sha256 = hashlib.file_digest(source, "sha256").hexdigest()
    bundle = load_bundle(fixture_path)
    with fixture_path.open("rb") as source:
        if hashlib.file_digest(source, "sha256").hexdigest() != fixture_sha256:
            raise ValueError("fixture changed while loading the evaluation")
    if (not bundle.studies or any(study.dataset_status != "synthetic" for study in bundle.studies)
            or any(item.provenance != "synthetic" for item in bundle.evidence + bundle.trials + bundle.observations)):
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
        actual = _summary(response)
        failures = _differences(case["expected"], actual)
        results.append({"id": case["id"], "passed": not failures,
                        "failures": failures, "actual": actual})
    return {
        "evaluation_kind": "synthetic_software_regression_not_NASA_validation",
        "dataset_id": bundle.dataset_id,
        "inputs": {"suite_sha256": hashlib.sha256(suite_bytes).hexdigest(),
                   "fixture_sha256": fixture_sha256},
        "passed": not profile_failures and all(result["passed"] for result in results),
        "case_count": len(results), "profile": profile_summary,
        "profile_failures": profile_failures, "cases": results,
        "limits": ["No physical prediction or real data review is validated.",
                   "Cases use explicit structured filters, not natural-language parsing.",
                   "This fixed suite is not a held-out independent scientific benchmark."],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, default=HERE / "cases.json")
    parser.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
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
