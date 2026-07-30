"""
StriveNest ERP - Domain Exceptions
Custom exception hierarchy for clean error propagation.
"""

from typing import List, Optional, Union
from app.core.constants import ResponseMessage
from app.schemas.common import ErrorDetail


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str = ResponseMessage.INTERNAL_ERROR,
        status_code: int = 500,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or []


class NotFoundException(AppException):
    def __init__(
        self,
        message: str = ResponseMessage.NOT_FOUND,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message=message, status_code=404, errors=errors)


class BadRequestException(AppException):
    def __init__(
        self,
        message: str = ResponseMessage.BAD_REQUEST,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message=message, status_code=400, errors=errors)


class UnauthorizedException(AppException):
    def __init__(
        self,
        message: str = ResponseMessage.UNAUTHORIZED,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message=message, status_code=401, errors=errors)


class ForbiddenException(AppException):
    def __init__(
        self,
        message: str = ResponseMessage.FORBIDDEN,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message=message, status_code=403, errors=errors)


class ValidationException(AppException):
    def __init__(
        self,
        message: str = ResponseMessage.VALIDATION_ERROR,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message=message, status_code=422, errors=errors)


class DatabaseException(AppException):
    def __init__(
        self,
        message: str = ResponseMessage.DATABASE_ERROR,
        errors: Optional[List[Union[ErrorDetail, dict, str]]] = None
    ):
        super().__init__(message=message, status_code=500, errors=errors)
