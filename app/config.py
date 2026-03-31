"""
Configuration settings for Notes API.
Loads environment variables from .env file.
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./notes.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # App
    APP_NAME: str = "Notes API"
    APP_VERSION: str = "0.1.0"
    
    @property
    def database_url_sync(self) -> str:
        """Convert async database URL to sync for Alembic."""
        return self.DATABASE_URL.replace("+aiosqlite", "")


# Global settings instance
settings = Settings()