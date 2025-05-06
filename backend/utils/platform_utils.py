from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.platform import PlatformIntegration, PlatformMessage
from ..models.chatbot import ChatSession, ChatMessage
from ..schemas.platform import WechatMessage, TeamsMessage
from ..utils.chatbot_utils import generate_response, search_knowledge_base
import json
from datetime import datetime
import requests
from ..config import settings

async def handle_wechat_message(message: WechatMessage) -> Dict[str, Any]:
    """处理微信消息"""
    try:
        # 获取或创建平台集成
        integration = get_platform_integration("wechat", message.from_user)
        
        # 处理不同类型的消息
        if message.msg_type == "text":
            return await process_text_message(integration, message.content, message.from_user)
        elif message.msg_type == "voice":
            return await process_voice_message(integration, message.media_id, message.recognition)
        elif message.msg_type == "image":
            return await process_image_message(integration, message.media_id)
        else:
            return {"type": "text", "content": "暂不支持该类型的消息"}
    except Exception as e:
        return {"type": "text", "content": f"处理消息时出错：{str(e)}"}

async def handle_teams_message(message: TeamsMessage) -> Dict[str, Any]:
    """处理Teams消息"""
    try:
        # 获取或创建平台集成
        integration = get_platform_integration("teams", message.from_user)
        
        # 处理消息
        if message.type == "message":
            return await process_text_message(integration, message.text, message.from_user)
        elif message.type == "file":
            return await process_file_message(integration, message.attachments)
        else:
            return {"type": "text", "content": "暂不支持该类型的消息"}
    except Exception as e:
        return {"type": "text", "content": f"处理消息时出错：{str(e)}"}

async def process_text_message(
    integration: PlatformIntegration,
    content: str,
    user_id: str
) -> Dict[str, Any]:
    """处理文本消息"""
    try:
        # 获取或创建聊天会话
        session = get_or_create_chat_session(integration.user_id)
        
        # 保存用户消息
        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=content
        )
        
        # 搜索相关知识
        knowledge_results = search_knowledge_base(content, integration.db)
        
        # 生成响应
        response_content = generate_response(
            content,
            knowledge_results,
            {"user_id": integration.user_id}
        )
        
        # 保存助手响应
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_content,
            knowledge_references=knowledge_results
        )
        
        # 保存平台消息记录
        platform_message = PlatformMessage(
            platform_integration_id=integration.id,
            message_type="text",
            content=content,
            direction="incoming",
            status="delivered"
        )
        
        integration.db.add_all([user_message, assistant_message, platform_message])
        integration.db.commit()
        
        return {
            "type": "text",
            "content": response_content,
            "knowledge_references": knowledge_results
        }
    except Exception as e:
        integration.db.rollback()
        raise e

async def process_voice_message(
    integration: PlatformIntegration,
    media_id: str,
    recognition: Optional[str] = None
) -> Dict[str, Any]:
    """处理语音消息"""
    try:
        # 下载语音文件
        voice_content = download_wechat_media(media_id)
        
        # 如果提供了语音识别结果，直接使用
        if recognition:
            return await process_text_message(integration, recognition, integration.platform_user_id)
        
        # 否则进行语音识别
        text_content = await transcribe_voice(voice_content)
        return await process_text_message(integration, text_content, integration.platform_user_id)
    except Exception as e:
        return {"type": "text", "content": f"处理语音消息时出错：{str(e)}"}

async def process_image_message(
    integration: PlatformIntegration,
    media_id: str
) -> Dict[str, Any]:
    """处理图片消息"""
    try:
        # 下载图片
        image_content = download_wechat_media(media_id)
        
        # 进行图像分析
        image_analysis = await analyze_image(image_content)
        
        # 生成响应
        response = f"我看到了这张图片：{image_analysis['description']}"
        return {"type": "text", "content": response}
    except Exception as e:
        return {"type": "text", "content": f"处理图片消息时出错：{str(e)}"}

async def process_file_message(
    integration: PlatformIntegration,
    attachments: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """处理文件消息"""
    try:
        file_info = attachments[0]  # 假设只处理第一个附件
        file_content = download_teams_file(file_info["contentUrl"])
        
        # 根据文件类型处理
        if file_info["contentType"].startswith("image/"):
            return await process_image_message(integration, file_content)
        elif file_info["contentType"].startswith("audio/"):
            return await process_voice_message(integration, file_content)
        else:
            return {"type": "text", "content": "暂不支持该类型的文件"}
    except Exception as e:
        return {"type": "text", "content": f"处理文件消息时出错：{str(e)}"}

def get_platform_integration(platform_type: str, platform_user_id: str) -> PlatformIntegration:
    """获取或创建平台集成"""
    db = Session()
    try:
        integration = db.query(PlatformIntegration).filter(
            PlatformIntegration.platform_type == platform_type,
            PlatformIntegration.platform_user_id == platform_user_id,
            PlatformIntegration.is_active == True
        ).first()
        
        if not integration:
            integration = PlatformIntegration(
                platform_type=platform_type,
                platform_user_id=platform_user_id
            )
            db.add(integration)
            db.commit()
            db.refresh(integration)
        
        return integration
    except Exception as e:
        db.rollback()
        raise e

def get_or_create_chat_session(user_id: int) -> ChatSession:
    """获取或创建聊天会话"""
    db = Session()
    try:
        session = db.query(ChatSession).filter(
            ChatSession.user_id == user_id,
            ChatSession.is_active == True
        ).first()
        
        if not session:
            session = ChatSession(
                user_id=user_id,
                title=f"Chat Session {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        return session
    except Exception as e:
        db.rollback()
        raise e

def download_wechat_media(media_id: str) -> bytes:
    """下载微信媒体文件"""
    # 实现微信媒体文件下载逻辑
    pass

def download_teams_file(content_url: str) -> bytes:
    """下载Teams文件"""
    # 实现Teams文件下载逻辑
    pass

async def transcribe_voice(voice_content: bytes) -> str:
    """语音转文字"""
    # 实现语音识别逻辑
    pass

async def analyze_image(image_content: bytes) -> Dict[str, Any]:
    """图像分析"""
    # 实现图像分析逻辑
    pass 