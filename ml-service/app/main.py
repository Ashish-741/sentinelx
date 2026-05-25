"""
FastAPI microservice for ML-based phishing detection and email analysis.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from .models.email_analyzer import EmailPhishingAnalyzer
from .models.phishing_model import PhishingDetector
from .features.domain_features import get_domain_info
from .utils.helpers import validate_url

logger = logging.getLogger(__name__)

phishing_detector = PhishingDetector()
email_analyzer = EmailPhishingAnalyzer()


def _map_risk_level(score: int) -> str:
    """Unified risk level mapping — single source of truth for the entire service."""
    if score >= 75:
        return "critical"
    if score >= 50:
        return "dangerous"
    if score >= 25:
        return "suspicious"
    return "safe"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Load ML models on startup."""
    if not phishing_detector.load_models():
        raise RuntimeError("Failed to load or train phishing detection models.")
    email_analyzer.load_model()
    yield


app = FastAPI(
    title="SentinelX ML Service",
    description="AI-powered phishing detection microservice",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class URLPredictionRequest(BaseModel):
    url: str


class URLPredictionResponse(BaseModel):
    url: str
    is_phishing: bool
    confidence: float
    risk_score: int
    risk_level: str
    features: dict
    explanation: str


class EmailAnalysisRequest(BaseModel):
    email_text: str | None = None
    text: str | None = None

    @model_validator(mode="after")
    def require_content(self):
        if not (self.email_text or self.text):
            raise ValueError("email_text or text is required")
        return self

    @property
    def content(self) -> str:
        return self.email_text or self.text or ""


class EmailAnalysisResponse(BaseModel):
    is_phishing: bool
    confidence: float
    risk_score: int
    risk_level: str
    indicators: list
    explanation: str
    categories: dict | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: bool


@app.get("/api/ml/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "service": "SentinelX ML Service",
        "version": "1.0.0",
        "models_loaded": phishing_detector.is_loaded,
    }


@app.post("/api/ml/predict-url", response_model=URLPredictionResponse)
async def predict_url(request: URLPredictionRequest):
    # Validate URL format
    if not validate_url(request.url):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    try:
        result = phishing_detector.predict(request.url)
        risk_score = result["risk_score"]
        risk_level = _map_risk_level(risk_score)

        # Enrich with domain age data (strong phishing signal)
        try:
            from urllib.parse import urlparse
            import tldextract
            extracted = tldextract.extract(request.url)
            domain = extracted.registered_domain
            if domain:
                domain_info = get_domain_info(domain)
                age_days = domain_info.get("domain_age_days")
                if age_days is not None and age_days < 30:
                    # Very new domain — boost risk score
                    risk_score = min(risk_score + 15, 100)
                    risk_level = _map_risk_level(risk_score)
                    result["features"]["domain_age_days"] = age_days
                    result["explanation"] += (
                        f" Additionally, this domain is only {age_days} days old,"
                        " which is a strong phishing indicator."
                    )
                elif age_days is not None:
                    result["features"]["domain_age_days"] = age_days
        except Exception as domain_exc:
            logger.debug("Domain enrichment skipped: %s", domain_exc)

        return {
            "url": request.url,
            "is_phishing": result["is_phishing"],
            "confidence": result["confidence"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "features": result["features"],
            "explanation": result["explanation"],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/ml/analyze-email", response_model=EmailAnalysisResponse)
async def analyze_email(request: EmailAnalysisRequest):
    try:
        analysis = email_analyzer.analyze(request.content)
        risk_score = analysis["risk_score"]
        risk_level = _map_risk_level(risk_score)
        confidence = analysis["confidence"]
        is_phishing = risk_score >= 50

        indicators = [
            item.get("word", str(item))
            for item in analysis.get("highlighted_keywords", [])
        ]

        return {
            "is_phishing": is_phishing,
            "confidence": confidence,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "indicators": indicators,
            "explanation": analysis.get("explanation", ""),
            "categories": analysis.get("categories"),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/")
async def root():
    return {
        "message": "SentinelX ML Service API",
        "endpoints": {
            "health": "/api/ml/health",
            "predict_url": "/api/ml/predict-url",
            "analyze_email": "/api/ml/analyze-email",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
