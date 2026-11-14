"""Persistence tests across migrations, replacement and connection restart."""

import asyncio
import hashlib
import json
from pathlib import Path

import pytest
from sqlalchemy import text

from flamelab.ai.engine import run_research
from flamelab.config import Settings
from flamelab.data.cli import main
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import RankingRequest, ResearchRequest
from flamelab.storage.database import create_engine_and_session, migrate
from flamelab.storage.models import ActiveDataset, DatasetSnapshot, ResearchRun
from flamelab.storage.repository import Repository, bundle_digest

ROOT = Path(__file__).resolve().parents[3]
DEMO = ROOT / "data/fixtures/demo.json"
CATALOG = ROOT / "data/catalog/psi_metadata.json"


def test_migrations_and_restart_preserve_saved_research_context(tmp_path):
    settings = Settings(database_url="sqlite:///" + (tmp_path / "research.db").as_posix(),
                        ai_provider="demo", seed_demo=False)
    original = load_bundle(DEMO)
    request = ResearchRequest(
        question="Conectar datos sintéticos, herramientas y persistencia.",
        ranking=RankingRequest(
            target={"material": "demo_polymer", "geometry": "sheet",
                    "gravity_regime": "microgravity", "flow_velocity_cm_s": 5},
            required_match=["material", "geometry", "gravity_regime"],
            vary=["flow_velocity_cm_s"], allow_synthetic=True,
        ),
    )
    response = asyncio.run(run_research(request, original, settings))
    assert response.status == "completed"
    migrate(settings)
    engine, sessions = create_engine_and_session(settings)
    with sessions() as session:
        repository = Repository(session)
        repository.replace_bundle(original)
        repository.save_run(response, original)
        repository.replace_bundle(load_bundle(CATALOG), allow_replace=True)
    engine.dispose()

    # Re-run the real migration and reopen all database connections as on restart.
    migrate(settings)
    reopened, reopened_sessions = create_engine_and_session(settings)
    try:
        with reopened_sessions() as session:
            repository = Repository(session)
            assert repository.get_bundle().dataset_id == "psi:local-catalog-v1"
            restored = repository.get_run(response.id)
            historical = repository.get_run_bundle(response.id)
            assert restored.model_dump(mode="json") == response.model_dump(mode="json")
            assert bundle_digest(historical) == bundle_digest(original)
            assert historical.evidence == original.evidence
            assert historical.observations == original.observations
            assert session.scalar(text("SELECT count(*) FROM alembic_version")) == 1
    finally:
        reopened.dispose()


def test_repository_revalidates_mutated_models_before_replacement(tmp_path):
    settings = Settings(database_url="sqlite:///" + (tmp_path / "guard.db").as_posix())
    migrate(settings)
    engine, sessions = create_engine_and_session(settings)
    original = load_bundle(DEMO)
    try:
        with sessions() as session:
            repository = Repository(session)
            repository.replace_bundle(original)
            invalid = original.model_copy(deep=True)
            invalid.observations[0].evidence_ids = ["missing:evidence"]
            with pytest.raises(ValueError):
                repository.replace_bundle(invalid, allow_replace=True)
            assert bundle_digest(repository.get_bundle()) == bundle_digest(original)
    finally:
        engine.dispose()


def test_legacy_snapshot_reimport_does_not_replace_identical_corpus(tmp_path):
    settings = Settings(database_url="sqlite:///" + (tmp_path / "legacy.db").as_posix())
    migrate(settings)
    engine, sessions = create_engine_and_session(settings)
    original = load_bundle(DEMO)
    previous = original.model_dump(mode="json")
    for trial in previous["trials"]:
        del trial["segments"]
    for observation in previous["observations"]:
        for field in ("segment_id", "original_value", "original_unit"):
            del observation[field]
    payload = json.dumps(previous, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    assert digest != bundle_digest(original)
    try:
        with sessions() as session:
            session.add(DatasetSnapshot(digest=digest, dataset_id=original.dataset_id, payload=payload))
            session.flush()
            session.add(ActiveDataset(id=1, digest=digest))
            session.commit()
            repository = Repository(session)
            assert repository.get_bundle() == original
            assert repository.replace_bundle(original) is False
            assert session.get(ActiveDataset, 1).digest == digest
    finally:
        engine.dispose()


def test_historical_p2_segment_records_are_read_without_rewriting_snapshots(tmp_path):
    settings = Settings(_env_file=None, database_url="sqlite:///" + (tmp_path / "p2.db").as_posix(),
                        ai_provider="demo", seed_demo=False)
    bundle = load_bundle(ROOT / "docs/examples/sequential_conditions.json")
    previous = bundle.model_dump(mode="json")
    previous["schema_version"] = "1.0"
    trial = previous["trials"][0]
    trial["condition_stages"] = trial.pop("segments")
    for record in trial["condition_stages"]:
        record["order"] = record.pop("sequence")
        record.pop("evidence_ids")
    for record in previous["observations"]:
        record["condition_id"] = record.pop("segment_id")
    payload = json.dumps(previous, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()

    response = asyncio.run(run_research(ResearchRequest(
        question="Comparar las observaciones del ejemplo de segmentos.",
        ranking=RankingRequest(target={"oxygen_initial_pct": 21},
                               vary=["oxygen_pct"], allow_synthetic=True),
    ), bundle, settings))
    previous_run = response.model_dump(mode="json")
    assert response.status == "completed"
    for item in previous_run["ranking"]["items"]:
        item["eligible_condition_ids"] = item.pop("eligible_segment_ids")
        item["scored_condition_id"] = item.pop("scored_segment_id")
    for point in previous_run["comparison"]["points"]:
        point["condition_id"] = point.pop("segment_id")
    for group in previous_run["comparison"]["groups"]:
        group["n_condition_stages"] = group.pop("n_segments")
    previous_run_payload = json.dumps(previous_run, ensure_ascii=False)

    migrate(settings)
    engine, sessions = create_engine_and_session(settings)
    try:
        with sessions() as session:
            session.add(DatasetSnapshot(digest=digest, dataset_id=bundle.dataset_id, payload=payload))
            session.flush()
            session.add(ActiveDataset(id=1, digest=digest))
            session.add(ResearchRun(id=response.id, dataset_digest=digest, payload=previous_run_payload))
            session.commit()
            repository = Repository(session)
            assert repository.get_bundle() == bundle
            assert repository.replace_bundle(bundle) is False
            repository.replace_bundle(load_bundle(CATALOG), allow_replace=True)
            assert repository.get_run_bundle(response.id) == bundle
            recovered = repository.get_run(response.id)
            assert recovered.comparison.points == response.comparison.points
            assert any("Expediente histórico" in warning for warning in recovered.warnings)
            assert session.get(DatasetSnapshot, digest).payload == payload
            assert session.get(ResearchRun, response.id).payload == previous_run_payload
    finally:
        engine.dispose()


def test_invalid_cli_import_preserves_existing_active_corpus(tmp_path):
    url = "sqlite:///" + (tmp_path / "guard-cli.db").as_posix()
    assert main(["import", str(DEMO), "--database-url", url]) == 0
    malformed = tmp_path / "invalid.json"
    payload = json.loads(DEMO.read_text(encoding="utf-8"))
    payload["observations"][0]["unit"] = "m/s"
    malformed.write_text(json.dumps(payload), encoding="utf-8")
    assert main(["import", str(malformed), "--database-url", url, "--replace"]) == 1
    engine, sessions = create_engine_and_session(Settings(database_url=url))
    try:
        with sessions() as session:
            current = Repository(session).get_bundle()
            assert bundle_digest(current) == bundle_digest(load_bundle(DEMO))
    finally:
        engine.dispose()
