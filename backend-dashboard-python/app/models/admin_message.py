from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.config.database import Base
import enum


class MessageSender(enum.Enum):
    agent = "agent"
    admin = "admin"


class ChatMode(enum.Enum):
    bot = "bot"
    manual = "manual"


class AdminMessage(Base):
    """Model for internal admin-agent chat messages"""
    __tablename__ = "admin_messages"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, nullable=False, index=True)  # ID of the agent in conversation
    text = Column(String, nullable=False)
    sender = Column(SQLEnum(MessageSender, name="message_sender"), nullable=False)
    sender_name = Column(String, nullable=True)  # Name of sender for display
    mode = Column(SQLEnum(ChatMode, name="admin_chat_mode"), nullable=False, default=ChatMode.bot)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
