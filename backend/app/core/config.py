"""
StriveNest ERP - Core Configuration Settings
Pydantic v2 BaseSettings for environment variables.
"""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.core.constants import EnvironmentOption


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # App Settings
    APP_NAME: str = "StriveNest ERP Backend"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Enterprise Resource Planning Backend Foundation API"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: EnvironmentOption = EnvironmentOption.DEVELOPMENT

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_HOSTS: Union[List[str], str] = ["*"]
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # Database Settings
    DATABASE_URL: str = "sqlite:///./strivenest.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 300
    DB_ECHO: bool = False

    # Logging Settings
    LOG_TO_FILE: bool = True
    LOG_FILE_PATH: str = "logs/app.log"

    # JWT Authentication & Security Settings
    JWT_SECRET_KEY: str = "strivenest_super_secret_jwt_key_phase2a_2026_enterprise_erp"
    JWT_REFRESH_SECRET_KEY: str = "strivenest_super_secret_refresh_jwt_key_phase2a_2026_enterprise_erp"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting & Lockout Security Hardening Settings
    LOGIN_RATE_LIMIT: int = 5
    LOGIN_RATE_WINDOW_MINUTES: int = 15
    ACCOUNT_LOCK_MINUTES: int = 30

    # Cookie Authentication Settings
    COOKIE_AUTH_ENABLED: bool = False
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    @field_validator("ALLOWED_HOSTS", "CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == EnvironmentOption.PRODUCTION

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


# Global Settings instance
settings = Settings()
