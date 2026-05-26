"""
SentinelX ML Service - Phishing URL Detection Model

Wraps scikit-learn Random Forest (primary) and Logistic Regression (secondary)
classifiers.  Loads pre-trained models from disk; if none exist, triggers the
training pipeline automatically.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np

from app.features.url_features import FEATURE_NAMES, extract_features

logger = logging.getLogger(__name__)

# Resolved path to the models directory
_MODELS_DIR = Path(__file__).resolve().parents[2] / "models"


class PhishingDetector:
    """
    ML-based phishing URL detector.

    Attributes:
        rf_model: Trained Random Forest classifier (primary).
        lr_model: Trained Logistic Regression classifier (secondary).
        feature_names: Ordered feature list used during training.
        is_loaded: Whether models have been successfully loaded.
    """

    def __init__(self) -> None:
        self.rf_model: Any = None
        self.lr_model: Any = None
        self.feature_names: list[str] = FEATURE_NAMES
        self.is_loaded: bool = False

    # ------------------------------------------------------------------
    # Model lifecycle
    # ------------------------------------------------------------------

    def load_models(self) -> bool:
        """
        Attempt to load serialised models from disk.

        If the model files are not found, the training pipeline is invoked
        automatically so the service can start cleanly on first run.

        Returns:
            True if models were loaded (or trained) successfully.
        """
        rf_path = _MODELS_DIR / "random_forest_model.joblib"
        lr_path = _MODELS_DIR / "logistic_regression_model.joblib"
        features_path = _MODELS_DIR / "feature_names.joblib"

        if rf_path.exists() and lr_path.exists():
            try:
                self.rf_model = joblib.load(rf_path)
                self.lr_model = joblib.load(lr_path)
                if features_path.exists():
                    self.feature_names = joblib.load(features_path)
                self.is_loaded = True
                logger.info("ML models loaded successfully from %s", _MODELS_DIR)
                return True
            except Exception as exc:
                logger.error("Failed to load models: %s", exc)

        # Models not on disk → trigger training
        logger.info("Pre-trained models not found. Starting training pipeline…")
        return self._train_models()

    def _train_models(self) -> bool:
        """Run the training script and then load the freshly saved models."""
        try:
            from app.training.train_model import train_and_save_models

            train_and_save_models()

            # Now load what was just saved
            rf_path = _MODELS_DIR / "random_forest_model.joblib"
            lr_path = _MODELS_DIR / "logistic_regression_model.joblib"
            features_path = _MODELS_DIR / "feature_names.joblib"

            self.rf_model = joblib.load(rf_path)
            self.lr_model = joblib.load(lr_path)
            if features_path.exists():
                self.feature_names = joblib.load(features_path)

            self.is_loaded = True
            logger.info("Models trained and loaded successfully.")
            return True
        except Exception as exc:
            logger.error("Model training failed: %s", exc)
            self.is_loaded = False
            return False

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def predict(self, url: str) -> Dict[str, Any]:
        """
        Predict whether *url* is a phishing URL.

        Uses the Random Forest as the primary model.  If both models are
        available the final confidence is the average of the two model
        probabilities.

        Args:
            url: The URL string to classify.

        Returns:
            Dictionary with keys:
                is_phishing, confidence, risk_level, risk_score,
                features, explanation.
        """
        if not self.is_loaded:
            raise RuntimeError(
                "ML models are not loaded. Please wait for model initialisation."
            )

        # 1. Extract features
        features = extract_features(url, skip_whois=True)

        # 2. Build ordered feature vector
        feature_vector = np.array(
            [features.get(name, 0.0) for name in self.feature_names]
        ).reshape(1, -1)

        # 3. Primary prediction (Random Forest)
        rf_proba = self.rf_model.predict_proba(feature_vector)[0]
        rf_phishing_prob = float(rf_proba[1])

        # 4. Secondary prediction (Logistic Regression)
        lr_phishing_prob: Optional[float] = None
        if self.lr_model is not None:
            lr_proba = self.lr_model.predict_proba(feature_vector)[0]
            lr_phishing_prob = float(lr_proba[1])

        # 5. Ensemble confidence
        if lr_phishing_prob is not None:
            confidence = round((rf_phishing_prob * 0.7 + lr_phishing_prob * 0.3), 4)
        else:
            confidence = round(rf_phishing_prob, 4)

        is_phishing = confidence >= 0.5
        risk_score = int(confidence * 100)
        risk_level = self._risk_level(risk_score)

        # 6. Human-readable explanation
        explanation = self._generate_explanation(features, is_phishing, confidence)

        return {
            "is_phishing": is_phishing,
            "confidence": confidence,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "features": features,
            "explanation": explanation,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _risk_level(score: int) -> str:
        """Map 0-100 score to a risk label (aligned with main.py _map_risk_level)."""
        if score >= 75:
            return "critical"
        if score >= 50:
            return "dangerous"
        if score >= 25:
            return "suspicious"
        return "safe"

    @staticmethod
    def _generate_explanation(
        features: Dict[str, float],
        is_phishing: bool,
        confidence: float,
    ) -> str:
        """
        Build a plain-English explanation of why the URL was classified
        the way it was, based on which features were flagged.
        """
        reasons: list[str] = []

        if features.get("has_ip_address", 0):
            reasons.append("The URL uses an IP address instead of a domain name")
        if features.get("has_suspicious_tld", 0):
            reasons.append("The domain uses a suspicious top-level domain")
        if features.get("is_typosquatting", 0):
            reasons.append(
                "The domain name closely resembles a well-known brand (possible typosquatting)"
            )
        if features.get("is_shortened", 0):
            reasons.append("The URL uses a known URL-shortening service")
        if features.get("has_suspicious_keywords", 0):
            reasons.append(
                "The URL contains suspicious keywords (e.g. login, verify, secure)"
            )
        if features.get("has_at_symbol", 0):
            reasons.append("The URL contains an '@' symbol, which can be used to deceive")
        if features.get("has_port", 0):
            reasons.append("The URL specifies a non-standard port")
        if not features.get("has_https", 0):
            reasons.append("The URL does not use HTTPS encryption")
        if features.get("url_length", 0) > 75:
            reasons.append("The URL is unusually long")
        if features.get("num_subdomains", 0) > 3:
            reasons.append("The URL has an excessive number of subdomains")
        if features.get("entropy", 0) > 4.5:
            reasons.append("The URL has high character entropy (appears randomly generated)")
        if features.get("digit_to_letter_ratio", 0) > 0.5:
            reasons.append("The URL has an unusually high digit-to-letter ratio")

        if is_phishing:
            if reasons:
                header = (
                    f"This URL is classified as PHISHING with {confidence:.0%} confidence. "
                    "Key risk factors: "
                )
                return header + "; ".join(reasons) + "."
            return (
                f"This URL is classified as PHISHING with {confidence:.0%} confidence "
                "based on overall feature analysis."
            )
        else:
            if reasons:
                header = (
                    f"This URL appears LEGITIMATE ({confidence:.0%} phishing probability). "
                    "Minor observations: "
                )
                return header + "; ".join(reasons) + "."
            return (
                f"This URL appears LEGITIMATE with {confidence:.0%} phishing probability. "
                "No significant risk indicators were detected."
            )
