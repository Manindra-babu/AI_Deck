from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.core.database import get_db
from app.models.schema import ModelRelease

router = APIRouter(prefix="/api/models", tags=["AI Models Tracker"])

@router.get("")
async def list_model_releases(
    organization: Optional[str] = Query(None),
    is_open_source: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ModelRelease)

    if organization:
        query = query.filter(ModelRelease.organization.ilike(f"%{organization}%"))
    if is_open_source is not None:
        query = query.filter(ModelRelease.is_open_source == is_open_source)
    if search:
        query = query.filter(
            (ModelRelease.model_name.ilike(f"%{search}%")) |
            (ModelRelease.capabilities.ilike(f"%{search}%")) |
            (ModelRelease.organization.ilike(f"%{search}%"))
        )

    models = query.order_by(desc(ModelRelease.announcement_date), desc(ModelRelease.created_at)).all()

    return [
        {
            "id": m.id,
            "model_name": m.model_name,
            "organization": m.organization,
            "announcement_date": m.announcement_date.isoformat() if m.announcement_date else None,
            "model_category": m.model_category,
            "capabilities": m.capabilities,
            "announcement_url": m.announcement_url,
            "documentation_url": m.documentation_url,
            "is_open_source": m.is_open_source,
            "weights_available": m.weights_available,
            "benchmarks": m.benchmarks,
        }
        for m in models
    ]
