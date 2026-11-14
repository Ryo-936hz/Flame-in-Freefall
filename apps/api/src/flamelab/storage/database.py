from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from flamelab.config import ROOT, Settings


def create_engine_and_session(settings: Settings):
    url = make_url(settings.database_url)
    sqlite = url.get_backend_name() == "sqlite"
    if sqlite and url.database not in (None, "", ":memory:"):
        Path(url.database).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False, "timeout": 15} if sqlite else {},
    )
    if sqlite:
        @event.listens_for(engine, "connect")
        def pragmas(connection, _record):
            connection.execute("PRAGMA foreign_keys=ON")
            connection.execute("PRAGMA journal_mode=WAL")
    return engine, sessionmaker(bind=engine, expire_on_commit=False)


def migrate(settings: Settings) -> None:
    # Migrations use a supplied connection, avoiding credentials in alembic.ini/logs.
    engine, _ = create_engine_and_session(settings)
    config = Config(str(ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(ROOT / "apps/api/alembic"))
    try:
        with engine.begin() as connection:
            config.attributes["connection"] = connection
            command.upgrade(config, "head")
    finally:
        engine.dispose()
