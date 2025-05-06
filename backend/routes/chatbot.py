from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models.chatbot import ChatSession, ChatMessage, StudentProfile, ChatbotKnowledge
from ..schemas.chatbot import (
    ChatSessionResponse,
    ChatMessageResponse,
    StudentProfileResponse,
    ChatbotKnowledgeResponse,
    ChatRequest,
    ChatResponse
)
from ..utils.chatbot_utils import (
    analyze_sentiment,
    classify_intent,
    search_knowledge_base,
    generate_response,
    update_student_profile
)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """处理聊天请求并返回响应"""
    try:
        # 获取或创建聊天会话
        if request.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
        else:
            session = ChatSession(
                title=f"Chat Session {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                user_id=request.context.get("user_id") if request.context else None
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        # 保存用户消息
        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=request.message,
            sentiment=analyze_sentiment(request.message),
            intent=classify_intent(request.message)
        )
        db.add(user_message)

        # 搜索相关知识
        knowledge_results = search_knowledge_base(request.message, db)
        
        # 生成响应
        response_content = generate_response(
            request.message,
            knowledge_results,
            request.context
        )

        # 保存助手响应
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_content,
            knowledge_references=knowledge_results
        )
        db.add(assistant_message)

        # 更新学生档案
        if request.context and request.context.get("user_id"):
            update_student_profile(
                request.context["user_id"],
                request.message,
                response_content,
                db
            )

        db.commit()

        return ChatResponse(
            message=response_content,
            session_id=session.id,
            knowledge_references=knowledge_results,
            suggested_topics=[k["title"] for k in knowledge_results[:3]]
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    user_id: int,
    db: Session = Depends(get_db)
):
    """获取用户的聊天会话列表"""
    try:
        sessions = db.query(ChatSession).filter(
            ChatSession.user_id == user_id,
            ChatSession.is_active == True
        ).all()
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db)
):
    """获取特定会话的消息历史"""
    try:
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at).all()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student-profile/{user_id}", response_model=StudentProfileResponse)
async def get_student_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """获取学生档案"""
    try:
        profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == user_id
        ).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Student profile not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/knowledge", response_model=List[ChatbotKnowledgeResponse])
async def search_knowledge(
    query: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """搜索知识库"""
    try:
        results = search_knowledge_base(query, db, category)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 