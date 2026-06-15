"""
Pydantic settings para el backend de Deali v2.
Lee variables de .env o del entorno del proceso (GitHub Actions / Fly.io secrets).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ─── Supabase ────────────────────────────────────────
    supabase_url: str
    supabase_service_role_key: str

    # ─── Redis ───────────────────────────────────────────
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    # ─── VTEX scraper ────────────────────────────────────
    vtex_max_pages: int = 4
    vtex_delay_ms: int = 300

    # ─── Browser scraper ─────────────────────────────────
    browser_max_concurrent: int = 2

    # ─── Anti-bot cookies ────────────────────────────────
    tottus_cookie: str = ""
    lider_cookie: str = ""
    unimarc_cookie: str = ""
    acuenta_cookie: str = ""

    # ─── Logging ─────────────────────────────────────────
    log_level: str = "INFO"


# Instancia singleton — importar desde aquí en todo el proyecto
settings = Settings()
