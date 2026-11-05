from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
import pytz

from app.core.database import get_db
from app.core.config import settings
from app.models.schema import (
    Article, NewsSource, DailyReport, ModelRelease,
    ResearchPaper, CollectionRun
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns live summary data directly from persistent database tables.
    Never returns fabricated content.
    """
    total_articles = db.query(Article).count()
    total_sources = db.query(NewsSource).filter(NewsSource.is_active == True).count()
    total_models = db.query(ModelRelease).count()
    total_papers = db.query(ResearchPaper).count()

    # Last collection run
    last_run = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).first()
    
    # Breaking developments (Importance >= 7.5 or marked verified)
    breaking_news = (
        db.query(Article)
        .filter(Article.importance_score >= 7.5)
        .order_by(Article.published_at.desc())
        .limit(5)
        .all()
    )

    # Latest AI news
    latest_news = (
        db.query(Article)
        .order_by(Article.published_at.desc(), Article.collected_at.desc())
        .limit(10)
        .all()
    )

    # Latest Daily Report
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    latest_report = db.query(DailyReport).order_by(DailyReport.report_date.desc()).first()

    # Category breakdown
    category_counts = (
        db.query(Article.category, func.count(Article.id))
        .group_by(Article.category)
        .all()
    )

    # Calculate next scheduled report time (07:00 AM IST)
    tz = pytz.timezone(settings.TIMEZONE)
    local_now = datetime.now(tz)
    scheduled_today = local_now.replace(hour=settings.DAILY_REPORT_HOUR, minute=settings.DAILY_REPORT_MINUTE, second=0, microsecond=0)
    if local_now >= scheduled_today:
        next_report_time = scheduled_today + timedelta(days=1)
    else:
        next_report_time = scheduled_today

    return {
        "metrics": {
            "total_articles": total_articles,
            "active_sources": total_sources,
            "models_tracked": total_models,
            "research_papers": total_papers,
        },
        "sync_status": {
            "last_collection": last_run.completed_at.isoformat() if last_run and last_run.completed_at else (last_run.started_at.isoformat() if last_run else None),
            "collection_status": last_run.status if last_run else "idle",
            "last_articles_found": last_run.new_articles_saved if last_run else 0,
            "next_scheduled_brief": next_report_time.isoformat(),
            "timezone": settings.TIMEZONE,
        },
        "today_brief": {
            "id": latest_report.id if latest_report else None,
            "date": latest_report.report_date if latest_report else None,
            "executive_summary": latest_report.executive_summary if latest_report else None,
            "top_developments_count": len(latest_report.top_developments or []) if latest_report else 0,
        } if latest_report else None,
        "breaking_news": [
            {
                "id": a.id,
                "title": a.title,
                "source_name": a.source_name,
                "category": a.category,
                "importance_score": a.importance_score,
                "importance_reason": a.importance_reason,
                "verification_status": a.verification_status,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "original_url": a.original_url,
                "ai_summary": a.ai_summary or a.raw_summary,
            }
            for a in breaking_news
        ],
        "latest_news": [
            {
                "id": a.id,
                "title": a.title,
                "source_name": a.source_name,
                "category": a.category,
                "importance_score": a.importance_score,
                "verification_status": a.verification_status,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "original_url": a.original_url,
                "is_bookmarked": a.is_bookmarked,
                "is_read": a.is_read,
            }
            for a in latest_news
        ],
        "category_counts": {cat: count for cat, count in category_counts},
    }
