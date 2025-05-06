from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OverallProgress(BaseModel):
    completed: int
    inProgress: int
    notStarted: int

class CourseProgress(BaseModel):
    id: int
    name: str
    status: str
    progress: float
    lastActivity: datetime

class ActivityResponse(BaseModel):
    id: int
    description: str
    courseName: str
    date: datetime
    status: str

class MilestoneResponse(BaseModel):
    id: int
    title: str
    description: str
    progress: float

class ProgressResponse(BaseModel):
    overall: OverallProgress
    courses: List[CourseProgress]
    recentActivities: List[ActivityResponse]
    milestones: List[MilestoneResponse]

class ActivityCreate(BaseModel):
    student_id: int
    course_id: int
    description: str
    status: str

class MilestoneCreate(BaseModel):
    student_id: int
    title: str
    description: str

class MilestoneUpdate(BaseModel):
    progress: float 