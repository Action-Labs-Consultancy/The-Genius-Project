"""add email to AccessRequest

Revision ID: xxxx
Revises: <previous_revision>
Create Date: <date>

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'xxxx'
down_revision = '<previous_revision>'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('access_request', sa.Column('email', sa.String(length=120), nullable=False))

def downgrade():
    op.drop_column('access_request', 'email')
