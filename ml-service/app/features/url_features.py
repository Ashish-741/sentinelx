"""
SentinelX ML Service - URL Feature Extraction

Extracts 24 numerical features from a URL for phishing detection.
Features include structural properties, entropy, typosquatting similarity,
and presence of suspicious patterns.
"""

import math
import re
from typing import Dict
from urllib.parse import urlparse

import tldextract


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

KNOWN_SHORTENERS: set[str] = {
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    "t.co",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "adf.ly",
    "bit.do",
    "mcaf.ee",
    "su.pr",
    "rebrand.ly",
    "cutt.ly",
    "shorte.st",
    "tiny.cc",
}

SUSPICIOUS_TLDS: set[str] = {
    ".xyz",
    ".tk",
    ".ml",
    ".ga",
    ".cf",
    ".gq",
    ".buzz",
    ".top",
    ".club",
    ".icu",
    ".work",
}

SUSPICIOUS_KEYWORDS: set[str] = {
    "login",
    "verify",
    "secure",
    "account",
    "update",
    "banking",
    "paypal",
    "signin",
    "confirm",
    "password",
    "suspend",
    "alert",
    "unusual",
}

KNOWN_BRANDS: list[str] = [
    "google",
    "facebook",
    "apple",
    "microsoft",
    "amazon",
    "paypal",
    "netflix",
    "instagram",
    "twitter",
    "linkedin",
    "yahoo",
    "dropbox",
    "chase",
    "wellsfargo",
    "bankofamerica",
]


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _levenshtein_distance(s1: str, s2: str) -> int:
    """
    Compute the Levenshtein (edit) distance between two strings.

    Uses a standard dynamic-programming approach with O(min(m, n)) memory.

    Args:
        s1: First string.
        s2: Second string.

    Returns:
        Integer edit distance.
    """
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = list(range(len(s2) + 1))

    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            # Insertion, deletion, substitution
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def _shannon_entropy(text: str) -> float:
    """
    Calculate Shannon entropy of a string.

    Higher entropy suggests more randomness, which is common in
    machine-generated phishing URLs.

    Args:
        text: Input string.

    Returns:
        Shannon entropy as a float.
    """
    if not text:
        return 0.0

    length = len(text)
    freq: Dict[str, int] = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1

    entropy = 0.0
    for count in freq.values():
        probability = count / length
        if probability > 0:
            entropy -= probability * math.log2(probability)

    return round(entropy, 4)


def _is_ip_address(domain: str) -> bool:
    """Check whether *domain* looks like an IP address (v4)."""
    pattern = r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"
    return bool(re.match(pattern, domain))


def _check_typosquatting(domain: str) -> bool:
    """
    Return True if *domain* is suspiciously close (edit distance ≤ 2)
    to any well-known brand but not an exact match.
    """
    domain_lower = domain.lower().split(".")[0]  # base name without TLD
    for brand in KNOWN_BRANDS:
        distance = _levenshtein_distance(domain_lower, brand)
        if 0 < distance <= 2:
            return True
    return False


from app.features.domain_features import get_domain_info

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_features(url: str, skip_whois: bool = False) -> Dict[str, float]:
    """
    Extract 25 numerical features from a URL for ML model input.
    """
    features: Dict[str, float] = {}

    url_str = url if url else ""
    parsed = urlparse(url_str)
    extracted = tldextract.extract(url_str)

    domain = extracted.registered_domain or parsed.netloc or ""
    subdomain = extracted.subdomain or ""
    suffix = extracted.suffix or ""
    path = parsed.path or ""
    url_lower = url_str.lower()

    # --- Structural features ---
    features["url_length"] = float(len(url_str))
    features["num_dots"] = float(url_str.count("."))
    features["num_hyphens"] = float(url_str.count("-"))
    features["num_underscores"] = float(url_str.count("_"))
    features["num_slashes"] = float(url_str.count("/"))
    features["num_question_marks"] = float(url_str.count("?"))
    features["num_equal_signs"] = float(url_str.count("="))
    features["num_at_signs"] = float(url_str.count("@"))
    features["num_ampersands"] = float(url_str.count("&"))
    features["num_exclamation"] = float(url_str.count("!"))
    features["num_digits"] = float(sum(c.isdigit() for c in url_str))
    features["num_subdomains"] = float(subdomain.count(".") + 1) if subdomain else 0.0
    features["path_length"] = float(len(path))

    # --- Protocol / network features ---
    features["has_https"] = 1.0 if parsed.scheme == "https" else 0.0

    netloc = parsed.netloc or ""
    host = netloc.split(":")[0]
    features["has_ip_address"] = 1.0 if _is_ip_address(host) else 0.0
    features["has_at_symbol"] = 1.0 if "@" in url_str else 0.0

    fqdn = (f"{extracted.domain}.{extracted.suffix}" if extracted.domain and extracted.suffix else "").lower()
    features["is_shortened"] = 1.0 if fqdn in KNOWN_SHORTENERS else 0.0
    features["domain_length"] = float(len(domain))
    
    tld_with_dot = f".{suffix}".lower() if suffix else ""
    features["has_suspicious_tld"] = 1.0 if tld_with_dot in SUSPICIOUS_TLDS else 0.0
    features["entropy"] = _shannon_entropy(url_str)
    features["has_suspicious_keywords"] = 1.0 if any(kw in url_lower for kw in SUSPICIOUS_KEYWORDS) else 0.0
    features["is_typosquatting"] = 1.0 if _check_typosquatting(domain) else 0.0

    num_letters = sum(c.isalpha() for c in url_str)
    num_digits = sum(c.isdigit() for c in url_str)
    features["digit_to_letter_ratio"] = round(num_digits / num_letters, 4) if num_letters > 0 else float(num_digits)

    port_match = re.search(r":(\d{2,5})(?:/|$)", netloc)
    features["has_port"] = 1.0 if port_match and port_match.group(1) not in {"80", "443"} else 0.0

    # --- Domain Age (WHOIS) ---
    if skip_whois:
        features["domain_age_days"] = -1.0
    else:
        whois_data = get_domain_info(domain)
        features["domain_age_days"] = float(whois_data.get("domain_age_days") or -1.0)

    return features

# Canonical ordered list of feature names used during training & inference.
FEATURE_NAMES: list[str] = [
    "url_length", "num_dots", "num_hyphens", "num_underscores", "num_slashes",
    "num_question_marks", "num_equal_signs", "num_at_signs", "num_ampersands",
    "num_exclamation", "num_digits", "num_subdomains", "path_length",
    "has_https", "has_ip_address", "has_at_symbol", "is_shortened",
    "domain_length", "has_suspicious_tld", "entropy", "has_suspicious_keywords",
    "is_typosquatting", "digit_to_letter_ratio", "has_port", "domain_age_days",
]

# Backward-compatible alias used by older imports
extract_url_features = extract_features
