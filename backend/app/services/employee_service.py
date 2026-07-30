"""
StriveNest ERP - Employee Management Service
Business logic layer for Employee CRUD, Approval workflows, Status updates, Document storage, and Audit logs.
"""

import math
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.models.employee import EmployeeDocument, EmployeeAuditLog, DocumentStatus
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
    EmployeeAuditResponse,
    EmployeeAuditPaginatedResponse,
)
from app.utils.exceptions import (
    AppException,
    BadRequestException,
    NotFoundException,
    ValidationException,
    ForbiddenException,
)
from app.models.base import utc_now


def format_employee_response(user: User) -> EmployeeResponse:
    return EmployeeResponse(
        id=user.id,
        employee_id=user.employee_id,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        department_id=user.department_id,
        department=user.department_id,  # department_id serves as department name or ID
        designation_id=user.designation_id,
        designation=user.designation_id,
        profile_image=user.profile_image,
        status=user.status,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=user.updated_at.isoformat() if user.updated_at else "",
        last_login=user.last_login.isoformat() if user.last_login else None,
    )


def format_document_response(doc: EmployeeDocument) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        employee_id=doc.employee_id,
        document_type=doc.document_type,
        document_name=doc.document_name,
        file_name=doc.file_name,
        file_url=doc.file_url,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        status=doc.status,
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
        updated_at=doc.updated_at.isoformat() if doc.updated_at else "",
    )


class EmployeeService:
    """Enterprise Employee Management Business Service."""

    @staticmethod
    def generate_employee_id(db: Session) -> str:
        """Generates sequential employee ID like EMP-10001."""
        count = db.query(func.count(User.id)).scalar() or 0
        seq = 10001 + count
        emp_id = f"EMP-{seq}"
        while db.query(User).filter(User.employee_id == emp_id).first():
            seq += 1
            emp_id = f"EMP-{seq}"
        return emp_id

    @staticmethod
    def log_employee_audit(
        db: Session,
        employee_id: str,
        performed_by: Optional[str],
        action: str,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
    ):
        """Creates an audit log entry for employee actions."""
        audit = EmployeeAuditLog(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            performed_by=performed_by,
            action=action,
            details=details,
            ip_address=ip_address,
            created_at=utc_now(),
        )
        db.add(audit)

    @staticmethod
    def get_employees(
        db: Session,
        page: int = 1,
        size: int = 20,
        search: Optional[str] = None,
        department: Optional[str] = None,
        designation: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        include_deleted: bool = False,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> EmployeePaginatedResponse:
        """
        Retrieves paginated employee list with rich filtering, search, and sorting.
        """
        query = db.query(User)

        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))

        # Filtering
        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                    User.email.ilike(pattern),
                    User.employee_id.ilike(pattern),
                    User.phone.ilike(pattern),
                )
            )

        if department:
            query = query.filter(User.department_id == department)

        if designation:
            query = query.filter(User.designation_id == designation)

        if role:
            query = query.filter(User.role == role)

        if status:
            query = query.filter(User.status == status)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        if is_verified is not None:
            query = query.filter(User.is_verified == is_verified)

        # Total count
        total = query.count()
        pages = math.ceil(total / size) if size > 0 else 1

        # Sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Pagination
        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()

        return EmployeePaginatedResponse(
            total=total,
            page=page,
            size=size,
            pages=pages,
            items=[format_employee_response(u) for u in items],
        )

    @staticmethod
    def get_employee_stats(db: Session) -> EmployeeStatsSummaryResponse:
        """Calculates system employee statistics for Super Admin dashboard."""
        total = db.query(func.count(User.id)).filter(User.deleted_at.is_(None)).scalar() or 0
        active = db.query(func.count(User.id)).filter(User.status == UserStatus.ACTIVE.value, User.deleted_at.is_(None)).scalar() or 0
        pending = db.query(func.count(User.id)).filter(User.status == UserStatus.PENDING.value, User.deleted_at.is_(None)).scalar() or 0
        inactive = db.query(func.count(User.id)).filter(User.status == UserStatus.INACTIVE.value, User.deleted_at.is_(None)).scalar() or 0
        blocked = db.query(func.count(User.id)).filter(User.status.in_([UserStatus.BLOCKED.value, UserStatus.REJECTED.value]), User.deleted_at.is_(None)).scalar() or 0
        deleted = db.query(func.count(User.id)).filter(User.deleted_at.isnot(None)).scalar() or 0
        verified = db.query(func.count(User.id)).filter(User.is_verified.is_(True), User.deleted_at.is_(None)).scalar() or 0

        recent_users = db.query(User).filter(User.deleted_at.is_(None)).order_by(User.created_at.desc()).limit(5).all()

        return EmployeeStatsSummaryResponse(
            total_employees=total,
            active_employees=active,
            pending_employees=pending,
            inactive_employees=inactive,
            blocked_employees=blocked,
            deleted_employees=deleted,
            verified_employees=verified,
            recent_employees=[format_employee_response(u) for u in recent_users],
        )

    @staticmethod
    def get_employee_by_id_or_emp_id(db: Session, identifier: str) -> User:
        """Finds employee by UUID id or employee_id."""
        user = db.query(User).filter(
            or_(User.id == identifier, User.employee_id == identifier),
            User.deleted_at.is_(None),
        ).first()

        if not user:
            raise NotFoundException(f"Employee with identifier '{identifier}' not found.")
        return user

    @staticmethod
    def create_employee(
        db: Session,
        req: EmployeeCreate,
        created_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Creates a new employee record."""
        # Email uniqueness check
        existing_email = db.query(User).filter(
            User.email == req.email.lower().strip(),
            User.deleted_at.is_(None),
        ).first()
        if existing_email:
            raise ValidationException("An employee with this email address already exists.")

        # Phone uniqueness check
        if req.phone:
            existing_phone = db.query(User).filter(
                User.phone == req.phone.strip(),
                User.deleted_at.is_(None),
            ).first()
            if existing_phone:
                raise ValidationException("An employee with this phone number already exists.")

        # Employee ID generation
        emp_id = req.employee_id.strip() if req.employee_id else EmployeeService.generate_employee_id(db)

        # Password handling
        raw_pwd = req.password if req.password else "StriveNest123!"

        # Determine active status based on provided status
        status_val = req.status.upper()
        is_active_val = status_val == UserStatus.ACTIVE.value

        new_user = User(
            id=str(uuid.uuid4()),
            employee_id=emp_id,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            email=req.email.lower().strip(),
            phone=req.phone.strip() if req.phone else None,
            password_hash=hash_password(raw_pwd),
            role=req.role.upper(),
            department_id=req.department_id or req.department,
            designation_id=req.designation_id or req.designation,
            profile_image=req.profile_image,
            status=status_val,
            is_active=is_active_val,
            is_verified=req.is_verified,
            created_by=created_by_id,
            updated_by=created_by_id,
            created_at=utc_now(),
            updated_at=utc_now(),
        )

        db.add(new_user)
        db.flush()

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=new_user.id,
            performed_by=created_by_id,
            action="EMPLOYEE_CREATED",
            details=f"Employee created with ID {new_user.employee_id}, role {new_user.role}, status {new_user.status}.",
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(new_user)
        return format_employee_response(new_user)

    @staticmethod
    def update_employee(
        db: Session,
        identifier: str,
        req: EmployeeUpdate,
        updated_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Updates employee fields."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)
        changes = []

        if req.first_name is not None and req.first_name.strip() != user.first_name:
            user.first_name = req.first_name.strip()
            changes.append("first_name")

        if req.last_name is not None and req.last_name.strip() != user.last_name:
            user.last_name = req.last_name.strip()
            changes.append("last_name")

        if req.email is not None and req.email.lower().strip() != user.email:
            existing = db.query(User).filter(
                User.email == req.email.lower().strip(),
                User.id != user.id,
                User.deleted_at.is_(None),
            ).first()
            if existing:
                raise ValidationException("Another employee already uses this email address.")
            user.email = req.email.lower().strip()
            changes.append("email")

        if req.phone is not None and req.phone.strip() != user.phone:
            if req.phone.strip():
                existing_p = db.query(User).filter(
                    User.phone == req.phone.strip(),
                    User.id != user.id,
                    User.deleted_at.is_(None),
                ).first()
                if existing_p:
                    raise ValidationException("Another employee already uses this phone number.")
            user.phone = req.phone.strip() if req.phone.strip() else None
            changes.append("phone")

        dept = req.department_id or req.department
        if dept is not None and dept != user.department_id:
            user.department_id = dept
            changes.append("department")

        desig = req.designation_id or req.designation
        if desig is not None and desig != user.designation_id:
            user.designation_id = desig
            changes.append("designation")

        if req.role is not None and req.role.upper() != user.role:
            user.role = req.role.upper()
            changes.append("role")

        if req.profile_image is not None:
            user.profile_image = req.profile_image
            changes.append("profile_image")

        if req.status is not None and req.status.upper() != user.status:
            user.status = req.status.upper()
            user.is_active = user.status == UserStatus.ACTIVE.value
            changes.append("status")

        if req.is_active is not None and req.is_active != user.is_active:
            user.is_active = req.is_active
            if not req.is_active and user.status == UserStatus.ACTIVE.value:
                user.status = UserStatus.INACTIVE.value
            elif req.is_active and user.status == UserStatus.INACTIVE.value:
                user.status = UserStatus.ACTIVE.value
            changes.append("is_active")

        if req.is_verified is not None and req.is_verified != user.is_verified:
            user.is_verified = req.is_verified
            changes.append("is_verified")

        if changes:
            user.updated_by = updated_by_id
            user.updated_at = utc_now()
            EmployeeService.log_employee_audit(
                db=db,
                employee_id=user.id,
                performed_by=updated_by_id,
                action="EMPLOYEE_UPDATED",
                details=f"Updated fields: {', '.join(changes)}",
                ip_address=ip_address,
            )
            db.commit()
            db.refresh(user)

        return format_employee_response(user)

    @staticmethod
    def approve_employee(
        db: Session,
        identifier: str,
        approved_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Approves employee application setting status to ACTIVE."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)
        user.status = UserStatus.ACTIVE.value
        user.is_active = True
        user.is_verified = True
        user.updated_by = approved_by_id
        user.updated_at = utc_now()

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=user.id,
            performed_by=approved_by_id,
            action="EMPLOYEE_APPROVED",
            details=f"Employee application approved by administrator.",
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(user)
        return format_employee_response(user)

    @staticmethod
    def reject_employee(
        db: Session,
        identifier: str,
        reason: Optional[str] = None,
        rejected_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Rejects employee application setting status to REJECTED."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)
        user.status = UserStatus.REJECTED.value
        user.is_active = False
        user.updated_by = rejected_by_id
        user.updated_at = utc_now()

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=user.id,
            performed_by=rejected_by_id,
            action="EMPLOYEE_REJECTED",
            details=f"Employee application rejected. Reason: {reason or 'N/A'}",
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(user)
        return format_employee_response(user)

    @staticmethod
    def update_status(
        db: Session,
        identifier: str,
        req: EmployeeStatusUpdate,
        updated_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Updates employee status (ACTIVE, INACTIVE, BLOCKED, PENDING, REJECTED, DELETED)."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)
        new_status = req.status.upper()
        old_status = user.status

        user.status = new_status
        user.is_active = new_status == UserStatus.ACTIVE.value
        if new_status == UserStatus.DELETED.value:
            user.deleted_at = utc_now()
            user.deleted_by = updated_by_id

        user.updated_by = updated_by_id
        user.updated_at = utc_now()

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=user.id,
            performed_by=updated_by_id,
            action=f"STATUS_CHANGED_{new_status}",
            details=f"Status changed from '{old_status}' to '{new_status}'. Reason: {req.reason or 'N/A'}",
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(user)
        return format_employee_response(user)

    @staticmethod
    def delete_employee(
        db: Session,
        identifier: str,
        deleted_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Soft-deletes employee."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)
        user.deleted_at = utc_now()
        user.deleted_by = deleted_by_id
        user.status = UserStatus.DELETED.value
        user.is_active = False

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=user.id,
            performed_by=deleted_by_id,
            action="EMPLOYEE_DELETED",
            details="Employee soft-deleted from system.",
            ip_address=ip_address,
        )

        db.commit()
        return {"message": f"Employee '{user.full_name}' ({user.employee_id}) has been soft-deleted successfully."}

    @staticmethod
    def restore_employee(
        db: Session,
        identifier: str,
        restored_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Restores soft-deleted employee."""
        user = db.query(User).filter(
            or_(User.id == identifier, User.employee_id == identifier)
        ).first()

        if not user:
            raise NotFoundException(f"Employee with identifier '{identifier}' not found.")

        user.deleted_at = None
        user.deleted_by = None
        user.status = UserStatus.ACTIVE.value
        user.is_active = True
        user.updated_by = restored_by_id
        user.updated_at = utc_now()

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=user.id,
            performed_by=restored_by_id,
            action="EMPLOYEE_RESTORED",
            details="Employee record restored from soft-deleted state.",
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(user)
        return format_employee_response(user)

    # --- Document Management ---

    @staticmethod
    def create_document(
        db: Session,
        identifier: str,
        req: DocumentCreate,
        uploaded_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> DocumentResponse:
        """Uploads / attaches document to employee."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)

        doc = EmployeeDocument(
            id=str(uuid.uuid4()),
            employee_id=user.id,
            document_type=req.document_type,
            document_name=req.document_name,
            file_name=req.file_name,
            file_url=req.file_url,
            file_size=req.file_size,
            mime_type=req.mime_type,
            status=DocumentStatus.ACTIVE.value,
            uploaded_by=uploaded_by_id,
            created_at=utc_now(),
            updated_at=utc_now(),
        )

        db.add(doc)
        db.flush()

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=user.id,
            performed_by=uploaded_by_id,
            action="DOCUMENT_UPLOADED",
            details=f"Uploaded document '{req.document_name}' ({req.document_type}).",
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(doc)
        return format_document_response(doc)

    @staticmethod
    def get_employee_documents(
        db: Session,
        identifier: str,
        page: int = 1,
        size: int = 20,
    ) -> DocumentPaginatedResponse:
        """Lists employee documents."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)

        query = db.query(EmployeeDocument).filter(
            EmployeeDocument.employee_id == user.id,
            EmployeeDocument.deleted_at.is_(None),
        )

        total = query.count()
        offset = (page - 1) * size
        docs = query.order_by(EmployeeDocument.created_at.desc()).offset(offset).limit(size).all()

        return DocumentPaginatedResponse(
            total=total,
            page=page,
            size=size,
            items=[format_document_response(d) for d in docs],
        )

    @staticmethod
    def get_document_by_id(db: Session, document_id: str) -> EmployeeDocument:
        """Gets single document record."""
        doc = db.query(EmployeeDocument).filter(
            EmployeeDocument.id == document_id,
            EmployeeDocument.deleted_at.is_(None),
        ).first()

        if not doc:
            raise NotFoundException(f"Document with ID '{document_id}' not found.")
        return doc

    @staticmethod
    def delete_document(
        db: Session,
        document_id: str,
        deleted_by_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Soft deletes employee document."""
        doc = EmployeeService.get_document_by_id(db, document_id)
        doc.deleted_at = utc_now()
        doc.deleted_by = deleted_by_id
        doc.status = DocumentStatus.ARCHIVED.value

        EmployeeService.log_employee_audit(
            db=db,
            employee_id=doc.employee_id,
            performed_by=deleted_by_id,
            action="DOCUMENT_DELETED",
            details=f"Soft deleted document '{doc.document_name}'.",
            ip_address=ip_address,
        )

        db.commit()
        return {"message": f"Document '{doc.document_name}' removed successfully."}

    # --- Audit Logs ---

    @staticmethod
    def get_employee_audit_logs(
        db: Session,
        identifier: str,
        page: int = 1,
        size: int = 20,
    ) -> EmployeeAuditPaginatedResponse:
        """Fetches lifecycle audit history for employee."""
        user = EmployeeService.get_employee_by_id_or_emp_id(db, identifier)

        query = db.query(EmployeeAuditLog).filter(
            EmployeeAuditLog.employee_id == user.id
        )

        total = query.count()
        offset = (page - 1) * size
        logs = query.order_by(EmployeeAuditLog.created_at.desc()).offset(offset).limit(size).all()

        items = []
        for log in logs:
            performer_name = log.performer.full_name if log.performer else None
            items.append(
                EmployeeAuditResponse(
                    id=log.id,
                    employee_id=log.employee_id,
                    performed_by=log.performed_by,
                    performer_name=performer_name,
                    action=log.action,
                    details=log.details,
                    ip_address=log.ip_address,
                    created_at=log.created_at.isoformat() if log.created_at else "",
                )
            )

        return EmployeeAuditPaginatedResponse(
            total=total,
            page=page,
            size=size,
            items=items,
        )
