from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional, List

from app.core.database import get_db
from app.models.schema import Article
from app.services.processor import are_titles_similar

router = APIRouter(prefix="/api/articles", tags=["Articles"])

@router.get("")
async def list_articles(
    q: Optional[str] = Query(None, description="Search keyword in title or content"),
    category: Optional[str] = Query(None, description="Filter by category"),
    source_name: Optional[str] = Query(None, description="Filter by source name"),
    min_importance: Optional[float] = Query(None, ge=1.0, le=10.0, description="Minimum importance score"),
    verification_status: Optional[str] = Query(None, description="Filter by verification status"),
    is_bookmarked: Optional[bool] = Query(None, description="Filter by bookmarked status"),
    sort_by: str = Query("published_at", regex="^(published_at|importance_score)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Article)

    if q:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{q}%"),
                Article.content.ilike(f"%{q}%"),
                Article.ai_summary.ilike(f"%{q}%")
            )
        )
    if category:
        query = query.filter(Article.category == category)
    if source_name:
        query = query.filter(Article.source_name == source_name)
    if min_importance is not None:
        query = query.filter(Article.importance_score >= min_importance)
    if verification_status:
        query = query.filter(Article.verification_status == verification_status)
    if is_bookmarked is not None:
        query = query.filter(Article.is_bookmarked == is_bookmarked)

    total = query.count()

    order_col = Article.published_at if sort_by == "published_at" else Article.importance_score
    order_func = desc(order_col) if sort_order == "desc" else asc(order_col)
    
    articles = query.order_by(order_func).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size else 1,
        "articles": [
            {
                "id": a.id,
                "title": a.title,
                "original_url": a.original_url,
                "source_name": a.source_name,
                "source_domain": a.source_domain,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "collected_at": a.collected_at.isoformat() if a.collected_at else None,
                "raw_summary": a.raw_summary,
                "ai_summary": a.ai_summary,
                "why_it_matters": a.why_it_matters,
                "technical_implications": a.technical_implications,
                "category": a.category,
                "importance_score": a.importance_score,
                "importance_reason": a.importance_reason,
                "credibility_assessment": a.credibility_assessment,
                "verification_status": a.verification_status,
                "is_read": a.is_read,
                "is_bookmarked": a.is_bookmarked,
            }
            for a in articles
        ]
    }

@router.get("/{article_id}")
async def get_article_detail(article_id: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Related articles in same category
    related = (
        db.query(Article)
        .filter(Article.category == article.category, Article.id != article.id)
        .order_by(Article.published_at.desc())
        .limit(4)
        .all()
    )

    # Duplicate or multi-source coverage identification
    all_recent = db.query(Article).filter(Article.id != article.id).order_by(Article.published_at.desc()).limit(150).all()
    duplicate_coverage = [
        {
            "id": r.id,
            "title": r.title,
            "source_name": r.source_name,
            "original_url": r.original_url,
            "published_at": r.published_at.isoformat() if r.published_at else None
        }
        for r in all_recent if are_titles_similar(article.title, r.title, threshold=0.75)
    ]

    return {
        "article": {
            "id": article.id,
            "title": article.title,
            "original_url": article.original_url,
            "canonical_url": article.canonical_url,
            "source_name": article.source_name,
            "source_domain": article.source_domain,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "content": article.content,
            "raw_summary": article.raw_summary,
            "ai_summary": article.ai_summary,
            "why_it_matters": article.why_it_matters,
            "technical_implications": article.technical_implications,
            "category": article.category,
            "importance_score": article.importance_score,
            "importance_reason": article.importance_reason,
            "credibility_assessment": article.credibility_assessment,
            "verification_status": article.verification_status,
            "is_read": article.is_read,
            "is_bookmarked": article.is_bookmarked,
        },
        "related_articles": [
            {
                "id": r.id,
                "title": r.title,
                "source_name": r.source_name,
                "category": r.category,
                "published_at": r.published_at.isoformat() if r.published_at else None,
            }
            for r in related
        ],
        "duplicate_coverage": duplicate_coverage,
    }

@router.patch("/{article_id}/read")
async def toggle_read_status(article_id: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.is_read = not article.is_read
    db.commit()
    return {"id": article.id, "is_read": article.is_read}

@router.patch("/{article_id}/bookmark")
async def toggle_bookmark_status(article_id: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.is_bookmarked = not article.is_bookmarked
    db.commit()
    return {"id": article.id, "is_bookmarked": article.is_bookmarked}
