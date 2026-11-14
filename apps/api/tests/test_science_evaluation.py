"""Check the synthetic evaluation and prove an incorrect expectation fails."""

import importlib.util
import json
from pathlib import Path

from flamelab.config import ROOT

EVAL_DIRECTORY = Path(__file__).resolve().parents[3] / "evals/science"
spec = importlib.util.spec_from_file_location("flamelab_science_evaluation", EVAL_DIRECTORY / "run.py")
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)
FIXTURE = ROOT / "data/fixtures/demo.json"


def test_three_explicit_cases_pass_without_provider_or_database(capsys):
    assert evaluation.main(["--cases", str(EVAL_DIRECTORY / "cases.json"),
                            "--fixture", str(FIXTURE)]) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["case_count"] == 3
    assert report["passed"] is True
    assert report["evaluation_kind"] == "synthetic_software_regression_not_NASA_validation"
    assert all(case["passed"] for case in report["cases"])


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
