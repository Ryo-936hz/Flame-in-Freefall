from pathlib import Path
from typing import Literal, Self

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FLAMELAB_", env_file=".env", extra="ignore", hide_input_in_errors=True)
    database_url: str = f"sqlite:///{(ROOT / 'work/flamelab.db').as_posix()}"
    ai_provider: Literal["demo", "openai", "qwen"] = "demo"
    ollama_model: str = "qwen3:0.6b"
    openai_api_key: SecretStr | None = None
    openai_model: str | None = None
    ai_timeout_seconds: float = Field(default=30, gt=0, le=120)
    ai_max_context_chars: int = Field(default=40000, ge=1000, le=100000)
    seed_demo: bool = False
    fixture_path: Path = ROOT / "data/fixtures/demo.json"
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    @model_validator(mode="after")
    def explicit_provider(self) -> Self:
        try:
            database = make_url(self.database_url)
        except (ArgumentError, ValueError):
            # Connection URLs may contain credentials; never echo the parser input.
            raise ValueError("database_url must be a valid SQLAlchemy connection URL") from None
        if database.get_backend_name() == "sqlite":
            if database.database in (None, "", ":memory:"):
                raise ValueError("SQLite requires a file path; in-memory databases do not persist across engines")
            uri = database.query.get("uri", "false")
            plain_file = isinstance(uri, str) and uri.strip().lower() in {"false", "0", "no", "off", "n", "f"}
            if not plain_file or database.database.lower().startswith("file:"):
                raise ValueError("SQLite URI mode is not supported; use a persistent sqlite:/// file URL")
        if self.openai_model is not None:
            self.openai_model = self.openai_model.strip()
        if self.ai_provider == "openai" and (
            not self.openai_api_key or not self.openai_api_key.get_secret_value().strip()
            or not self.openai_model
        ):
            raise ValueError("openai mode requires server key and explicit model")
        return self
