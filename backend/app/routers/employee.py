"""
StriveNest ERP - Employee Management API Endpoints
FastAPI Router for Employee CRUD, Approval Workflow, Profile, Documents, Status Management, and Audit History.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_super_admin
from app.models.user import User, UserRole
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeSelfUpdate,
    EmployeeStatusUpdate,
    EmployeeResponse,
    EmployeePaginatedResponse,
    EmployeeStatsSummaryResponse,
    DocumentCreate,
    DocumentResponse,
    DocumentPaginatedResponse,
    EmployeeAuditPaginatedResponse,
)
from app.services.employee_service import EmployeeService, format_employee_response
from app.utils.exceptions import ForbiddenException, BadRequestException
from app.utils.device_info import get_client_ip

router = APIRouter(prefix="/employees", tags=["Employee Management"])


def verify_self_or_admin(identifier: str, current_user: User) -> str:
    """
    Ensures employee users can only access their own records,
    while SUPER_ADMIN can access any employee.
    Returns the resolved user ID / identifier.
    """
    if identifier == "me":
        return current_user.id

    if current_user.role == UserRole.SUPER_ADMIN.value:
        return identifier

    if current_user.id == identifier or current_user.employee_id == identifier:
        return current_user.id

    raise ForbiddenException("Access denied. Employees can only access their own profile and records.")


# --- Employee List & Search (Admin Only) ---

@router.get("", response_model=EmployeePaginatedResponse, summary="List Employees with Search & Filters")
def list_employees(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, email, phone, employee ID"),
    department: Optional[str] = Query(None, description="Filter by department"),
    designation: Optional[str] = Query(None, description="Filter by designation"),
    role: Optional[str] = Query(None, description="Filter by role (SUPER_ADMIN, EMPLOYEE)"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, ACTIVE, INACTIVE, BLOCKED, REJECTED, DELETED)"),
    is_active: Optional[bool] = Query(None, description="Filter by active state"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification state"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    return EmployeeService.get_employees(
        db=db,
        page=page,
        size=size,
        search=search,
        department=department,
        designation=designation,
        role=role,
        status=status,
        is_active=is_active,
        is_verified=is_verified,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# --- Employee System Statistics (Admin Only) ---

@router.get("/stats/summary", response_model=EmployeeStatsSummaryResponse, summary="Get Employee System Metrics Summary")
def get_employee_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    return EmployeeService.get_employee_stats(db)


# --- Create Employee (Admin Only) ---

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED, summary="Create New Employee")
def create_employee(
    req: EmployeeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.create_employee(
        db=db,
        req=req,
        created_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Current Employee Profile Shortcut ---

@router.get("/me", response_model=EmployeeResponse, summary="Get Current Authenticated Employee Profile")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = EmployeeService.get_employee_by_id_or_emp_id(db, current_user.id)
    return format_employee_response(user)


# --- Get Employee Details ---

@router.get("/{employee_id}", response_model=EmployeeResponse, summary="Get Employee Details")
def get_employee_details(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    user = EmployeeService.get_employee_by_id_or_emp_id(db, resolved_id)
    return format_employee_response(user)


# --- Full Update Employee (Admin Only) ---

@router.put("/{employee_id}", response_model=EmployeeResponse, summary="Update Employee Details")
def update_employee(
    employee_id: str,
    req: EmployeeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.update_employee(
        db=db,
        identifier=employee_id,
        req=req,
        updated_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Soft Delete Employee (Admin Only) ---

@router.delete("/{employee_id}", summary="Soft Delete Employee")
def delete_employee(
    employee_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.delete_employee(
        db=db,
        identifier=employee_id,
        deleted_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Restore Soft-Deleted Employee (Admin Only) ---

@router.post("/{employee_id}/restore", response_model=EmployeeResponse, summary="Restore Soft-Deleted Employee")
def restore_employee(
    employee_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.restore_employee(
        db=db,
        identifier=employee_id,
        restored_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Approval Workflows (Admin Only) ---

@router.post("/{employee_id}/approve", response_model=EmployeeResponse, summary="Approve Employee Application")
def approve_employee(
    employee_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.approve_employee(
        db=db,
        identifier=employee_id,
        approved_by_id=current_user.id,
        ip_address=ip_address,
    )


@router.post("/{employee_id}/reject", response_model=EmployeeResponse, summary="Reject Employee Application")
def reject_employee(
    employee_id: str,
    request: Request,
    reason: Optional[str] = Query(None, description="Reason for rejection"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.reject_employee(
        db=db,
        identifier=employee_id,
        reason=reason,
        rejected_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Status Management (Admin Only) ---

@router.patch("/{employee_id}/status", response_model=EmployeeResponse, summary="Update Employee Status")
def update_employee_status(
    employee_id: str,
    req: EmployeeStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    ip_address = get_client_ip(request)
    return EmployeeService.update_status(
        db=db,
        identifier=employee_id,
        req=req,
        updated_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Profile Endpoints (Admin or Self) ---

@router.get("/{employee_id}/profile", response_model=EmployeeResponse, summary="Get Employee Profile")
def get_employee_profile(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    user = EmployeeService.get_employee_by_id_or_emp_id(db, resolved_id)
    return format_employee_response(user)


@router.put("/{employee_id}/profile", response_model=EmployeeResponse, summary="Update Employee Personal Profile")
def update_employee_profile(
    employee_id: str,
    req: EmployeeSelfUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    ip_address = get_client_ip(request)

    # Convert self-update fields to general EmployeeUpdate
    update_data = EmployeeUpdate(
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        profile_image=req.profile_image,
    )

    return EmployeeService.update_employee(
        db=db,
        identifier=resolved_id,
        req=update_data,
        updated_by_id=current_user.id,
        ip_address=ip_address,
    )


@router.post("/{employee_id}/profile-image", response_model=EmployeeResponse, summary="Update Employee Profile Image")
def update_profile_image(
    employee_id: str,
    request: Request,
    image_url: str = Query(..., description="Profile image URL or Base64 data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    ip_address = get_client_ip(request)

    update_data = EmployeeUpdate(profile_image=image_url)
    return EmployeeService.update_employee(
        db=db,
        identifier=resolved_id,
        req=update_data,
        updated_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Employee Documents (Admin or Self) ---

@router.get("/{employee_id}/documents", response_model=DocumentPaginatedResponse, summary="List Employee Documents")
def list_employee_documents(
    employee_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    return EmployeeService.get_employee_documents(
        db=db,
        identifier=resolved_id,
        page=page,
        size=size,
    )


@router.post("/{employee_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, summary="Upload Employee Document")
def upload_employee_document(
    employee_id: str,
    req: DocumentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    ip_address = get_client_ip(request)

    return EmployeeService.create_document(
        db=db,
        identifier=resolved_id,
        req=req,
        uploaded_by_id=current_user.id,
        ip_address=ip_address,
    )


@router.get("/{employee_id}/documents/{document_id}", response_model=DocumentResponse, summary="Get Document Details")
def get_employee_document(
    employee_id: str,
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    doc = EmployeeService.get_document_by_id(db, document_id)

    # Check document belongs to this employee
    user = EmployeeService.get_employee_by_id_or_emp_id(db, resolved_id)
    if doc.employee_id != user.id:
        raise ForbiddenException("Document does not belong to this employee.")

    return doc


@router.delete("/{employee_id}/documents/{document_id}", summary="Delete Employee Document")
def delete_employee_document(
    employee_id: str,
    document_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    ip_address = get_client_ip(request)

    doc = EmployeeService.get_document_by_id(db, document_id)
    user = EmployeeService.get_employee_by_id_or_emp_id(db, resolved_id)
    if doc.employee_id != user.id:
        raise ForbiddenException("Document does not belong to this employee.")

    return EmployeeService.delete_document(
        db=db,
        document_id=document_id,
        deleted_by_id=current_user.id,
        ip_address=ip_address,
    )


# --- Employee Audit History (Admin or Self) ---

@router.get("/{employee_id}/audit-logs", response_model=EmployeeAuditPaginatedResponse, summary="Get Employee Audit History")
def get_employee_audit_logs(
    employee_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_id = verify_self_or_admin(employee_id, current_user)
    return EmployeeService.get_employee_audit_logs(
        db=db,
        identifier=resolved_id,
        page=page,
        size=size,
    )
