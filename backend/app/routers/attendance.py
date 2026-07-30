"""
StriveNest ERP - Attendance Management Router
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.portal import (
    AttendanceCheckInRequest,
    AttendanceCheckOutRequest,
    AttendanceResponse,
    AttendancePaginatedResponse,
    AttendanceMonthlySummaryResponse,
)
from app.services.portal_service import PortalService
from app.utils.device_info import get_client_ip

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])


@router.get("/today", response_model=Optional[AttendanceResponse], summary="Get Today's Attendance Record")
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_today_attendance(db, current_user.id)


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED, summary="Check In")
def check_in(
    req: AttendanceCheckInRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = get_client_ip(request)
    return PortalService.check_in(db, current_user.id, req, ip_address=ip_address)


@router.post("/check-out", response_model=AttendanceResponse, summary="Check Out")
def check_out(
    req: AttendanceCheckOutRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip_address = get_client_ip(request)
    return PortalService.check_out(db, current_user.id, req, ip_address=ip_address)


@router.get("/history", response_model=AttendancePaginatedResponse, summary="Get Attendance History")
def get_attendance_history(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_attendance_history(
        db, current_user.id, start_date=start_date, end_date=end_date, page=page, size=size
    )


@router.get("/summary", response_model=AttendanceMonthlySummaryResponse, summary="Get Monthly Attendance Summary")
def get_attendance_summary(
    year: int = Query(..., description="Year e.g. 2026"),
    month: int = Query(..., ge=1, le=12, description="Month 1-12"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PortalService.get_attendance_summary(db, current_user.id, year, month)
