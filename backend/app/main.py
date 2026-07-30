"""
StriveNest ERP - Main FastAPI Application Factory & Entrypoint
Configures FastAPI app instance, lifespan handlers, CORS, middleware, global exception handlers, and Swagger documentation.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request, status
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.v1.main import api_v1_router
from app.core.config import settings
from app.core.database import check_db_connection, init_db
from app.core.logging import get_logger, setup_logging
from app.core.middleware import RequestContextMiddleware
from app.utils.exceptions import AppException
from app.utils.responses import create_error_response

# Initialize logger
logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager handling startup and shutdown events.
    """
    # Startup Events
    logger.info("Initializing %s v%s...", settings.APP_NAME, settings.APP_VERSION)
    logger.info("Environment: %s | Debug: %s", settings.ENVIRONMENT, settings.DEBUG)
    
    try:
        init_db()
        db_ok = check_db_connection()
        if db_ok:
            logger.info("Database connection test passed.")
        else:
            logger.warning("Database connection test failed on startup!")
    except Exception as exc:
        logger.error("Startup database initialization error: %s", str(exc))

    yield  # Application runs here

    # Shutdown Events
    logger.info("Shutting down %s...", settings.APP_NAME)
    logger.info("Cleanup completed successfully.")


def create_application() -> FastAPI:
    """Factory creating and configuring FastAPI instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=settings.APP_DESCRIPTION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # 1. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Compression Middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 3. Trusted Host Middleware
    allowed_hosts = settings.ALLOWED_HOSTS if isinstance(settings.ALLOWED_HOSTS, list) else ["*"]
    if "*" not in allowed_hosts:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # 4. Custom Request Context & Logging Middleware
    app.add_middleware(RequestContextMiddleware)

    # Include API Routers
    app.include_router(api_v1_router, prefix=settings.API_PREFIX)

    # --- GLOBAL EXCEPTION HANDLERS ---

    @app.exception_handler(AppException)
    async def custom_app_exception_handler(request: Request, exc: AppException):
        logger.error("AppException [%s %s]: %s", request.method, request.url.path, exc.message)
        return create_error_response(
            message=exc.message,
            errors=exc.errors,
            status_code=exc.status_code
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning("HTTPException [%s %s]: %s (Status %d)", request.method, request.url.path, exc.detail, exc.status_code)
        return create_error_response(
            message=str(exc.detail),
            status_code=exc.status_code
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.warning("HTTPException [%s %s]: %s (Status %d)", request.method, request.url.path, exc.detail, exc.status_code)
        return create_error_response(
            message=str(exc.detail),
            status_code=exc.status_code
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning("ValidationError [%s %s]: %d errors", request.method, request.url.path, len(exc.errors()))
        formatted_errors = []
        for error in exc.errors():
            loc = " -> ".join([str(x) for x in error.get("loc", []) if x != "body"])
            msg = error.get("msg", "Invalid value")
            formatted_errors.append({
                "field": loc or "request",
                "message": msg
            })
        return create_error_response(
            message="Validation failed for request parameters.",
            errors=formatted_errors,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        logger.error("Database IntegrityError [%s %s]: %s", request.method, request.url.path, str(exc.orig))
        return create_error_response(
            message="A database constraint or integrity violation occurred.",
            errors=[{"message": "Duplicate entry or foreign key violation."}],
            status_code=status.HTTP_409_CONFLICT
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        logger.error("SQLAlchemyError [%s %s]: %s", request.method, request.url.path, str(exc))
        return create_error_response(
            message="An unexpected database error occurred.",
            errors=[{"message": "Database query execution failed."}],
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.critical("Unhandled Exception [%s %s]: %s", request.method, request.url.path, str(exc), exc_info=True)
        return create_error_response(
            message="An internal server error occurred.",
            errors=[{"message": "System encountered an unexpected exception."}],
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Customize OpenAPI Schema
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=f"{settings.APP_NAME} Documentation",
            version=settings.APP_VERSION,
            description=(
                f"{settings.APP_DESCRIPTION}\n\n"
                "### Features & Architecture\n"
                "- **FastAPI** with Python 3.12+ async-ready architecture\n"
                "- **SQLAlchemy 2.x** with DeclarativeBase and connection pooling\n"
                "- **Alembic** migration environment\n"
                "- **Pydantic v2** model validation & settings\n"
                "- **Standardized API Responses** (`APIResponse` model)\n"
                "- **Centralized Global Exception Handling**\n"
                "- **Enterprise Request Logging & Request-ID Tracking**"
            ),
            routes=app.routes,
        )

        openapi_schema["components"] = openapi_schema.get("components", {})
        openapi_schema["components"]["securitySchemes"] = {
            "HTTPBearer": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Enter your JWT Bearer token as issued by `/api/v1/auth/login`"
            }
        }
        openapi_schema["info"]["contact"] = {
            "name": "StriveNest Engineering Team",
            "email": "architecture@strivenest.com"
        }
        openapi_schema["info"]["license"] = {
            "name": "Proprietary / Enterprise ERP License",
        }

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi
    return app


app = create_application()
