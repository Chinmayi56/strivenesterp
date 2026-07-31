from datetime import datetime

from sqlalchemy.orm import Session

from app.models.portal import (
    LeaveRequest,
    LeaveStatus,
    Notification,
    NotificationType,
)
from app.utils.exceptions import NotFoundException


class AdminLeaveService:

    from sqlalchemy.orm import joinedload

@staticmethod
def get_all_leave_requests(db: Session):
    leaves = (
        db.query(LeaveRequest)
        .options(joinedload(LeaveRequest.employee))
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )

    data = []

    for leave in leaves:
        data.append({
            "id": leave.id,
            "employee_name": (
                f"{leave.employee.first_name} {leave.employee.last_name}"
                if leave.employee
                else ""
            ),
            "employee_id": leave.employee.employee_id if leave.employee else "",
            "employee_email": leave.employee.email if leave.employee else "",
            "leave_type": leave.leave_type,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "reason": leave.reason,
            "status": leave.status,
            "submitted_date": leave.submitted_date,
        })

    return data

    @staticmethod
    def approve_leave(
        db: Session,
        leave_id: str,
        approver_id: str,
    ):
        leave = (
            db.query(LeaveRequest)
            .filter(LeaveRequest.id == leave_id)
            .first()
        )

        if not leave:
            raise NotFoundException("Leave request not found.")

        if leave.status != LeaveStatus.PENDING.value:
            raise Exception("Only pending leave requests can be approved.")

        leave.status = LeaveStatus.APPROVED.value
        leave.approver_id = approver_id
        leave.approval_date = datetime.utcnow()

        db.add(
            Notification(
                employee_id=leave.employee_id,
                title="Leave Approved",
                message="Your leave request has been approved.",
                notification_type=NotificationType.LEAVE.value,
                entity_type="leave",
                entity_id=leave.id,
            )
        )

        db.commit()
        db.refresh(leave)

        return leave

    @staticmethod
    def reject_leave(
        db: Session,
        leave_id: str,
        approver_id: str,
    ):
        leave = (
            db.query(LeaveRequest)
            .filter(LeaveRequest.id == leave_id)
            .first()
        )

        if not leave:
            raise NotFoundException("Leave request not found.")

        if leave.status != LeaveStatus.PENDING.value:
            raise Exception("Only pending leave requests can be rejected.")

        leave.status = LeaveStatus.REJECTED.value
        leave.approver_id = approver_id
        leave.approval_date = datetime.utcnow()

        db.add(
            Notification(
                employee_id=leave.employee_id,
                title="Leave Rejected",
                message="Your leave request has been rejected.",
                notification_type=NotificationType.LEAVE.value,
                entity_type="leave",
                entity_id=leave.id,
            )
        )

        db.commit()
        db.refresh(leave)

        return leave