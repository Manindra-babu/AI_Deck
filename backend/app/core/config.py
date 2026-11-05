import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DB_PATH = (BASE_DIR / "ai_radar.db").as_posix()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Intelligence Radar"
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    
    # Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # SMTP
    SMTP_HOST: str = "smtp.hostinger.com"
    SMTP_PORT: int = 465
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_SSL: bool = True
    EMAIL_RECIPIENT: Optional[str] = None
    
    # Scheduling & Timing
    TIMEZONE: str = "Asia/Kolkata"
    NEWS_COLLECTION_INTERVAL_MINUTES: int = 15
    DAILY_REPORT_HOUR: int = 7
    DAILY_REPORT_MINUTE: int = 0
    
    # URLs & CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
