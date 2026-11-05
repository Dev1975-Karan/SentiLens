"""Backend configuration and environment variables.
Read settings from a .env file (optional) and expose them via Pydantic Settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Server options
    host: str = "0.0.0.0"
    port: int = 8000

    # Upload limits – mirror frontend validation
    max_file_size: int = 50 * 1024 * 1024  # 50 MB
    allowed_extensions: list[str] = [".exe", ".dll", ".ps1", ".bat", ".py"]

    # Optional LLM API key – if not set we fall back to heuristic engine only
    llm_api_key: str | None = None
    llm_endpoint: str = "https://api.openai.com/v1/chat/completions"

    # SQLite DB path (lightweight, no external service needed)
    sqlite_path: str = "sentinellens.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
