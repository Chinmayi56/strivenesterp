"""
StriveNest ERP - Leave Management Router
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import (
    LeaveCreateRequest,
    LeaveResponse,
    LeavePaginatedResponse,
)
from app.services.portal_service import PortalService
from app.utils.device_info import get_client_ip

router = APIRouter(prefix="/leaves", tags=["Leave Management"])


@router.post("", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED, summary="Create Leave Request")
def create_leave_request(
    req: LeaveCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = get_client_ip(request)
    return PortalService.create_leave_request(db, current_user.id, req, ip_address=ip_address)


@router.get("", response_model=LeavePaginatedResponse, summary="Get My Leave Requests")
def get_my_leave_requests(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status PENDING, APPROVED, REJECTED, CANCELLED"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_my_leave_requests(
        db, current_user.id, status_filter=status_filter, page=page, size=size
    )


@router.post("/{leave_id}/cancel", response_model=LeaveResponse, summary="Cancel Leave Request")
def cancel_leave_request(
    leave_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = get_client_ip(request)
    return PortalService.cancel_leave_request(db, leave_id, current_user.id, ip_address=ip_address)
