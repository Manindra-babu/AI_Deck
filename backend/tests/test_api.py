import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_dashboard_summary():
    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert "sync_status" in data
    assert "breaking_news" in data
    assert "latest_news" in data

def test_list_articles():
    resp = client.get("/api/articles?page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert "articles" in data
    assert "total" in data

def test_list_models():
    resp = client.get("/api/models")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_list_research():
    resp = client.get("/api/research")
    assert resp.status_code == 200
    data = resp.json()
    assert "papers" in data

def test_list_sources():
    resp = client.get("/api/sources")
    assert resp.status_code == 200
    data = resp.json()
    assert "sources" in data
    assert len(data["sources"]) > 0

def test_get_settings():
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "gemini" in data
    assert "smtp" in data
    assert "schedule" in data
