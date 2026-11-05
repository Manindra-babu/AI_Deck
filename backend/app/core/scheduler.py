import asyncio
import logging
import pytz
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.schema import DailyReport, EmailLog
from app.services.collector_orchestrator import run_news_collection_cycle
from app.services.report_generator import generate_daily_intelligence_report
from app.services.email_service import send_daily_report_email

logger = logging.getLogger("ai_radar.scheduler")

scheduler = AsyncIOScheduler()

async def scheduled_collection_job():
    """Periodic news collection background task."""
    logger.info("Starting scheduled RSS collection cycle...")
    db = SessionLocal()
    try:
        run = await run_news_collection_cycle(db)
        logger.info(f"Scheduled collection finished: {run.new_articles_saved} new articles saved.")
    except Exception as e:
        logger.error(f"Scheduled collection failed: {e}")
    finally:
        db.close()

async def scheduled_daily_report_job():
    """
    Automated Daily Intelligence Brief workflow executed at 07:00 AM IST.
    1. Generates the daily synthesis from collected articles.
    2. Sends email report if recipient is configured and email wasn't sent yet for today.
    """
    tz = pytz.timezone(settings.TIMEZONE)
    local_now = datetime.now(tz)
    today_str = local_now.strftime("%Y-%m-%d")
    logger.info(f"Triggering 07:00 AM IST Daily Intelligence Brief for {today_str}...")

    db = SessionLocal()
    try:
        # Step 1: Generate or retrieve report
        report = await generate_daily_intelligence_report(db, target_date=today_str)
        if not report:
            logger.warning(f"No articles available to generate report for {today_str}. Skipping email dispatch.")
            return

        # Step 2: Prevent duplicate email dispatch
        existing_sent_email = db.query(EmailLog).filter(
            EmailLog.report_id == report.id,
            EmailLog.status == "sent"
        ).first()

        if existing_sent_email:
            logger.info(f"Daily report for {today_str} was already sent to {existing_sent_email.recipient}. Skipping duplicate.")
            return

        # Step 3: Optional email dispatch if configured by user
        if settings.EMAIL_RECIPIENT and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            success, msg = send_daily_report_email(report, settings.EMAIL_RECIPIENT, db)
            logger.info(f"Daily email dispatch result for {today_str}: {msg}")
        else:
            logger.info("Email delivery skipped; daily intelligence report generated and saved directly for website viewing.")

    except Exception as e:
        logger.error(f"Scheduled daily report job failed: {e}")
    finally:
        db.close()

def start_scheduler():
    """Configure and start the background scheduler."""
    if scheduler.running:
        return

    kolkata_tz = pytz.timezone(settings.TIMEZONE)
    
    # 1. RSS periodic collection (e.g. every 15 minutes)
    scheduler.add_job(
        scheduled_collection_job,
        trigger=IntervalTrigger(minutes=settings.NEWS_COLLECTION_INTERVAL_MINUTES),
        id="periodic_news_collection",
        name="Periodic News Collection",
        replace_existing=True,
    )

    # 2. Daily Intelligence Brief at 07:00 AM IST
    scheduler.add_job(
        scheduled_daily_report_job,
        trigger=CronTrigger(
            hour=settings.DAILY_REPORT_HOUR,
            minute=settings.DAILY_REPORT_MINUTE,
            timezone=kolkata_tz
        ),
        id="daily_intelligence_brief",
        name="Daily Intelligence Brief at 07:00 AM IST",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"Scheduler started: Collection every {settings.NEWS_COLLECTION_INTERVAL_MINUTES} mins, "
        f"Daily Brief configured for {settings.DAILY_REPORT_HOUR:02d}:{settings.DAILY_REPORT_MINUTE:02d} ({settings.TIMEZONE})."
    )

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down.")
