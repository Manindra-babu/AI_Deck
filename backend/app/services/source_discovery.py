import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from sqlalchemy.orm import Session

from app.models.schema import SourceDiscovery, NewsSource
from app.services.rss_collector import discover_feed_url, test_feed_connectivity
from app.core.security import is_safe_url

logger = logging.getLogger("ai_radar.source_discovery")

# Well-known AI research labs and organizations for candidate discovery
KNOWN_AI_ENTITIES = [
    {"name": "Allen Institute for AI (Ai2)", "url": "https://allenai.org/news", "type": "Academic Paper", "tier": "Academic source"},
    {"name": "Berkeley AI Research (BAIR)", "url": "https://bair.berkeley.edu/blog/", "type": "Academic Paper", "tier": "Academic source"},
    {"name": "Stanford HAI", "url": "https://hai.stanford.edu/news", "type": "Academic Paper", "tier": "Academic source"},
    {"name": "Cohere AI", "url": "https://cohere.com/blog", "type": "Official Announcement", "tier": "Official source"},
    {"name": "Stability AI", "url": "https://stability.ai/news", "type": "Official Announcement", "tier": "Official source"},
    {"name": "Anthropic Research", "url": "https://www.anthropic.com/research", "type": "Academic Paper", "tier": "Official source"},
    {"name": "DeepSeek Blog", "url": "https://deepseek.com/blog", "type": "Official Announcement", "tier": "Official source"},
    {"name": "Scale AI Blog", "url": "https://scale.com/blog", "type": "Official Announcement", "tier": "Official source"},
    {"name": "LangChain Blog", "url": "https://blog.langchain.dev/", "type": "Open Source Community", "tier": "Community source"},
    {"name": "LlamaIndex Blog", "url": "https://www.llamaindex.ai/blog", "type": "Open Source Community", "tier": "Community source"},
    {"name": "Ars Technica AI", "url": "https://arstechnica.com/ai/", "type": "Established Publication", "tier": "Established publication"},
    {"name": "MIT CSAIL News", "url": "https://www.csail.mit.edu/news", "type": "Academic Paper", "tier": "Academic source"},
]

async def run_source_discovery(db: Session) -> List[Dict[str, Any]]:
    """
    Evaluates known AI entities, probes their websites for verified feeds,
    and records candidates in the source_discovery table without adding unverified feeds directly.
    """
    discovered_results = []
    
    for candidate in KNOWN_AI_ENTITIES:
        target_url = candidate["url"]
        domain = urlparse(target_url).netloc.lower()
        
        # Check if already in news_sources
        existing_source = db.query(NewsSource).filter(NewsSource.feed_url.like(f"%{domain}%")).first()
        if existing_source:
            continue
            
        # Check if already evaluated in source_discovery
        discovery_rec = db.query(SourceDiscovery).filter(SourceDiscovery.domain == domain).first()
        if not discovery_rec:
            discovery_rec = SourceDiscovery(
                domain=domain,
                suggested_name=candidate["name"],
                suggested_type=candidate["type"],
                reliability_tier=candidate["tier"],
                validation_status="testing"
            )
            db.add(discovery_rec)
            db.commit()
            db.refresh(discovery_rec)
            
        # Attempt feed discovery
        feed_url = await discover_feed_url(target_url)
        if feed_url:
            success, msg, latency, sample_title = await test_feed_connectivity(feed_url)
            if success:
                discovery_rec.discovered_feed_url = feed_url
                discovery_rec.validation_status = "validated"
                discovery_rec.error_details = f"Verified: {msg} (Latency: {latency}ms)"
            else:
                discovery_rec.discovered_feed_url = feed_url
                discovery_rec.validation_status = "failed"
                discovery_rec.error_details = f"Feed test failed: {msg}"
        else:
            discovery_rec.validation_status = "failed"
            discovery_rec.error_details = "No RSS/Atom feed detected on website"
            
        db.commit()
        discovered_results.append({
            "domain": domain,
            "name": candidate["name"],
            "feed_url": discovery_rec.discovered_feed_url,
            "status": discovery_rec.validation_status,
            "details": discovery_rec.error_details,
            "tier": candidate["tier"]
        })
        
    return discovered_results

async def evaluate_custom_source(website_url: str, db: Session) -> Dict[str, Any]:
    """Inspects a custom website URL provided by the user for valid feeds and reliability."""
    if not is_safe_url(website_url):
        return {"success": False, "error": "Invalid or blocked URL"}
        
    domain = urlparse(website_url).netloc.lower()
    discovered_feed = await discover_feed_url(website_url)
    
    tier = "Unverified source"
    if any(edu in domain for edu in [".edu", "arxiv.org", "openreview.net"]):
        tier = "Academic source"
    elif any(comp in domain for comp in ["google.com", "openai.com", "anthropic.com", "nvidia.com", "microsoft.com", "meta.com"]):
        tier = "Official source"
        
    if discovered_feed:
        valid, msg, latency, sample_title = await test_feed_connectivity(discovered_feed)
        return {
            "success": valid,
            "domain": domain,
            "discovered_feed_url": discovered_feed,
            "reliability_tier": tier,
            "status_message": msg,
            "latency_ms": latency,
            "sample_title": sample_title
        }
    else:
        return {
            "success": False,
            "domain": domain,
            "discovered_feed_url": None,
            "reliability_tier": tier,
            "status_message": "No RSS/Atom feed discovered automatically on this webpage."
        }
