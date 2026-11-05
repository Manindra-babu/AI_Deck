import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    website_url = Column(String(500), nullable=False)
    feed_url = Column(String(500), nullable=False, unique=True, index=True)
    source_type = Column(String(50), default="Official Announcement")  # Official, Academic, Publication, Community
    reliability_tier = Column(String(50), default="Official source")  # Official source, Academic source, Established publication, Community source, Unverified source
    is_active = Column(Boolean, default=True, index=True)
    last_fetched_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    article_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    articles = relationship("Article", back_populates="source", cascade="all, delete-orphan")


class NewsEvent(Base):
    """Groups duplicate or multi-source coverage of the same underlying story"""
    __tablename__ = "news_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)
    category = Column(String(100), default="Other AI Developments")
    importance_score = Column(Float, default=5.0)
    first_seen_at = Column(DateTime(timezone=True), default=utc_now)
    last_updated_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    articles = relationship("Article", back_populates="event")


class Article(Base):
    __tablename__ = "articles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False, index=True)
    original_url = Column(String(1000), nullable=False, unique=True, index=True)
    canonical_url = Column(String(1000), nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)
    
    source_id = Column(String(36), ForeignKey("news_sources.id"), nullable=True)
    source_name = Column(String(200), nullable=False, default="Unknown Source")
    source_domain = Column(String(200), nullable=False, default="unknown.com")
    
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    collected_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    
    content = Column(Text, nullable=True)
    raw_summary = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    technical_implications = Column(Text, nullable=True)
    
    category = Column(String(100), default="Other AI Developments", index=True)
    importance_score = Column(Float, default=5.0, index=True)
    importance_reason = Column(Text, nullable=True)
    credibility_assessment = Column(String(50), default="Official Announcement")
    verification_status = Column(String(50), default="Confirmed Announcement") # Confirmed announcement, Research finding, Company claim, Reported development, Unverified claim
    
    is_read = Column(Boolean, default=False)
    is_bookmarked = Column(Boolean, default=False)
    
    event_id = Column(String(36), ForeignKey("news_events.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    source = relationship("NewsSource", back_populates="articles")
    event = relationship("NewsEvent", back_populates="articles")


class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False, index=True)
    authors = Column(Text, nullable=True)
    publication_date = Column(DateTime(timezone=True), nullable=True)
    abstract = Column(Text, nullable=True)
    category = Column(String(100), default="AI Research")
    paper_url = Column(String(1000), nullable=False, unique=True)
    code_url = Column(String(1000), nullable=True)
    ai_explanation = Column(Text, nullable=True)
    research_significance = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ModelRelease(Base):
    __tablename__ = "model_releases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_name = Column(String(200), nullable=False, index=True)
    organization = Column(String(200), nullable=False)
    announcement_date = Column(DateTime(timezone=True), nullable=True)
    model_category = Column(String(100), default="Multimodal")
    capabilities = Column(Text, nullable=True)
    announcement_url = Column(String(1000), nullable=False)
    documentation_url = Column(String(1000), nullable=True)
    is_open_source = Column(Boolean, default=False)
    weights_available = Column(Boolean, default=False)
    benchmarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_date = Column(String(20), nullable=False, unique=True, index=True)  # YYYY-MM-DD
    executive_summary = Column(Text, nullable=False)
    top_developments = Column(JSON, default=list)
    model_releases = Column(JSON, default=list)
    research_breakthroughs = Column(JSON, default=list)
    industry_developments = Column(JSON, default=list)
    open_source_developments = Column(JSON, default=list)
    emerging_trends = Column(JSON, default=list)
    total_articles_analyzed = Column(Integer, default=0)
    generated_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    email_logs = relationship("EmailLog", back_populates="report")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("daily_reports.id"), nullable=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    status = Column(String(50), default="pending")  # sent, failed, skipped
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), default=utc_now)

    report = relationship("DailyReport", back_populates="email_logs")


class SourceDiscovery(Base):
    __tablename__ = "source_discovery"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    domain = Column(String(200), nullable=False, unique=True)
    suggested_name = Column(String(200), nullable=False)
    suggested_type = Column(String(100), default="Official Announcement")
    discovered_feed_url = Column(String(500), nullable=True)
    validation_status = Column(String(50), default="untested")  # untested, validated, failed
    reliability_tier = Column(String(50), default="Unverified source")
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ApplicationSetting(Base):
    __tablename__ = "application_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="running")  # running, completed, failed
    sources_checked = Column(Integer, default=0)
    articles_found = Column(Integer, default=0)
    new_articles_saved = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    details = Column(Text, nullable=True)
