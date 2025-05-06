from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChecklistItemBase(BaseModel):
    title: str
    description: str
    category: str
    deadline: Optional[datetime] = None

class ChecklistItemCreate(ChecklistItemBase):
    pass

class ChecklistItemResponse(ChecklistItemBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InterviewQuestionBase(BaseModel):
    question: str
    answer: str
    category: str
    difficulty: str

class InterviewQuestionCreate(InterviewQuestionBase):
    interview_id: int

class InterviewQuestionResponse(InterviewQuestionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MockInterviewBase(BaseModel):
    title: str
    description: str
    level: str
    duration: int
    preparation_steps: str
    interview_url: str

class MockInterviewCreate(MockInterviewBase):
    pass

class MockInterviewResponse(MockInterviewBase):
    id: int
    created_at: datetime
    updated_at: datetime
    questions: List[InterviewQuestionResponse]

    class Config:
        from_attributes = True

class InterviewFeedbackBase(BaseModel):
    rating: int
    feedback: str
    strengths: str
    weaknesses: str

class InterviewFeedbackCreate(InterviewFeedbackBase):
    interview_id: int

class InterviewFeedbackResponse(InterviewFeedbackBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationStatusBase(BaseModel):
    status: str
    current_step: str
    next_deadline: datetime
    completed_steps: str
    pending_steps: str

class ApplicationStatusCreate(ApplicationStatusBase):
    user_id: int

class ApplicationStatusResponse(ApplicationStatusBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 