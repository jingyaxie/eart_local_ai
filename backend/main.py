from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import time
from typing import Callable

from database import engine, Base
from routes import auth, users, files, courses, notifications, permissions, learning, visa, chatbot, platform
from utils.permission_utils import initialize_permissions
from utils.logger import api_logger, error_logger, log_error

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    Base.metadata.create_all(bind=engine)
    initialize_permissions()
    api_logger.info("Application startup")
    yield
    # Cleanup on shutdown
    api_logger.info("Application shutdown")
    pass

app = FastAPI(
    title="AI-Assisted Course System",
    description="An intelligent system for course learning, portfolio creation, and application processes",
    version="1.0.0",
    lifespan=lifespan
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # 记录错误日志
    log_error(exc, {
        'path': request.url.path,
        'method': request.method,
        'client': request.client.host if request.client else None,
    })
    
    # 返回错误响应
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc)
        }
    )

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable) -> Response:
    # 记录请求开始
    start_time = time.time()
    
    # 记录请求信息
    request_info = {
        'method': request.method,
        'url': str(request.url),
        'client': request.client.host if request.client else None,
        'headers': dict(request.headers),
    }
    api_logger.info(f"Request started: {request_info}")
    
    try:
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 记录响应信息
        response_info = {
            'status_code': response.status_code,
            'process_time': f"{process_time:.3f}s",
        }
        api_logger.info(f"Request completed: {response_info}")
        
        return response
        
    except Exception as e:
        # 记录错误信息
        error_info = {
            'error': str(e),
            'process_time': f"{time.time() - start_time:.3f}s",
        }
        error_logger.error(f"Request failed: {error_info}")
        raise

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(files.router, prefix="/api/files", tags=["文件"])
app.include_router(courses.router, prefix="/api/courses", tags=["课程"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["通知"])
app.include_router(permissions.router, prefix="/api/permissions", tags=["权限"])
app.include_router(learning.router, prefix="/api/learning", tags=["学习进度"])
app.include_router(visa.router, prefix="/api/visa", tags=["签证流程"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["学习助手"])
app.include_router(platform.router, prefix="/api/platform", tags=["平台集成"])

@app.get("/")
async def root():
    return JSONResponse(
        content={
            "message": "Welcome to AI-Assisted Course System API",
            "status": "operational"
        }
    )

@app.get("/health")
async def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "timestamp": time.time()
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 