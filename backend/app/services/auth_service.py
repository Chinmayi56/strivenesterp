"""
StriveNest ERP - Authentication Business Logic Service
Handles User Registration, Credential Verification, Token Issuance, Refresh Token Rotation, and Password Resets.
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import (
    User,
    UserRole,
    UserStatus,
    RefreshToken,
    PasswordResetToken,
    LoginHistory,
    AuthenticationAudit,
)
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    AuditLogResponse,
    AuditLogPaginatedResponse,
)
from app.utils.exceptions import (
    AppException,
    BadRequestException,
    UnauthorizedException,
    ValidationException,
    NotFoundException,
)
from app.models.base import utc_now
from app.utils.device_info import get_client_ip, parse_user_agent
from fastapi import Request


def format_user_response(user: User) -> UserResponse:
    """Utility helper to serialize User model into UserResponse schema."""
    return UserResponse(
        id=user.id,
        employee_id=user.employee_id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        profile_image=user.profile_image,
        department_id=user.department_id,
        designation_id=user.designation_id,
        status=user.status,
        last_login=user.last_login.isoformat() if user.last_login else None,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=user.updated_at.isoformat() if user.updated_at else "",
    )


def ensure_utc(dt: datetime) -> datetime:
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class AuthService:
    """Enterprise Authentication Service handling complete security lifecycle."""

    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest, request: Optional[Request] = None) -> UserResponse:
        """
        Registers a new user/employee with uniqueness checks and strong password hashing.
        """
        # 1. Email uniqueness validation
        existing_email = db.query(User).filter(
            User.email == req.email,
            User.deleted_at.is_(None)
        ).first()
        if existing_email:
            raise ValidationException("An account with this email address already exists.")

        # 2. Phone uniqueness validation
        if req.phone:
            existing_phone = db.query(User).filter(
                User.phone == req.phone,
                User.deleted_at.is_(None)
            ).first()
            if existing_phone:
                raise ValidationException("An account with this phone number already exists.")

        # 3. Generate sequential employee_id
        user_count = db.query(func.count(User.id)).scalar() or 0
        employee_id = f"EMP-{10001 + user_count}"

        # 4. Create User instance
        new_user = User(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            email=req.email.lower().strip(),
            phone=req.phone.strip() if req.phone else None,
            password_hash=hash_password(req.password),
            role=req.role.value if isinstance(req.role, UserRole) else (req.role or UserRole.EMPLOYEE.value),
            department_id=req.department_id,
            designation_id=req.designation_id,
            status=UserStatus.ACTIVE.value,
            is_active=True,
            is_verified=False,
            failed_attempts=0,
            created_at=utc_now(),
            updated_at=utc_now()
        )

        db.add(new_user)
        
        # Log Audit Event
        client_ip = get_client_ip(request) if request else None
        user_agent = request.headers.get("User-Agent") if request else None
        audit = AuthenticationAudit(
            id=str(uuid.uuid4()),
            user_id=new_user.id,
            event_type="USER_REGISTRATION",
            description=f"New user registered: {new_user.email} with role {new_user.role}",
            ip_address=client_ip,
            user_agent=user_agent,
            created_at=utc_now()
        )
        db.add(audit)
        db.flush()
        
        return format_user_response(new_user)

    @staticmethod
    def login_user(db: Session, req: UserLoginRequest, request: Optional[Request] = None) -> TokenResponse:
        """
        Authenticates user credentials, validates account state, handles rate limiting & account lockout,
        updates security tracking timestamps, records login history & audit logs, and generates tokens.
        """
        client_ip = get_client_ip(request) if request else "127.0.0.1"
        raw_user_agent = request.headers.get("User-Agent") if request else "Unknown"
        browser_name, os_name, device_type = parse_user_agent(raw_user_agent)

        # 1. Locate user
        user = db.query(User).filter(
            User.email == req.email,
            User.deleted_at.is_(None)
        ).first()

        if not user:
            # Audit log for non-existent account login attempt
            audit = AuthenticationAudit(
                id=str(uuid.uuid4()),
                user_id=None,
                event_type="LOGIN_FAILED",
                description=f"Failed login attempt for non-existent email {req.email}.",
                ip_address=client_ip,
                user_agent=raw_user_agent,
                created_at=utc_now()
            )
            db.add(audit)
            db.commit()
            raise UnauthorizedException("Invalid email or password.")

        # 2. Check if account is locked
        if user.locked_until:
            locked_until_utc = ensure_utc(user.locked_until)
            if locked_until_utc > utc_now():
                # Record locked login attempt
                history = LoginHistory(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    login_time=utc_now(),
                    ip_address=client_ip,
                    device=device_type,
                    browser=browser_name,
                    operating_system=os_name,
                    user_agent=raw_user_agent,
                    login_status="LOCKED",
                    failure_reason="Account is currently locked",
                    created_at=utc_now()
                )
                db.add(history)
                db.commit()
                raise AppException(
                    message="Account temporarily locked. Please try again later.",
                    status_code=423
                )
            else:
                # Lockout window has expired, reset lockout state
                user.locked_until = None
                user.failed_attempts = 0

        # 3. Verify password
        if not verify_password(req.password, user.password_hash):
            user.failed_attempts += 1
            user.last_failed_login = utc_now()

            # Check if threshold reached
            if user.failed_attempts >= settings.LOGIN_RATE_LIMIT:
                user.locked_until = utc_now() + timedelta(minutes=settings.ACCOUNT_LOCK_MINUTES)
                
                # Record LoginHistory & Audit Log
                history = LoginHistory(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    login_time=utc_now(),
                    ip_address=client_ip,
                    device=device_type,
                    browser=browser_name,
                    operating_system=os_name,
                    user_agent=raw_user_agent,
                    login_status="LOCKED",
                    failure_reason="Account locked due to consecutive failed attempts",
                    created_at=utc_now()
                )
                audit = AuthenticationAudit(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    event_type="ACCOUNT_LOCKED",
                    description=f"Account for {user.email} locked after {user.failed_attempts} failed attempts.",
                    ip_address=client_ip,
                    user_agent=raw_user_agent,
                    created_at=utc_now()
                )
                db.add(history)
                db.add(audit)
                db.commit()
                raise AppException(
                    message="Account temporarily locked. Please try again later.",
                    status_code=423
                )

            # Record failed attempt
            history = LoginHistory(
                id=str(uuid.uuid4()),
                user_id=user.id,
                login_time=utc_now(),
                ip_address=client_ip,
                device=device_type,
                browser=browser_name,
                operating_system=os_name,
                user_agent=raw_user_agent,
                login_status="FAILED",
                failure_reason="Invalid credentials",
                created_at=utc_now()
            )
            audit = AuthenticationAudit(
                id=str(uuid.uuid4()),
                user_id=user.id,
                event_type="LOGIN_FAILED",
                description=f"Failed login attempt for user {user.email}.",
                ip_address=client_ip,
                user_agent=raw_user_agent,
                created_at=utc_now()
            )
            db.add(history)
            db.add(audit)
            db.commit()
            raise UnauthorizedException("Invalid email or password.")

        # 4. Check account status & active state
        if user.status == UserStatus.BLOCKED.value:
            raise UnauthorizedException("Your account is blocked. Please contact system administration.")
        if not user.is_active or user.status == UserStatus.INACTIVE.value:
            raise UnauthorizedException("Your account is currently inactive.")

        # 5. Successful Login -> Reset lockout counters & update login timestamps
        user.failed_attempts = 0
        user.locked_until = None
        user.last_login = utc_now()
        user.last_successful_login = utc_now()

        # 6. Record Login History & Audit Log
        login_history = LoginHistory(
            id=str(uuid.uuid4()),
            user_id=user.id,
            login_time=utc_now(),
            ip_address=client_ip,
            device=device_type,
            browser=browser_name,
            operating_system=os_name,
            user_agent=raw_user_agent,
            login_status="SUCCESS",
            created_at=utc_now()
        )
        audit_log = AuthenticationAudit(
            id=str(uuid.uuid4()),
            user_id=user.id,
            event_type="LOGIN_SUCCESS",
            description=f"User {user.email} logged in successfully.",
            ip_address=client_ip,
            user_agent=raw_user_agent,
            created_at=utc_now()
        )
        db.add(login_history)
        db.add(audit_log)

        # 7. Issue access and refresh tokens
        token_payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role
        }

        access_token = create_access_token(data=token_payload)
        refresh_token = create_refresh_token(data=token_payload)

        # 8. Store refresh token in DB
        refresh_token_entry = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=refresh_token,
            expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            is_revoked=False,
            created_at=utc_now()
        )
        db.add(refresh_token_entry)
        db.flush()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=format_user_response(user),
            role=user.role
        )

    @staticmethod
    def logout_user(db: Session, refresh_token: str, request: Optional[Request] = None) -> None:
        """
        Revokes the supplied refresh token to invalidate active session and records audit event.
        """
        token_entry = db.query(RefreshToken).filter(
            RefreshToken.token_hash == refresh_token
        ).first()

        client_ip = get_client_ip(request) if request else None
        user_agent = request.headers.get("User-Agent") if request else None

        if token_entry:
            token_entry.is_revoked = True
            
            audit = AuthenticationAudit(
                id=str(uuid.uuid4()),
                user_id=token_entry.user_id,
                event_type="LOGOUT",
                description="User logged out and refresh token was revoked.",
                ip_address=client_ip,
                user_agent=user_agent,
                created_at=utc_now()
            )
            db.add(audit)
            db.flush()

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str, request: Optional[Request] = None) -> TokenResponse:
        """
        Refreshes access token with Refresh Token Rotation strategy.
        """
        payload = decode_refresh_token(refresh_token)
        user_id = payload.get("sub") or payload.get("user_id")

        if not user_id:
            raise UnauthorizedException("Invalid refresh token payload.")

        # Check token entry in DB
        token_entry = db.query(RefreshToken).filter(
            RefreshToken.token_hash == refresh_token,
            RefreshToken.is_revoked == False
        ).first()

        if not token_entry or ensure_utc(token_entry.expires_at) < utc_now():
            raise UnauthorizedException("Refresh token is invalid or has been revoked.")

        user = db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()

        if not user or not user.is_active or user.status == UserStatus.BLOCKED.value:
            raise UnauthorizedException("User account is no longer active.")

        # Rotate Refresh Token
        token_entry.is_revoked = True

        new_token_payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role
        }

        new_access_token = create_access_token(data=new_token_payload)
        new_refresh_token = create_refresh_token(data=new_token_payload)

        new_token_entry = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=new_refresh_token,
            expires_at=utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            is_revoked=False,
            created_at=utc_now()
        )
        db.add(new_token_entry)

        client_ip = get_client_ip(request) if request else None
        user_agent = request.headers.get("User-Agent") if request else None

        audit = AuthenticationAudit(
            id=str(uuid.uuid4()),
            user_id=user.id,
            event_type="REFRESH_TOKEN",
            description=f"Access token refreshed for user {user.email}.",
            ip_address=client_ip,
            user_agent=user_agent,
            created_at=utc_now()
        )
        db.add(audit)
        db.flush()

        token_entry.replaced_by = new_token_entry.id

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=format_user_response(user),
            role=user.role
        )

    @staticmethod
    def forgot_password(db: Session, email: str, request: Optional[Request] = None) -> Dict[str, Any]:
        """
        Generates a secure password reset token for the given user email address.
        """
        user = db.query(User).filter(
            User.email == email.lower().strip(),
            User.deleted_at.is_(None)
        ).first()

        client_ip = get_client_ip(request) if request else None
        user_agent = request.headers.get("User-Agent") if request else None

        if not user:
            return {
                "message": "If an account exists with this email, a password reset token has been dispatched.",
                "reset_token": None
            }

        reset_token_str = secrets.token_urlsafe(32)
        reset_entry = PasswordResetToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=reset_token_str,
            expires_at=utc_now() + timedelta(hours=1),
            is_used=False,
            created_at=utc_now()
        )
        audit = AuthenticationAudit(
            id=str(uuid.uuid4()),
            user_id=user.id,
            event_type="PASSWORD_RESET_REQUEST",
            description=f"Password reset link requested for {user.email}.",
            ip_address=client_ip,
            user_agent=user_agent,
            created_at=utc_now()
        )
        db.add(reset_entry)
        db.add(audit)
        db.flush()

        return {
            "message": "If an account exists with this email, a password reset token has been dispatched.",
            "reset_token": reset_token_str
        }

    @staticmethod
    def reset_password(db: Session, reset_token: str, new_password: str, request: Optional[Request] = None) -> None:
        """
        Resets user password given a valid password reset token.
        """
        token_entry = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == reset_token,
            PasswordResetToken.is_used == False
        ).first()

        if not token_entry or ensure_utc(token_entry.expires_at) < utc_now():
            raise BadRequestException("Invalid or expired password reset token.")

        user = db.query(User).filter(
            User.id == token_entry.user_id,
            User.deleted_at.is_(None)
        ).first()

        if not user:
            raise NotFoundException("Associated user account not found.")

        user.password_hash = hash_password(new_password)
        user.last_password_change = utc_now()
        user.updated_at = utc_now()
        token_entry.is_used = True

        # Revoke all existing refresh tokens for security
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id
        ).update({"is_revoked": True})

        client_ip = get_client_ip(request) if request else None
        user_agent = request.headers.get("User-Agent") if request else None

        audit = AuthenticationAudit(
            id=str(uuid.uuid4()),
            user_id=user.id,
            event_type="PASSWORD_RESET",
            description=f"Password successfully reset for {user.email}.",
            ip_address=client_ip,
            user_agent=user_agent,
            created_at=utc_now()
        )
        db.add(audit)
        db.flush()

    @staticmethod
    def change_password(
        db: Session,
        user_id: str,
        current_password: str,
        new_password: str,
        confirm_password: str,
        request: Optional[Request] = None
    ) -> Dict[str, Any]:
        """
        Allows an authenticated user to change their password securely.
        """
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise NotFoundException("User account not found.")

        if not verify_password(current_password, user.password_hash):
            raise BadRequestException("Current password is incorrect.")

        if new_password != confirm_password:
            raise BadRequestException("New password and confirm password do not match.")

        # Password strength checks
        if len(new_password) < 8:
            raise ValidationException("New password must be at least 8 characters long.")
        if not any(c.isupper() for c in new_password):
            raise ValidationException("New password must contain at least one uppercase letter.")
        if not any(c.islower() for c in new_password):
            raise ValidationException("New password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in new_password):
            raise ValidationException("New password must contain at least one number.")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in new_password):
            raise ValidationException("New password must contain at least one special character.")

        user.password_hash = hash_password(new_password)

        # Invalidate all existing refresh tokens
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"is_revoked": True})

        client_ip = get_client_ip(request) if request else None
        user_agent = request.headers.get("User-Agent") if request else None

        audit = AuthenticationAudit(
            id=str(uuid.uuid4()),
            user_id=user.id,
            event_type="PASSWORD_CHANGED",
            description=f"User {user.email} successfully changed their password.",
            ip_address=client_ip,
            user_agent=user_agent,
            created_at=utc_now()
        )
        db.add(audit)
        db.commit()

        return {"status": "success", "message": "Password changed successfully."}

    @staticmethod
    def get_audit_logs(
        db: Session,
        page: int = 1,
        size: int = 20,
        event_type: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> AuditLogPaginatedResponse:
        """
        Queries authentication audit logs with pagination, filtering, date range, and text search.
        """
        query = db.query(AuthenticationAudit)

        if event_type:
            query = query.filter(AuthenticationAudit.event_type == event_type)

        if user_id:
            query = query.filter(AuthenticationAudit.user_id == user_id)

        if start_date:
            query = query.filter(AuthenticationAudit.created_at >= start_date)

        if end_date:
            query = query.filter(AuthenticationAudit.created_at <= end_date)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (AuthenticationAudit.description.ilike(search_pattern)) |
                (AuthenticationAudit.ip_address.ilike(search_pattern)) |
                (AuthenticationAudit.event_type.ilike(search_pattern))
            )

        total = query.count()
        offset = (page - 1) * size
        logs = query.order_by(AuthenticationAudit.created_at.desc()).offset(offset).limit(size).all()

        items = [
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                event_type=log.event_type,
                description=log.description,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                created_at=log.created_at.isoformat() if log.created_at else ""
            )
            for log in logs
        ]

        return AuditLogPaginatedResponse(
            total=total,
            page=page,
            size=size,
            items=items
        )

