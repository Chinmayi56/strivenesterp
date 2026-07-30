"""
StriveNest ERP - Projects Router
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import ProjectPaginatedResponse
from app.services.portal_service import PortalService

router = APIRouter(prefix="/projects", tags=["Project Management"])


@router.get("", response_model=ProjectPaginatedResponse, summary="Get Assigned Projects")
def get_my_projects(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status NEW, PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_my_projects(
        db, current_user.id, status_filter=status_filter, page=page, size=size
    )
