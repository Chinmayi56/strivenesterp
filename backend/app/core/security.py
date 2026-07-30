"""
StriveNest ERP - Core Security Utilities
Password hashing (passlib/bcrypt), strong password validation, and JWT authentication token handling (python-jose).
"""

import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.utils.exceptions import ValidationException, UnauthorizedException


# Passlib CryptContext for password hashing using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes a plain text password using passlib bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a stored hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def validate_strong_password(password: str) -> str:
    """
    Validates that a password adheres to enterprise security policy:
    - Minimum 8 characters
    - At least one uppercase letter [A-Z]
    - At least one lowercase letter [a-z]
    - At least one digit [0-9]
    - At least one special character
    """
    if len(password) < 8:
        raise ValidationException("Password must be at least 8 characters in length.")
    if not re.search(r"[A-Z]", password):
        raise ValidationException("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValidationException("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValidationException("Password must contain at least one numeric digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\/']", password):
        raise ValidationException("Password must contain at least one special character.")
    return password


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generates a signed JWT access token containing subject, user_id, role, and expiration.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access",
        "jti": str(uuid.uuid4())
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generates a signed JWT refresh token for session renewal.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": str(uuid.uuid4())
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_REFRESH_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT access token signature and expiration.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type. Access token required.")
        return payload
    except JWTError as exc:
        raise UnauthorizedException("Could not validate credentials or token has expired.") from exc


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT refresh token signature and expiration.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_REFRESH_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type. Refresh token required.")
        return payload
    except JWTError as exc:
        raise UnauthorizedException("Invalid or expired refresh token.") from exc
