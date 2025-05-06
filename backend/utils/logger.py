import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path
import traceback
from functools import wraps

# 创建日志目录
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# 日志格式
class CustomFormatter(logging.Formatter):
    def format(self, record):
        # 添加时间戳
        record.timestamp = datetime.utcnow().isoformat()
        
        # 格式化异常信息
        if record.exc_info:
            record.exc_text = ''.join(traceback.format_exception(*record.exc_info))
        
        # 格式化日志消息
        if isinstance(record.msg, (dict, list)):
            record.msg = json.dumps(record.msg, ensure_ascii=False)
        
        return super().format(record)

# 日志配置
def setup_logger(name: str, log_file: str, level=logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # 文件处理器
    file_handler = logging.FileHandler(
        LOG_DIR / log_file,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # 设置格式
    formatter = CustomFormatter(
        '%(timestamp)s [%(levelname)s] %(name)s: %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # 添加处理器
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# 创建日志记录器
api_logger = setup_logger('api', 'api.log')
error_logger = setup_logger('error', 'error.log', logging.ERROR)
audit_logger = setup_logger('audit', 'audit.log')

# 请求日志装饰器
def log_request(logger: logging.Logger = api_logger):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取请求信息
            request = kwargs.get('request')
            if request:
                request_info = {
                    'method': request.method,
                    'url': str(request.url),
                    'client': request.client.host if request.client else None,
                    'headers': dict(request.headers),
                    'query_params': dict(request.query_params),
                    'path_params': kwargs.get('path_params', {}),
                }
                
                # 记录请求开始
                logger.info(f"Request started: {json.dumps(request_info, ensure_ascii=False)}")
                
                try:
                    # 执行请求处理
                    start_time = datetime.utcnow()
                    response = await func(*args, **kwargs)
                    end_time = datetime.utcnow()
                    
                    # 计算处理时间
                    process_time = (end_time - start_time).total_seconds()
                    
                    # 记录响应信息
                    response_info = {
                        'status_code': getattr(response, 'status_code', 200),
                        'process_time': f"{process_time:.3f}s",
                    }
                    logger.info(f"Request completed: {json.dumps(response_info, ensure_ascii=False)}")
                    
                    return response
                    
                except Exception as e:
                    # 记录错误信息
                    error_info = {
                        'error': str(e),
                        'traceback': traceback.format_exc(),
                    }
                    error_logger.error(f"Request failed: {json.dumps(error_info, ensure_ascii=False)}")
                    raise
                    
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# 审计日志装饰器
def log_audit(action: str, resource_type: str, logger: logging.Logger = audit_logger):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取用户信息
            current_user = kwargs.get('current_user')
            user_info = {
                'user_id': getattr(current_user, 'id', None),
                'username': getattr(current_user, 'username', None),
            }
            
            # 记录审计信息
            audit_info = {
                'action': action,
                'resource_type': resource_type,
                'user': user_info,
                'timestamp': datetime.utcnow().isoformat(),
            }
            
            try:
                # 执行操作
                result = await func(*args, **kwargs)
                
                # 记录成功信息
                audit_info['status'] = 'success'
                if isinstance(result, dict):
                    audit_info['details'] = result
                logger.info(f"Audit log: {json.dumps(audit_info, ensure_ascii=False)}")
                
                return result
                
            except Exception as e:
                # 记录失败信息
                audit_info['status'] = 'failed'
                audit_info['error'] = str(e)
                logger.error(f"Audit log: {json.dumps(audit_info, ensure_ascii=False)}")
                raise
                
        return wrapper
    return decorator

# 错误日志记录
def log_error(error: Exception, context: Optional[Dict[str, Any]] = None):
    error_info = {
        'error': str(error),
        'type': type(error).__name__,
        'traceback': traceback.format_exc(),
        'context': context or {},
        'timestamp': datetime.utcnow().isoformat(),
    }
    error_logger.error(f"Error occurred: {json.dumps(error_info, ensure_ascii=False)}") 