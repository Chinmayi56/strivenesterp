"""
StriveNest ERP - Health Check Endpoints
Provides /health, /health/ready, and /health/live checks.
"""

import time
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.constants import TAG_HEALTH
from app.core.database import check_db_connection, get_db
from app.core.logging import get_logger
from app.schemas.common import APIResponse, HealthStatusSchema, ReadinessStatusSchema, LivenessStatusSchema
from app.utils.responses import create_success_response, create_error_response

router = APIRouter(prefix="/health", tags=[TAG_HEALTH])
logger = get_logger("routers.health")
APP_START_TIME = time.time()


@router.get(
    "",
    summary="System Health Check",
    description="Returns overall system health status including application and database connectivity.",
    response_model=APIResponse[HealthStatusSchema]
)
def get_health(db: Session = Depends(get_db)):
    """GET /api/v1/health"""
    db_connected = check_db_connection()
    db_status = "connected" if db_connected else "disconnected"
    overall_status = "healthy" if db_connected else "degraded"

    health_data = HealthStatusSchema(
        status=overall_status,
        database=db_status,
        application="running",
        version=settings.APP_VERSION
    )

    if not db_connected:
        return create_error_response(
            message="Database connectivity check failed.",
            errors=[{"message": "Unable to execute SELECT 1 query on database engine."}],
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    return create_success_response(
        data=health_data.model_dump(),
        message="System health check completed successfully."
    )


@router.get(
    "/ready",
    summary="System Readiness Check",
    description="Checks whether the application and dependencies are ready to accept traffic.",
    response_model=APIResponse[ReadinessStatusSchema]
)
def get_readiness(db: Session = Depends(get_db)):
    """GET /api/v1/health/ready"""
    db_connected = check_db_connection()

    if not db_connected:
        return create_error_response(
            message="System is not ready to accept traffic.",
            errors=[{"message": "Database instance is unreachable."}],
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    readiness_data = ReadinessStatusSchema(
        ready=True,
        database="connected",
        message="Application is fully initialized and ready."
    )
    return create_success_response(
        data=readiness_data.model_dump(),
        message="System readiness check passed."
    )


@router.get(
    "/live",
    summary="System Liveness Check",
    description="Checks if the server process is alive.",
    response_model=APIResponse[LivenessStatusSchema]
)
def get_liveness():
    """GET /api/v1/health/live"""
    uptime = time.time() - APP_START_TIME
    liveness_data = LivenessStatusSchema(
        alive=True,
        uptime_seconds=round(uptime, 2)
    )
    return create_success_response(
        data=liveness_data.model_dump(),
        message="System liveness check passed."
    )
