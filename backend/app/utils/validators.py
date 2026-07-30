"""
StriveNest ERP - Reusable Validators
Helper functions for UUID, environment, database URL, and pagination validations.
"""

import uuid
from typing import Tuple
from app.utils.exceptions import BadRequestException


def validate_uuid(value: str, param_name: str = "ID") -> str:
    """Validates if a string is a valid UUID format."""
    try:
        val = uuid.UUID(value)
        return str(val)
    except ValueError:
        raise BadRequestException(
            message=f"Invalid {param_name} format.",
            errors=[{"field": param_name, "message": f"'{value}' is not a valid UUID string."}]
        )


def validate_pagination_params(page: int, page_size: int) -> Tuple[int, int]:
    """Validates pagination page and page_size bounds."""
    if page < 1:
        raise BadRequestException(
            message="Invalid page number.",
            errors=[{"field": "page", "message": "Page must be greater than or equal to 1."}]
        )
    if page_size < 1 or page_size > 100:
        raise BadRequestException(
            message="Invalid page size.",
            errors=[{"field": "page_size", "message": "Page size must be between 1 and 100."}]
        )
    return page, page_size


def validate_db_url(url: str) -> bool:
    """Checks if database URL string has valid driver protocol."""
    allowed_prefixes = ("postgresql", "sqlite", "mysql")
    return any(url.lower().startswith(prefix) for prefix in allowed_prefixes)
