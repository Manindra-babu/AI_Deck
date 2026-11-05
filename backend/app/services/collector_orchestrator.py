import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from urllib.parse import urlparse
from sqlalchemy.orm import Session

from app.models.schema import (
    NewsSource, Article, ModelRelease, ResearchPaper,
    CollectionRun, utc_now
)
from app.seed_sources import INITIAL_SOURCES
from app.services.rss_collector import fetch_feed_articles
from app.services.processor import (
    normalize_url, compute_content_hash, are_titles_similar,
    classify_article, calculate_importance, determine_verification_status
)
from app.services.gemini_analyzer import (
    analyze_article_with_gemini, explain_research_paper_with_gemini
)

logger = logging.getLogger("ai_radar.collector")

def seed_initial_sources_if_empty(db: Session):
    """Seed the database with initial verified AI sources if table is empty."""
    count = db.query(NewsSource).count()
    if count == 0:
        logger.info("Seeding initial verified AI sources...")
        for src_data in INITIAL_SOURCES:
            source = NewsSource(
                name=src_data["name"],
                website_url=src_data["website_url"],
                feed_url=src_data["feed_url"],
                source_type=src_data["source_type"],
                reliability_tier=src_data["reliability_tier"],
                is_active=True
            )
            db.add(source)
        db.commit()

async def run_news_collection_cycle(db: Session, max_articles_per_source: int = 15) -> CollectionRun:
    """
    Executes a complete news collection and ingestion cycle.
    Fetches real RSS feeds, deduplicates, categorizes, analyzes via Gemini,
    and updates database records without fabricated content.
    """
    seed_initial_sources_if_empty(db)
    
    run = CollectionRun(
        started_at=utc_now(),
        status="running",
        sources_checked=0,
        articles_found=0,
        new_articles_saved=0,
        error_count=0
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    active_sources = db.query(NewsSource).filter(NewsSource.is_active == True).all()
    recent_titles = [
        t[0] for t in db.query(Article.title)
        .filter(Article.collected_at >= utc_now() - timedelta(days=7))
        .all()
    ]

    total_new = 0
    total_found = 0
    errors = 0
    gemini_calls_count = 0
    MAX_GEMINI_CALLS_PER_RUN = 3  # Protect free tier quota (5 RPM)

    for source in active_sources:
        run.sources_checked += 1
        try:
            logger.info(f"Fetching source: {source.name} ({source.feed_url})")
            entries = await fetch_feed_articles(source.feed_url)
            source.last_fetched_at = utc_now()
            source.last_error = None
            total_found += len(entries)
            
            source_new_count = 0
            for item in entries[:max_articles_per_source]:
                raw_url = item["link"]
                canon_url = normalize_url(raw_url)
                title = item["title"]
                content = item.get("content", "")
                published_at = item.get("published_at") or utc_now()
                
                # Deduplication 1: URL match
                existing_art = db.query(Article).filter(
                    (Article.original_url == raw_url) | (Article.canonical_url == canon_url)
                ).first()
                if existing_art:
                    continue
                    
                # Deduplication 2: Title similarity check against recent articles
                is_duplicate = False
                for existing_title in recent_titles[-200:]:
                    if are_titles_similar(title, existing_title, threshold=0.88):
                        is_duplicate = True
                        break
                if is_duplicate:
                    continue
                    
                content_hash = compute_content_hash(title, content)
                existing_hash = db.query(Article).filter(Article.content_hash == content_hash).first()
                if existing_hash:
                    continue
                    
                # Classification & Importance
                category = classify_article(title, content, source.source_type)
                importance, reason = calculate_importance(title, content, category, source.reliability_tier)
                verification = determine_verification_status(source.source_type, source.reliability_tier, title)
                
                domain = urlparse(source.website_url).netloc
                
                # Gemini AI enrichment (rate-limit aware)
                ai_summary = None
                why_matters = None
                tech_implications = None
                
                if (importance >= 7.5 or category == "Model Releases") and gemini_calls_count < MAX_GEMINI_CALLS_PER_RUN:
                    analysis = await analyze_article_with_gemini(title, content or item.get("raw_summary", ""), source.name)
                    gemini_calls_count += 1
                    if analysis:
                        ai_summary = analysis.summary
                        why_matters = analysis.why_it_matters
                        tech_implications = analysis.technical_implications
                        
                        # Handle Model Release detection
                        if analysis.is_model_release and analysis.model_name:
                            existing_model = db.query(ModelRelease).filter(ModelRelease.model_name == analysis.model_name).first()
                            if not existing_model:
                                model_entry = ModelRelease(
                                    model_name=analysis.model_name,
                                    organization=analysis.organization or source.name,
                                    announcement_date=published_at,
                                    model_category=category,
                                    capabilities=analysis.capabilities or why_matters,
                                    announcement_url=raw_url,
                                    is_open_source=analysis.is_open_source or False,
                                )
                                db.add(model_entry)
                
                # If category is Model Releases and wasn't added by Gemini, add directly if verified
                if category == "Model Releases":
                    existing_model = db.query(ModelRelease).filter(ModelRelease.announcement_url == raw_url).first()
                    if not existing_model:
                        model_entry = ModelRelease(
                            model_name=title.split(" - ")[0].split(":")[0][:80],
                            organization=source.name,
                            announcement_date=published_at,
                            model_category=category,
                            capabilities=item.get("raw_summary", "")[:250],
                            announcement_url=raw_url,
                            is_open_source=("open" in title.lower() or "weights" in title.lower()),
                        )
                        db.add(model_entry)

                # If Academic Research (e.g. arXiv), add to research_papers
                if "arxiv.org" in raw_url or source.source_type == "Academic Paper":
                    existing_paper = db.query(ResearchPaper).filter(ResearchPaper.paper_url == raw_url).first()
                    if not existing_paper:
                        paper_exp = None
                        if gemini_calls_count < MAX_GEMINI_CALLS_PER_RUN:
                            paper_exp = await explain_research_paper_with_gemini(
                                title=title,
                                abstract=content or item.get("raw_summary", ""),
                                authors=item.get("authors", "")
                            )
                            gemini_calls_count += 1

                        paper_entry = ResearchPaper(
                            title=title,
                            authors=item.get("authors", "Research Authors"),
                            publication_date=published_at,
                            abstract=content or item.get("raw_summary", ""),
                            category="AI Research",
                            paper_url=raw_url,
                            ai_explanation=paper_exp.simplified_explanation if paper_exp else None,
                            research_significance=paper_exp.research_significance if paper_exp else None
                        )
                        db.add(paper_entry)


                article = Article(
                    title=title,
                    original_url=raw_url,
                    canonical_url=canon_url,
                    content_hash=content_hash,
                    source_id=source.id,
                    source_name=source.name,
                    source_domain=domain,
                    published_at=published_at,
                    collected_at=utc_now(),
                    content=content,
                    raw_summary=item.get("raw_summary", ""),
                    ai_summary=ai_summary,
                    why_it_matters=why_matters,
                    technical_implications=tech_implications,
                    category=category,
                    importance_score=importance,
                    importance_reason=reason,
                    credibility_assessment=source.source_type,
                    verification_status=verification
                )
                db.add(article)
                source_new_count += 1
                total_new += 1
                recent_titles.append(title)
                
            source.article_count = (source.article_count or 0) + source_new_count
            db.commit()

        except Exception as e:
            logger.error(f"Error fetching source {source.name}: {e}")
            source.last_error = str(e)
            errors += 1
            db.commit()

    run.status = "completed"
    run.completed_at = utc_now()
    run.articles_found = total_found
    run.new_articles_saved = total_new
    run.error_count = errors
    run.details = f"Processed {run.sources_checked} sources. Ingested {total_new} new verified articles."
    db.commit()
    db.refresh(run)

    return run
