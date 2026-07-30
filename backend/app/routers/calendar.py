"""
StriveNest ERP - Calendar Events Router
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import CalendarEventResponse
from app.services.portal_service import PortalService

router = APIRouter(prefix="/calendar", tags=["Calendar Events"])


@router.get("/events", response_model=List[CalendarEventResponse], summary="Get Employee Calendar Events")
def get_calendar_events(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_my_calendar_events(
        db, current_user.id, start_date=start_date, end_date=end_date
    )
