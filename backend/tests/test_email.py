import pytest
from app.services.email_service import generate_email_html
from app.models.schema import DailyReport

def test_generate_email_html():
    report = DailyReport(
        report_date="2026-11-05",
        executive_summary="Frontier AI labs announced state-of-the-art updates across reasoning and agent capabilities.",
        top_developments=[
            {
                "headline": "Claude 3.5 Sonnet Upgraded",
                "what_happened": "Enhanced reasoning and computer use features.",
                "why_it_matters": "Enables higher accuracy on engineering tasks.",
                "source_url": "https://anthropic.com/news",
                "source_name": "Anthropic",
                "verification_status": "Confirmed announcement"
            }
        ],
        model_releases=[
            {
                "model_name": "Claude 3.5 Sonnet",
                "organization": "Anthropic",
                "details": "Frontier multimodal reasoning",
                "source_url": "https://anthropic.com"
            }
        ],
        research_breakthroughs=[],
        total_articles_analyzed=12
    )

    html = generate_email_html(report, "http://localhost:5173")
    assert "Daily Intelligence Brief" in html
    assert "2026-11-05" in html
    assert "Claude 3.5 Sonnet" in html
    assert "Anthropic" in html
    assert "#2563EB" in html  # Brand blue accent
    assert "purple" not in html.lower()  # Strict no-purple rule
