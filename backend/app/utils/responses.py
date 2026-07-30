"""
StriveNest ERP - Standard Response Utilities
Reusable JSONResponse builders matching enterprise response contracts.
"""

from typing import Any, List, Optional, Union
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.core.constants import ResponseMessage
from app.schemas.common import APIResponse, ErrorDetail, PaginationMeta


def create_success_response(
    data: Any = None,
    message: str = ResponseMessage.SUCCESS,
    status_code: int = 200,
    headers: Optional[dict] = None
) -> JSONResponse:
    """
    Builds a standard success JSON response.
    Format:
    {
        "success": true,
        "message": message,
        "data": data,
        "errors": [],
        "timestamp": ISO-timestamp
    }
    """
    response_model = APIResponse(
        success=True,
        message=message,
        data=data,
        errors=[]
    )
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(response_model.model_dump()),
        headers=headers
    )


def create_error_response(
    message: str = ResponseMessage.BAD_REQUEST,
    errors: Optional[List[Union[ErrorDetail, dict, str]]] = None,
    status_code: int = 400,
    headers: Optional[dict] = None
) -> JSONResponse:
    """
    Builds a standard error JSON response.
    Format:
    {
        "success": false,
        "message": message,
        "data": null,
        "errors": [...],
        "timestamp": ISO-timestamp
    }
    """
    formatted_errors: List[ErrorDetail] = []
    if errors:
        for err in errors:
            if isinstance(err, ErrorDetail):
                formatted_errors.append(err)
            elif isinstance(err, dict):
                formatted_errors.append(ErrorDetail(**err))
            elif isinstance(err, str):
                formatted_errors.append(ErrorDetail(message=err))

    response_model = APIResponse[Any](
        success=False,
        message=message,
        data=None,
        errors=formatted_errors
    )
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(response_model.model_dump()),
        headers=headers
    )


def create_paginated_response(
    items: List[Any],
    page: int,
    page_size: int,
    total_items: int,
    message: str = ResponseMessage.SUCCESS,
    status_code: int = 200
) -> JSONResponse:
    """Builds a standard paginated JSON response."""
    total_pages = (total_items + page_size - 1) // page_size if page_size > 0 else 0
    pagination = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1
    )
    payload = {
        "items": items,
        "pagination": pagination.model_dump()
    }
    return create_success_response(data=payload, message=message, status_code=status_code)
