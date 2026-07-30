"""
StriveNest ERP - Standard API Schemas & Response Structures
Pydantic v2 schemas for responses, errors, health checks, and pagination.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field


T = TypeVar("T")


def current_utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class ErrorDetail(BaseModel):
    """Structured error detail schema."""
    field: Optional[str] = Field(default=None, description="Field name where error occurred")
    code: Optional[str] = Field(default=None, description="Error code or categorization")
    message: str = Field(..., description="Human readable error message")

    model_config = ConfigDict(extra="ignore")


class APIResponse(BaseModel, Generic[T]):
    """Standardized API Response Schema for StriveNest ERP System."""
    success: bool = Field(..., description="Indicates if operation succeeded")
    message: str = Field(..., description="Summary response message")
    data: Optional[T] = Field(default=None, description="Response payload data")
    errors: List[ErrorDetail] = Field(default_factory=list, description="List of errors if any")
    timestamp: str = Field(default_factory=current_utc_timestamp, description="ISO 8601 UTC timestamp")

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Operation completed successfully.",
                "data": {},
                "errors": [],
                "timestamp": "2026-07-28T22:39:20Z"
            }
        }
    )


class PaginationMeta(BaseModel):
    """Metadata for paginated queries."""
    page: int = Field(1, ge=1, description="Current page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    total_items: int = Field(0, ge=0, description="Total number of items")
    total_pages: int = Field(0, ge=0, description="Total number of pages")
    has_next: bool = Field(False, description="Whether next page exists")
    has_previous: bool = Field(False, description="Whether previous page exists")


class PaginatedData(BaseModel, Generic[T]):
    """Payload format for paginated list endpoints."""
    items: List[T] = Field(default_factory=list, description="List of items")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")


class HealthStatusSchema(BaseModel):
    """Payload format for System Health Check."""
    status: str = Field(..., description="Overall health status (healthy/degraded)")
    database: str = Field(..., description="Database connection status")
    application: str = Field(..., description="Application execution state")
    version: str = Field(..., description="Application version")
    timestamp: str = Field(default_factory=current_utc_timestamp, description="Current timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "database": "connected",
                "application": "running",
                "version": "1.0.0",
                "timestamp": "2026-07-28T22:39:20Z"
            }
        }
    )


class ReadinessStatusSchema(BaseModel):
    """Payload format for System Readiness Check."""
    ready: bool = Field(..., description="Readiness status boolean")
    database: str = Field(..., description="Database connectivity status")
    message: str = Field(..., description="Readiness message")


class LivenessStatusSchema(BaseModel):
    """Payload format for System Liveness Check."""
    alive: bool = Field(True, description="Liveness status boolean")
    uptime_seconds: float = Field(..., description="Server uptime in seconds")
