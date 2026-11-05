import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin, urlparse
import httpx
import feedparser
from bs4 import BeautifulSoup

from app.core.security import is_safe_url, sanitize_text

logger = logging.getLogger("ai_radar.rss_collector")

DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 AI-Intelligence-Radar/1.0"

def parse_entry_datetime(entry: Any) -> Optional[datetime]:
    """Extract and normalize publication timestamp to UTC."""
    for field in ("published_parsed", "updated_parsed", "created_parsed"):
        parsed_time = getattr(entry, field, None)
        if parsed_time:
            try:
                # convert struct_time to timestamp then UTC datetime
                timestamp = time.mktime(parsed_time)
                return datetime.fromtimestamp(timestamp, tz=timezone.utc)
            except Exception:
                pass
    return None

def extract_content(entry: Any) -> str:
    """Safely extract plain text content or summary from feed entry."""
    content_text = ""
    if hasattr(entry, "content") and entry.content:
        for c in entry.content:
            if isinstance(c, dict) and "value" in c:
                content_text += " " + c["value"]
    elif hasattr(entry, "summary") and entry.summary:
        content_text = entry.summary
    elif hasattr(entry, "description") and entry.description:
        content_text = entry.description

    return sanitize_text(content_text)

async def discover_feed_url(target_url: str) -> Optional[str]:
    """
    Attempt to discover an RSS/Atom feed from a webpage URL.
    Checks <link rel="alternate" type="application/rss+xml"> or similar.
    """
    if not is_safe_url(target_url):
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers={"User-Agent": DEFAULT_USER_AGENT}) as client:
            resp = await client.get(target_url)
            if resp.status_code != 200:
                return None
            
            content_type = resp.headers.get("content-type", "").lower()
            if any(t in content_type for t in ["xml", "rss", "atom"]):
                # Target URL itself is likely an RSS/Atom feed
                return str(resp.url)
            
            soup = BeautifulSoup(resp.text, "html.parser")
            feed_links = soup.find_all(
                "link",
                rel=lambda r: r and "alternate" in r.lower(),
                type=lambda t: t and any(ft in t.lower() for ft in ["rss", "atom", "xml"])
            )
            for link in feed_links:
                href = link.get("href")
                if href:
                    feed_url = urljoin(str(resp.url), href)
                    if is_safe_url(feed_url):
                        return feed_url
            
            # Common RSS fallback paths
            for path in ["/feed", "/feed/", "/rss", "/rss.xml", "/feed.xml", "/index.xml"]:
                candidate = urljoin(str(resp.url), path)
                try:
                    head_resp = await client.head(candidate, timeout=4.0)
                    if head_resp.status_code == 200 and any(t in head_resp.headers.get("content-type", "") for t in ["xml", "rss", "atom"]):
                        return candidate
                except Exception:
                    continue

    except Exception as e:
        logger.warning(f"Error during feed discovery for {target_url}: {e}")

    return None

async def test_feed_connectivity(feed_url: str) -> Tuple[bool, str, int, Optional[str]]:
    """
    Test connectivity to an RSS feed.
    Returns (success, message, response_time_ms, sample_title)
    """
    if not is_safe_url(feed_url):
        return False, "Invalid or unsafe URL (SSRF blocked)", 0, None

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers={"User-Agent": DEFAULT_USER_AGENT}) as client:
            resp = await client.get(feed_url)
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            if resp.status_code != 200:
                return False, f"HTTP Error {resp.status_code}", elapsed_ms, None
            
            feed = feedparser.parse(resp.text)
            if feed.bozo and not feed.entries:
                return False, f"Feed parsing error: {getattr(feed, 'bozo_exception', 'Malformed XML')}", elapsed_ms, None
            
            entry_count = len(feed.entries)
            sample_title = feed.entries[0].title if entry_count > 0 and hasattr(feed.entries[0], "title") else None
            
            return True, f"Valid feed with {entry_count} entries", elapsed_ms, sample_title

    except httpx.TimeoutException:
        return False, "Connection timed out", int((time.time() - start_time) * 1000), None
    except Exception as e:
        return False, f"Connection failed: {str(e)}", int((time.time() - start_time) * 1000), None

async def fetch_feed_articles(feed_url: str) -> List[Dict[str, Any]]:
    """
    Fetches and parses articles from a validated feed URL.
    Returns structured article dictionaries.
    """
    if not is_safe_url(feed_url):
        raise ValueError(f"Unsafe feed URL: {feed_url}")

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers={"User-Agent": DEFAULT_USER_AGENT}) as client:
        resp = await client.get(feed_url)
        resp.raise_for_status()
        raw_xml = resp.text

    feed = feedparser.parse(raw_xml)
    articles = []

    for entry in feed.entries:
        title = getattr(entry, "title", "").strip()
        link = getattr(entry, "link", "").strip()
        
        if not title or not link:
            continue
            
        published_at = parse_entry_datetime(entry)
        content_text = extract_content(entry)
        
        # arXiv specific parsing: authors and abstract
        authors = ""
        if hasattr(entry, "authors") and entry.authors:
            authors = ", ".join([a.get("name", "") for a in entry.authors if isinstance(a, dict) and a.get("name")])
        elif hasattr(entry, "author") and entry.author:
            authors = str(entry.author)

        articles.append({
            "title": title,
            "link": link,
            "published_at": published_at,
            "content": content_text,
            "raw_summary": content_text[:600] if content_text else "",
            "authors": authors,
        })

    return articles
