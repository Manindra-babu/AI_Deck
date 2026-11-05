import pytest
from app.services.processor import (
    normalize_url, compute_content_hash, are_titles_similar,
    classify_article, calculate_importance, determine_verification_status
)

def test_normalize_url():
    url = "https://techcrunch.com/2026/03/10/ai-agent-launch/?utm_source=twitter&utm_medium=social#overview"
    normalized = normalize_url(url)
    assert "utm_source" not in normalized
    assert "utm_medium" not in normalized
    assert "#" not in normalized
    assert "techcrunch.com/2026/03/10/ai-agent-launch" in normalized

def test_compute_content_hash():
    h1 = compute_content_hash("New Model Released", "OpenAI has released a new model.")
    h2 = compute_content_hash("New Model Released", "OpenAI has released a new model.")
    h3 = compute_content_hash("Different Article", "Google announced something else.")
    assert h1 == h2
    assert h1 != h3

def test_are_titles_similar():
    t1 = "OpenAI Launches GPT-5 with Enhanced Reasoning Capabilities"
    t2 = "OpenAI launches GPT-5 with enhanced reasoning capabilities!"
    t3 = "Google DeepMind Unveils New Quantum Computing Milestone"
    assert are_titles_similar(t1, t2) is True
    assert are_titles_similar(t1, t3) is False

def test_classify_article():
    assert classify_article("Llama 3 Weights Released on Hugging Face", "Open source weights available") == "Model Releases"
    assert classify_article("Novel Attention Mechanism in Transformers", "arxiv preprint showing convergence") == "AI Research"
    assert classify_article("Autonomous Agent for Computer Use", "function calling and workflows") == "Agents"

def test_calculate_importance():
    score, reason = calculate_importance(
        "Anthropic Releases Claude 3.5 Sonnet",
        "Official announcement of frontier model with state-of-the-art benchmark results",
        "Model Releases",
        "Official source"
    )
    assert score >= 7.0
    assert "official" in reason or "model release" in reason

def test_determine_verification_status():
    assert determine_verification_status("Official Announcement", "Official source", "New AI Model") == "Confirmed announcement"
    assert determine_verification_status("Academic Paper", "Academic source", "Paper Title") == "Research finding"
    assert determine_verification_status("Established Publication", "Established publication", "Rumor of new chip") == "Unverified claim"
