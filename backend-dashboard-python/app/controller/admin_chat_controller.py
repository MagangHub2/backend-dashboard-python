from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.admin_message import AdminMessage, MessageSender, ChatMode
from datetime import datetime


def get_agent_admin_chat(agent_id: int, db: Session):
    """Get all admin chat messages for a specific agent"""
    messages = db.query(AdminMessage).filter(
        AdminMessage.agent_id == agent_id
    ).order_by(AdminMessage.created_at.asc()).all()

    # Get the current mode from the latest message, default to 'bot'
    current_mode = messages[-1].mode.value if messages else "bot"

    return {
        "id": agent_id,
        "mode": current_mode,
        "messages": [
            {
                "id": msg.id,
                "text": msg.text,
                "sender": msg.sender.value,
                "sender_name": msg.sender_name,
                "time": msg.created_at.strftime("%H:%M"),
                "status": "read"  # For now, all messages are read
            }
            for msg in messages
        ]
    }


def send_admin_chat_message(agent_id: int, text: str, sender: str, sender_name: str, mode: str, db: Session):
    """Send a message in the admin chat"""

    # Validate sender
    if sender not in ["agent", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid sender type")

    # Validate mode
    if mode not in ["bot", "manual"]:
        raise HTTPException(status_code=400, detail="Invalid mode type")

    # Create new message
    new_message = AdminMessage(
        agent_id=agent_id,
        text=text,
        sender=MessageSender[sender],
        sender_name=sender_name,
        mode=ChatMode[mode]
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # If mode is bot and sender is agent, generate automatic admin response
    if mode == "bot" and sender == "agent":
        bot_response = generate_bot_response(text)

        bot_message = AdminMessage(
            agent_id=agent_id,
            text=bot_response,
            sender=MessageSender.admin,
            sender_name="Auto Admin",
            mode=ChatMode.bot
        )

        db.add(bot_message)
        db.commit()
        db.refresh(bot_message)

    return {
        "id": new_message.id,
        "text": new_message.text,
        "sender": new_message.sender.value,
        "sender_name": new_message.sender_name,
        "time": new_message.created_at.strftime("%H:%M"),
        "status": "sent"
    }


def generate_bot_response(message: str) -> str:
    """Generate automatic bot response based on agent message"""
    message_lower = message.lower()

    # Simple keyword-based responses
    if "help" in message_lower or "bantuan" in message_lower:
        return "Halo! Admin akan segera membantu Anda. Silakan jelaskan masalah yang Anda hadapi."
    elif "customer" in message_lower or "pelanggan" in message_lower:
        return "Terima kasih atas informasinya. Admin akan segera meninjau chat customer Anda."
    elif "urgent" in message_lower or "penting" in message_lower or "mendesak" in message_lower:
        return "Pesan urgent diterima. Admin akan segera merespons."
    elif "?" in message:
        return "Pertanyaan Anda telah diterima. Admin akan segera memberikan jawaban."
    else:
        return "Pesan Anda telah diterima. Admin akan segera merespons. Terima kasih!"
