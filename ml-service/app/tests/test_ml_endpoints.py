import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch
from app.main import app

@pytest.fixture
def mock_phishing_detector():
    with patch("app.main.phishing_detector") as mock_detector:
        mock_detector.is_loaded = True
        mock_detector.predict.return_value = {
            "is_phishing": True,
            "confidence": 0.85,
            "risk_score": 85,
            "features": {"url_length": 50},
            "explanation": "Test explanation"
        }
        yield mock_detector

@pytest.fixture
def mock_email_analyzer():
    with patch("app.main.email_analyzer") as mock_analyzer:
        mock_analyzer.analyze.return_value = {
            "risk_score": 90,
            "confidence": 0.95,
            "highlighted_keywords": [{"word": "urgent", "category": "urgency"}],
            "explanation": "Test explanation",
            "categories": {}
        }
        yield mock_analyzer

@pytest.mark.asyncio
async def test_health_check(mock_phishing_detector):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/ml/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["models_loaded"] is True

@pytest.mark.asyncio
async def test_predict_url_valid(mock_phishing_detector):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/ml/predict-url", json={"url": "http://example.com/login"})
    assert response.status_code == 200
    assert response.json()["is_phishing"] is True
    assert response.json()["risk_level"] == "critical"

@pytest.mark.asyncio
async def test_predict_url_invalid():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/ml/predict-url", json={"url": "not-a-url"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid URL format"

@pytest.mark.asyncio
async def test_analyze_email_valid(mock_email_analyzer):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/ml/analyze-email", json={"text": "urgent account update"})
    assert response.status_code == 200
    assert response.json()["is_phishing"] is True
    assert response.json()["risk_level"] == "critical"
    assert "urgent" in response.json()["indicators"]
