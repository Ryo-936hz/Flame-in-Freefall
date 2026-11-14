"""Check the synthetic evaluation and prove an incorrect expectation fails."""

import hashlib
import importlib.util
import json
from pathlib import Path

import pytest

from flamelab.config import ROOT

EVAL_DIRECTORY = Path(__file__).resolve().parents[3] / "evals/science"
spec = importlib.util.spec_from_file_location("flamelab_science_evaluation", EVAL_DIRECTORY / "run.py")
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)
FIXTURE = ROOT / "data/fixtures/demo.json"


def test_six_explicit_cases_pass_without_provider_or_database(capsys):
    assert evaluation.main(["--cases", str(EVAL_DIRECTORY / "cases.json"),
                            "--fixture", str(FIXTURE)]) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["case_count"] == 6
    assert report["passed"] is True
    assert report["evaluation_kind"] == "synthetic_software_regression_not_NASA_validation"
    assert all(case["passed"] for case in report["cases"])
    assert report["inputs"]["suite_sha256"] == hashlib.sha256(
        (EVAL_DIRECTORY / "cases.json").read_bytes()).hexdigest()
    assert report["inputs"]["fixture_sha256"] == hashlib.sha256(FIXTURE.read_bytes()).hexdigest()


def test_wrong_expected_independent_count_returns_failure(tmp_path, capsys):
    cases = json.loads((EVAL_DIRECTORY / "cases.json").read_text(encoding="utf-8"))
    cases["cases"][0]["expected"]["groups"][0]["n_independent_units"] = 4
    changed = tmp_path / "incorrect.json"
    changed.write_text(json.dumps(cases), encoding="utf-8")
    assert evaluation.main(["--cases", str(changed), "--fixture", str(FIXTURE)]) == 1
    report = json.loads(capsys.readouterr().out)
    assert report["passed"] is False
    failures = report["cases"][0]["failures"]
    assert any(failure["path"].endswith("n_independent_units") for failure in failures)


def test_empty_suite_is_not_a_success(tmp_path, capsys):
    empty = tmp_path / "empty.json"
    empty.write_text('{"cases": []}', encoding="utf-8")
    assert evaluation.main(["--cases", str(empty), "--fixture", str(FIXTURE)]) == 2
    assert json.loads(capsys.readouterr().out)["passed"] is False


def test_non_synthetic_corpus_is_rejected(tmp_path, capsys):
    corpus = tmp_path / "metadata.json"
    corpus.write_text(json.dumps({
        "dataset_id": "test:metadata-only", "description": "Artificial non-synthetic test",
        "studies": [{"id": "test:study", "title": "Metadata test", "family": "test",
                     "dataset_status": "metadata_only"}],
    }), encoding="utf-8")
    assert evaluation.main(["--cases", str(EVAL_DIRECTORY / "cases.json"),
                            "--fixture", str(corpus)]) == 2
    assert json.loads(capsys.readouterr().out)["passed"] is False


def test_report_fingerprints_change_with_exact_input_bytes(tmp_path):
    cases = EVAL_DIRECTORY / "cases.json"
    original = evaluation.evaluate(cases, FIXTURE)
    changed_suite = tmp_path / "cases.json"
    changed_suite.write_bytes(cases.read_bytes() + b"\n")
    changed_fixture = tmp_path / "fixture.json"
    changed_fixture.write_bytes(FIXTURE.read_bytes() + b"\n")
    revised = evaluation.evaluate(changed_suite, changed_fixture)
    assert original["passed"] and revised["passed"]
    assert original["inputs"]["suite_sha256"] != revised["inputs"]["suite_sha256"]
    assert original["inputs"]["fixture_sha256"] != revised["inputs"]["fixture_sha256"]
    assert original["cases"] == revised["cases"]


@pytest.fixture
def segment_evaluation(monkeypatch):
    monkeypatch.syspath_prepend(str(EVAL_DIRECTORY))
    segment_spec = importlib.util.spec_from_file_location(
        "flamelab_segment_evaluation", EVAL_DIRECTORY / "segment_run.py",
    )
    module = importlib.util.module_from_spec(segment_spec)
    segment_spec.loader.exec_module(module)
    return module


def test_six_segment_cases_preserve_scopes_and_fixture(segment_evaluation, capsys):
    fixture = EVAL_DIRECTORY / "segment_fixture.json"
    original_hash = hashlib.sha256(fixture.read_bytes()).hexdigest()
    assert segment_evaluation.main([]) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["case_count"] == 6
    assert report["passed"] is True
    assert report["evaluation_kind"] == "synthetic_segment_software_regression_not_NASA_validation"
    assert all(case["passed"] for case in report["cases"])
    assert report["profile"]["n_segments"] == 6
    assert report["profile"]["n_independent_units"] == 3
    assert report["inputs"]["fixture_sha256"] == original_hash
    assert hashlib.sha256(fixture.read_bytes()).hexdigest() == original_hash


@pytest.mark.parametrize("field,value", [
    ("scored_segment_id", "synthetic:changed-segment-z"),
    ("eligible_segment_ids", ["synthetic:changed-segment-z", "synthetic:changed-segment-a"]),
])
def test_wrong_expected_segment_selection_fails(segment_evaluation, tmp_path, capsys, field, value):
    suite = json.loads((EVAL_DIRECTORY / "segment_cases.json").read_text(encoding="utf-8"))
    case = next(item for item in suite["cases"] if item["id"] == "segment_effective_geometry_and_face")
    case["expected"]["selected_segments"][0][field] = value
    changed = tmp_path / "incorrect-segment-selection.json"
    changed.write_text(json.dumps(suite), encoding="utf-8")
    assert segment_evaluation.main(["--cases", str(changed)]) == 1
    report = json.loads(capsys.readouterr().out)
    result = next(item for item in report["cases"] if item["id"] == case["id"])
    assert result["passed"] is False
    assert any(field in failure["path"] for failure in result["failures"])
