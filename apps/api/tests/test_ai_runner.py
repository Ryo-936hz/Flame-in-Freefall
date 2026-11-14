"""Evaluation must fail for corrupted expectations, empty suites or real corpora."""

import importlib.util
import json

import pytest

from flamelab.config import ROOT


@pytest.fixture
def evaluator():
    specification = importlib.util.spec_from_file_location("ai_catalog_evaluator", ROOT / "evals/ai/run.py")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


def test_all_eighteen_offline_cases(evaluator, capsys):
    assert evaluator.main([]) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["passed"] and report["case_count"] == 18
    assert all(case["passed"] for case in report["cases"])
    assert report["inputs"]["fixture_sha256"] and report["inputs"]["suite_sha256"]


def test_corrupted_expectation_is_not_silently_regenerated(evaluator, tmp_path, capsys):
    suite = json.loads((ROOT / "evals/ai/cases.json").read_text(encoding="utf-8"))
    suite["cases"][0]["expected"]["points"] = 999
    changed = tmp_path / "wrong.json"
    changed.write_text(json.dumps(suite), encoding="utf-8")
    assert evaluator.main(["--cases", str(changed)]) == 1
    report = json.loads(capsys.readouterr().out)
    assert not report["passed"]
    assert report["cases"][0]["failures"][0]["path"] == "result.points"


@pytest.mark.parametrize("suite", [{"cases": []}, {"cases": [{"id": "empty", "expected": {}}]}])
def test_empty_or_unchecked_cases_are_invalid(evaluator, tmp_path, capsys, suite):
    invalid = tmp_path / "invalid.json"
    invalid.write_text(json.dumps(suite), encoding="utf-8")
    assert evaluator.main(["--cases", str(invalid)]) == 2
    assert not json.loads(capsys.readouterr().out)["passed"]


def test_real_metadata_does_not_become_synthetic_evaluation(evaluator, capsys):
    assert evaluator.main(["--fixture", str(ROOT / "data/catalog/psi_metadata.json")]) == 2
    assert not json.loads(capsys.readouterr().out)["passed"]
