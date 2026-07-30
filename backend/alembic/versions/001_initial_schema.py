"""Initial Schema Foundation

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-28 22:39:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Initial base schema setup placeholder for future ERP module migrations
    pass


def downgrade() -> None:
    pass
