"""
StriveNest ERP - Authentication Audit Logs Router
API endpoints for querying authentication audit logs (SUPER_ADMIN only).
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_super_admin
from app.models.user import User
from app.schemas.auth import AuditLogPaginatedResponse
from app.services.auth_service import AuthService
from app.utils.responses import create_success_response

router = APIRouter(prefix="/audit", tags=["Security Audit Logs"])


@router.get(
    "/authentication",
    status_code=status.HTTP_200_OK,
    summary="Get Authentication Audit Logs",
    description="Queries and returns paginated security audit logs. Strictly protected for SUPER_ADMIN role."
)
def get_authentication_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_type: Optional[str] = Query(None, description="Filter by audit event type"),
    user_id: Optional[str] = Query(None, description="Filter by User UUID"),
    start_date: Optional[datetime] = Query(None, description="Filter start date (ISO string)"),
    end_date: Optional[datetime] = Query(None, description="Filter end date (ISO string)"),
    search: Optional[str] = Query(None, description="Search keyword in description or IP address"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    audit_data = AuthService.get_audit_logs(
        db=db,
        page=page,
        size=size,
        event_type=event_type,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        search=search,
    )
    return create_success_response(
        data=audit_data.model_dump(),
        message="Authentication audit logs retrieved successfully.",
        status_code=status.HTTP_200_OK
    )
