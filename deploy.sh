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
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "请编辑 .env 文件设置必要的环境变量"
        exit 1
    else
        print_error ".env.example 文件不存在"
        exit 1
    fi
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