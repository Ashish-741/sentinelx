"""
SentinelX ML Service - Utility Helpers

Provides common validation, sanitization, and response formatting utilities
used across the ML microservice.
"""

import re
import html
import ipaddress
from typing import Any, Optional
from urllib.parse import urlparse


def validate_url(url: str) -> bool:
    """
    Check if the given string is a valid URL format.

    Args:
        url: The URL string to validate.

    Returns:
        True if the URL is valid, False otherwise.
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc]) and result.scheme in (
            "http",
            "https",
            "ftp",
        )
    except (ValueError, AttributeError):
        return False
