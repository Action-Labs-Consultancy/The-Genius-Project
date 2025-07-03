"""Add name, is_dm, created_by to Channel table

Revision ID: add_channel_fields_20250702
Revises: cc2bb65baa31
Create Date: 2025-07-02
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('channel', sa.Column('name', sa.String(), nullable=True))
    op.add_column('channel_member', sa.Column('user_id', sa.Integer(), nullable=False))
    op.add_column('channel', sa.Column('is_dm', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('channel', sa.Column('created_by', sa.Integer(), nullable=False, server_default='1'))

def downgrade():
    op.drop_column('channel', 'created_by')
    op.drop_column('channel', 'is_dm')
    op.drop_column('channel', 'name')
    op.drop_column('channel_member', 'user_id')
