"""add user role enum

Revision ID: eaae7a12e839
Revises: 9f730c5050e6
Create Date: 2025-12-19 16:12:51.395427

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eaae7a12e839'
down_revision: Union[str, Sequence[str], None] = '9f730c5050e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
