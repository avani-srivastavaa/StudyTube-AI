"""
Configuration — Supabase + Gemini settings loaded from .env
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── AI ────────────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # ── Supabase ──────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""                  # https://xxxx.supabase.co
    SUPABASE_ANON_KEY: str = ""             # safe to expose in browser
    SUPABASE_SERVICE_ROLE_KEY: str = ""     # server-only, never expose

    # ── App ───────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Rate Limits ───────────────────────────────────────────────────────────
    MAX_VIDEOS_PER_HOUR: int = 20
    MAX_CHAT_MESSAGES_PER_DAY: int = 200

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
