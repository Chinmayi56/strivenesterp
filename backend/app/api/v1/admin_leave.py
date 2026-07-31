from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_super_admin
from app.models.user import User
from app.services.admin_leave_service import AdminLeaveService
from app.utils.responses import create_success_response

router = APIRouter(
    prefix="/admin/leaves",
    tags=["Super Admin Leave Management"]
)


@router.get("")
def get_all_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    data = AdminLeaveService.get_all_leave_requests(db)

    return create_success_response(
        data=data,
        message="Leave requests fetched successfully.",
        status_code=status.HTTP_200_OK
    )


@router.patch("/{leave_id}/approve")
def approve_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    data = AdminLeaveService.approve_leave(
        db,
        leave_id,
        current_user.id
    )

    return create_success_response(
        data=data,
        message="Leave approved successfully.",
        status_code=status.HTTP_200_OK
    )


@router.patch("/{leave_id}/reject")
def reject_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    data = AdminLeaveService.reject_leave(
        db,
        leave_id,
        current_user.id
    )

    return create_success_response(
        data=data,
        message="Leave rejected successfully.",
        status_code=status.HTTP_200_OK
    )