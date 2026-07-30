"""Employee Management Migration: Employee Documents and Audit Logs

Revision ID: 004_employee_management
Revises: 003_auth_security_hardening
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_employee_management'
down_revision: Union[str, None] = '003_auth_security_hardening'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Employee Documents Table
    op.create_table(
        'employee_documents',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('employee_id', sa.String(length=36), nullable=False),
        sa.Column('document_type', sa.String(length=100), nullable=False),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ACTIVE'),
        sa.Column('uploaded_by', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employee_documents_id'), 'employee_documents', ['id'], unique=False)
    op.create_index(op.f('ix_employee_documents_employee_id'), 'employee_documents', ['employee_id'], unique=False)
    op.create_index(op.f('ix_employee_documents_document_type'), 'employee_documents', ['document_type'], unique=False)

    # 2. Create Employee Audit Logs Table
    op.create_table(
        'employee_audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('employee_id', sa.String(length=36), nullable=False),
        sa.Column('performed_by', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employee_audit_logs_id'), 'employee_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_employee_audit_logs_employee_id'), 'employee_audit_logs', ['employee_id'], unique=False)
    op.create_index(op.f('ix_employee_audit_logs_action'), 'employee_audit_logs', ['action'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_employee_audit_logs_action'), table_name='employee_audit_logs')
    op.drop_index(op.f('ix_employee_audit_logs_employee_id'), table_name='employee_audit_logs')
    op.drop_index(op.f('ix_employee_audit_logs_id'), table_name='employee_audit_logs')
    op.drop_table('employee_audit_logs')

    op.drop_index(op.f('ix_employee_documents_document_type'), table_name='employee_documents')
    op.drop_index(op.f('ix_employee_documents_employee_id'), table_name='employee_documents')
    op.drop_index(op.f('ix_employee_documents_id'), table_name='employee_documents')
    op.drop_table('employee_documents')
