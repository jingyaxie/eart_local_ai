from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ChecklistItem(Base):
    __tablename__ = "visa_checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String)  # 文档准备、预约、面签等
    completed = Column(Boolean, default=False)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MockInterview(Base):
    __tablename__ = "visa_mock_interviews"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    level = Column(String)  # 初级、中级、高级
    duration = Column(Integer)  # 时长（分钟）
    preparation_steps = Column(Text)  # JSON格式存储准备步骤
    interview_url = Column(String)  # 视频面试链接
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = relationship("InterviewQuestion", back_populates="interview")

class InterviewQuestion(Base):
    __tablename__ = "visa_interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("visa_mock_interviews.id"))
    question = Column(Text)
    answer = Column(Text)
    category = Column(String)  # 个人背景、学习计划、资金证明等
    difficulty = Column(String)  # 简单、中等、困难
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("MockInterview", back_populates="questions")

class InterviewFeedback(Base):
    __tablename__ = "visa_interview_feedback"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("visa_mock_interviews.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)  # 1-5星评价
    feedback = Column(Text)
    strengths = Column(Text)  # JSON格式存储优势
    weaknesses = Column(Text)  # JSON格式存储需要改进的地方
    created_at = Column(DateTime, default=datetime.utcnow)

class ApplicationStatus(Base):
    __tablename__ = "visa_application_status"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String)  # 未开始、进行中、已完成
    current_step = Column(String)
    next_deadline = Column(DateTime)
    completed_steps = Column(Text)  # JSON格式存储已完成步骤
    pending_steps = Column(Text)  # JSON格式存储待完成步骤
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 