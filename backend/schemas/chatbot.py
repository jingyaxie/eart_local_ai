from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessageBase(BaseModel):
    role: str
    content: str
    knowledge_references: Optional[Dict[str, Any]] = None
    sentiment: Optional[str] = None
    intent: Optional[str] = None

class ChatMessageCreate(ChatMessageBase):
    session_id: int

class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: str
    is_active: bool = True

class ChatSessionCreate(ChatSessionBase):
    user_id: int

class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True

class StudentProfileBase(BaseModel):
    learning_style: Optional[str] = None
    interests: Optional[List[str]] = None
    study_goals: Optional[str] = None
    preferred_topics: Optional[List[str]] = None
    chat_history_summary: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    user_id: int

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    last_interaction: datetime

    class Config:
        from_attributes = True

class ChatbotKnowledgeBase(BaseModel):
    category: str
    title: str
    content: str
    keywords: List[str]
    related_topics: List[str]

class ChatbotKnowledgeCreate(ChatbotKnowledgeBase):
    pass

class ChatbotKnowledgeResponse(ChatbotKnowledgeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    usage_count: int
    rating: float

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: str
    session_id: int
    knowledge_references: Optional[List[Dict[str, Any]]] = None
    suggested_topics: Optional[List[str]] = None 