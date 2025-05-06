from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
from datetime import datetime
import aiofiles
import json
from dotenv import load_dotenv

from database import get_db
import models
import auth
from utils.logger import log_request, log_audit, api_logger
from utils.file_extractor import FileContentExtractor
from utils.embedding_processor import EmbeddingProcessor

# Load environment variables
load_dotenv()

# Initialize embedding processor
embedding_processor = EmbeddingProcessor(openai_api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

# Create upload directories
UPLOAD_DIR = "uploads"
MEDIA_DIR = os.path.join(UPLOAD_DIR, "media")
AUDIO_DIR = os.path.join(MEDIA_DIR, "audio")
IMAGE_DIR = os.path.join(MEDIA_DIR, "images")
DOCUMENT_DIR = os.path.join(MEDIA_DIR, "documents")

for directory in [MEDIA_DIR, AUDIO_DIR, IMAGE_DIR, DOCUMENT_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

def get_file_type(file: UploadFile) -> str:
    content_type = file.content_type
    if content_type in ALLOWED_IMAGE_TYPES:
        return "image"
    elif content_type in ALLOWED_AUDIO_TYPES:
        return "audio"
    elif content_type in ALLOWED_DOCUMENT_TYPES:
        return "document"
    else:
        return "unknown"

@router.post("/upload")
@log_request()
@log_audit(action="upload_file", resource_type="media")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # 记录文件信息
    file_info = {
        'filename': file.filename,
        'content_type': file.content_type,
        'size': file.size if hasattr(file, 'size') else 'unknown',
        'category': category,
    }
    api_logger.info(f"File upload started: {json.dumps(file_info, ensure_ascii=False)}")
    
    # Validate file type
    file_type = get_file_type(file)
    if file_type == "unknown":
        error_msg = f"Unsupported file type: {file.content_type}"
        api_logger.error(error_msg)
        raise HTTPException(
            status_code=400,
            detail=error_msg
        )
    
    # Determine upload directory
    if file_type == "image":
        upload_dir = IMAGE_DIR
    elif file_type == "audio":
        upload_dir = AUDIO_DIR
    else:
        upload_dir = DOCUMENT_DIR
    
    # Create category subdirectory if specified
    if category:
        upload_dir = os.path.join(upload_dir, category)
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    
    try:
        # Save file
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Extract content and metadata
        extracted_data = FileContentExtractor.extract_content(file_path, file_type)
        
        # Generate embeddings
        embedding_data = embedding_processor.process_file(
            file_path=file_path,
            file_type=file_type,
            metadata={
                "title": file.filename,
                "category": category or file_type,
                "content_type": file.content_type,
                "size": file.size if hasattr(file, 'size') else 0,
                "owner_id": current_user.id,
                **extracted_data["metadata"]
            }
        )
        
        if embedding_data is None:
            raise Exception("Failed to generate embeddings")
        
        # Create knowledge base entry
        db_entry = models.KnowledgeBase(
            title=file.filename,
            content=extracted_data["content"],
            category=category or file_type,
            file_path=file_path,
            owner_id=current_user.id,
            metadata=json.dumps({
                **extracted_data["metadata"],
                "embedding_id": embedding_data["doc_id"]
            })
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        
        # 记录上传成功
        success_info = {
            'file_path': file_path,
            'knowledge_base_id': db_entry.id,
            'file_type': file_type,
            'content_length': len(extracted_data["content"]),
            'metadata': extracted_data["metadata"],
            'embedding_id': embedding_data["doc_id"]
        }
        api_logger.info(f"File upload completed: {json.dumps(success_info, ensure_ascii=False)}")
        
        return {
            "filename": file.filename,
            "file_type": file_type,
            "path": file_path,
            "knowledge_base_id": db_entry.id,
            "content_length": len(extracted_data["content"]),
            "metadata": extracted_data["metadata"],
            "embedding_id": embedding_data["doc_id"]
        }
        
    except Exception as e:
        # 记录上传失败
        error_info = {
            'error': str(e),
            'file_info': file_info,
        }
        api_logger.error(f"File upload failed: {json.dumps(error_info, ensure_ascii=False)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/files")
async def list_files(
    file_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.KnowledgeBase).filter(
        models.KnowledgeBase.owner_id == current_user.id
    )
    
    if file_type:
        query = query.filter(models.KnowledgeBase.category == file_type)
    if category:
        query = query.filter(models.KnowledgeBase.category == category)
    
    entries = query.all()
    
    return [
        {
            "id": entry.id,
            "title": entry.title,
            "category": entry.category,
            "file_path": entry.file_path,
            "created_at": entry.created_at
        }
        for entry in entries
    ]

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    entry = db.query(models.KnowledgeBase).filter(
        models.KnowledgeBase.id == file_id,
        models.KnowledgeBase.owner_id == current_user.id
    ).first()
    
    if entry is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    if entry.file_path and os.path.exists(entry.file_path):
        os.remove(entry.file_path)
    
    # Delete database entry
    db.delete(entry)
    db.commit()
    
    return {"message": "File deleted successfully"}

@router.get("/categories")
async def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Get unique categories from user's files
    categories = db.query(models.KnowledgeBase.category).filter(
        models.KnowledgeBase.owner_id == current_user.id
    ).distinct().all()
    
    return [category[0] for category in categories]

@router.get("/search")
async def search_files(
    query: str,
    file_type: Optional[str] = None,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Search for files using semantic search."""
    try:
        # Search for similar files
        results = embedding_processor.search_similar(
            query=query,
            file_type=file_type,
            limit=limit
        )
        
        # Get additional information from database
        file_ids = [result["metadata"]["file_path"] for result in results]
        db_entries = db.query(models.KnowledgeBase).filter(
            models.KnowledgeBase.file_path.in_(file_ids),
            models.KnowledgeBase.owner_id == current_user.id
        ).all()
        
        # Combine results
        combined_results = []
        for result in results:
            db_entry = next(
                (entry for entry in db_entries if entry.file_path == result["metadata"]["file_path"]),
                None
            )
            if db_entry:
                combined_results.append({
                    "id": db_entry.id,
                    "title": db_entry.title,
                    "category": db_entry.category,
                    "file_path": db_entry.file_path,
                    "content": db_entry.content,
                    "metadata": json.loads(db_entry.metadata),
                    "similarity_score": result.get("similarity", 0)
                })
        
        return combined_results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        ) 