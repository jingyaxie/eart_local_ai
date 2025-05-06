from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class PlatformIntegration(Base):
    __tablename__ = "platform_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform_type = Column(String)  # wechat, teams, etc.
    platform_user_id = Column(String)  # 平台用户ID
    access_token = Column(String)
    refresh_token = Column(String)
    token_expires_at = Column(DateTime)
    platform_settings = Column(JSON)  # 平台特定设置
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="platform_integrations")

class PlatformMessage(Base):
    __tablename__ = "platform_messages"

    id = Column(Integer, primary_key=True, index=True)
    platform_integration_id = Column(Integer, ForeignKey("platform_integrations.id"))
    message_type = Column(String)  # text, image, voice, etc.
    content = Column(String)
    platform_message_id = Column(String)  # 平台消息ID
    direction = Column(String)  # incoming, outgoing
    status = Column(String)  # sent, delivered, read, failed
    metadata = Column(JSON)  # 消息元数据
    created_at = Column(DateTime, default=datetime.utcnow)

    platform_integration = relationship("PlatformIntegration", back_populates="messages") 