import re
import os
import os
from typing import Dict, Any, List

class EmailPhishingAnalyzer:
    """
    Analyzes email content for phishing indicators using a Deep Learning Transformer model.
    Falls back to heuristic rules if the ML model is not available.
    """

    def __init__(self):
        self.model = None
        self.is_loaded = False

        # Heuristic keywords for fallback/highlighting
        self.urgency_keywords = [
            "urgent", "immediate", "action required", "account suspended", 
            "verify your account", "security alert", "unauthorized login"
        ]
        self.financial_keywords = [
            "invoice", "payment", "bank", "wire transfer", "crypto", 
            "bitcoin", "wallet", "funds"
        ]
        self.credential_keywords = [
            "password", "login", "credentials", "authenticate", 
            "click here", "sign in"
        ]

    def load_model(self):
        """Load the trained ML model from Hugging Face."""
        try:
            print("Loading Deep Learning Transformer model from Hugging Face...")
            from transformers import pipeline
            import warnings
            warnings.filterwarnings("ignore")
            
            # Using a lightweight bert model fine-tuned for spam detection
            self.model = pipeline("text-classification", model="mrm8488/bert-tiny-finetuned-sms-spam-detection", truncation=True, max_length=512)
            self.is_loaded = True
            print("Transformer ML model loaded successfully.")
        except Exception as e:
            print(f"Error loading Transformer ML model: {e}. Using heuristic fallback.")
            self.is_loaded = False

    @staticmethod
    def _risk_level(score: int) -> str:
        """Map an integer risk score to a human label (aligned with unified thresholds)."""
        if score >= 75:
            return "critical"
        if score >= 50:
            return "dangerous"
        if score >= 25:
            return "suspicious"
        return "safe"

    def _highlight_keywords(self, text: str) -> List[Dict[str, str]]:
        """Find and categorize suspicious keywords in the text."""
        highlights = []
        text_lower = text.lower()

        for kw in self.urgency_keywords:
            if kw in text_lower:
                highlights.append({"word": kw, "category": "urgency"})
        for kw in self.financial_keywords:
            if kw in text_lower:
                highlights.append({"word": kw, "category": "financial"})
        for kw in self.credential_keywords:
            if kw in text_lower:
                highlights.append({"word": kw, "category": "credential_harvesting"})

        return highlights

    def analyze(self, email_text: str) -> Dict[str, Any]:
        """
        Analyze the given email text.
        Uses the ML model if available, otherwise falls back to heuristics.
        """
        if not email_text or not isinstance(email_text, str):
            return {
                "risk_score": 0,
                "risk_level": "safe",
                "confidence": 0.0,
                "categories": {},
                "highlighted_keywords": [],
                "explanation": "No valid text provided.",
                "is_phishing": False,
                "indicators": []
            }

        highlights = self._highlight_keywords(email_text)
        indicators = list(set([h["word"] for h in highlights]))
        
        categories = {
            "urgency": sum(1 for h in highlights if h["category"] == "urgency"),
            "financial": sum(1 for h in highlights if h["category"] == "financial"),
            "credential_harvesting": sum(1 for h in highlights if h["category"] == "credential_harvesting"),
        }

        # If ML model is loaded, use it for the primary prediction
        if self.is_loaded and self.model is not None:
            # The transformer model outputs [{'label': 'LABEL_1', 'score': 0.99}]
            # LABEL_1 typically means spam/phishing, LABEL_0 means safe (ham)
            try:
                prediction = self.model(email_text[:512])[0]
                label = prediction['label']
                score = prediction['score']
                
                # Normalize probability to spam probability
                if label == 'LABEL_1' or 'spam' in label.lower() or 'phishing' in label.lower() or 'negative' in label.lower():
                    spam_prob = score
                else:
                    spam_prob = 1.0 - score
                    
                risk_score = int(spam_prob * 100)
                
                # Boost score slightly if known malicious keywords are present but ML missed them
                if len(indicators) >= 1 and risk_score < 50:
                    risk_score += 20
                    
                risk_score = min(risk_score, 100)
                
                explanation = "Analysis powered by Deep Learning Transformer classification (Semantic Vector Embeddings)."
                if len(indicators) > 0:
                    explanation += f" Detected suspicious keywords."

                return {
                    "risk_score": risk_score,
                    "risk_level": self._risk_level(risk_score),
                    "confidence": round(float(score), 2),
                    "categories": categories,
                    "highlighted_keywords": highlights,
                    "explanation": explanation,
                    "is_phishing": risk_score >= 50,
                    "indicators": indicators
                }
            except Exception as e:
                print(f"Transformer inference failed: {e}")
                # Fall through to fallback
            
        # Fallback to heuristic rules
        base_score = 0
        base_score += categories["urgency"] * 15
        base_score += categories["financial"] * 20
        base_score += categories["credential_harvesting"] * 25
        
        risk_score = min(base_score, 100)
        
        explanation = "Analysis powered by heuristic rules (ML model unavailable)."
        
        return {
            "risk_score": risk_score,
            "risk_level": self._risk_level(risk_score),
            "confidence": 0.70, # Static confidence for rules
            "categories": categories,
            "highlighted_keywords": highlights,
            "explanation": explanation,
            "is_phishing": risk_score >= 50,
            "indicators": indicators
        }
