"""
StriveNest ERP - Portal Service Layer
Business logic for Attendance, Leave, Projects, Tasks, Calendar, Notifications, and Dashboard metrics.
"""

from datetime import datetime, date, timedelta, time
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, and_, desc, asc
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, UserRole
from app.models.employee import EmployeeDocument, EmployeeAuditLog
from app.models.portal import (
    AttendanceRecord,
    AttendanceStatus,
    LeaveRequest,
    LeaveType,
    LeaveStatus,
    Project,
    ProjectMember,
    ProjectStatus,
    PriorityLevel,
    Task,
    TaskStatus,
    Notification,
    NotificationType,
)
from app.schemas.portal import (
    AttendanceCheckInRequest,
    AttendanceCheckOutRequest,
    AttendanceResponse,
    AttendancePaginatedResponse,
    AttendanceMonthlySummaryResponse,
    LeaveCreateRequest,
    LeaveResponse,
    LeavePaginatedResponse,
    ProjectResponse,
    ProjectMemberResponse,
    ProjectPaginatedResponse,
    TaskStatusUpdateRequest,
    TaskResponse,
    TaskPaginatedResponse,
    TaskSummaryResponse,
    CalendarEventResponse,
    NotificationResponse,
    NotificationPaginatedResponse,
    EmployeeDashboardSummaryResponse,
)
from app.services.employee_service import format_employee_response, EmployeeService
from app.utils.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.models.base import utc_now


class PortalService:

    # --- ATTENDANCE ---

    @staticmethod
    def get_today_attendance(db: Session, employee_id: str) -> Optional[AttendanceResponse]:
        today = date.today()
        record = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            .first()
        )
        if not record:
            return None
        return AttendanceResponse.model_validate(record)

    @staticmethod
    def check_in(db: Session, employee_id: str, req: AttendanceCheckInRequest, ip_address: Optional[str] = None) -> AttendanceResponse:
        today = date.today()
        now = utc_now()

        existing = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            .first()
        )

        if existing and existing.check_in_time:
            raise BadRequestException("You have already checked in for today.")

        if not existing:
            existing = AttendanceRecord(
                employee_id=employee_id,
                date=today,
                check_in_time=now,
                status=AttendanceStatus.PRESENT.value if now.time() < time(9, 30) else AttendanceStatus.LATE.value,
                notes=req.notes,
            )
            db.add(existing)
        else:
            existing.check_in_time = now
            if req.notes:
                existing.notes = (existing.notes or "") + f" | Check-in note: {req.notes}"

        db.commit()
        db.refresh(existing)

        # Audit log
        db.add(EmployeeAuditLog(
            employee_id=employee_id,
            performed_by=employee_id,
            action="ATTENDANCE_CHECK_IN",
            details=f"Checked in at {now.strftime('%Y-%m-%d %H:%M:%S')}",
            ip_address=ip_address,
        ))
        db.commit()

        return AttendanceResponse.model_validate(existing)

    @staticmethod
    def check_out(db: Session, employee_id: str, req: AttendanceCheckOutRequest, ip_address: Optional[str] = None) -> AttendanceResponse:
        today = date.today()
        now = utc_now()

        existing = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            .first()
        )

        if not existing or not existing.check_in_time:
            raise BadRequestException("You must check in before checking out.")

        if existing.check_out_time:
            raise BadRequestException("You have already checked out for today.")

        existing.check_out_time = now
        
        # Calculate working hours ensuring matching timezone awareness
        check_in_time = existing.check_in_time
        if check_in_time.tzinfo is None and now.tzinfo is not None:
            check_in_time = check_in_time.replace(tzinfo=now.tzinfo)
        elif check_in_time.tzinfo is not None and now.tzinfo is None:
            now = now.replace(tzinfo=check_in_time.tzinfo)

        delta = now - check_in_time
        existing.working_hours = round(max(0.0, delta.total_seconds() / 3600.0), 2)

        if req.notes:
            existing.notes = (existing.notes or "") + f" | Check-out note: {req.notes}"

        db.commit()
        db.refresh(existing)

        # Audit log
        db.add(EmployeeAuditLog(
            employee_id=employee_id,
            performed_by=employee_id,
            action="ATTENDANCE_CHECK_OUT",
            details=f"Checked out at {now.strftime('%Y-%m-%d %H:%M:%S')}. Total working hours: {existing.working_hours}h",
            ip_address=ip_address,
        ))
        db.commit()

        return AttendanceResponse.model_validate(existing)

    @staticmethod
    def get_attendance_history(
        db: Session,
        employee_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        size: int = 20,
    ) -> AttendancePaginatedResponse:
        query = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id == employee_id)

        if start_date:
            query = query.filter(AttendanceRecord.date >= start_date)
        if end_date:
            query = query.filter(AttendanceRecord.date <= end_date)

        total = query.count()
        pages = max(1, (total + size - 1) // size)
        records = query.order_by(AttendanceRecord.date.desc()).offset((page - 1) * size).limit(size).all()

        return AttendancePaginatedResponse(
            total=total,
            page=page,
            size=size,
            pages=pages,
            items=[AttendanceResponse.model_validate(r) for r in records],
        )

    @staticmethod
    def get_attendance_summary(db: Session, employee_id: str, year: int, month: int) -> AttendanceMonthlySummaryResponse:
        start_of_month = date(year, month, 1)
        if month == 12:
            end_of_month = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_of_month = date(year, month + 1, 1) - timedelta(days=1)

        records = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.date >= start_of_month,
                AttendanceRecord.date <= end_of_month,
            )
            .all()
        )

        present = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT.value, AttendanceStatus.LATE.value])
        absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT.value)
        late = sum(1 for r in records if r.status == AttendanceStatus.LATE.value)
        leave = sum(1 for r in records if r.status == AttendanceStatus.LEAVE.value)
        working_hours = round(sum(r.working_hours for r in records), 2)

        return AttendanceMonthlySummaryResponse(
            total_days=len(records),
            present_days=present,
            absent_days=absent,
            late_days=late,
            leave_days=leave,
            total_working_hours=working_hours,
        )

    # --- LEAVE MANAGEMENT ---

    @staticmethod
    def create_leave_request(db: Session, employee_id: str, req: LeaveCreateRequest, ip_address: Optional[str] = None) -> LeaveResponse:
        if req.start_date > req.end_date:
            raise BadRequestException("Start date cannot be after end date.")

        delta = (req.end_date - req.start_date).days + 1

        leave = LeaveRequest(
            employee_id=employee_id,
            leave_type=req.leave_type,
            start_date=req.start_date,
            end_date=req.end_date,
            total_days=float(delta),
            reason=req.reason,
            status=LeaveStatus.PENDING.value,
        )

        db.add(leave)
        db.commit()
        db.refresh(leave)

        # Create system notification for applicant
        db.add(Notification(
            employee_id=employee_id,
            title="Leave Request Submitted",
            message=f"Your {req.leave_type} leave request from {req.start_date} to {req.end_date} has been submitted.",
            notification_type=NotificationType.LEAVE.value,
            entity_type="leave",
            entity_id=leave.id,
        ))

        # Audit log
        db.add(EmployeeAuditLog(
            employee_id=employee_id,
            performed_by=employee_id,
            action="LEAVE_REQUEST_CREATED",
            details=f"Created leave request for {delta} days ({req.start_date} to {req.end_date})",
            ip_address=ip_address,
        ))
        db.commit()

        return LeaveResponse.model_validate(leave)

    @staticmethod
    def get_my_leave_requests(
        db: Session,
        employee_id: str,
        status_filter: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> LeavePaginatedResponse:
        query = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee_id)
        if status_filter:
            query = query.filter(LeaveRequest.status == status_filter)

        total = query.count()
        pages = max(1, (total + size - 1) // size)
        leaves = query.order_by(LeaveRequest.submitted_date.desc()).offset((page - 1) * size).limit(size).all()

        return LeavePaginatedResponse(
            total=total,
            page=page,
            size=size,
            pages=pages,
            items=[LeaveResponse.model_validate(l) for l in leaves],
        )

    @staticmethod
    def cancel_leave_request(db: Session, leave_id: str, employee_id: str, ip_address: Optional[str] = None) -> LeaveResponse:
        leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
        if not leave:
            raise NotFoundException("Leave request not found.")

        if leave.employee_id != employee_id:
            raise ForbiddenException("You can only cancel your own leave requests.")

        if leave.status not in [LeaveStatus.PENDING.value, LeaveStatus.APPROVED.value]:
            raise BadRequestException(f"Cannot cancel leave request in status '{leave.status}'.")

        leave.status = LeaveStatus.CANCELLED.value
        db.commit()
        db.refresh(leave)

        # Audit log
        db.add(EmployeeAuditLog(
            employee_id=employee_id,
            performed_by=employee_id,
            action="LEAVE_REQUEST_CANCELLED",
            details=f"Cancelled leave request {leave_id}",
            ip_address=ip_address,
        ))
        db.commit()

        return LeaveResponse.model_validate(leave)

    # --- PROJECTS ---

    @staticmethod
    def get_my_projects(
        db: Session,
        employee_id: str,
        status_filter: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> ProjectPaginatedResponse:
        query = (
            db.query(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(ProjectMember.employee_id == employee_id)
        )

        if status_filter:
            query = query.filter(Project.status == status_filter)

        total = query.count()
        pages = max(1, (total + size - 1) // size)
        projects = (
            query.options(joinedload(Project.members).joinedload(ProjectMember.employee))
            .order_by(Project.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        items = []
        for p in projects:
            member_responses = []
            for m in p.members:
                member_responses.append(ProjectMemberResponse(
                    id=m.id,
                    project_id=m.project_id,
                    employee_id=m.employee_id,
                    role_in_project=m.role_in_project,
                    created_at=m.created_at,
                    employee_name=f"{m.employee.first_name} {m.employee.last_name}" if m.employee else "Unknown",
                    employee_email=m.employee.email if m.employee else None,
                ))

            items.append(ProjectResponse(
                id=p.id,
                project_name=p.project_name,
                client_name=p.client_name,
                description=p.description,
                status=p.status,
                priority=p.priority,
                start_date=p.start_date,
                deadline=p.deadline,
                submission_date=p.submission_date,
                progress_percentage=p.progress_percentage,
                created_at=p.created_at,
                updated_at=p.updated_at,
                members=member_responses,
            ))

        return ProjectPaginatedResponse(
            total=total,
            page=page,
            size=size,
            pages=pages,
            items=items,
        )

    # --- TASKS ---

    @staticmethod
    def get_my_tasks(
        db: Session,
        employee_id: str,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> TaskPaginatedResponse:
        query = db.query(Task).options(joinedload(Task.project)).filter(Task.assigned_to_id == employee_id)

        if status_filter:
            query = query.filter(Task.status == status_filter)
        if priority_filter:
            query = query.filter(Task.priority == priority_filter)

        total = query.count()
        pages = max(1, (total + size - 1) // size)
        tasks = query.order_by(Task.created_at.desc()).offset((page - 1) * size).limit(size).all()

        items = []
        for t in tasks:
            items.append(TaskResponse(
                id=t.id,
                task_name=t.task_name,
                project_id=t.project_id,
                project_name=t.project.project_name if t.project else None,
                assigned_to_id=t.assigned_to_id,
                created_by_id=t.created_by_id,
                description=t.description,
                priority=t.priority,
                status=t.status,
                progress_percentage=t.progress_percentage,
                start_date=t.start_date,
                due_date=t.due_date,
                completed_date=t.completed_date,
                notes=t.notes,
                created_at=t.created_at,
                updated_at=t.updated_at,
            ))

        return TaskPaginatedResponse(
            total=total,
            page=page,
            size=size,
            pages=pages,
            items=items,
        )

    @staticmethod
    def update_task_status(
        db: Session,
        task_id: str,
        employee_id: str,
        req: TaskStatusUpdateRequest,
        ip_address: Optional[str] = None,
    ) -> TaskResponse:
        task = db.query(Task).options(joinedload(Task.project)).filter(Task.id == task_id).first()
        if not task:
            raise NotFoundException("Task not found.")

        if task.assigned_to_id != employee_id:
            raise ForbiddenException("You can only update tasks assigned to you.")

        task.status = req.status
        if req.progress_percentage is not None:
            task.progress_percentage = req.progress_percentage

        if req.status == TaskStatus.COMPLETED.value:
            task.progress_percentage = 100
            task.completed_date = utc_now()

        if req.notes:
            task.notes = (task.notes or "") + f"\n[{utc_now().strftime('%Y-%m-%d %H:%M')}]: {req.notes}"

        db.commit()
        db.refresh(task)

        # Audit log
        db.add(EmployeeAuditLog(
            employee_id=employee_id,
            performed_by=employee_id,
            action="TASK_STATUS_UPDATED",
            details=f"Updated task '{task.task_name}' status to {req.status}",
            ip_address=ip_address,
        ))
        db.commit()

        return TaskResponse(
            id=task.id,
            task_name=task.task_name,
            project_id=task.project_id,
            project_name=task.project.project_name if task.project else None,
            assigned_to_id=task.assigned_to_id,
            created_by_id=task.created_by_id,
            description=task.description,
            priority=task.priority,
            status=task.status,
            progress_percentage=task.progress_percentage,
            start_date=task.start_date,
            due_date=task.due_date,
            completed_date=task.completed_date,
            notes=task.notes,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )

    # --- CALENDAR ---

    @staticmethod
    def get_my_calendar_events(
        db: Session,
        employee_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[CalendarEventResponse]:
        events: List[CalendarEventResponse] = []

        # 1. Tasks
        task_query = db.query(Task).filter(Task.assigned_to_id == employee_id)
        if start_date:
            task_query = task_query.filter(Task.due_date >= start_date)
        if end_date:
            task_query = task_query.filter(Task.due_date <= end_date)

        for t in task_query.all():
            if t.due_date:
                events.append(CalendarEventResponse(
                    id=f"task-{t.id}",
                    title=f"Task Due: {t.task_name}",
                    type="TASK",
                    date=t.due_date,
                    status=t.status,
                    details=t.description,
                ))

        # 2. Leaves
        leave_query = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_([LeaveStatus.PENDING.value, LeaveStatus.APPROVED.value]),
        )
        for l in leave_query.all():
            events.append(CalendarEventResponse(
                id=f"leave-{l.id}",
                title=f"Leave ({l.leave_type})",
                type="LEAVE",
                date=l.start_date,
                status=l.status,
                details=l.reason,
            ))

        # 3. Project Deadlines
        projects = (
            db.query(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(ProjectMember.employee_id == employee_id)
            .all()
        )
        for p in projects:
            if p.deadline:
                events.append(CalendarEventResponse(
                    id=f"proj-{p.id}",
                    title=f"Project Deadline: {p.project_name}",
                    type="PROJECT_DEADLINE",
                    date=p.deadline,
                    status=p.status,
                    details=p.description,
                ))

        # Sort by date
        events.sort(key=lambda x: x.date)
        return events

    # --- NOTIFICATIONS ---

    @staticmethod
    def get_my_notifications(
        db: Session,
        employee_id: str,
        page: int = 1,
        size: int = 20,
    ) -> NotificationPaginatedResponse:
        query = db.query(Notification).filter(Notification.employee_id == employee_id)
        total = query.count()
        unread_count = query.filter(Notification.is_read == False).count()
        pages = max(1, (total + size - 1) // size)

        notifications = query.order_by(Notification.created_at.desc()).offset((page - 1) * size).limit(size).all()

        return NotificationPaginatedResponse(
            total=total,
            page=page,
            size=size,
            pages=pages,
            unread_count=unread_count,
            items=[NotificationResponse.model_validate(n) for n in notifications],
        )

    @staticmethod
    def mark_notification_read(db: Session, notification_id: str, employee_id: str) -> NotificationResponse:
        n = db.query(Notification).filter(Notification.id == notification_id).first()
        if not n:
            raise NotFoundException("Notification not found.")
        if n.employee_id != employee_id:
            raise ForbiddenException("Access denied to this notification.")

        n.is_read = True
        db.commit()
        db.refresh(n)
        return NotificationResponse.model_validate(n)

    @staticmethod
    def mark_all_notifications_read(db: Session, employee_id: str) -> int:
        updated = (
            db.query(Notification)
            .filter(Notification.employee_id == employee_id, Notification.is_read == False)
            .update({"is_read": True})
        )
        db.commit()
        return updated

    # --- DASHBOARD SUMMARY ---

    @staticmethod
    def get_employee_dashboard(db: Session, current_user: User) -> EmployeeDashboardSummaryResponse:
        employee_resp = format_employee_response(current_user)

        # Today's attendance
        today_att = PortalService.get_today_attendance(db, current_user.id)

        # Recent leave request
        recent_leave_rec = (
            db.query(LeaveRequest)
            .filter(LeaveRequest.employee_id == current_user.id)
            .order_by(LeaveRequest.submitted_date.desc())
            .first()
        )
        recent_leave = LeaveResponse.model_validate(recent_leave_rec) if recent_leave_rec else None

        # Projects count
        assigned_projects_count = (
            db.query(ProjectMember)
            .filter(ProjectMember.employee_id == current_user.id)
            .count()
        )

        # Pending tasks
        pending_tasks_count = (
            db.query(Task)
            .filter(
                Task.assigned_to_id == current_user.id,
                Task.status.in_([TaskStatus.TODO.value, TaskStatus.IN_PROGRESS.value]),
            )
            .count()
        )

        # Upcoming deadlines (Tasks due in next 14 days)
        today = date.today()
        upcoming_tasks_recs = (
            db.query(Task)
            .options(joinedload(Task.project))
            .filter(
                Task.assigned_to_id == current_user.id,
                Task.status != TaskStatus.COMPLETED.value,
                Task.due_date >= today,
            )
            .order_by(Task.due_date.asc())
            .limit(5)
            .all()
        )

        upcoming_deadlines = [
            TaskResponse(
                id=t.id,
                task_name=t.task_name,
                project_id=t.project_id,
                project_name=t.project.project_name if t.project else None,
                assigned_to_id=t.assigned_to_id,
                created_by_id=t.created_by_id,
                description=t.description,
                priority=t.priority,
                status=t.status,
                progress_percentage=t.progress_percentage,
                start_date=t.start_date,
                due_date=t.due_date,
                completed_date=t.completed_date,
                notes=t.notes,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in upcoming_tasks_recs
        ]

        # Recent Documents
        recent_docs_res = EmployeeService.get_employee_documents(db, current_user.id, page=1, size=5)

        # Unread notifications & recent notifications
        unread_notifs = (
            db.query(Notification)
            .filter(Notification.employee_id == current_user.id, Notification.is_read == False)
            .count()
        )

        recent_notifs_recs = (
            db.query(Notification)
            .filter(Notification.employee_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(5)
            .all()
        )

        recent_activity = [NotificationResponse.model_validate(n) for n in recent_notifs_recs]

        return EmployeeDashboardSummaryResponse(
            employee=employee_resp,
            today_attendance=today_att,
            recent_leave=recent_leave,
            assigned_projects_count=assigned_projects_count,
            pending_tasks_count=pending_tasks_count,
            upcoming_deadlines=upcoming_deadlines,
            recent_documents=recent_docs_res.items,
            unread_notifications_count=unread_notifs,
            recent_activity=recent_activity,
        )
