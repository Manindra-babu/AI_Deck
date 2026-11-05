from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.core.database import get_db
from app.models.schema import ResearchPaper

router = APIRouter(prefix="/api/research", tags=["Research Radar"])

@router.get("")
async def list_research_papers(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ResearchPaper)

    if search:
        query = query.filter(
            (ResearchPaper.title.ilike(f"%{search}%")) |
            (ResearchPaper.abstract.ilike(f"%{search}%")) |
            (ResearchPaper.authors.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(ResearchPaper.category == category)

    total = query.count()
    papers = (
        query.order_by(desc(ResearchPaper.publication_date), desc(ResearchPaper.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "papers": [
            {
                "id": p.id,
                "title": p.title,
                "authors": p.authors,
                "publication_date": p.publication_date.isoformat() if p.publication_date else None,
                "abstract": p.abstract,
                "category": p.category,
                "paper_url": p.paper_url,
                "code_url": p.code_url,
                "ai_explanation": p.ai_explanation,
                "research_significance": p.research_significance,
            }
            for p in papers
        ]
    }
