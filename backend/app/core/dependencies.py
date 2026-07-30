"""
StriveNest ERP - Dependency Injection Module
Common FastAPI dependencies for database, query params, request headers.
"""

from typing import Generator, List, Optional, Union
from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole, UserStatus
from app.utils.exceptions import ForbiddenException, UnauthorizedException
from app.utils.validators import validate_pagination_params

# Bearer Token Scheme for FastAPI OpenAPI Swagger UI integration
bearer_scheme = HTTPBearer(auto_error=False)


def get_db_session() -> Generator[Session, None, None]:
    """Dependency for obtaining database session."""
    yield from get_db()


class PaginationParams:
    """Dependency for standard pagination query parameters."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number starting at 1"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
        q: Optional[str] = Query(None, description="Search query string")
    ):
        self.page, self.page_size = validate_pagination_params(page, page_size)
        self.skip = (self.page - 1) * self.page_size
        self.limit = self.page_size
        self.q = q.strip() if q else None


def get_request_id(request: Request) -> str:
    """Dependency for retrieving request ID from request state."""
    return getattr(request.state, "request_id", "unknown")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts, decodes, and validates the JWT Bearer token,
    and returns the authenticated User instance.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication bearer token is required.")

    if credentials.scheme.lower() != "bearer":
        raise UnauthorizedException("Invalid authentication scheme. 'Bearer' token required.")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub") or payload.get("user_id")

    if not user_id:
        raise UnauthorizedException("Token payload missing subject user identifier.")

    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        raise UnauthorizedException("Authenticated user account no longer exists.")

    if not user.is_active or user.status == UserStatus.BLOCKED.value:
        raise UnauthorizedException("User account is inactive or blocked.")

    return user


def require_roles(*allowed_roles: Union[UserRole, str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Verifies if current user possesses one of the allowed roles.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        allowed_str_values = [
            r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles
        ]
        if current_user.role not in allowed_str_values:
            raise ForbiddenException(
                f"Access denied. Role '{current_user.role}' lacks permission for this resource."
            )
        return current_user

    return role_checker


# Convenient RBAC shortcuts
require_super_admin = require_roles(UserRole.SUPER_ADMIN)
require_employee = require_roles(UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)

