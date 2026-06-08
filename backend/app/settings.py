import os

from dotenv import load_dotenv

load_dotenv()


DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5501",
]


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: list[str]) -> list[str]:
    raw_value = os.getenv(name, "").strip()
    if not raw_value:
        return default
    values = [item.strip() for item in raw_value.split(",") if item.strip()]
    return values or default


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./repostreria.db")
        self.host = os.getenv("HOST", "127.0.0.1")
        self.port = int(os.getenv("PORT", "8000"))
        self.uvicorn_reload = _env_flag("UVICORN_RELOAD", default=True)
        self.cors_origins = _env_list("BACKEND_CORS_ORIGINS", DEFAULT_CORS_ORIGINS)


settings = Settings()
