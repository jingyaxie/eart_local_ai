from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from utils.permission_utils import require_permission, log_permission_action
from auth import get_current_active_user

router = APIRouter()

# 请求和响应模型
class RoleBase(BaseModel):
    name: str
    description: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PermissionBase(BaseModel):
    name: str
    description: str
    resource_type: str
    action: str

class PermissionCreate(PermissionBase):
    pass

class Permission(PermissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserRoleCreate(BaseModel):
    user_id: int
    role_id: int

class FilePermissionCreate(BaseModel):
    file_id: int
    user_id: int
    permission_type: str

# 角色管理路由
@router.post("/roles", response_model=Role)
@require_permission("manage_roles")
async def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """创建新角色"""
    db_role = models.Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    
    log_permission_action(
        current_user.id,
        "create_role",
        "role",
        db_role.id,
        db
    )
    
    return db_role

@router.get("/roles", response_model=List[Role])
@require_permission("view_roles")
async def get_roles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """获取所有角色"""
    return db.query(models.Role).all()

@router.put("/roles/{role_id}", response_model=Role)
@require_permission("manage_roles")
async def update_role(
    role_id: int,
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """更新角色"""
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="角色不存在")
    
    for key, value in role.dict().items():
        setattr(db_role, key, value)
    
    db.commit()
    db.refresh(db_role)
    
    log_permission_action(
        current_user.id,
        "update_role",
        "role",
        role_id,
        db
    )
    
    return db_role

# 权限管理路由
@router.post("/permissions", response_model=Permission)
@require_permission("manage_permissions")
async def create_permission(
    permission: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """创建新权限"""
    db_permission = models.Permission(**permission.dict())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    
    log_permission_action(
        current_user.id,
        "create_permission",
        "permission",
        db_permission.id,
        db
    )
    
    return db_permission

@router.get("/permissions", response_model=List[Permission])
@require_permission("view_permissions")
async def get_permissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """获取所有权限"""
    return db.query(models.Permission).all()

# 用户角色管理路由
@router.post("/user-roles")
@require_permission("manage_user_roles")
async def assign_role_to_user(
    user_role: UserRoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """为用户分配角色"""
    # 检查用户和角色是否存在
    user = db.query(models.User).filter(models.User.id == user_role.user_id).first()
    role = db.query(models.Role).filter(models.Role.id == user_role.role_id).first()
    
    if not user or not role:
        raise HTTPException(status_code=404, detail="用户或角色不存在")
    
    # 检查是否已经分配了该角色
    existing_role = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_role.user_id,
        models.UserRole.role_id == user_role.role_id
    ).first()
    
    if existing_role:
        raise HTTPException(status_code=400, detail="用户已拥有该角色")
    
    # 创建新的用户角色关联
    db_user_role = models.UserRole(**user_role.dict())
    db.add(db_user_role)
    db.commit()
    
    log_permission_action(
        current_user.id,
        "assign_role",
        "user_role",
        db_user_role.id,
        db
    )
    
    return {"message": "角色分配成功"}

@router.delete("/user-roles/{user_id}/{role_id}")
@require_permission("manage_user_roles")
async def remove_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """移除用户的角色"""
    user_role = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if not user_role:
        raise HTTPException(status_code=404, detail="用户角色关联不存在")
    
    db.delete(user_role)
    db.commit()
    
    log_permission_action(
        current_user.id,
        "remove_role",
        "user_role",
        user_role.id,
        db
    )
    
    return {"message": "角色移除成功"}

# 文件权限管理路由
@router.post("/file-permissions")
@require_permission("manage_file_permissions")
async def create_file_permission(
    file_permission: FilePermissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """创建文件权限"""
    # 检查用户和文件是否存在
    user = db.query(models.User).filter(models.User.id == file_permission.user_id).first()
    file = db.query(models.File).filter(models.File.id == file_permission.file_id).first()
    
    if not user or not file:
        raise HTTPException(status_code=404, detail="用户或文件不存在")
    
    # 检查是否已经存在权限
    existing_permission = db.query(models.FilePermission).filter(
        models.FilePermission.file_id == file_permission.file_id,
        models.FilePermission.user_id == file_permission.user_id
    ).first()
    
    if existing_permission:
        # 更新现有权限
        existing_permission.permission_type = file_permission.permission_type
        db.commit()
        db.refresh(existing_permission)
        
        log_permission_action(
            current_user.id,
            "update_file_permission",
            "file_permission",
            existing_permission.id,
            db
        )
        
        return existing_permission
    
    # 创建新的文件权限
    db_file_permission = models.FilePermission(**file_permission.dict())
    db.add(db_file_permission)
    db.commit()
    db.refresh(db_file_permission)
    
    log_permission_action(
        current_user.id,
        "create_file_permission",
        "file_permission",
        db_file_permission.id,
        db
    )
    
    return db_file_permission

@router.get("/file-permissions/{file_id}")
@require_permission("view_file_permissions")
async def get_file_permissions(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """获取文件的所有权限"""
    return db.query(models.FilePermission).filter(
        models.FilePermission.file_id == file_id
    ).all()

@router.delete("/file-permissions/{file_id}/{user_id}")
@require_permission("manage_file_permissions")
async def delete_file_permission(
    file_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """删除文件权限"""
    file_permission = db.query(models.FilePermission).filter(
        models.FilePermission.file_id == file_id,
        models.FilePermission.user_id == user_id
    ).first()
    
    if not file_permission:
        raise HTTPException(status_code=404, detail="文件权限不存在")
    
    db.delete(file_permission)
    db.commit()
    
    log_permission_action(
        current_user.id,
        "delete_file_permission",
        "file_permission",
        file_permission.id,
        db
    )
    
    return {"message": "文件权限删除成功"} 