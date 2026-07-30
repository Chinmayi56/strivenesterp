"""
StriveNest ERP - Employee Management Models
SQLAlchemy 2.x ORM models for Employee Documents and Employee Audit History.
"""

import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, utc_now


class DocumentType(str, enum.Enum):
    ID_PROOF = "ID Proof"
    ADDRESS_PROOF = "Address Proof"
    RESUME = "Resume"
    OFFER_LETTER = "Offer Letter"
    JOINING_DOCUMENT = "Joining Document"
    EDUCATION_CERTIFICATE = "Education Certificate"
    EXPERIENCE_CERTIFICATE = "Experience Certificate"
    OTHER = "Other"


class DocumentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    REJECTED = "REJECTED"


class EmployeeDocument(Base):
    """
    Model representing employee documents (ID proofs, resumes, certificates, etc.).
    """
    __tablename__ = "employee_documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    document_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    document_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    file_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default=DocumentStatus.ACTIVE.value,
        nullable=False
    )
    uploaded_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True
    )
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
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    deleted_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True
    )

    # Relationships
    employee: Mapped["User"] = relationship(
        "User",
        back_populates="documents",
        foreign_keys=[employee_id]
    )


class EmployeeAuditLog(Base):
    """
    Model tracking employee history and lifecycle audit events.
    """
    __tablename__ = "employee_audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    performed_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    # Relationships
    employee: Mapped["User"] = relationship(
        "User",
        foreign_keys=[employee_id],
        back_populates="employee_audit_logs"
    )
    performer: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[performed_by]
    )
