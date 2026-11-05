import ipaddress
import re
from urllib.parse import urlparse
import html
from typing import Optional

# Block private / loopback / link-local addresses for SSRF protection
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def is_safe_url(url: str) -> bool:
    """Validate that a URL is safe to fetch (HTTP/HTTPS only, not private IP/localhost)."""
    if not url or not isinstance(url, str):
        return False
    
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        return False
    
    hostname = parsed.hostname
    if not hostname:
        return False
    
    hostname = hostname.lower()
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
        return False
    
    # Check if host is direct IP address
    try:
        ip = ipaddress.ip_address(hostname)
        for net in BLOCKED_IP_NETWORKS:
            if ip in net:
                return False
    except ValueError:
        # Not a raw IP, standard domain name
        pass
    
    return True

def sanitize_text(text: Optional[str]) -> str:
    """Sanitize and clean text extracted from external sources."""
    if not text:
        return ""
    # Strip dangerous HTML and escape entities
    cleaned = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'<style.*?</style>', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
    # Remove HTML tags while preserving text
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    # Normalize spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_html_summary(html_content: Optional[str], max_len: int = 500) -> str:
    """Safely extract plain text preview from HTML."""
    if not html_content:
        return ""
    plain = sanitize_text(html_content)
    if len(plain) > max_len:
        return plain[:max_len].rsplit(' ', 1)[0] + '...'
    return plain
