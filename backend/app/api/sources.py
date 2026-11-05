from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from urllib.parse import urlparse

from app.core.database import get_db
from app.models.schema import NewsSource, SourceDiscovery
from app.services.rss_collector import test_feed_connectivity
from app.services.source_discovery import run_source_discovery, evaluate_custom_source
from app.seed_sources import INITIAL_SOURCES

router = APIRouter(prefix="/api/sources", tags=["Source Management"])

class AddSourcePayload(BaseModel):
    name: str
    website_url: str
    feed_url: str
    source_type: Optional[str] = "Official Announcement"
    reliability_tier: Optional[str] = "Official source"

class TestFeedPayload(BaseModel):
    feed_url: str

class EvaluateWebsitePayload(BaseModel):
    website_url: str

@router.get("")
async def list_sources(db: Session = Depends(get_db)):
    # Auto-seed if empty
    if db.query(NewsSource).count() == 0:
        for src in INITIAL_SOURCES:
            db.add(NewsSource(**src))
        db.commit()

    sources = db.query(NewsSource).order_by(NewsSource.name.asc()).all()
    discovery_candidates = db.query(SourceDiscovery).order_by(SourceDiscovery.created_at.desc()).limit(15).all()

    return {
        "sources": [
            {
                "id": s.id,
                "name": s.name,
                "website_url": s.website_url,
                "feed_url": s.feed_url,
                "source_type": s.source_type,
                "reliability_tier": s.reliability_tier,
                "is_active": s.is_active,
                "last_fetched_at": s.last_fetched_at.isoformat() if s.last_fetched_at else None,
                "last_error": s.last_error,
                "article_count": s.article_count,
            }
            for s in sources
        ],
        "discovery_candidates": [
            {
                "id": d.id,
                "domain": d.domain,
                "suggested_name": d.suggested_name,
                "suggested_type": d.suggested_type,
                "discovered_feed_url": d.discovered_feed_url,
                "validation_status": d.validation_status,
                "reliability_tier": d.reliability_tier,
                "error_details": d.error_details,
            }
            for d in discovery_candidates
        ]
    }

@router.post("")
async def add_source(payload: AddSourcePayload, db: Session = Depends(get_db)):
    # Validate feed connectivity first
    valid, message, latency, sample_title = await test_feed_connectivity(payload.feed_url)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Feed validation failed: {message}")

    # Check if feed_url already exists
    existing = db.query(NewsSource).filter(NewsSource.feed_url == payload.feed_url).first()
    if existing:
        raise HTTPException(status_code=400, detail="This feed URL is already configured.")

    source = NewsSource(
        name=payload.name,
        website_url=payload.website_url,
        feed_url=payload.feed_url,
        source_type=payload.source_type or "Official Announcement",
        reliability_tier=payload.reliability_tier or "Unverified source",
        is_active=True
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    return {
        "success": True,
        "message": f"Source added successfully ({message}).",
        "source": {
            "id": source.id,
            "name": source.name,
            "feed_url": source.feed_url,
            "reliability_tier": source.reliability_tier,
        }
    }

@router.delete("/{source_id}")
async def delete_source(source_id: str, db: Session = Depends(get_db)):
    source = db.query(NewsSource).filter(NewsSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
    return {"success": True, "message": f"Source '{source.name}' removed."}

@router.patch("/{source_id}/toggle")
async def toggle_source_active(source_id: str, db: Session = Depends(get_db)):
    source = db.query(NewsSource).filter(NewsSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    source.is_active = not source.is_active
    db.commit()
    return {"id": source.id, "is_active": source.is_active}

@router.post("/test")
async def test_source_feed(payload: TestFeedPayload):
    valid, message, latency, sample_title = await test_feed_connectivity(payload.feed_url)
    return {
        "valid": valid,
        "message": message,
        "latency_ms": latency,
        "sample_title": sample_title,
    }

@router.post("/discover")
async def trigger_source_discovery(db: Session = Depends(get_db)):
    results = await run_source_discovery(db)
    return {
        "success": True,
        "discovered_count": len(results),
        "results": results,
    }

@router.post("/evaluate")
async def evaluate_website(payload: EvaluateWebsitePayload, db: Session = Depends(get_db)):
    res = await evaluate_custom_source(payload.website_url, db)
    return res
