"""Authentication Security Hardening Migration

Revision ID: 003_auth_security_hardening
Revises: 002_user_auth_schema
Create Date: 2026-07-28 23:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_auth_security_hardening'
down_revision: Union[str, None] = '002_user_auth_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to users table
    op.add_column('users', sa.Column('failed_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('last_failed_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_successful_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_password_change', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))

    # 2. Create Login History Table
    op.create_table(
        'login_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('login_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('logout_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('device', sa.String(length=100), nullable=True),
        sa.Column('browser', sa.String(length=100), nullable=True),
        sa.Column('operating_system', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('login_status', sa.String(length=50), nullable=False),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_login_history_id'), 'login_history', ['id'], unique=False)
    op.create_index(op.f('ix_login_history_user_id'), 'login_history', ['user_id'], unique=False)

    # 3. Create Authentication Audit Logs Table
    op.create_table(
        'authentication_audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_authentication_audit_logs_id'), 'authentication_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_authentication_audit_logs_user_id'), 'authentication_audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_authentication_audit_logs_event_type'), 'authentication_audit_logs', ['event_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_authentication_audit_logs_event_type'), table_name='authentication_audit_logs')
    op.drop_index(op.f('ix_authentication_audit_logs_user_id'), table_name='authentication_audit_logs')
    op.drop_index(op.f('ix_authentication_audit_logs_id'), table_name='authentication_audit_logs')
    op.drop_table('authentication_audit_logs')

    op.drop_index(op.f('ix_login_history_user_id'), table_name='login_history')
    op.drop_index(op.f('ix_login_history_id'), table_name='login_history')
    op.drop_table('login_history')

    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'last_password_change')
    op.drop_column('users', 'last_successful_login')
    op.drop_column('users', 'last_failed_login')
    op.drop_column('users', 'failed_attempts')
