"""Persistent SQLite configuration works for plain and driver-qualified URLs."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from flamelab.config import Settings
from flamelab.main import create_app


@pytest.mark.parametrize("url", [
    "sqlite://", "sqlite:///:memory:", "sqlite:///:memory:?cache=shared",
    "sqlite+pysqlite://", "sqlite+pysqlite:///:memory:",
    "sqlite+pysqlite:///:memory:?cache=shared",
    "sqlite:///file:p1-memory?mode=memory&cache=shared&uri=true",
    "sqlite+pysqlite:///file::memory:?cache=shared&uri=true",
    "sqlite:///file:persistent.db?mode=ro&uri=true",
])
def test_sqlite_rejects_nonpersistent_or_unsupported_uri_configurations(url):
    with pytest.raises(ValidationError, match="SQLite requires a file path|SQLite URI mode is not supported"):
        Settings(_env_file=None, database_url=url, ai_provider="demo")


@pytest.mark.parametrize("url", [
    "private-url-marker-not-a-url",
    "postgresql://test:private-url-marker@localhost:not-a-port/testdb",
])
def test_invalid_database_url_error_does_not_echo_credentials(url):
    with pytest.raises(ValidationError) as error:
        Settings(_env_file=None, database_url=url, ai_provider="demo")
    assert "valid SQLAlchemy connection URL" in str(error.value)
    assert "private-url-marker" not in str(error.value)


def test_postgres_configuration_is_parsed_without_connecting():
    url = "postgresql+psycopg://test:test-only@localhost:5432/testdb"
    settings = Settings(_env_file=None, database_url=url, ai_provider="demo")
    assert settings.database_url == url


@pytest.mark.parametrize("driver", ["sqlite", "sqlite+pysqlite"])
def test_file_database_creates_parents_preserves_data_and_enforces_foreign_keys(tmp_path, driver):
    database = tmp_path / "new" / "nested" / "corpus.db"
    assert not database.parent.exists()
    settings = Settings(_env_file=None, ai_provider="demo", seed_demo=True,
                        database_url=f"{driver}:///" + database.as_posix())
    with TestClient(create_app(settings)) as client:
        health = client.get("/api/v1/health")
        assert health.status_code == 200, health.text
        assert health.json()["data_mode"] == "synthetic"
        assert database.is_file()
        trials = client.get("/api/v1/trials").json()
        assert len(trials) == 5
        with client.app.state.engine.connect() as connection:
            assert connection.scalar(text("PRAGMA foreign_keys")) == 1
            assert connection.scalar(text("PRAGMA journal_mode")) == "wal"
            with pytest.raises(IntegrityError):
                connection.execute(text(
                    "INSERT INTO research_runs (id, dataset_digest, payload) "
                    "VALUES (:id, :digest, :payload)"
                ), {"id": "synthetic:missing-snapshot", "digest": "missing", "payload": "{}"})
            connection.rollback()
    reopened_settings = settings.model_copy(update={"seed_demo": False})
    with TestClient(create_app(reopened_settings)) as reopened:
        assert reopened.get("/api/v1/health").status_code == 200
        assert reopened.get("/api/v1/trials").json() == trials
    assert Path(database).is_file()
