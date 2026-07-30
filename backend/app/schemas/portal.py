"""
StriveNest ERP - Portal Schemas
Pydantic schemas for Attendance, Leave, Projects, Tasks, Notifications, Calendar, Dashboard, and Change Password.
"""

from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.schemas.employee import EmployeeResponse, DocumentResponse


# --- Change Password ---
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current active password")
    new_password: str = Field(..., min_length=8, description="New strong password")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")


# --- Attendance Schemas ---
class AttendanceCheckInRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Optional check-in note")


class AttendanceCheckOutRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Optional check-out note")


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    working_hours: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AttendancePaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    items: List[AttendanceResponse]


class AttendanceMonthlySummaryResponse(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    leave_days: int
    total_working_hours: float


# --- Leave Schemas ---
class LeaveCreateRequest(BaseModel):
    leave_type: str = Field("CASUAL", description="Leave type (ANNUAL, SICK, CASUAL, MATERNITY, UNPAID, OTHER)")
    start_date: date = Field(..., description="Start date")
    end_date: date = Field(..., description="End date")
    reason: str = Field(..., min_length=3, description="Reason for leave request")


class LeaveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    total_days: float
    reason: str
    status: str
    submitted_date: datetime
    approval_date: Optional[datetime] = None
    approver_id: Optional[str] = None
    approver_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeavePaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    items: List[LeaveResponse]


# --- Project Schemas ---
class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    employee_id: str
    role_in_project: str
    created_at: datetime
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_name: str
    client_name: Optional[str] = None
    description: Optional[str] = None
    status: str
    priority: str
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    submission_date: Optional[date] = None
    progress_percentage: int
    created_at: datetime
    updated_at: datetime
    members: List[ProjectMemberResponse] = []


class ProjectPaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    items: List[ProjectResponse]


# --- Task Schemas ---
class TaskStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Task status (TODO, IN_PROGRESS, COMPLETED, BLOCKED, OVERDUE)")
    progress_percentage: Optional[int] = Field(None, ge=0, le=100, description="Progress percentage")
    notes: Optional[str] = Field(None, description="Task progress notes")


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_name: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    assigned_to_id: str
    created_by_id: Optional[str] = None
    description: Optional[str] = None
    priority: str
    status: str
    progress_percentage: int
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TaskPaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    items: List[TaskResponse]


class TaskSummaryResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int


# --- Calendar Schemas ---
class CalendarEventResponse(BaseModel):
    id: str
    title: str
    type: str  # "TASK", "PROJECT_DEADLINE", "LEAVE", "ATTENDANCE", "MEETING"
    date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str
    details: Optional[str] = None


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    title: str
    message: str
    notification_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: bool
    created_at: datetime


class NotificationPaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    unread_count: int
    items: List[NotificationResponse]


# --- Dashboard Summary Schema ---
class EmployeeDashboardSummaryResponse(BaseModel):
    employee: EmployeeResponse
    today_attendance: Optional[AttendanceResponse] = None
    recent_leave: Optional[LeaveResponse] = None
    assigned_projects_count: int
    pending_tasks_count: int
    upcoming_deadlines: List[TaskResponse] = []
    recent_documents: List[DocumentResponse] = []
    unread_notifications_count: int
    recent_activity: List[NotificationResponse] = []
