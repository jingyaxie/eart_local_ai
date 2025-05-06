from functools import lru_cache
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import models
from datetime import datetime

# 预定义的权限配置
PERMISSIONS = {
    'admin': ['*'],  # 管理员拥有所有权限
    'teacher': [
        'view_courses',
        'edit_courses',
        'view_students',
        'manage_assignments',
        'grade_assignments',
        'view_analytics'
    ],
    'student': [
        'view_courses',
        'view_materials',
        'submit_assignments',
        'view_grades',
        'view_progress'
    ]
}

@lru_cache(maxsize=1000)
def get_user_permissions(user_id: int, db: Session) -> List[str]:
    """获取用户所有权限"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return []
    
    # 如果是管理员，返回所有权限
    if user.is_admin:
        return ['*']
    
    # 获取用户所有角色的权限
    permissions = set()
    for role in user.roles:
        for permission in role.permissions:
            permissions.add(f"{permission.resource_type}:{permission.action}")
    
    return list(permissions)

def check_permission(
    required_permission: str,
    user_id: int,
    db: Session,
    resource_id: Optional[int] = None,
    resource_type: Optional[str] = None
) -> bool:
    """检查用户是否有指定权限"""
    user_permissions = get_user_permissions(user_id, db)
    
    # 如果有通配符权限，直接返回True
    if '*' in user_permissions:
        return True
    
    # 检查具体权限
    if required_permission in user_permissions:
        # 如果是资源相关的权限，检查资源权限
        if resource_id and resource_type:
            return check_resource_permission(
                user_id,
                resource_id,
                resource_type,
                required_permission,
                db
            )
        return True
    
    return False

def check_resource_permission(
    user_id: int,
    resource_id: int,
    resource_type: str,
    permission: str,
    db: Session
) -> bool:
    """检查用户对特定资源的权限"""
    if resource_type == 'file':
        file_permission = db.query(models.FilePermission).filter(
            models.FilePermission.file_id == resource_id,
            models.FilePermission.user_id == user_id
        ).first()
        
        if file_permission:
            return permission in file_permission.permission_type.split(',')
    
    return False

def log_permission_action(
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: int,
    db: Session,
    details: dict = None,
    ip_address: str = None
):
    """记录权限操作日志"""
    log = models.PermissionAuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()

def require_permission(permission: str):
    """权限检查装饰器"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            db = kwargs.get('db')
            current_user = kwargs.get('current_user')
            resource_id = kwargs.get('resource_id')
            resource_type = kwargs.get('resource_type')
            
            if not check_permission(
                permission,
                current_user.id,
                db,
                resource_id,
                resource_type
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="权限不足"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def initialize_permissions(db: Session):
    """初始化系统权限"""
    # 创建基本角色
    roles = {
        'admin': '系统管理员',
        'teacher': '教师',
        'student': '学生'
    }
    
    for role_name, description in roles.items():
        role = db.query(models.Role).filter(models.Role.name == role_name).first()
        if not role:
            role = models.Role(name=role_name, description=description)
            db.add(role)
    
    db.commit()
    
    # 创建基本权限
    permissions = [
        ('view_courses', '查看课程', 'course', 'read'),
        ('edit_courses', '编辑课程', 'course', 'write'),
        ('view_students', '查看学生', 'student', 'read'),
        ('manage_assignments', '管理作业', 'assignment', 'write'),
        ('grade_assignments', '评分作业', 'assignment', 'grade'),
        ('view_analytics', '查看分析', 'analytics', 'read'),
        ('submit_assignments', '提交作业', 'assignment', 'submit'),
        ('view_grades', '查看成绩', 'grade', 'read'),
        ('view_progress', '查看进度', 'progress', 'read')
    ]
    
    for name, description, resource_type, action in permissions:
        permission = db.query(models.Permission).filter(
            models.Permission.name == name
        ).first()
        if not permission:
            permission = models.Permission(
                name=name,
                description=description,
                resource_type=resource_type,
                action=action
            )
            db.add(permission)
    
    db.commit()
    
    # 为角色分配权限
    for role_name, permission_list in PERMISSIONS.items():
        role = db.query(models.Role).filter(models.Role.name == role_name).first()
        if role:
            for permission_name in permission_list:
                if permission_name == '*':
                    # 为管理员分配所有权限
                    permissions = db.query(models.Permission).all()
                    role.permissions.extend(permissions)
                else:
                    permission = db.query(models.Permission).filter(
                        models.Permission.name == permission_name
                    ).first()
                    if permission and permission not in role.permissions:
                        role.permissions.append(permission)
    
    db.commit() 