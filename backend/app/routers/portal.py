"""
StriveNest ERP - Portal Dashboard Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import EmployeeDashboardSummaryResponse
from app.services.portal_service import PortalService

router = APIRouter(prefix="/portal", tags=["Employee Portal Dashboard"])


@router.get("/dashboard", response_model=EmployeeDashboardSummaryResponse, summary="Get Employee Self-Service Dashboard Data")
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_employee_dashboard(db, current_user)
