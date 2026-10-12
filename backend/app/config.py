import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./erp.db")
    secret_key: str = os.getenv("SECRET_KEY", "smart-erp-jwt-secret-key-2026")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:5174")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
