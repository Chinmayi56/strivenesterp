"""
StriveNest ERP - Database Configuration
Engine, Session Local Factory, Connection Pooling, Health Check, and Session Dependency.
"""

from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings
from app.core.logging import get_logger
from app.models.base import Base

logger = get_logger("database")


def create_db_engine():
    """Build SQLAlchemy 2.x engine with connection pooling parameters."""
    connect_args = {}
    
    if settings.is_sqlite:
        connect_args["check_same_thread"] = False
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            echo=settings.DB_ECHO,
            future=True
        )
    else:
        # PostgreSQL / Production Engine configuration
        engine = create_engine(
            settings.DATABASE_URL,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,
            echo=settings.DB_ECHO,
            future=True
        )
    return engine


engine = create_db_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    class_=Session
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI Dependency providing a database session.
    Automatically handles commit, rollback on error, and session closure.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Database transaction error, rollback executed: %s", str(exc))
        raise
    finally:
        db.close()


def check_db_connection() -> bool:
    """Tests if the database connection is healthy."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database connection check failed: %s", str(exc))
        return False

def init_db():
    from app.models.user import (
        User,
        RefreshToken,
        PasswordResetToken,
        LoginHistory,
        AuthenticationAudit,
    )

    Base.metadata.create_all(bind=engine)