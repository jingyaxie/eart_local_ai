#!/bin/bash

# 设置错误时退出
set -e

# 检测操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="macos";;
    CYGWIN*)    PLATFORM="windows";;
    MINGW*)     PLATFORM="windows";;
    *)          PLATFORM="unknown";;
esac

# 颜色定义
if [ "$PLATFORM" = "windows" ]; then
    # Windows下使用简单的颜色标记
    RED='[ERROR]'
    GREEN='[INFO]'
    YELLOW='[WARNING]'
    NC=''
else
    # Unix系统使用ANSI颜色
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
fi

# 打印带颜色的信息
print_info() {
    if [ "$PLATFORM" = "windows" ]; then
        echo "$GREEN $1"
    else
        echo -e "${GREEN}[INFO]${NC} $1"
    fi
}

print_warning() {
    if [ "$PLATFORM" = "windows" ]; then
        echo "$YELLOW $1"
    else
        echo -e "${YELLOW}[WARNING]${NC} $1"
    fi
}

print_error() {
    if [ "$PLATFORM" = "windows" ]; then
        echo "$RED $1"
    else
        echo -e "${RED}[ERROR]${NC} $1"
    fi
}

# 检查是否为root用户
check_root() {
    if [ "$PLATFORM" = "windows" ]; then
        # Windows下检查管理员权限
        net session >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            print_error "请使用管理员权限运行此脚本"
            print_info "请右键点击脚本，选择'以管理员身份运行'"
            exit 1
        fi
    else
        # Unix系统检查root权限
        if [ "$EUID" -ne 0 ]; then
            print_error "请使用root权限运行此脚本"
            print_info "请使用: sudo $0"
            exit 1
        fi
    fi
}

# 获取服务器IP地址
get_server_ip() {
    local ip=""
    
    case "$PLATFORM" in
        "linux")
            # Linux下尝试多种方法
            if command -v ip &> /dev/null; then
                ip=$(ip route get 1 | awk '{print $7;exit}')
            elif command -v hostname &> /dev/null; then
                ip=$(hostname -I | awk '{print $1}')
            fi
            ;;
        "macos")
            # macOS下获取IP
            ip=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
            ;;
        "windows")
            # Windows下获取IP
            ip=$(ipconfig | findstr /i "IPv4" | findstr /v "127.0.0.1" | awk '{print $NF}')
            ;;
    esac
    
    # 如果还是获取不到，使用localhost
    if [ -z "$ip" ]; then
        ip="localhost"
    fi
    
    echo "$ip"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装"
        case "$PLATFORM" in
            "linux")
                print_info "请使用包管理器安装 $1"
                if command -v apt-get &> /dev/null; then
                    print_info "sudo apt-get install $1"
                elif command -v yum &> /dev/null; then
                    print_info "sudo yum install $1"
                fi
                ;;
            "macos")
                print_info "请使用 Homebrew 安装 $1: brew install $1"
                ;;
            "windows")
                print_info "请访问官方网站下载并安装 $1"
                ;;
        esac
        exit 1
    fi
}

# 检查Docker权限
check_docker_permissions() {
    if ! docker info &> /dev/null; then
        print_error "Docker权限检查失败"
        case "$PLATFORM" in
            "linux")
                print_info "请确保当前用户在docker用户组中"
                print_info "sudo usermod -aG docker $USER"
                print_info "然后重新登录服务器"
                ;;
            "macos")
                print_info "请确保Docker Desktop正在运行"
                print_info "并已授予必要的权限"
                ;;
            "windows")
                print_info "请确保Docker Desktop正在运行"
                print_info "并以管理员身份运行此脚本"
                ;;
        esac
        exit 1
    fi
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装"
        print_info "请访问 https://docs.docker.com/get-docker/ 安装Docker"
        exit 1
    fi
}

# 检查docker-compose
check_docker_compose() {
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_error "docker-compose未安装"
        print_info "请安装docker-compose或确保docker compose命令可用"
        exit 1
    fi
    print_info "使用docker compose命令: $DOCKER_COMPOSE_CMD"
}

# 检查依赖兼容性
check_dependencies() {
    print_info "检查依赖兼容性..."
    
    # 检查Python版本
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 未安装"
        case "$PLATFORM" in
            "linux")
                print_info "请安装 Python 3:"
                print_info "sudo apt-get install python3"
                ;;
            "macos")
                print_info "请使用 Homebrew 安装:"
                print_info "brew install python@3.9"
                ;;
            "windows")
                print_info "请从 Python 官网下载并安装 Python 3.9"
                ;;
        esac
        exit 1
    fi
    
    # 检查pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 未安装"
        case "$PLATFORM" in
            "linux")
                print_info "请安装 pip3:"
                print_info "sudo apt-get install python3-pip"
                ;;
            "macos")
                print_info "请使用 Homebrew 安装:"
                print_info "brew install python@3.9"
                ;;
            "windows")
                print_info "请从 Python 官网下载并安装 Python 3.9"
                ;;
        esac
        exit 1
    fi
    
    # 安装pip-tools
    pip3 install --quiet pip-tools
    
    # 运行依赖检查脚本
    if [ -f "backend/scripts/check_deps.py" ]; then
        python3 backend/scripts/check_deps.py
    else
        print_warning "依赖检查脚本不存在，跳过检查"
    fi
}

# 清理旧的构建缓存
cleanup_build_cache() {
    print_info "清理构建缓存..."
    docker builder prune -f
}

# 配置Docker镜像源
setup_docker_mirror() {
    print_info "配置Docker镜像源..."
    
    # 创建配置目录
    mkdir -p ~/.docker
    
    # 配置镜像源
    cat > ~/.docker/daemon.json << EOF
{
    "registry-mirrors": [
        "https://registry.cn-hangzhou.aliyuncs.com",
        "https://mirror.ccs.tencentyun.com",
        "https://hub-mirror.c.163.com"
    ]
}
EOF
    
    print_info "Docker镜像源配置完成"
}

# 主函数
main() {
    print_info "开始部署..."
    
    # 检查必要的命令
    check_command docker
    check_docker_compose
    check_docker_permissions
    
    # 配置Docker镜像源
    setup_docker_mirror
    
    # 检查依赖兼容性
    check_dependencies
    
    # 清理构建缓存
    cleanup_build_cache
    
    # 构建和启动服务
    print_info "构建和启动服务..."
    $DOCKER_COMPOSE_CMD build --no-cache
    $DOCKER_COMPOSE_CMD up -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    print_info "检查服务状态..."
    $DOCKER_COMPOSE_CMD ps
    
    print_info "部署完成！"
}

# 执行主函数
main

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

# 获取服务器IP
SERVER_IP=$(get_server_ip)
print_info "检测到服务器IP: $SERVER_IP"

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