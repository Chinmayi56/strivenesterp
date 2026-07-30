"""
StriveNest ERP - Core Constants
"""

from enum import Enum


class EnvironmentOption(str, Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    PRODUCTION = "production"


class ResponseMessage:
    SUCCESS = "Operation completed successfully."
    CREATED = "Resource created successfully."
    UPDATED = "Resource updated successfully."
    DELETED = "Resource deleted successfully."
    NOT_FOUND = "Requested resource was not found."
    BAD_REQUEST = "Invalid request parameters."
    VALIDATION_ERROR = "Validation failed."
    UNAUTHORIZED = "Authentication credentials were missing or invalid."
    FORBIDDEN = "You do not have permission to perform this action."
    INTERNAL_ERROR = "An unexpected internal server error occurred."
    DATABASE_ERROR = "A database error occurred."


# Custom Header Keys
HEADER_REQUEST_ID = "X-Request-ID"
HEADER_PROCESS_TIME = "X-Process-Time"

# OpenAPI Tags
TAG_HEALTH = "Health Check"
TAG_SYSTEM = "System Information"
TAG_BASE = "Base Architecture"
