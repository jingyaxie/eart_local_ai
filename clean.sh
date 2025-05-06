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

# 停止并删除容器
print_info "停止并删除容器..."
docker-compose down

# 删除所有相关的容器
print_info "删除所有相关的容器..."
docker ps -a | grep "ai_course_system" | awk '{print $1}' | xargs -r docker rm -f

# 删除所有相关的镜像
print_info "删除所有相关的镜像..."
docker images | grep "ai_course_system" | awk '{print $3}' | xargs -r docker rmi -f

# 删除所有相关的卷
print_info "删除所有相关的卷..."
docker volume ls | grep "ai_course_system" | awk '{print $2}' | xargs -r docker volume rm

# 清理未使用的资源
print_info "清理未使用的资源..."
docker system prune -f

# 删除生成的文件
print_info "删除生成的文件..."
rm -rf nginx/ssl/cert.pem nginx/ssl/key.pem
rm -f .env

# 删除日志文件
print_info "删除日志文件..."
rm -rf logs/*
rm -rf backend/logs/*

print_info "清理完成！" 