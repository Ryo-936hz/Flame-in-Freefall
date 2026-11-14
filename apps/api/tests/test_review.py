"""Independent integration regressions discovered during the base review."""

import asyncio

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import TypeAdapter, ValidationError

from flamelab.ai.engine import run_research
from flamelab.ai.provider import Narrative, ProviderFailure, synthesize
from flamelab.ai.report import render_report
from flamelab.config import ROOT, Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import (
    Claim, Citation, DatasetBundle, Identifier, RankingRequest, ResearchRequest,
)
from flamelab.main import create_app
from flamelab.science.ranking import rank_trials
from flamelab.storage.database import create_engine_and_session, migrate
from flamelab.storage.repository import Repository


@pytest.fixture
def review_bundle():
    return load_bundle(ROOT / "data/fixtures/demo.json")


def request_for(bundle):
    trial = bundle.trials[0]
    return ResearchRequest(
        question="Synthetic integration review; no NASA measurement claim.",
        ranking=RankingRequest(
            target={"material": trial.conditions["material"].value},
            required_match=["material"], vary=["flow_velocity_cm_s"],
            allow_synthetic=True,
        ),
    )


def test_ranked_trial_exposes_condition_and_observation_evidence(review_bundle):
    data = review_bundle.model_dump()
    study_id = data["trials"][0]["study_id"]
    for identifier in ("synthetic:condition-only", "synthetic:observation-only"):
        evidence = dict(data["evidence"][0], id=identifier, study_id=study_id)
        data["evidence"].append(evidence)
    data["trials"][0]["conditions"]["oxygen_pct"]["evidence_ids"] = ["synthetic:condition-only"]
    data["observations"][0]["evidence_ids"] = ["synthetic:observation-only"]
    bundle = DatasetBundle.model_validate(data)
    result = rank_trials(bundle, request_for(bundle).ranking)
    selected = next(item for item in result.items if item.trial_id == bundle.trials[0].id)
    assert "synthetic:condition-only" in selected.evidence_ids
    assert "synthetic:observation-only" in selected.evidence_ids


def test_external_citation_to_measurement_source_is_valid(review_bundle, monkeypatch):
    data = review_bundle.model_dump()
    data["evidence"].append(dict(data["evidence"][0], id="synthetic:measurement-source"))
    data["observations"][0]["evidence_ids"] = ["synthetic:measurement-source"]
    bundle = DatasetBundle.model_validate(data)

    async def narrative(_context, _settings):
        return Narrative(summary="Synthetic data only.", claims=[Claim(
            text="The selected trial reports a flame spread rate of 0.05 mm/s.",
            kind="finding", citations=[Citation(
                evidence_id="synthetic:measurement-source", trial_id=bundle.trials[0].id,
            )],
        )])

    monkeypatch.setattr("flamelab.ai.engine.synthesize", narrative)
    settings = Settings(_env_file=None, ai_provider="openai", openai_api_key="test-only", openai_model="mock")
    run = asyncio.run(run_research(request_for(bundle), bundle, settings))
    assert run.claims[0].citations[0].evidence_id == "synthetic:measurement-source"
    assert "DATOS SINTÉTICOS" in render_report(run)


def test_external_cross_trial_citation_is_rejected(review_bundle, monkeypatch):
    async def narrative(_context, _settings):
        return Narrative(summary="Must be rejected.", claims=[Claim(
            text="Unsupported association between a source and a different trial.", kind="finding",
            citations=[Citation(evidence_id=review_bundle.trials[1].evidence_ids[0],
                                trial_id=review_bundle.trials[0].id)],
        )])

    monkeypatch.setattr("flamelab.ai.engine.synthesize", narrative)
    settings = Settings(_env_file=None, ai_provider="openai", openai_api_key="test-only", openai_model="mock")
    with pytest.raises(ProviderFailure, match="provider_invalid_citations"):
        asyncio.run(run_research(request_for(review_bundle), review_bundle, settings))


def test_report_labels_local_document_and_synthetic_fixture_by_provenance(review_bundle):
    run = asyncio.run(run_research(request_for(review_bundle), review_bundle, Settings(_env_file=None)))
    source = run.evidence[0]
    documentary = source.model_copy(update={
        "id": "published:local-source", "provenance": "published", "source_url": None,
        "locator": "Table 5.1, printed page 57",
    })
    fixture = source.model_copy(update={"id": "synthetic:local-fixture", "provenance": "synthetic"})
    report = render_report(run.model_copy(update={"evidence": [documentary, fixture]}))

    documentary_line = next(line for line in report.splitlines() if "published:local-source" in line)
    fixture_line = next(line for line in report.splitlines() if "synthetic:local-fixture" in line)
    assert "```text\nTable 5.1, printed page 57\n```" in report
    assert "fuente documental local; URL no disponible" in documentary_line
    assert "fixture local sintético; sin fuente externa" in fixture_line
    assert "fixture local; sin fuente NASA" not in documentary_line


def test_saved_report_and_evidence_survive_same_id_corpus_replacement(review_bundle, tmp_path):
    settings = Settings(_env_file=None, database_url="sqlite:///" + (tmp_path / "snapshot.db").as_posix())
    migrate(settings)
    engine, sessions = create_engine_and_session(settings)
    run = asyncio.run(run_research(request_for(review_bundle), review_bundle, settings))
    original_report = render_report(run)
    try:
        with sessions() as session:
            repository = Repository(session)
            repository.replace_bundle(review_bundle)
            repository.save_run(run, review_bundle)
        replacement = review_bundle.model_dump()
        replacement["evidence"][0]["text"] = "Changed later; not the source used in the saved run."
        replacement["observations"][0]["value"] = 9.0
        with sessions() as session:
            Repository(session).replace_bundle(DatasetBundle.model_validate(replacement), allow_replace=True)
        with sessions() as session:
            repository = Repository(session)
            assert render_report(repository.get_run(run.id)) == original_report
            assert repository.get_run_bundle(run.id) == review_bundle
    finally:
        engine.dispose()
    # Exercise the run-scoped source route after the application opens the same database.
    with TestClient(create_app(settings)) as client:
        evidence_id = review_bundle.evidence[0].id
        current = client.get(f"/api/v1/evidence/{evidence_id}").json()
        historical = client.get(f"/api/v1/evidence/{evidence_id}", params={"research_id": run.id}).json()
        assert current["text"] != historical["text"]
        assert historical["text"] == review_bundle.evidence[0].text


def test_identifier_cannot_contain_unroutable_path_separators():
    with pytest.raises(ValidationError):
        TypeAdapter(Identifier).validate_python("synthetic:trial/one")


@pytest.mark.parametrize("url", ["sqlite:///:memory:", "sqlite://"])
def test_in_memory_database_has_explicit_configuration_error(url):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url=url)


def test_synthetic_measurement_cannot_attach_to_published_source(review_bundle):
    data = review_bundle.model_dump()
    data["evidence"][0]["provenance"] = "published"
    data["evidence"][0]["source_url"] = "https://example.org/placeholder"
    with pytest.raises(ValidationError):
        DatasetBundle.model_validate(data)


@pytest.mark.parametrize("body", [[], {"status": "completed", "output": [1]},
                                  {"status": "completed", "output": [{"type": "message", "content": [1]}]}])
def test_malformed_provider_shapes_have_controlled_errors(body):
    settings = Settings(_env_file=None, ai_provider="openai", openai_api_key="test-only", openai_model="mock")
    transport = httpx.MockTransport(lambda _request: httpx.Response(200, json=body))
    with pytest.raises(ProviderFailure, match="provider_invalid_response"):
        asyncio.run(synthesize({}, settings, transport=transport))


def test_external_synthesis_has_overall_deadline():
    async def delayed(_request):
        await asyncio.sleep(0.1)
        return httpx.Response(200, json={"status": "completed", "output": []})

    settings = Settings(_env_file=None, ai_provider="openai", openai_api_key="test-only",
                        openai_model="mock", ai_timeout_seconds=0.01)
    with pytest.raises(ProviderFailure, match="provider_timeout"):
        asyncio.run(synthesize({}, settings, transport=httpx.MockTransport(delayed)))


def test_missing_requested_x_is_insufficient_even_with_known_y(review_bundle):
    data = review_bundle.model_dump()
    for trial in data["trials"]:
        trial["conditions"]["flow_velocity_cm_s"] = {"value": None, "status": "not_reported"}
    bundle = DatasetBundle.model_validate(data)
    run = asyncio.run(run_research(request_for(bundle), bundle, Settings(_env_file=None)))
    assert run.comparison.points
    assert all(point.x is None for point in run.comparison.points)
    assert run.status == "insufficient_evidence"
    assert not run.hypotheses
