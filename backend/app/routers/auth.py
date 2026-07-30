"""
StriveNest ERP - Authentication Router
API endpoints for user registration, authentication, token refresh, logout, password reset, profile, and RBAC testing.
"""

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_super_admin, require_employee
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.services.auth_service import AuthService, format_user_response
from app.utils.responses import create_success_response

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

AUTH_RESPONSES = {
    401: {"description": "Unauthorized - Invalid or expired credentials/token"},
    403: {"description": "Forbidden - Insufficient role permissions"},
    423: {"description": "Locked - Account temporarily locked due to consecutive failed attempts"},
    429: {"description": "Too Many Requests - Rate limit exceeded"},
}


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register Employee / User",
    description="Registers a new employee or user with role validation, strong password checks, and uniqueness validation.",
    responses=AUTH_RESPONSES
)
def register_user(
    req: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user_data = AuthService.register_user(db, req, request=request)
    return create_success_response(
        data=user_data.model_dump(),
        message="Employee account registered successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="User Login & Token Generation",
    description="Authenticates user credentials, verifies active state, handles lockout & rate limiting, and returns access and refresh JWT tokens.",
    responses=AUTH_RESPONSES
)
def login_user(
    req: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    token_response = AuthService.login_user(db, req, request=request)
    
    if settings.COOKIE_AUTH_ENABLED:
        response.set_cookie(
            key="refresh_token",
            value=token_response.refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        )

    return create_success_response(
        data=token_response.model_dump(),
        message="Authentication successful. Tokens generated.",
        status_code=status.HTTP_200_OK
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout & Token Invalidation",
    description="Invalidates and revokes the supplied refresh token to end active session.",
    responses=AUTH_RESPONSES
)
def logout_user(
    req: RefreshTokenRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    AuthService.logout_user(db, req.refresh_token, request=request)
    
    if settings.COOKIE_AUTH_ENABLED:
        response.delete_cookie(key="refresh_token")

    return create_success_response(
        data={"revoked": True},
        message="Logged out successfully. Refresh token invalidated.",
        status_code=status.HTTP_200_OK
    )


@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token (Token Rotation)",
    description="Validates current refresh token and issues new access token & fresh refresh token using token rotation.",
    responses=AUTH_RESPONSES
)
def refresh_token(
    req: RefreshTokenRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    token_response = AuthService.refresh_access_token(db, req.refresh_token, request=request)
    
    if settings.COOKIE_AUTH_ENABLED:
        response.set_cookie(
            key="refresh_token",
            value=token_response.refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        )

    return create_success_response(
        data=token_response.model_dump(),
        message="Access token refreshed successfully.",
        status_code=status.HTTP_200_OK
    )


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Initiate Password Reset",
    description="Generates a secure password reset token for user account recovery.",
    responses=AUTH_RESPONSES
)
def forgot_password(
    req: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    result = AuthService.forgot_password(db, req.email, request=request)
    return create_success_response(
        data=result,
        message="Password reset process initiated.",
        status_code=status.HTTP_200_OK
    )


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Complete Password Reset",
    description="Resets user password using valid reset token and invalidates active refresh tokens.",
    responses=AUTH_RESPONSES
)
def reset_password(
    req: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    AuthService.reset_password(db, req.reset_token, req.new_password, request=request)
    return create_success_response(
        data={"reset_completed": True},
        message="Password reset successfully. Please log in with your new credentials.",
        status_code=status.HTTP_200_OK
    )


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change Password (Authenticated User)",
    description="Allows authenticated user to change password after verifying current credentials.",
    responses=AUTH_RESPONSES
)
def change_password(
    req: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = AuthService.change_password(
        db=db,
        user_id=current_user.id,
        current_password=req.current_password,
        new_password=req.new_password,
        confirm_password=req.confirm_password,
        request=request
    )
    return create_success_response(
        data=result,
        message="Password changed successfully.",
        status_code=status.HTTP_200_OK
    )


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated User Profile",
    description="Returns profile information for the currently authenticated bearer token user."
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    user_data = format_user_response(current_user)
    return create_success_response(
        data=user_data.model_dump(),
        message="User profile retrieved successfully.",
        status_code=status.HTTP_200_OK
    )


@router.get(
    "/superadmin-only",
    status_code=status.HTTP_200_OK,
    summary="Super Admin Only Test Endpoint (RBAC Protection)",
    description="Protected route accessible strictly by users with SUPER_ADMIN role."
)
def super_admin_only_route(
    current_user: User = Depends(require_super_admin)
):
    return create_success_response(
        data={
            "access": "granted",
            "role": current_user.role,
            "user_id": current_user.id
        },
        message="Super Admin access verified.",
        status_code=status.HTTP_200_OK
    )


@router.get(
    "/employee-access",
    status_code=status.HTTP_200_OK,
    summary="Employee & Super Admin Test Endpoint (RBAC Protection)",
    description="Protected route accessible by authenticated EMPLOYEE and SUPER_ADMIN users."
)
def employee_access_route(
    current_user: User = Depends(require_employee)
):
    return create_success_response(
        data={
            "access": "granted",
            "role": current_user.role,
            "user_id": current_user.id
        },
        message="Employee access verified.",
        status_code=status.HTTP_200_OK
    )
