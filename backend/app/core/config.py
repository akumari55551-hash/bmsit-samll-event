from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "EVENT HQ · BMSIT 2026 API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./event_hq.db"
    CORS_ORIGINS: List[str] = ["*"]
    SECRET_KEY: str = "event-hq-tournament-secret-key-2026"
    ENVIRONMENT: str = "development"
    AUTO_SEED: bool = False

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
