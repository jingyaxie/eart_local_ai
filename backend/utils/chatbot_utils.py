from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.chatbot import ChatbotKnowledge, StudentProfile, ChatMessage
import json
from datetime import datetime
import openai
from ..config import settings

def analyze_sentiment(text: str) -> str:
    """分析文本情感"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个情感分析专家。请分析以下文本的情感，只返回：positive、negative或neutral。"},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content.strip().lower()
    except Exception:
        return "neutral"

def classify_intent(text: str) -> str:
    """分类用户意图"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个意图分类专家。请分析以下文本的意图，只返回：question、greeting、feedback、help或其他。"},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content.strip().lower()
    except Exception:
        return "other"

def search_knowledge_base(query: str, db: Session, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """搜索知识库"""
    try:
        # 使用OpenAI进行语义搜索
        response = openai.Embedding.create(
            input=query,
            model="text-embedding-ada-002"
        )
        query_embedding = response.data[0].embedding

        # 在数据库中搜索相关知识
        knowledge_query = db.query(ChatbotKnowledge)
        if category:
            knowledge_query = knowledge_query.filter(ChatbotKnowledge.category == category)
        
        knowledge_items = knowledge_query.all()
        
        # 计算相似度并排序
        results = []
        for item in knowledge_items:
            # 这里应该使用向量数据库进行相似度搜索
            # 为了演示，我们使用简单的关键词匹配
            if any(keyword in query.lower() for keyword in item.keywords):
                results.append({
                    "id": item.id,
                    "title": item.title,
                    "content": item.content,
                    "category": item.category,
                    "relevance_score": 1.0  # 实际应该计算相似度分数
                })
        
        return sorted(results, key=lambda x: x["relevance_score"], reverse=True)[:5]
    except Exception:
        return []

def generate_response(
    user_message: str,
    knowledge_results: List[Dict[str, Any]],
    context: Optional[Dict[str, Any]] = None
) -> str:
    """生成聊天响应"""
    try:
        # 构建系统提示
        system_prompt = "你是一个友好的学习助手，专门帮助学生解答问题。"
        if context and context.get("user_id"):
            system_prompt += " 请根据学生的历史记录和偏好提供个性化的回答。"

        # 构建知识库上下文
        knowledge_context = ""
        if knowledge_results:
            knowledge_context = "参考以下知识库信息：\n"
            for item in knowledge_results:
                knowledge_context += f"- {item['title']}: {item['content']}\n"

        # 生成响应
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{knowledge_context}\n用户问题：{user_message}"}
            ]
        )
        return response.choices[0].message.content
    except Exception:
        return "抱歉，我现在无法回答这个问题。请稍后再试。"

def update_student_profile(
    user_id: int,
    user_message: str,
    assistant_response: str,
    db: Session
) -> None:
    """更新学生档案"""
    try:
        profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == user_id
        ).first()

        if not profile:
            profile = StudentProfile(user_id=user_id)
            db.add(profile)

        # 更新最后交互时间
        profile.last_interaction = datetime.utcnow()

        # 分析用户消息，更新兴趣和偏好
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "分析以下对话，提取用户的学习风格、兴趣和偏好。返回JSON格式。"},
                    {"role": "user", "content": f"用户：{user_message}\n助手：{assistant_response}"}
                ]
            )
            analysis = json.loads(response.choices[0].message.content)
            
            if "learning_style" in analysis:
                profile.learning_style = analysis["learning_style"]
            if "interests" in analysis:
                profile.interests = analysis["interests"]
            if "preferred_topics" in analysis:
                profile.preferred_topics = analysis["preferred_topics"]
        except Exception:
            pass

        # 更新聊天历史摘要
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "总结以下对话的主要内容，不超过100字。"},
                    {"role": "user", "content": f"用户：{user_message}\n助手：{assistant_response}"}
                ]
            )
            profile.chat_history_summary = response.choices[0].message.content
        except Exception:
            pass

        db.commit()
    except Exception:
        db.rollback() 