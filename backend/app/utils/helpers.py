"""
StriveNest ERP - Helper Utilities
DateTime, timezone, and data manipulation helper routines.
"""

from datetime import datetime, timezone
from typing import Any, Dict


def get_utc_now() -> datetime:
    """Returns current datetime in UTC timezone."""
    return datetime.now(timezone.utc)


def format_iso_timestamp(dt: datetime = None) -> str:
    """Formats datetime as ISO 8601 string."""
    if dt is None:
        dt = get_utc_now()
    return dt.isoformat()


def sanitize_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    """Removes None values and sensitive keys from dictionary for safe logging."""
    sensitive_keys = {"password", "secret", "token", "authorization", "api_key"}
    return {
        k: ("***HIDDEN***" if k.lower() in sensitive_keys else v)
        for k, v in d.items()
        if v is not None
    }
