"""
StriveNest ERP - Middleware Stack
Request ID tracking, execution time calculation, and request/response logging middleware.
"""

import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.constants import HEADER_PROCESS_TIME, HEADER_REQUEST_ID
from app.core.logging import get_logger

logger = get_logger("middleware")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Assigns a unique X-Request-ID to every incoming request.
    2. Measures process execution time in milliseconds.
    3. Logs request details and response status codes.
    4. Attaches X-Request-ID and X-Process-Time headers to response.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        # Extract or generate Request ID
        request_id = request.headers.get(HEADER_REQUEST_ID) or str(uuid.uuid4())
        request.state.request_id = request_id

        # Attach claims if valid JWT header present
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            try:
                from app.core.security import decode_access_token
                claims = decode_access_token(token)
                request.state.user_id = claims.get("sub") or claims.get("user_id")
                request.state.user_role = claims.get("role")
            except Exception:
                request.state.user_id = None
                request.state.user_role = None
        else:
            request.state.user_id = None
            request.state.user_role = None

        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        url_path = request.url.path

        logger.info(
            "Incoming Request [%s] %s %s from IP %s",
            request_id[:8],
            method,
            url_path,
            client_ip
        )

        try:
            response: Response = await call_next(request)
            process_time = (time.perf_counter() - start_time) * 1000  # ms
            process_time_str = f"{process_time:.2f}ms"

            response.headers[HEADER_REQUEST_ID] = request_id
            response.headers[HEADER_PROCESS_TIME] = process_time_str

            # Security Headers (OWASP Security Hardening)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

            logger.info(
                "Completed Request [%s] %s %s -> Status %d in %s",
                request_id[:8],
                method,
                url_path,
                response.status_code,
                process_time_str
            )
            return response
        except Exception as exc:
            process_time = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Unhandled Exception in Request [%s] %s %s after %.2fms: %s",
                request_id[:8],
                method,
                url_path,
                process_time,
                str(exc)
            )
            raise exc
