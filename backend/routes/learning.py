from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Student, Course, Enrollment, Activity, Milestone
from ..schemas.learning import (
    ProgressResponse,
    OverallProgress,
    CourseProgress,
    ActivityResponse,
    MilestoneResponse
)

router = APIRouter()

@router.get("/progress", response_model=ProgressResponse)
async def get_learning_progress(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get learning progress for a specific student or all students
    """
    try:
        # Get overall progress
        overall = get_overall_progress(db, student_id)
        
        # Get course progress
        courses = get_course_progress(db, student_id)
        
        # Get recent activities
        activities = get_recent_activities(db, student_id)
        
        # Get milestones
        milestones = get_milestones(db, student_id)
        
        return ProgressResponse(
            overall=overall,
            courses=courses,
            recentActivities=activities,
            milestones=milestones
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_overall_progress(db: Session, student_id: Optional[int] = None) -> OverallProgress:
    """Calculate overall progress statistics"""
    query = db.query(Enrollment)
    if student_id:
        query = query.filter(Enrollment.student_id == student_id)
    
    total = query.count()
    completed = query.filter(Enrollment.status == 'completed').count()
    in_progress = query.filter(Enrollment.status == 'in_progress').count()
    not_started = total - completed - in_progress
    
    return OverallProgress(
        completed=completed,
        inProgress=in_progress,
        notStarted=not_started
    )

def get_course_progress(db: Session, student_id: Optional[int] = None) -> List[CourseProgress]:
    """Get progress for each course"""
    query = db.query(
        Course,
        Enrollment
    ).join(
        Enrollment,
        Course.id == Enrollment.course_id
    )
    
    if student_id:
        query = query.filter(Enrollment.student_id == student_id)
    
    results = query.all()
    
    return [
        CourseProgress(
            id=course.id,
            name=course.name,
            status=enrollment.status,
            progress=enrollment.progress,
            lastActivity=enrollment.last_activity
        )
        for course, enrollment in results
    ]

def get_recent_activities(
    db: Session,
    student_id: Optional[int] = None,
    limit: int = 10
) -> List[ActivityResponse]:
    """Get recent learning activities"""
    query = db.query(Activity).order_by(Activity.date.desc())
    
    if student_id:
        query = query.filter(Activity.student_id == student_id)
    
    activities = query.limit(limit).all()
    
    return [
        ActivityResponse(
            id=activity.id,
            description=activity.description,
            courseName=activity.course.name,
            date=activity.date,
            status=activity.status
        )
        for activity in activities
    ]

def get_milestones(db: Session, student_id: Optional[int] = None) -> List[MilestoneResponse]:
    """Get learning milestones"""
    query = db.query(Milestone)
    
    if student_id:
        query = query.filter(Milestone.student_id == student_id)
    
    milestones = query.all()
    
    return [
        MilestoneResponse(
            id=milestone.id,
            title=milestone.title,
            description=milestone.description,
            progress=milestone.progress
        )
        for milestone in milestones
    ]

@router.post("/activity")
async def record_activity(
    student_id: int,
    course_id: int,
    description: str,
    status: str,
    db: Session = Depends(get_db)
):
    """Record a new learning activity"""
    try:
        activity = Activity(
            student_id=student_id,
            course_id=course_id,
            description=description,
            status=status,
            date=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        return {"message": "Activity recorded successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/milestone")
async def create_milestone(
    student_id: int,
    title: str,
    description: str,
    db: Session = Depends(get_db)
):
    """Create a new learning milestone"""
    try:
        milestone = Milestone(
            student_id=student_id,
            title=title,
            description=description,
            progress=0
        )
        db.add(milestone)
        db.commit()
        return {"message": "Milestone created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/milestone/{milestone_id}/progress")
async def update_milestone_progress(
    milestone_id: int,
    progress: float,
    db: Session = Depends(get_db)
):
    """Update milestone progress"""
    try:
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        milestone.progress = progress
        db.commit()
        return {"message": "Milestone progress updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 