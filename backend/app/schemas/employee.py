"""
StriveNest ERP - Employee Management Pydantic Schemas
Data transfer objects and validation models for Employee CRUD, Profile, Documents, Approval, and Audit History.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Employee Schemas ---

class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    department_id: Optional[str] = Field(None, max_length=36)
    designation: Optional[str] = Field(None, max_length=100)
    designation_id: Optional[str] = Field(None, max_length=36)
    role: str = Field("EMPLOYEE", max_length=50)
    profile_image: Optional[str] = Field(None, max_length=500)
    status: str = Field("PENDING", max_length=50)
    is_verified: bool = False


class EmployeeCreate(EmployeeBase):
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    employee_id: Optional[str] = Field(None, max_length=50)


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    department_id: Optional[str] = Field(None, max_length=36)
    designation: Optional[str] = Field(None, max_length=100)
    designation_id: Optional[str] = Field(None, max_length=36)
    role: Optional[str] = Field(None, max_length=50)
    profile_image: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class EmployeeSelfUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    profile_image: Optional[str] = Field(None, max_length=500)


class EmployeeStatusUpdate(BaseModel):
    status: str = Field(..., max_length=50, description="Status: PENDING, ACTIVE, INACTIVE, BLOCKED, REJECTED, DELETED")
    reason: Optional[str] = Field(None, max_length=500)


class EmployeeResponse(BaseModel):
    id: str
    employee_id: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    department_id: Optional[str] = None
    department: Optional[str] = None
    designation_id: Optional[str] = None
    designation: Optional[str] = None
    profile_image: Optional[str] = None
    status: str
    is_active: bool
    is_verified: bool
    created_at: str
    updated_at: str
    last_login: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeePaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    items: List[EmployeeResponse]


class EmployeeStatsSummaryResponse(BaseModel):
    total_employees: int
    active_employees: int
    pending_employees: int
    inactive_employees: int
    blocked_employees: int
    deleted_employees: int
    verified_employees: int
    recent_employees: List[EmployeeResponse]


# --- Document Schemas ---

class DocumentCreate(BaseModel):
    document_type: str = Field(..., min_length=1, max_length=100)
    document_name: str = Field(..., min_length=1, max_length=255)
    file_name: str = Field(..., min_length=1, max_length=255)
    file_url: str = Field(..., min_length=1, max_length=500)
    file_size: int = Field(..., ge=0)
    mime_type: str = Field(..., min_length=1, max_length=100)


class DocumentResponse(BaseModel):
    id: str
    employee_id: str
    document_type: str
    document_name: str
    file_name: str
    file_url: str
    file_size: int
    mime_type: str
    status: str
    uploaded_by: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class DocumentPaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[DocumentResponse]


# --- Audit History Schemas ---

class EmployeeAuditResponse(BaseModel):
    id: str
    employee_id: str
    performed_by: Optional[str] = None
    performer_name: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class EmployeeAuditPaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[EmployeeAuditResponse]
