from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models.visa import ChecklistItem, MockInterview, InterviewQuestion, InterviewFeedback, ApplicationStatus
from ..schemas.visa import (
    ChecklistItemResponse,
    MockInterviewResponse,
    InterviewQuestionResponse,
    InterviewFeedbackCreate,
    ApplicationStatusResponse
)

router = APIRouter()

@router.get("/checklist", response_model=List[ChecklistItemResponse])
async def get_checklist(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get visa application checklist items"""
    try:
        query = db.query(ChecklistItem)
        if category:
            query = query.filter(ChecklistItem.category == category)
        return query.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/checklist/{item_id}/toggle")
async def toggle_checklist_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Toggle checklist item completion status"""
    try:
        item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Checklist item not found")
        
        item.completed = not item.completed
        item.updated_at = datetime.utcnow()
        db.commit()
        
        # 更新申请状态
        update_application_status(db)
        
        return {"message": "Checklist item updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mock-interviews", response_model=List[MockInterviewResponse])
async def get_mock_interviews(
    level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get available mock interviews"""
    try:
        query = db.query(MockInterview)
        if level:
            query = query.filter(MockInterview.level == level)
        return query.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mock-interviews/{interview_id}/questions", response_model=List[InterviewQuestionResponse])
async def get_interview_questions(
    interview_id: int,
    db: Session = Depends(get_db)
):
    """Get questions for a specific mock interview"""
    try:
        questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id
        ).all()
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mock-interviews/{interview_id}/feedback")
async def submit_interview_feedback(
    interview_id: int,
    feedback: InterviewFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Submit feedback for a mock interview"""
    try:
        interview = db.query(MockInterview).filter(MockInterview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        new_feedback = InterviewFeedback(
            interview_id=interview_id,
            rating=feedback.rating,
            feedback=feedback.feedback,
            strengths=feedback.strengths,
            weaknesses=feedback.weaknesses
        )
        db.add(new_feedback)
        db.commit()
        
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/application-status", response_model=ApplicationStatusResponse)
async def get_application_status(
    db: Session = Depends(get_db)
):
    """Get current visa application status"""
    try:
        # 获取或创建申请状态
        status = db.query(ApplicationStatus).first()
        if not status:
            status = ApplicationStatus(
                status="not_started",
                current_step="准备阶段",
                next_deadline=datetime.utcnow(),
                completed_steps="[]",
                pending_steps=str(steps)
            )
            db.add(status)
            db.commit()
        
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def update_application_status(db: Session):
    """Update application status based on checklist completion"""
    try:
        # 获取所有清单项目
        checklist_items = db.query(ChecklistItem).all()
        
        # 计算完成的项目
        completed_items = [item for item in checklist_items if item.completed]
        completed_categories = set(item.category for item in completed_items)
        
        # 确定当前步骤和下一步
        steps = ["准备阶段", "申请材料", "预约面签", "模拟面签", "正式面签", "签证结果"]
        current_step = None
        next_step = None
        
        for step in steps:
            if step not in completed_categories:
                if not current_step:
                    current_step = step
                elif not next_step:
                    next_step = step
                    break
        
        # 更新申请状态
        status = db.query(ApplicationStatus).first()
        if not status:
            status = ApplicationStatus()
            db.add(status)
        
        status.status = "completed" if len(completed_items) == len(checklist_items) else "in_progress"
        status.current_step = current_step or steps[-1]
        status.next_deadline = datetime.utcnow()  # 这里可以根据实际情况设置截止日期
        status.completed_steps = str(list(completed_categories))
        status.pending_steps = str([step for step in steps if step not in completed_categories])
        status.updated_at = datetime.utcnow()
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise e 