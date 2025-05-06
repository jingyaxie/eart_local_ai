from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    messages = relationship("ChatMessage", back_populates="session")
    user = relationship("User", back_populates="chat_sessions")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)  # user, assistant, system
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    knowledge_references = Column(JSON)  # 引用的知识库文档
    sentiment = Column(String)  # 情感分析结果
    intent = Column(String)  # 意图分类
    
    session = relationship("ChatSession", back_populates="messages")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    learning_style = Column(String)  # 学习风格
    interests = Column(JSON)  # 兴趣领域
    study_goals = Column(Text)  # 学习目标
    preferred_topics = Column(JSON)  # 偏好的话题
    chat_history_summary = Column(Text)  # 聊天历史摘要
    last_interaction = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="student_profile")

class ChatbotKnowledge(Base):
    __tablename__ = "chatbot_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)  # 知识类别
    title = Column(String)
    content = Column(Text)
    keywords = Column(JSON)  # 关键词
    related_topics = Column(JSON)  # 相关主题
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usage_count = Column(Integer, default=0)  # 使用次数
    rating = Column(Float, default=0.0)  # 评分 