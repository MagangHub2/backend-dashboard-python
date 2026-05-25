"""add_mode_to_admin_messages

Revision ID: 7a4ad7b9e6e6
Revises: e016c0677dfa
Create Date: 2026-01-02 22:45:06.177609

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a4ad7b9e6e6'
down_revision: Union[str, Sequence[str], None] = 'e016c0677dfa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create admin_chat_mode enum type if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE admin_chat_mode AS ENUM ('bot', 'manual');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Add mode column to admin_messages table with default 'bot' if not exists
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE admin_messages
            ADD COLUMN mode admin_chat_mode NOT NULL DEFAULT 'bot';
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove mode column
    op.execute("""
        ALTER TABLE admin_messages DROP COLUMN mode
    """)

    # Drop the enum type
    op.execute("""
        DROP TYPE admin_chat_mode
    """)
