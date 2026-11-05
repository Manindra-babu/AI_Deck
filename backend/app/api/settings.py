from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from typing import Optional
from google import genai

from app.core.database import get_db
from app.core.config import settings
from app.models.schema import ApplicationSetting, Article, NewsSource, DailyReport, CollectionRun
from app.services.email_service import test_smtp_connection
from app.services.collector_orchestrator import run_news_collection_cycle

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class UpdateSettingsPayload(BaseModel):
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_ssl: Optional[bool] = None
    email_recipient: Optional[str] = None
    daily_report_hour: Optional[int] = None
    daily_report_minute: Optional[int] = None
    collection_interval_minutes: Optional[int] = None
    min_importance_threshold: Optional[float] = None

class TestSMTPPayload(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_use_ssl: bool = True

@router.get("")
async def get_current_settings(db: Session = Depends(get_db)):
    # Mask secrets
    gemini_configured = bool(settings.GEMINI_API_KEY)
    gemini_masked = (
        f"{settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}"
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 8
        else ("Configured" if settings.GEMINI_API_KEY else "Not Configured")
    )
    
    smtp_configured = bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD)

    return {
        "gemini": {
            "is_configured": gemini_configured,
            "masked_key": gemini_masked,
            "model": settings.GEMINI_MODEL,
        },
        "smtp": {
            "is_configured": smtp_configured,
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "username": settings.SMTP_USERNAME or "",
            "use_ssl": settings.SMTP_USE_SSL,
            "recipient": settings.EMAIL_RECIPIENT or "",
        },
        "schedule": {
            "timezone": settings.TIMEZONE,
            "daily_report_hour": settings.DAILY_REPORT_HOUR,
            "daily_report_minute": settings.DAILY_REPORT_MINUTE,
            "collection_interval_minutes": settings.NEWS_COLLECTION_INTERVAL_MINUTES,
        },
        "thresholds": {
            "min_importance": 5.0,
        }
    }

@router.post("")
async def update_settings(payload: UpdateSettingsPayload, db: Session = Depends(get_db)):
    if payload.gemini_api_key is not None and payload.gemini_api_key.strip():
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
    if payload.gemini_model:
        settings.GEMINI_MODEL = payload.gemini_model.strip()
    if payload.smtp_host:
        settings.SMTP_HOST = payload.smtp_host.strip()
    if payload.smtp_port:
        settings.SMTP_PORT = payload.smtp_port
    if payload.smtp_username is not None:
        settings.SMTP_USERNAME = payload.smtp_username.strip() or None
    if payload.smtp_password is not None and payload.smtp_password.strip():
        settings.SMTP_PASSWORD = payload.smtp_password.strip()
    if payload.smtp_use_ssl is not None:
        settings.SMTP_USE_SSL = payload.smtp_use_ssl
    if payload.email_recipient is not None:
        settings.EMAIL_RECIPIENT = payload.email_recipient.strip() or None
    if payload.daily_report_hour is not None:
        settings.DAILY_REPORT_HOUR = payload.daily_report_hour
    if payload.daily_report_minute is not None:
        settings.DAILY_REPORT_MINUTE = payload.daily_report_minute
    if payload.collection_interval_minutes is not None:
        settings.NEWS_COLLECTION_INTERVAL_MINUTES = payload.collection_interval_minutes

    return {"success": True, "message": "Settings updated successfully."}

@router.post("/test-smtp")
async def test_smtp_endpoint(payload: TestSMTPPayload):
    success, msg = test_smtp_connection(
        host=payload.smtp_host,
        port=payload.smtp_port,
        username=payload.smtp_username,
        password=payload.smtp_password,
        use_ssl=payload.smtp_use_ssl
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@router.post("/trigger-collection")
async def trigger_collection(db: Session = Depends(get_db)):
    """Manually initiate an immediate collection cycle."""
    run = await run_news_collection_cycle(db)
    return {
        "success": True,
        "run_id": run.id,
        "sources_checked": run.sources_checked,
        "new_articles_saved": run.new_articles_saved,
        "errors": run.error_count,
        "details": run.details,
    }

@router.get("/health")
async def get_system_health(db: Session = Depends(get_db)):
    """Comprehensive system diagnostic health status."""
    # Check DB
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    # Check Gemini API
    gemini_status = "unconfigured"
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            resp = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents="ping"
            )
            gemini_status = "operational" if resp and resp.text else "unexpected response"
        except Exception as e:
            gemini_status = f"error: {str(e)}"

    last_run = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).first()
    
    return {
        "system_status": "healthy" if db_ok else "degraded",
        "database": {
            "status": "operational" if db_ok else "unreachable",
            "url_type": "SQLite" if settings.DATABASE_URL.startswith("sqlite") else "PostgreSQL",
        },
        "gemini_api": {
            "configured": bool(settings.GEMINI_API_KEY),
            "model": settings.GEMINI_MODEL,
            "status": gemini_status,
        },
        "smtp": {
            "configured": bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD),
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
        },
        "last_collection": {
            "status": last_run.status if last_run else "never run",
            "at": last_run.completed_at.isoformat() if last_run and last_run.completed_at else None,
            "articles_added": last_run.new_articles_saved if last_run else 0,
        }
    }
