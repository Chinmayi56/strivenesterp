"""
StriveNest ERP - SQLAlchemy Base Models
Provides DeclarativeBase and standard Model Mixins for future ERP modules.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Declarative Base for all SQLAlchemy 2.x models."""
    pass


class TimestampMixin:
    """Mixin for models requiring created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )


class AuditMixin(TimestampMixin):
    """Mixin adding is_active and soft-delete capabilities."""
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )


class UUIDModel(Base, AuditMixin):
    """Base model with UUID primary key and audit mixin."""
    __abstract__ = True

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance attributes into dictionary."""
        res = {}
        for col in getattr(self, "__table__").columns:
            val = getattr(self, col.name)
            if isinstance(val, datetime):
                val = val.isoformat()
            res[col.name] = val
        return res
