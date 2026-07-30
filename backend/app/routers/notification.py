"""
StriveNest ERP - Notifications Router
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import (
    NotificationResponse,
    NotificationPaginatedResponse,
)
from app.services.portal_service import PortalService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationPaginatedResponse, summary="Get Employee Notifications")
def get_my_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_my_notifications(db, current_user.id, page=page, size=size)


@router.patch("/{notification_id}/read", response_model=NotificationResponse, summary="Mark Notification as Read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.mark_notification_read(db, notification_id, current_user.id)


@router.post("/read-all", summary="Mark All Notifications as Read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = PortalService.mark_all_notifications_read(db, current_user.id)
    return {"status": "success", "marked_read": count}
