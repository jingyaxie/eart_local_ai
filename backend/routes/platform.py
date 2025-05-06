from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.platform import PlatformIntegration, PlatformMessage
from ..schemas.platform import (
    PlatformIntegrationCreate,
    PlatformIntegrationResponse,
    PlatformMessageResponse,
    WechatMessage,
    TeamsMessage
)
from ..utils.platform_utils import (
    handle_wechat_message,
    handle_teams_message,
    process_platform_message
)

router = APIRouter()

@router.post("/wechat/webhook")
async def wechat_webhook(request: Request):
    """处理微信消息"""
    try:
        data = await request.json()
        message = WechatMessage(**data)
        return await handle_wechat_message(message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/teams/webhook")
async def teams_webhook(request: Request):
    """处理Teams消息"""
    try:
        data = await request.json()
        message = TeamsMessage(**data)
        return await handle_teams_message(message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/integrations", response_model=PlatformIntegrationResponse)
async def create_platform_integration(
    integration: PlatformIntegrationCreate,
    db: Session = Depends(get_db)
):
    """创建平台集成"""
    try:
        db_integration = PlatformIntegration(**integration.dict())
        db.add(db_integration)
        db.commit()
        db.refresh(db_integration)
        return db_integration
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integrations/{user_id}", response_model=List[PlatformIntegrationResponse])
async def get_user_integrations(
    user_id: int,
    db: Session = Depends(get_db)
):
    """获取用户的平台集成列表"""
    try:
        integrations = db.query(PlatformIntegration).filter(
            PlatformIntegration.user_id == user_id,
            PlatformIntegration.is_active == True
        ).all()
        return integrations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{integration_id}", response_model=List[PlatformMessageResponse])
async def get_platform_messages(
    integration_id: int,
    db: Session = Depends(get_db)
):
    """获取平台消息历史"""
    try:
        messages = db.query(PlatformMessage).filter(
            PlatformMessage.platform_integration_id == integration_id
        ).order_by(PlatformMessage.created_at.desc()).limit(50).all()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 