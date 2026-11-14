"""Real PostgreSQL migration and persisted research recovery check.

FLAMELAB_TEST_POSTGRES_URL must point to a dedicated disposable test database.
This test replaces its active corpus and leaves snapshots for recovery assertions.
"""

import asyncio
import os
from pathlib import Path

import pytest
from sqlalchemy import text

from flamelab.ai.engine import run_research
from flamelab.ai.report import render_report
from flamelab.config import Settings
from flamelab.data.loader import load_bundle
from flamelab.domain.contracts import RankingRequest, ResearchRequest
from flamelab.storage.database import create_engine_and_session, migrate
from flamelab.storage.repository import Repository, bundle_digest


@pytest.mark.skipif(
    not os.getenv("FLAMELAB_TEST_POSTGRES_URL"),
    reason="set FLAMELAB_TEST_POSTGRES_URL to run the PostgreSQL integration check",
)
def test_postgres_migrations_and_restart_preserve_research_context():
    database_url = os.environ["FLAMELAB_TEST_POSTGRES_URL"]
    settings = Settings(_env_file=None, database_url=database_url, ai_provider="demo", seed_demo=False)
    fixture_path = Path(__file__).resolve().parents[3] / "data/fixtures/demo.json"
    bundle = load_bundle(fixture_path)
    request = ResearchRequest(
        question="Recover the saved synthetic research after reconnecting.",
        ranking=RankingRequest(
            target={"material": "demo_polymer", "geometry": "sheet"},
            required_match=["material", "geometry"],
            vary=["flow_velocity_cm_s"],
            allow_synthetic=True,
        ),
    )
    response = asyncio.run(run_research(request, bundle, settings))
    assert response.plan is not None
    assert response.status == "completed"
    original_report = render_report(response)
    catalog = load_bundle(fixture_path.parents[1] / "catalog/psi_metadata.json")

    migrate(settings)
    engine, sessions = create_engine_and_session(settings)
    try:
        with sessions() as session:
            repository = Repository(session)
            repository.replace_bundle(bundle, allow_replace=True)
            repository.save_run(response, bundle)
            repository.replace_bundle(catalog, allow_replace=True)
            assert session.scalar(text("SELECT count(*) FROM alembic_version")) == 1
    finally:
        engine.dispose()

    migrate(settings)
    reopened, reopened_sessions = create_engine_and_session(settings)
    try:
        with reopened_sessions() as session:
            repository = Repository(session)
            assert repository.get_bundle().dataset_id == catalog.dataset_id
            restored = repository.get_run(response.id)
            historical = repository.get_run_bundle(response.id)
            assert restored.model_dump(mode="json") == response.model_dump(mode="json")
            assert bundle_digest(historical) == bundle_digest(bundle)
            assert historical.observations == bundle.observations
            assert historical.evidence == bundle.evidence
            assert restored.plan == response.plan
            assert render_report(restored) == original_report
    finally:
        reopened.dispose()
