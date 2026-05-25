"""
SentinelX ML Service - Domain Feature Extraction

Provides WHOIS-based domain intelligence (creation date, age, registrar, etc.)
for enrichment of phishing analysis.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def get_domain_info(domain: str) -> Dict[str, Any]:
    """
    Retrieve WHOIS information for the given domain.

    Attempts a WHOIS lookup using the ``python-whois`` library and returns
    key registration fields.  All exceptions are handled gracefully so that
    callers never receive an unhandled error from this function.

    Args:
        domain: The domain name to look up (e.g. ``"example.com"``).

    Returns:
        A dictionary containing:
        - ``creation_date`` (str | None): Domain creation date in ISO format.
        - ``expiry_date`` (str | None): Domain expiration date in ISO format.
        - ``registrar`` (str | None): Registrar name.
        - ``domain_age_days`` (int | None): Age of the domain in days.
        - ``nameservers`` (list[str]): List of nameserver hostnames.
        - ``error`` (str | None): Error message if the lookup failed.
    """
    result: Dict[str, Any] = {
        "creation_date": None,
        "expiry_date": None,
        "registrar": None,
        "domain_age_days": None,
        "nameservers": [],
        "error": None,
    }

    if not domain or not isinstance(domain, str):
        result["error"] = "Invalid domain provided"
        return result

    try:
        import whois  # type: ignore[import-untyped]

        w = whois.whois(domain)

        # --- Creation date ---
        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if isinstance(creation, datetime):
            result["creation_date"] = creation.isoformat()
            age_delta = datetime.now(timezone.utc) - creation.replace(
                tzinfo=timezone.utc
            )
            result["domain_age_days"] = max(age_delta.days, 0)

        # --- Expiry date ---
        expiry = w.expiration_date
        if isinstance(expiry, list):
            expiry = expiry[0]
        if isinstance(expiry, datetime):
            result["expiry_date"] = expiry.isoformat()

        # --- Registrar ---
        result["registrar"] = w.registrar if w.registrar else None

        # --- Nameservers ---
        ns = w.name_servers
        if ns:
            if isinstance(ns, list):
                result["nameservers"] = [str(n).lower() for n in ns]
            else:
                result["nameservers"] = [str(ns).lower()]

    except Exception as exc:
        logger.warning("WHOIS lookup failed for %s: %s", domain, exc)
        result["error"] = f"WHOIS lookup failed: {str(exc)}"

    return result
