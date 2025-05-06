from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
import auth

router = APIRouter()

class ChecklistItem(BaseModel):
    name: str
    status: str  # "pending", "completed", "in_progress"
    notes: Optional[str] = None

class ApplicationChecklistBase(BaseModel):
    school_name: str
    checklist_items: List[ChecklistItem]
    visa_requirements: Optional[List[ChecklistItem]] = None

class ApplicationChecklistCreate(ApplicationChecklistBase):
    pass

class ApplicationChecklist(ApplicationChecklistBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=ApplicationChecklist)
async def create_checklist(
    checklist: ApplicationChecklistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = models.ApplicationChecklist(
        school_name=checklist.school_name,
        checklist_items=[item.dict() for item in checklist.checklist_items],
        visa_requirements=[item.dict() for item in checklist.visa_requirements] if checklist.visa_requirements else None,
        user_id=current_user.id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/", response_model=List[ApplicationChecklist])
async def read_checklists(
    skip: int = 0,
    limit: int = 100,
    school_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.ApplicationChecklist).filter(
        models.ApplicationChecklist.user_id == current_user.id
    )
    if school_name:
        query = query.filter(models.ApplicationChecklist.school_name == school_name)
    entries = query.offset(skip).limit(limit).all()
    return entries

@router.get("/{checklist_id}", response_model=ApplicationChecklist)
async def read_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    entry = db.query(models.ApplicationChecklist).filter(
        models.ApplicationChecklist.id == checklist_id,
        models.ApplicationChecklist.user_id == current_user.id
    ).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return entry

@router.put("/{checklist_id}", response_model=ApplicationChecklist)
async def update_checklist(
    checklist_id: int,
    checklist: ApplicationChecklistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = db.query(models.ApplicationChecklist).filter(
        models.ApplicationChecklist.id == checklist_id,
        models.ApplicationChecklist.user_id == current_user.id
    ).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    db_entry.school_name = checklist.school_name
    db_entry.checklist_items = [item.dict() for item in checklist.checklist_items]
    db_entry.visa_requirements = [item.dict() for item in checklist.visa_requirements] if checklist.visa_requirements else None
    db_entry.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{checklist_id}")
async def delete_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = db.query(models.ApplicationChecklist).filter(
        models.ApplicationChecklist.id == checklist_id,
        models.ApplicationChecklist.user_id == current_user.id
    ).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    db.delete(db_entry)
    db.commit()
    return {"message": "Checklist deleted successfully"}

@router.get("/stats/summary")
async def get_checklist_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Get all checklists for the user
    entries = db.query(models.ApplicationChecklist).filter(
        models.ApplicationChecklist.user_id == current_user.id
    ).all()
    
    # Calculate statistics
    total_schools = len(entries)
    total_items = 0
    completed_items = 0
    school_stats = {}
    
    for entry in entries:
        school_stats[entry.school_name] = {
            "total_items": len(entry.checklist_items),
            "completed_items": sum(1 for item in entry.checklist_items if item["status"] == "completed"),
            "visa_items": len(entry.visa_requirements) if entry.visa_requirements else 0
        }
        total_items += len(entry.checklist_items)
        completed_items += school_stats[entry.school_name]["completed_items"]
    
    return {
        "total_schools": total_schools,
        "total_items": total_items,
        "completed_items": completed_items,
        "completion_rate": (completed_items / total_items * 100) if total_items > 0 else 0,
        "school_statistics": school_stats
    } 