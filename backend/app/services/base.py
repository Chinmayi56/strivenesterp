"""
StriveNest ERP - Base Service Layer
Abstract Base Service providing common CRUD operations and database transactions.
"""

from typing import Generic, List, Optional, Type, TypeVar
from sqlalchemy.orm import Session
from app.core.logging import get_logger

ModelType = TypeVar("ModelType")
logger = get_logger("services.base")


class BaseService(Generic[ModelType]):
    """Base generic service class for business logic modules."""

    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, item_id: str) -> Optional[ModelType]:
        """Fetch item by primary key ID."""
        return self.db.query(self.model).filter(getattr(self.model, "id") == item_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Fetch list of items with pagination."""
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def count(self) -> int:
        """Get total record count."""
        return self.db.query(self.model).count()
