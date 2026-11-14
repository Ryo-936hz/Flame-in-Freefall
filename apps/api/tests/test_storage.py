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
from flamelab.storage.models import ActiveDataset, DatasetSnapshot
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
        del trial["condition_stages"]
    for observation in previous["observations"]:
        for field in ("condition_id", "original_value", "original_unit"):
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
