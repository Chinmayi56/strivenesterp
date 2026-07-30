"""
StriveNest ERP - Tasks Router
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import (
    TaskStatusUpdateRequest,
    TaskResponse,
    TaskPaginatedResponse,
)
from app.services.portal_service import PortalService
from app.utils.device_info import get_client_ip

router = APIRouter(prefix="/tasks", tags=["Task Management"])


@router.get("", response_model=TaskPaginatedResponse, summary="Get Assigned Tasks")
def get_my_tasks(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by TODO, IN_PROGRESS, COMPLETED, BLOCKED, OVERDUE"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by LOW, MEDIUM, HIGH, URGENT"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_my_tasks(
        db,
        current_user.id,
        status_filter=status_filter,
        priority_filter=priority_filter,
        page=page,
        size=size,
    )


@router.patch("/{task_id}/status", response_model=TaskResponse, summary="Update Assigned Task Status / Progress")
def update_task_status(
    task_id: str,
    req: TaskStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = get_client_ip(request)
    return PortalService.update_task_status(db, task_id, current_user.id, req, ip_address=ip_address)
