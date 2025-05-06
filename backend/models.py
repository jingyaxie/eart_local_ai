from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# 角色-权限关联表
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id')),
    Column('permission_id', Integer, ForeignKey('permissions.id'))
)

class Role(Base):
    """角色模型"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    users = relationship("User", secondary="user_roles", back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    """权限模型"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200))
    resource_type = Column(String(50))  # 资源类型(如:file, course等)
    action = Column(String(50))  # 操作类型(如:read, write等)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class UserRole(Base):
    """用户-角色关联表"""
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class FilePermission(Base):
    """文件权限模型"""
    __tablename__ = "file_permissions"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    permission_type = Column(String(20))  # read, write, delete, share
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PermissionAuditLog(Base):
    """权限审计日志模型"""
    __tablename__ = "permission_audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50))  # 操作类型
    resource_type = Column(String(50))  # 资源类型
    resource_id = Column(Integer)  # 资源ID
    details = Column(JSON)  # 详细信息
    ip_address = Column(String(50))  # IP地址
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # 关联
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    knowledge_base = relationship("KnowledgeBase", back_populates="owner")
    portfolio_progress = relationship("PortfolioProgress", back_populates="student")
    chat_history = relationship("ChatHistory", back_populates="user")
    file_permissions = relationship("FilePermission", back_populates="user")
    audit_logs = relationship("PermissionAuditLog", back_populates="user")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    category = Column(String, index=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    metadata = Column(JSON, nullable=True)  # Store file metadata as JSON
    
    # Relationships
    owner = relationship("User", back_populates="knowledge_base")

class PortfolioProgress(Base):
    __tablename__ = "portfolio_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    project_name = Column(String, index=True)
    status = Column(String)  # e.g., "planning", "in_progress", "completed"
    feedback = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("User", back_populates="portfolio_progress")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    agent_type = Column(String)  # e.g., "course_qa", "portfolio", "visa"
    
    # Relationships
    user = relationship("User", back_populates="chat_history")

class ApplicationChecklist(Base):
    __tablename__ = "application_checklist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    school_name = Column(String, index=True)
    checklist_items = Column(JSON)  # List of required items and their status
    visa_requirements = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CourseSummary(Base):
    __tablename__ = "course_summaries"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, index=True)
    summary_content = Column(Text)
    homework_requirements = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    audio_file_path = Column(String, nullable=True)
    transcription = Column(Text, nullable=True) 