from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
from datetime import datetime
import json
import aiofiles
from dotenv import load_dotenv

from database import get_db
import models
import auth
from utils.logger import log_request, log_audit, api_logger
from utils.file_extractor import FileContentExtractor
from utils.knowledge_processor import KnowledgeProcessor

# Load environment variables
load_dotenv()

# Initialize knowledge processor
knowledge_processor = KnowledgeProcessor(openai_api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

class KnowledgeBaseBase(BaseModel):
    title: str
    content: str
    category: str

class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass

class KnowledgeBase(KnowledgeBaseBase):
    id: int
    created_at: datetime
    owner_id: int
    file_path: Optional[str] = None

    class Config:
        from_attributes = True

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/", response_model=KnowledgeBase)
async def create_knowledge_entry(
    entry: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = models.KnowledgeBase(
        **entry.dict(),
        owner_id=current_user.id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.post("/upload")
@log_request()
@log_audit(action="upload_knowledge", resource_type="knowledge")
async def upload_knowledge(
    request: Request,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Upload a document to the knowledge base."""
    try:
        # Extract content from file
        content = await file.read()
        file_path = f"uploads/knowledge/{file.filename}"
        
        # Save file temporarily
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Extract content and metadata
        extracted_data = FileContentExtractor.extract_content(file_path, "document")
        
        # Process document in knowledge base
        doc_metadata = {
            "id": str(datetime.utcnow().timestamp()),
            "title": file.filename,
            "category": category or "default",
            "content_type": file.content_type,
            "size": len(content),
            "owner_id": current_user.id,
            **extracted_data["metadata"]
        }
        
        processing_result = knowledge_processor.process_document(
            content=extracted_data["content"],
            metadata=doc_metadata
        )
        
        if processing_result is None:
            raise Exception("Failed to process document")
        
        # Create knowledge base entry
        db_entry = models.KnowledgeBase(
            title=file.filename,
            content=extracted_data["content"],
            category=category or "default",
            file_path=file_path,
            owner_id=current_user.id,
            metadata=json.dumps({
                **doc_metadata,
                "doc_ids": processing_result["doc_ids"],
                "chunk_count": processing_result["chunk_count"]
            })
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        
        # Clean up temporary file
        os.remove(file_path)
        
        return {
            "id": db_entry.id,
            "title": db_entry.title,
            "category": db_entry.category,
            "chunk_count": processing_result["chunk_count"],
            "metadata": doc_metadata
        }
        
    except Exception as e:
        api_logger.error(f"Knowledge upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload knowledge: {str(e)}"
        )

@router.get("/", response_model=List[KnowledgeBase])
async def read_knowledge_entries(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.KnowledgeBase).filter(
        models.KnowledgeBase.owner_id == current_user.id
    )
    if category:
        query = query.filter(models.KnowledgeBase.category == category)
    entries = query.offset(skip).limit(limit).all()
    return entries

@router.get("/{entry_id}", response_model=KnowledgeBase)
async def read_knowledge_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    entry = db.query(models.KnowledgeBase).filter(
        models.KnowledgeBase.id == entry_id,
        models.KnowledgeBase.owner_id == current_user.id
    ).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.put("/{entry_id}", response_model=KnowledgeBase)
async def update_knowledge_entry(
    entry_id: int,
    entry: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = db.query(models.KnowledgeBase).filter(
        models.KnowledgeBase.id == entry_id,
        models.KnowledgeBase.owner_id == current_user.id
    ).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    for key, value in entry.dict().items():
        setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}")
async def delete_knowledge_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_entry = db.query(models.KnowledgeBase).filter(
        models.KnowledgeBase.id == entry_id,
        models.KnowledgeBase.owner_id == current_user.id
    ).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Delete associated file if exists
    if db_entry.file_path and os.path.exists(db_entry.file_path):
        os.remove(db_entry.file_path)
    
    db.delete(db_entry)
    db.commit()
    return {"message": "Entry deleted successfully"}

@router.get("/search")
@log_request()
async def search_knowledge(
    query: str,
    category: Optional[str] = None,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Search the knowledge base."""
    try:
        results = knowledge_processor.search_knowledge(
            query=query,
            category=category,
            limit=limit
        )
        
        return results
        
    except Exception as e:
        api_logger.error(f"Knowledge search failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.post("/chat")
@log_request()
async def chat_with_knowledge(
    request: Request,
    query: str,
    conversation_id: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Chat with the knowledge base."""
    try:
        response = knowledge_processor.chat_with_knowledge(
            query=query,
            conversation_id=conversation_id,
            category=category
        )
        
        return response
        
    except Exception as e:
        api_logger.error(f"Knowledge chat failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )

@router.delete("/{knowledge_id}")
@log_request()
@log_audit(action="delete_knowledge", resource_type="knowledge")
async def delete_knowledge(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Delete a knowledge base entry."""
    try:
        entry = db.query(models.KnowledgeBase).filter(
            models.KnowledgeBase.id == knowledge_id,
            models.KnowledgeBase.owner_id == current_user.id
        ).first()
        
        if entry is None:
            raise HTTPException(status_code=404, detail="Knowledge entry not found")
        
        # Delete from ChromaDB
        metadata = json.loads(entry.metadata)
        if "doc_ids" in metadata:
            knowledge_processor.delete_knowledge(
                doc_ids=metadata["doc_ids"],
                category=entry.category
            )
        
        # Delete physical file
        if entry.file_path and os.path.exists(entry.file_path):
            os.remove(entry.file_path)
        
        # Delete database entry
        db.delete(entry)
        db.commit()
        
        return {"message": "Knowledge entry deleted successfully"}
        
    except Exception as e:
        api_logger.error(f"Knowledge deletion failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete knowledge: {str(e)}"
        )

@router.post("/create")
async def create_knowledge_base(
    collection_name: str,
    current_user = Depends(auth.get_current_user)
):
    """Create a new knowledge base instance."""
    if collection_name in knowledge_processors:
        raise HTTPException(status_code=400, detail="Knowledge base already exists")
    
    processor = KnowledgeProcessor.create_knowledge_base(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        collection_name=collection_name
    )
    knowledge_processors[collection_name] = processor
    
    return {"message": f"Knowledge base '{collection_name}' created successfully"}

@router.get("/list")
async def list_knowledge_bases(
    current_user = Depends(auth.get_current_user)
):
    """List all available knowledge bases."""
    return {
        "knowledge_bases": [
            {
                "name": name,
                "stats": processor.get_collection_stats()
            }
            for name, processor in knowledge_processors.items()
        ]
    }

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    collection_name: str = Form("default"),
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file to a specific knowledge base."""
    if collection_name not in knowledge_processors:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    processor = knowledge_processors[collection_name]
    
    try:
        # 保存文件
        file_path = f"uploads/{file.filename}"
        os.makedirs("uploads", exist_ok=True)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # 提取文件内容
        content = file_extractor.extract_content(file_path)
        
        # 处理文档
        metadata = {
            "title": file.filename,
            "category": category,
            "created_at": datetime.now().isoformat(),
            "owner_id": current_user.id
        }
        
        processor.process_document(content, metadata)
        
        # 保存到数据库
        knowledge_entry = models.KnowledgeBase(
            title=file.filename,
            content=content,
            category=category,
            file_path=file_path,
            owner_id=current_user.id,
            metadata=json.dumps(metadata)
        )
        db.add(knowledge_entry)
        db.commit()
        
        return {"message": "File processed and added to knowledge base successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_knowledge(
    query: str,
    category: Optional[str] = None,
    collection_name: str = "default",
    limit: int = 5,
    current_user = Depends(auth.get_current_user)
):
    """Search in a specific knowledge base."""
    if collection_name not in knowledge_processors:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    processor = knowledge_processors[collection_name]
    
    try:
        results = processor.search_knowledge(query, category, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_knowledge(
    request: Request,
    collection_name: str = "default",
    current_user = Depends(auth.get_current_user)
):
    """Chat with a specific knowledge base."""
    if collection_name not in knowledge_processors:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    processor = knowledge_processors[collection_name]
    
    try:
        data = await request.json()
        query = data.get("query")
        conversation_id = data.get("conversation_id")
        
        if not query or not conversation_id:
            raise HTTPException(status_code=400, detail="Missing query or conversation_id")
        
        response = processor.chat_with_knowledge(query, conversation_id)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{knowledge_id}")
async def delete_knowledge(
    knowledge_id: int,
    collection_name: str = "default",
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a knowledge base entry."""
    if collection_name not in knowledge_processors:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    processor = knowledge_processors[collection_name]
    
    try:
        # 获取知识库条目
        knowledge = db.query(models.KnowledgeBase).filter(
            models.KnowledgeBase.id == knowledge_id,
            models.KnowledgeBase.owner_id == current_user.id
        ).first()
        
        if not knowledge:
            raise HTTPException(status_code=404, detail="Knowledge entry not found")
        
        # 删除文件
        if os.path.exists(knowledge.file_path):
            os.remove(knowledge.file_path)
        
        # 从向量存储中删除
        metadata = json.loads(knowledge.metadata)
        processor.delete_knowledge([str(knowledge_id)], metadata.get("category"))
        
        # 从数据库中删除
        db.delete(knowledge)
        db.commit()
        
        return {"message": "Knowledge entry deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 