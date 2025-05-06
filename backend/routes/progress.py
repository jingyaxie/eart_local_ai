from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
import auth

router = APIRouter()

class PortfolioProgressBase(BaseModel):
    project_name: str
    status: str
    feedback: Optional[str] = None

class PortfolioProgressCreate(PortfolioProgressBase):
    pass

class PortfolioProgress(PortfolioProgressBase):
    id: int
    student_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=PortfolioProgress)
async def create_progress_entry(
    entry: PortfolioProgressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = models.PortfolioProgress(
        **entry.dict(),
        student_id=current_user.id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/", response_model=List[PortfolioProgress])
async def read_progress_entries(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.PortfolioProgress).filter(
        models.PortfolioProgress.student_id == current_user.id
    )
    if status:
        query = query.filter(models.PortfolioProgress.status == status)
    entries = query.offset(skip).limit(limit).all()
    return entries

@router.get("/{entry_id}", response_model=PortfolioProgress)
async def read_progress_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    entry = db.query(models.PortfolioProgress).filter(
        models.PortfolioProgress.id == entry_id,
        models.PortfolioProgress.student_id == current_user.id
    ).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.put("/{entry_id}", response_model=PortfolioProgress)
async def update_progress_entry(
    entry_id: int,
    entry: PortfolioProgressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = db.query(models.PortfolioProgress).filter(
        models.PortfolioProgress.id == entry_id,
        models.PortfolioProgress.student_id == current_user.id
    ).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    for key, value in entry.dict().items():
        setattr(db_entry, key, value)
    
    db_entry.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}")
async def delete_progress_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = db.query(models.PortfolioProgress).filter(
        models.PortfolioProgress.id == entry_id,
        models.PortfolioProgress.student_id == current_user.id
    ).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(db_entry)
    db.commit()
    return {"message": "Entry deleted successfully"}

@router.get("/stats/summary")
async def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Get all entries for the user
    entries = db.query(models.PortfolioProgress).filter(
        models.PortfolioProgress.student_id == current_user.id
    ).all()
    
    # Calculate statistics
    total_projects = len(entries)
    status_counts = {}
    for entry in entries:
        status_counts[entry.status] = status_counts.get(entry.status, 0) + 1
    
    # Get recent activity
    recent_entries = db.query(models.PortfolioProgress).filter(
        models.PortfolioProgress.student_id == current_user.id
    ).order_by(models.PortfolioProgress.last_updated.desc()).limit(5).all()
    
    return {
        "total_projects": total_projects,
        "status_distribution": status_counts,
        "recent_activity": [
            {
                "project_name": entry.project_name,
                "status": entry.status,
                "last_updated": entry.last_updated
            }
            for entry in recent_entries
        ]
    } 