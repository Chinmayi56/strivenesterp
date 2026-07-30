"""
StriveNest ERP - Authentication Schemas
Pydantic v2 schemas for User Registration, Login, Token Payloads, Password Reset, and User Response.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.core.security import validate_strong_password
from app.models.user import UserRole, UserStatus


class UserRegisterRequest(BaseModel):
    """Payload for registering a new user / employee."""
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    email: EmailStr = Field(..., description="Unique corporate email address")
    phone: Optional[str] = Field(None, description="Optional unique phone number")
    password: str = Field(..., description="Strong password adhering to security policy")
    role: Optional[UserRole] = Field(default=UserRole.EMPLOYEE, description="User role (SUPER_ADMIN or EMPLOYEE)")
    department_id: Optional[str] = Field(None, description="Department UUID")
    designation_id: Optional[str] = Field(None, description="Designation UUID")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_strong_password(v)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane.doe@strivenest.com",
                "phone": "+15550192834",
                "password": "SecurePassword123!",
                "role": "EMPLOYEE"
            }
        }
    )


class UserLoginRequest(BaseModel):
    """Payload for user authentication login."""
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Plain text password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "jane.doe@strivenest.com",
                "password": "SecurePassword123!"
            }
        }
    )


class UserResponse(BaseModel):
    """User profile response model."""
    id: str
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role: str
    profile_image: Optional[str] = None
    department_id: Optional[str] = None
    designation_id: Optional[str] = None
    status: str
    last_login: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: str
    updated_at: str

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
                "employee_id": "EMP-10001",
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane.doe@strivenest.com",
                "phone": "+15550192834",
                "role": "EMPLOYEE",
                "status": "ACTIVE",
                "is_active": True,
                "is_verified": False,
                "created_at": "2026-07-28T22:00:00Z",
                "updated_at": "2026-07-28T22:00:00Z"
            }
        }
    )


class TokenResponse(BaseModel):
    """JWT Token pair response model."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds")
    user: UserResponse
    role: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "role": "EMPLOYEE"
            }
        }
    )


class RefreshTokenRequest(BaseModel):
    """Payload for refreshing access token."""
    refresh_token: str = Field(..., description="Valid unrevoked refresh token")


class ForgotPasswordRequest(BaseModel):
    """Payload for initiating password reset."""
    email: EmailStr = Field(..., description="Registered email address")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class ChangePasswordRequest(BaseModel):
    """Payload for authenticated password change."""
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New strong password")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")


class ResetPasswordRequest(BaseModel):
    """Payload for completing password reset with token."""
    reset_token: str = Field(..., description="Password reset authorization token")
    new_password: str = Field(..., description="New strong password")

    @field_validator("new_password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_strong_password(v)


class AuditLogResponse(BaseModel):
    """Single authentication audit log item."""
    id: str
    user_id: Optional[str] = None
    event_type: str
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class AuditLogPaginatedResponse(BaseModel):
    """Paginated list of authentication audit logs."""
    total: int
    page: int
    size: int
    items: list[AuditLogResponse]

