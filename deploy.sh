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

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用root权限运行此脚本"
        print_info "请使用: sudo $0"
        exit 1
    fi
}

# 获取服务器IP地址
get_server_ip() {
    # 尝试多种方法获取IP地址
    local ip=""
    
    # 方法1: 获取公网IP
    if command -v curl &> /dev/null; then
        ip=$(curl -s https://api.ipify.org)
    fi
    
    # 方法2: 获取本地IP
    if [ -z "$ip" ]; then
        ip=$(hostname -I | awk '{print $1}')
    fi
    
    # 如果还是获取不到，使用localhost
    if [ -z "$ip" ]; then
        ip="localhost"
    fi
    
    echo "$ip"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_warning "$1 未安装，正在安装..."
        if [ "$1" = "docker" ]; then
            curl -fsSL https://get.docker.com | sh
        elif [ "$1" = "docker-compose" ]; then
            curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
    fi
}

# 检查Docker权限
check_docker_permissions() {
    if ! docker info &> /dev/null; then
        print_error "Docker权限检查失败"
        print_info "请确保当前用户在docker用户组中"
        print_info "可以运行以下命令添加用户到docker组："
        print_info "sudo usermod -aG docker $USER"
        print_info "然后重新登录服务器"
        exit 1
    fi
}

# 检查docker-compose命令
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "docker-compose 未安装"
        print_info "请安装 docker-compose 或确保 docker compose 命令可用"
        exit 1
    fi
    print_info "使用 docker compose 命令: $DOCKER_COMPOSE_CMD"
}

# 检查是否为root用户
check_root

# 检查必要的命令
print_info "检查必要的命令..."
check_command docker
check_command docker-compose

# 检查docker-compose命令
print_info "检查docker-compose命令..."
check_docker_compose

# 检查Docker权限
print_info "检查Docker权限..."
check_docker_permissions

# 创建必要的目录
print_info "创建必要的目录..."
mkdir -p nginx/ssl
mkdir -p logs
mkdir -p backend/logs
chmod -R 755 nginx/ssl logs backend/logs

# 生成SSL证书
print_info "生成SSL证书..."
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
    chmod 644 nginx/ssl/cert.pem
    chmod 600 nginx/ssl/key.pem
    print_info "SSL证书已生成"
else
    print_warning "SSL证书已存在，跳过生成"
fi

# 获取服务器IP
SERVER_IP=$(get_server_ip)
print_info "检测到服务器IP: $SERVER_IP"

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
APP_URL=https://${SERVER_IP}
APP_SECRET_KEY=$(openssl rand -hex 32)

# 后端服务配置
BACKEND_PORT=8000
BACKEND_WORKERS=4
BACKEND_HOST=0.0.0.0

# 前端服务配置
FRONTEND_PORT=80
FRONTEND_HOST=0.0.0.0

# OpenAI配置
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# 微信小程序配置
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_TOKEN=
WECHAT_ENCODING_AES_KEY=

# Teams配置
TEAMS_APP_ID=
TEAMS_APP_SECRET=
TEAMS_TENANT_ID=

# 邮件服务配置
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# 文件存储配置
STORAGE_TYPE=local
STORAGE_PATH=/app/storage
STORAGE_URL=https://${SERVER_IP}/storage

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
CORS_ORIGINS=https://${SERVER_IP}
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
    chmod 644 .env
    print_info "已创建默认环境变量文件，你可以在后台管理界面中配置相关设置"
fi

# 配置Docker镜像源
setup_docker_mirror() {
    print_info "配置Docker镜像源..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
    "registry-mirrors": [
        "https://registry.cn-hangzhou.aliyuncs.com",
        "https://docker.mirrors.ustc.edu.cn",
        "https://hub-mirror.c.163.com",
        "https://mirror.ccs.tencentyun.com"
    ]
}
EOF
    systemctl restart docker
}

# 构建和启动服务
print_info "构建和启动服务..."
$DOCKER_COMPOSE_CMD build
$DOCKER_COMPOSE_CMD up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 10

# 检查服务状态
print_info "检查服务状态..."
$DOCKER_COMPOSE_CMD ps

# 运行数据库迁移
print_info "运行数据库迁移..."
$DOCKER_COMPOSE_CMD exec -T backend alembic upgrade head

# 初始化数据
print_info "初始化数据..."
if [ -f "scripts/init_data.py" ]; then
    $DOCKER_COMPOSE_CMD exec -T backend python scripts/init_data.py
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
print_info "================================================"
print_info "系统访问地址："
print_info "前端访问地址: https://${SERVER_IP}"
print_info "后端API地址: https://${SERVER_IP}/api"
print_info "后台管理地址: https://${SERVER_IP}/admin"
print_info "================================================"
print_info "查看服务日志: $DOCKER_COMPOSE_CMD logs -f"
print_info "注意：请在后台管理界面中配置必要的设置，如 OpenAI API、微信小程序等" 