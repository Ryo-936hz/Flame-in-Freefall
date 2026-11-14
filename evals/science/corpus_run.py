"""Opt-in software checks of the unverified NASA corpus imported by P2, offline."""

import argparse
import asyncio
import hashlib
import json
from pathlib import Path

from run import _differences

from flamelab.ai.engine import run_research
from flamelab.config import Settings
from flamelab.domain.contracts import ComparisonRequest, DatasetBundle, ResearchRequest
from flamelab.science.comparison import compare_trials
from flamelab.science.profiling import profile_dataset

CHECKS_VERSION = "p3-nasa-corpus-software-v1"
EXPECTED_STUDIES = {
    f"psi:PSI-{number}" for number in (
        10, 20, 21, 22, 23, 25, 26, 39, 47, 60, 62, 68,
        69, 98, 99, 100, 101, 102, 106, 107, 115, 117, 142, 159,
    )
}
BASS_STUDY = "psi:PSI-25"
FLOW_SIX_SEGMENTS = sorted([
    "psi:PSI-25:M7:stage:2", "psi:PSI-25:M8:stage:2",
    "psi:PSI-25:M13:stage:1", "psi:PSI-25:M19:stage:2",
])
FLEX_TRIAL = "psi:PSI-69:test:16"
FLEX_METRIC = "flex_visible_flame_extinction_diameter_mm"


def evaluate(bundle_path: Path) -> dict:
    # Parse the same bytes that are fingerprinted; do not write/import the corpus.
    bundle_bytes = bundle_path.read_bytes()
    bundle = DatasetBundle.model_validate_json(bundle_bytes)
    if (bundle.dataset_id != "psi:nasa-local-corpus-v1" or bundle.schema_version != "1.1"
            or {study.id for study in bundle.studies} != EXPECTED_STUDIES
            or any(study.dataset_status == "synthetic" for study in bundle.studies)
            or any(item.provenance == "synthetic"
                   for item in bundle.trials + bundle.observations + bundle.evidence)):
        raise ValueError("Requires the P2 NASA 24-study corpus 1.1 without synthetic records")

    results = []

    def check(identifier, expected, actual):
        failures = _differences(expected, actual)
        results.append({"id": identifier, "passed": not failures,
                        "expected": expected, "actual": actual, "failures": failures})

    profile = profile_dataset(bundle)
    counts = {key: getattr(profile, key) for key in (
        "n_studies", "n_trials", "n_segments", "n_observations", "n_independent_units",
        "n_trials_with_unresolved_independence", "synthetic_trials",
    )}
    counts.update(
        known_observations=sum(item.status == "known" for item in bundle.observations),
        n_evidence=len(bundle.evidence),
        unreviewed_evidence=sum(not item.reviewed for item in bundle.evidence),
    )
    check("corpus_profile", {
        "n_studies": 24, "n_trials": 1058, "n_segments": 43, "n_observations": 1673,
        "known_observations": 1283, "n_independent_units": 20,
        "n_trials_with_unresolved_independence": 1038, "synthetic_trials": 0,
        "n_evidence": 2265, "unreviewed_evidence": 2265,
    }, counts)

    bass_trials = [trial for trial in bundle.trials if trial.study_id == BASS_STUDY]
    bass_ids = {trial.id for trial in bass_trials}
    bass_observations = [item for item in bundle.observations if item.trial_id in bass_ids]
    bass_segments = [segment for trial in bass_trials for segment in trial.segments]
    check("bass_import_shape", {
        "trials": 20, "segments": 43, "observations": 43, "known": 39, "not_measured": 4,
        "assigned_observations": 43, "identified_units": 20, "segment_oxygen_not_measured": 43,
        "unverified": True,
    }, {
        "trials": len(bass_trials), "segments": len(bass_segments), "observations": len(bass_observations),
        "known": sum(item.status == "known" for item in bass_observations),
        "not_measured": sum(item.status == "not_measured" for item in bass_observations),
        "assigned_observations": sum(item.segment_id is not None for item in bass_observations),
        "identified_units": len({trial.independent_unit_id for trial in bass_trials
                                 if trial.independent_unit_status == "identified"}),
        "segment_oxygen_not_measured": sum(
            "oxygen_pct" in segment.conditions and segment.conditions["oxygen_pct"].status == "not_measured"
            for segment in bass_segments
        ),
        "unverified": any(study.id == BASS_STUDY and study.dataset_status == "unverified"
                          for study in bundle.studies),
    })

    # Explicit demo ignores provider settings and does not open a database.
    settings = Settings(_env_file=None, ai_provider="demo", seed_demo=False,
                        openai_api_key=None, openai_model=None)

    def research(target, required):
        request = ResearchRequest(
            question="Software check of locally imported evidence; scientific review remains pending.",
            ranking={"condition_scope": "segment", "study_ids": [BASS_STUDY],
                     "target": target, "required_match": required, "allow_synthetic": False, "limit": 50},
            include_hypotheses=False,
        )
        return asyncio.run(run_research(request, bundle, settings))

    flow = research({"flow_velocity_cm_s": 6}, ["flow_velocity_cm_s"])
    flow_points = flow.comparison.points if flow.comparison else []
    check("bass_flow_six_segment_selection", {
        "status": "completed", "provider": "demo", "ranked_trials": 4, "points": 4,
        "point_segment_ids": FLOW_SIX_SEGMENTS, "eligible_segment_ids": FLOW_SIX_SEGMENTS,
        "scored_segment_ids": FLOW_SIX_SEGMENTS, "all_x_six": True, "identified_units": 4,
        "x_unit": "cm/s", "y_unit": "mm/s", "scientific_review_warning": True,
    }, {
        "status": flow.status, "provider": flow.provider, "ranked_trials": len(flow.ranking.items),
        "points": len(flow_points), "point_segment_ids": sorted(point.segment_id for point in flow_points),
        "eligible_segment_ids": sorted(segment_id for item in flow.ranking.items
                                       for segment_id in item.eligible_segment_ids),
        "scored_segment_ids": sorted(item.scored_segment_id for item in flow.ranking.items),
        "all_x_six": bool(flow_points) and all(point.x == 6 for point in flow_points),
        "identified_units": len({point.independent_unit_id for point in flow_points
                                 if point.independent_unit_status == "identified"}),
        "x_unit": flow.comparison.x_unit if flow.comparison else None,
        "y_unit": flow.comparison.unit if flow.comparison else None,
        "scientific_review_warning": any("awaiting scientific review" in warning for warning in flow.warnings),
    })

    for identifier, target in (
        ("bass_required_segment_oxygen", {"oxygen_pct": 21}),
        ("bass_lunar_insufficient", {"gravity_regime": "lunar"}),
    ):
        response = research(target, list(target))
        check(identifier, {"status": "insufficient_evidence", "provider": "demo",
                           "ranked_trials": 0, "points": 0, "comparison_absent": True}, {
            "status": response.status, "provider": response.provider, "ranked_trials": len(response.ranking.items),
            "points": len(response.comparison.points) if response.comparison else 0,
            "comparison_absent": response.comparison is None,
        })

    flex = compare_trials(bundle, ComparisonRequest(
        trial_ids=[FLEX_TRIAL, "psi:PSI-25:M8"], metric=FLEX_METRIC, x_condition="pressure_kpa",
    ))
    check("flex_campaign_and_unresolved_independence", {
        "points": 1, "trial_ids": [FLEX_TRIAL], "groups": 1, "identified_units": 0,
        "unresolved_trials": 1, "x_unit": "kPa", "y_unit": "mm", "bass_excluded_warning": True,
    }, {
        "points": len(flex.points), "trial_ids": sorted({point.trial_id for point in flex.points}),
        "groups": len(flex.groups), "identified_units": sum(group.n_independent_units for group in flex.groups),
        "unresolved_trials": sum(group.n_trials_with_unresolved_independence for group in flex.groups),
        "x_unit": flex.x_unit, "y_unit": flex.unit,
        "bass_excluded_warning": f"metric_outside_campaign:psi:PSI-25:M8:{FLEX_METRIC}" in flex.warnings,
    })

    observations = {item.id: item for item in bundle.observations}
    evidence = {item.id: item for item in bundle.evidence}
    points = flow_points + flex.points
    known = [item for item in bundle.observations if item.status == "known"]
    check("originals_units_and_source_references", {
        "known_checked": 1283, "known_with_original_and_unit": 1283, "points_checked": 5,
        "point_originals_preserved": True, "point_y_preserved": True, "point_sources_resolve": True,
        "measurement_sources_preserved": True, "flow_sources_retrieved": True, "intervals_null": True,
    }, {
        "known_checked": len(known), "known_with_original_and_unit": sum(
            item.original_value is not None and item.original_unit is not None for item in known
        ),
        "points_checked": len(points),
        "point_originals_preserved": bool(points) and all(
            (point.original_value, point.original_unit)
            == (observations[point.observation_id].original_value, observations[point.observation_id].original_unit)
            for point in points
        ),
        "point_y_preserved": bool(points) and all(point.y == observations[point.observation_id].value
                                                  for point in points),
        "point_sources_resolve": bool(points) and all(
            point.evidence_ids and all(ref in evidence and bool(evidence[ref].locator) for ref in point.evidence_ids)
            for point in points
        ),
        "measurement_sources_preserved": bool(points) and all(
            set(observations[point.observation_id].evidence_ids).issubset(point.evidence_ids) for point in points
        ),
        "flow_sources_retrieved": bool(flow_points) and all(
            set(point.evidence_ids).issubset(item.id for item in flow.evidence) for point in flow_points
        ),
        "intervals_null": bool(flow.comparison and flow.comparison.groups and flex.groups)
        and all(group.interval is None for group in [*flow.comparison.groups, *flex.groups]),
    })
    return {
        "evaluation_kind": "unverified_NASA_corpus_software_checks_not_scientific_validation",
        "checks_version": CHECKS_VERSION, "dataset_id": bundle.dataset_id,
        "inputs": {"bundle_sha256": hashlib.sha256(bundle_bytes).hexdigest(),
                   "checks_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        "passed": all(result["passed"] for result in results), "case_count": len(results),
        "counts": counts, "cases": results,
        "limits": [
            "Checks compare the current P2 import with explicit software expectations, not original sources.",
            "All evidence remains unreviewed; a passing result does not validate NASA measurements or licenses.",
            "Dataset and study IDs bound the suite; they do not authenticate the source bytes.",
            "Original values, units and reference identity are preserved; semantic citation support is not assessed.",
            "No raw observations or source text are included in this report; no database or external provider is used.",
            "No physical equivalence, causal inference, uncertainty interval or fire-safety conclusion is established.",
            "P2/P3 must review changed imports and version these expectations instead of regenerating them from output.",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        report = evaluate(args.bundle)
    except (OSError, ValueError, KeyError, TypeError) as error:
        # Validation errors can contain source values; never echo raw input.
        print(json.dumps({"passed": False, "error": type(error).__name__,
                          "message": "Invalid input; supply the unverified P2 NASA 24-study corpus 1.1."}))
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
