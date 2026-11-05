from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.schema import DailyReport, EmailLog
from app.services.report_generator import generate_daily_intelligence_report
from app.services.email_service import send_daily_report_email

router = APIRouter(prefix="/api/reports", tags=["Daily Reports"])

@router.get("")
async def list_daily_reports(
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    reports = db.query(DailyReport).order_by(DailyReport.report_date.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "report_date": r.report_date,
            "executive_summary": r.executive_summary[:280] + "...",
            "total_articles_analyzed": r.total_articles_analyzed,
            "top_developments_count": len(r.top_developments or []),
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
        }
        for r in reports
    ]

@router.get("/latest")
async def get_latest_daily_report(db: Session = Depends(get_db)):
    report = db.query(DailyReport).order_by(DailyReport.report_date.desc()).first()
    if not report:
        return {"report": None, "message": "No daily intelligence brief has been generated yet."}
    
    # Check email delivery status for this report
    email_logs = db.query(EmailLog).filter(EmailLog.report_id == report.id).order_by(EmailLog.sent_at.desc()).all()

    return {
        "report": {
            "id": report.id,
            "report_date": report.report_date,
            "executive_summary": report.executive_summary,
            "top_developments": report.top_developments or [],
            "model_releases": report.model_releases or [],
            "research_breakthroughs": report.research_breakthroughs or [],
            "industry_developments": report.industry_developments or [],
            "open_source_developments": report.open_source_developments or [],
            "emerging_trends": report.emerging_trends or [],
            "total_articles_analyzed": report.total_articles_analyzed,
            "generated_at": report.generated_at.isoformat() if report.generated_at else None,
        },
        "email_delivery": [
            {
                "id": l.id,
                "recipient": l.recipient,
                "status": l.status,
                "error_message": l.error_message,
                "sent_at": l.sent_at.isoformat() if l.sent_at else None,
            }
            for l in email_logs
        ]
    }

@router.get("/{report_date}")
async def get_daily_report_by_date(report_date: str, db: Session = Depends(get_db)):
    report = db.query(DailyReport).filter(DailyReport.report_date == report_date).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"No report found for date {report_date}")
    
    email_logs = db.query(EmailLog).filter(EmailLog.report_id == report.id).order_by(EmailLog.sent_at.desc()).all()
    return {
        "report": {
            "id": report.id,
            "report_date": report.report_date,
            "executive_summary": report.executive_summary,
            "top_developments": report.top_developments or [],
            "model_releases": report.model_releases or [],
            "research_breakthroughs": report.research_breakthroughs or [],
            "industry_developments": report.industry_developments or [],
            "open_source_developments": report.open_source_developments or [],
            "emerging_trends": report.emerging_trends or [],
            "total_articles_analyzed": report.total_articles_analyzed,
            "generated_at": report.generated_at.isoformat() if report.generated_at else None,
        },
        "email_delivery": [
            {
                "id": l.id,
                "recipient": l.recipient,
                "status": l.status,
                "error_message": l.error_message,
                "sent_at": l.sent_at.isoformat() if l.sent_at else None,
            }
            for l in email_logs
        ]
    }

@router.post("/generate")
async def generate_report_now(
    date_str: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    target = date_str or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    report = await generate_daily_intelligence_report(db, target_date=target)
    if not report:
        raise HTTPException(status_code=400, detail="Cannot generate report: No collected articles are available in the database yet. Run an ingestion cycle first.")
    
    return {
        "success": True,
        "message": f"Daily report for {report.report_date} generated successfully.",
        "report_id": report.id,
        "report_date": report.report_date,
    }

@router.post("/{report_id}/send-email")
async def dispatch_report_email(
    report_id: str,
    recipient: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    success, message = send_daily_report_email(report, recipient, db)
    if not success:
        raise HTTPException(status_code=400, detail=message)
        
    return {"success": True, "message": message}
