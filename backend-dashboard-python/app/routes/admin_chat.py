from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.controller.admin_chat_controller import get_agent_admin_chat, send_admin_chat_message
from app.config.deps import get_db

router = APIRouter(
    prefix="/admin-chat",
    tags=["Admin Chat"]
)


@router.get("/{agent_id}")
def get_chat(agent_id: int, db: Session = Depends(get_db)):
    """Get admin chat for a specific agent"""
    return get_agent_admin_chat(agent_id, db)


@router.post("/{agent_id}/messages")
def send_message(
    agent_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Send a message in the admin chat

    Body:
    {
        "text": "message text",
        "sender": "agent" or "admin",
        "sender_name": "Agent Name",
        "mode": "bot" or "manual" (default: "bot")
    }
    """
    text = data.get("text")
    sender = data.get("sender")
    sender_name = data.get("sender_name", "Unknown")
    mode = data.get("mode", "bot")

    if not text or not sender:
        return {"error": "text and sender are required"}, 400

    return send_admin_chat_message(agent_id, text, sender, sender_name, mode, db)
