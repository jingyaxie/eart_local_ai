from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime

from database import get_db
import models
import auth
from agents import CourseQAAgent, PortfolioAgent, VisaAgent

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    agent_type: str  # "course_qa", "portfolio", "visa"

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

manager = ConnectionManager()

# Initialize AI agents
course_qa_agent = CourseQAAgent()
portfolio_agent = PortfolioAgent()
visa_agent = VisaAgent()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Get appropriate agent based on type
            agent = None
            if message_data["agent_type"] == "course_qa":
                agent = course_qa_agent
            elif message_data["agent_type"] == "portfolio":
                agent = portfolio_agent
            elif message_data["agent_type"] == "visa":
                agent = visa_agent
            
            if not agent:
                await websocket.send_text(json.dumps({
                    "error": "Invalid agent type"
                }))
                continue
            
            # Get AI response
            response = await agent.get_response(message_data["message"])
            
            # Save to chat history
            chat_entry = models.ChatHistory(
                user_id=user_id,
                message=message_data["message"],
                response=response,
                agent_type=message_data["agent_type"]
            )
            db.add(chat_entry)
            db.commit()
            
            # Send response
            await manager.send_personal_message(
                json.dumps({
                    "response": response,
                    "timestamp": datetime.utcnow().isoformat()
                }),
                user_id
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.get("/history", response_model=List[ChatResponse])
async def get_chat_history(
    agent_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == current_user.id
    )
    if agent_type:
        query = query.filter(models.ChatHistory.agent_type == agent_type)
    
    history = query.order_by(models.ChatHistory.timestamp.desc()).limit(limit).all()
    return [
        ChatResponse(
            response=entry.response,
            timestamp=entry.timestamp
        ) for entry in history
    ]

@router.post("/message", response_model=ChatResponse)
async def send_message(
    message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Get appropriate agent
    agent = None
    if message.agent_type == "course_qa":
        agent = course_qa_agent
    elif message.agent_type == "portfolio":
        agent = portfolio_agent
    elif message.agent_type == "visa":
        agent = visa_agent
    
    if not agent:
        raise HTTPException(status_code=400, detail="Invalid agent type")
    
    # Get AI response
    response = await agent.get_response(message.message)
    
    # Save to chat history
    chat_entry = models.ChatHistory(
        user_id=current_user.id,
        message=message.message,
        response=response,
        agent_type=message.agent_type
    )
    db.add(chat_entry)
    db.commit()
    
    return ChatResponse(
        response=response,
        timestamp=chat_entry.timestamp
    ) 