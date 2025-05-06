#!/bin/bash

# 设置错误时退出
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 打印带颜色的信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装"
        exit 1
    fi
}

# 检查必要的命令
print_info "检查必要的命令..."
check_command docker
check_command docker-compose
check_command openssl

# 创建必要的目录
print_info "创建必要的目录..."
mkdir -p nginx/ssl
mkdir -p logs
mkdir -p backend/logs

# 生成SSL证书
print_info "生成SSL证书..."
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
    print_info "SSL证书已生成"
else
    print_warning "SSL证书已存在，跳过生成"
fi

# 检查环境变量文件
print_info "检查环境变量文件..."
if [ ! -f .env ]; then
    print_info "创建环境变量文件..."
    cat > .env << EOF
# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@db:5432/ai_course_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ai_course_system

# Redis配置
REDIS_URL=redis://redis:6379/0

# 应用配置
APP_NAME=AI课程系统
APP_ENV=production
APP_DEBUG=false
APP_URL=https://localhost
APP_SECRET_KEY=$(openssl rand -hex 32)

# 后端服务配置
BACKEND_PORT=8000
BACKEND_WORKERS=4
BACKEND_HOST=0.0.0.0

# 前端服务配置
FRONTEND_PORT=80
FRONTEND_HOST=0.0.0.0

# OpenAI配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# 微信小程序配置
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_TOKEN=your-wechat-token
WECHAT_ENCODING_AES_KEY=your-wechat-encoding-aes-key

# Teams配置
TEAMS_APP_ID=your-teams-app-id
TEAMS_APP_SECRET=your-teams-app-secret
TEAMS_TENANT_ID=your-teams-tenant-id

# 邮件服务配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com

# 文件存储配置
STORAGE_TYPE=local
STORAGE_PATH=/app/storage
STORAGE_URL=https://localhost/storage

# 日志配置
LOG_LEVEL=INFO
LOG_PATH=/app/logs
LOG_MAX_SIZE=100MB
LOG_BACKUP_COUNT=10

# 缓存配置
CACHE_TYPE=redis
CACHE_TTL=3600

# 会话配置
SESSION_TYPE=redis
SESSION_TTL=7200

# 安全配置
CORS_ORIGINS=https://localhost
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization
CORS_MAX_AGE=3600

# 监控配置
ENABLE_METRICS=true
METRICS_PORT=9090
PROMETHEUS_ENABLED=true

# 备份配置
BACKUP_PATH=/app/backups
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE="0 2 * * *"

# 系统限制
MAX_UPLOAD_SIZE=50MB
MAX_REQUESTS_PER_MINUTE=100
MAX_CONNECTIONS=1000

# 其他配置
TIMEZONE=Asia/Shanghai
LANGUAGE=zh_CN
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
EOF
    print_warning "请编辑 .env 文件设置必要的环境变量"
    exit 1
fi

# 构建和启动服务
print_info "构建和启动服务..."
docker-compose build
docker-compose up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 10

# 检查服务状态
print_info "检查服务状态..."
docker-compose ps

# 运行数据库迁移
print_info "运行数据库迁移..."
docker-compose exec -T backend alembic upgrade head

# 初始化数据
print_info "初始化数据..."
if [ -f "scripts/init_data.py" ]; then
    docker-compose exec -T backend python scripts/init_data.py
else
    print_warning "初始化脚本不存在，跳过数据初始化"
fi

# 检查服务健康状态
print_info "检查服务健康状态..."
if curl -s http://localhost:8000/health > /dev/null; then
    print_info "后端服务健康检查通过"
else
    print_error "后端服务健康检查失败"
fi

if curl -s http://localhost > /dev/null; then
    print_info "前端服务健康检查通过"
else
    print_error "前端服务健康检查失败"
fi

# 显示部署完成信息
print_info "部署完成！"
print_info "前端访问地址: https://localhost"
print_info "后端API地址: https://localhost/api"
print_info "查看服务日志: docker-compose logs -f" 