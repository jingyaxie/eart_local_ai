from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class PlatformIntegrationBase(BaseModel):
    platform_type: str
    platform_user_id: str
    platform_settings: Optional[Dict[str, Any]] = None

class PlatformIntegrationCreate(PlatformIntegrationBase):
    user_id: int

class PlatformIntegrationResponse(PlatformIntegrationBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PlatformMessageBase(BaseModel):
    message_type: str
    content: str
    direction: str
    metadata: Optional[Dict[str, Any]] = None

class PlatformMessageCreate(PlatformMessageBase):
    platform_integration_id: int

class PlatformMessageResponse(PlatformMessageBase):
    id: int
    platform_integration_id: int
    platform_message_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WechatMessage(BaseModel):
    msg_type: str
    content: str
    from_user: str
    to_user: str
    msg_id: str
    create_time: int
    media_id: Optional[str] = None
    format: Optional[str] = None
    recognition: Optional[str] = None

class TeamsMessage(BaseModel):
    type: str
    text: str
    from_user: str
    channel_id: str
    message_id: str
    created_at: datetime
    attachments: Optional[List[Dict[str, Any]]] = None 