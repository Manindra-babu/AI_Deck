import hashlib
import re
from difflib import SequenceMatcher
from typing import Tuple, Dict, Any, Optional
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

def normalize_url(raw_url: str) -> str:
    """
    Normalizes a URL by stripping tracking parameters (utm_*, ref, etc.),
    sorting query parameters, and lowercasing domain.
    """
    if not raw_url:
        return ""
    try:
        parsed = urlparse(raw_url.strip())
        # Filter query params
        clean_params = []
        for k, v in parse_qsl(parsed.query, keep_blank_values=False):
            k_lower = k.lower()
            if not k_lower.startswith("utm_") and k_lower not in ("ref", "source", "fbclid", "gclid", "mc_cid", "mc_eid"):
                clean_params.append((k, v))
        clean_params.sort()
        new_query = urlencode(clean_params)
        
        path = parsed.path.rstrip('/')
        if not path:
            path = "/"
            
        normalized = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            path,
            "",
            new_query,
            ""
        ))
        return normalized
    except Exception:
        return raw_url.strip()

def compute_content_hash(title: str, content: Optional[str] = None) -> str:
    """Generate deterministic SHA-256 fingerprint from title and content snippet."""
    clean_title = re.sub(r'[^a-zA-Z0-9]', '', (title or "").lower())
    clean_content = re.sub(r'[^a-zA-Z0-9]', '', (content or "")[:300].lower())
    payload = f"{clean_title}::{clean_content}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()

def are_titles_similar(title1: str, title2: str, threshold: float = 0.82) -> bool:
    """Returns True if titles are semantically or lexically near-duplicates."""
    t1 = re.sub(r'[^\w\s]', '', title1.lower()).strip()
    t2 = re.sub(r'[^\w\s]', '', title2.lower()).strip()
    if t1 == t2:
        return True
    return SequenceMatcher(None, t1, t2).ratio() >= threshold

CATEGORY_KEYWORDS = {
    "Model Releases": [
        "weights", "releases model", "announces model", "launches model", "llama", "gemini",
        "gpt-", "claude", "mistral", "deepseek", "phi-", "qwen", "gemma", "model release",
        "foundation model", "state-of-the-art model"
    ],
    "AI Research": [
        "arxiv", "paper", "theorem", "proof", "benchmark", "ablation", "dataset",
        "transformer architecture", "attention mechanism", "neural", "convergence",
        "representation learning", "preprint", "iclr", "neurips", "cvpr", "icml"
    ],
    "Open Source": [
        "open source", "open-source", "github", "hugging face", "open weights", "apache 2.0",
        "mit license", "repository", "weights available", "reproducible"
    ],
    "Agents": [
        "agent", "agentic", "autonomous agent", "workflow automation", "computer use",
        "tool use", "function calling", "multi-agent", "agent framework"
    ],
    "Multimodal AI": [
        "multimodal", "vision-language", "vlm", "speech-to-text", "text-to-speech",
        "image generation", "video generation", "diffusion model", "sora", "audio"
    ],
    "Robotics": [
        "robot", "robotics", "embodied ai", "humanoid", "actuator", "manipulation",
        "locomotion", "spatial intelligence"
    ],
    "Infrastructure and Hardware": [
        "gpu", "tpu", "h100", "b200", "blackwell", "cuda", "inference cluster",
        "datacenter", "latency", "quantization", "vllm", "tensorrt", "nvidia", "silicon"
    ],
    "AI Safety": [
        "safety", "alignment", "red teaming", "jailbreak", "hallucination",
        "evaluations", "constitutional ai", "rlhf", "governance", "superalignment"
    ],
    "AI Policy": [
        "regulation", "copyright", "eu ai act", "executive order", "ftc", "antitrust",
        "compliance", "policy", "intellectual property", "legislation"
    ],
    "AI Tools": [
        "ide", "copilot", "developer tool", "sdk", "api release", "playground",
        "debugger", "cli tool", "extension", "plugin"
    ],
    "AI Companies": [
        "funding", "valuation", "acquisition", "series a", "series b", "ipo",
        "earnings", "partnership", "startup", "venture capital"
    ],
    "Industry Applications": [
        "healthcare", "biomedical", "drug discovery", "finance", "legal tech",
        "manufacturing", "logistics", "enterprise"
    ]
}

def classify_article(title: str, content: str, source_type: str = "") -> str:
    """Classifies an article into one of the designated categories based on content."""
    combined = f"{title} {content}".lower()
    
    if "arxiv" in combined or source_type == "Academic Paper":
        return "AI Research"
    
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in title.lower():
                score += 3  # Higher weight for title matches
            elif kw in content.lower():
                score += 1
        scores[category] = score
        
    best_category = max(scores, key=scores.get)
    if scores[best_category] > 0:
        return best_category
        
    return "Other AI Developments"

def calculate_importance(
    title: str,
    content: str,
    category: str,
    reliability_tier: str
) -> Tuple[float, str]:
    """
    Computes an objective importance score (1.0 to 10.0) and generates an explanatory reason.
    """
    score = 5.0
    reasons = []
    text = f"{title} {content}".lower()
    
    # 1. Source Credibility Baseline
    if reliability_tier == "Official source":
        score += 1.8
        reasons.append("direct announcement from a tier-1 AI lab/company")
    elif reliability_tier == "Academic source":
        score += 1.5
        reasons.append("peer-reviewed or academic preprint from arXiv/lab")
    elif reliability_tier == "Established publication":
        score += 0.8
        reasons.append("investigative journalism from established tech outlet")
        
    # 2. Content & Impact signals
    high_impact_signals = [
        ("major model release", ["state-of-the-art", "sota", "releases", "announces new model", "frontier model", "gpt-5", "claude 3.5", "gemini 2"]),
        ("open-weights release", ["open weights", "open source model", "weights available on hugging face", "apache 2.0"]),
        ("architectural breakthrough", ["new architecture", "breakthrough", "10x speedup", "novel training method"]),
        ("frontier capability", ["reasoning model", "computer use", "autonomous agent", "breakthrough in math"]),
        ("hardware/datacenter expansion", ["gigawatt", "blackwell deployment", "next-gen accelerator"]),
    ]
    
    for label, keywords in high_impact_signals:
        if any(k in text for k in keywords):
            score += 1.2
            reasons.append(label)
            break
            
    # 3. Category weighting
    if category == "Model Releases":
        score += 1.0
        reasons.append("direct model release")
    elif category in ("AI Research", "Agents", "Open Source"):
        score += 0.5
        
    # Cap score
    score = min(max(round(score, 1), 1.0), 10.0)
    
    if reasons:
        explanation = f"Rated {score}/10 due to {', '.join(reasons)}."
    else:
        explanation = f"Rated {score}/10 based on standard industry coverage."
        
    return score, explanation

def determine_verification_status(source_type: str, reliability_tier: str, title: str) -> str:
    """
    Distinguishes confirmed announcements, research findings, company claims,
    reported developments, and unverified claims.
    """
    title_lower = title.lower()
    if reliability_tier == "Academic source" or "arxiv" in title_lower:
        return "Research finding"
    if reliability_tier == "Official source":
        if any(w in title_lower for w in ["claims", "plans to", "reportedly", "rumor"]):
            return "Company claim"
        return "Confirmed announcement"
    if any(w in title_lower for w in ["rumor", "leak", "unverified", "alleged", "sources say"]):
        return "Unverified claim"
    if reliability_tier == "Established publication":
        return "Reported development"
    return "Reported development"
