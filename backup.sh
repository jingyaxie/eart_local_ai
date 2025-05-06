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

# 创建备份目录
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
print_info "创建备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 备份数据库
print_info "备份数据库..."
docker-compose exec -T db pg_dump -U postgres ai_course_system > "$BACKUP_DIR/database.sql"

# 备份Redis数据
print_info "备份Redis数据..."
docker-compose exec -T redis redis-cli SAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_DIR/redis.rdb"

# 备份配置文件
print_info "备份配置文件..."
cp .env "$BACKUP_DIR/env"
cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml"
cp -r nginx/conf.d "$BACKUP_DIR/nginx_conf"

# 备份SSL证书
print_info "备份SSL证书..."
cp -r nginx/ssl "$BACKUP_DIR/ssl"

# 创建备份信息文件
print_info "创建备份信息文件..."
echo "备份时间: $(date)" > "$BACKUP_DIR/backup_info.txt"
echo "系统版本: $(docker-compose exec -T backend python -c 'import sys; print(sys.version)')" >> "$BACKUP_DIR/backup_info.txt"
echo "数据库大小: $(du -h "$BACKUP_DIR/database.sql" | cut -f1)" >> "$BACKUP_DIR/backup_info.txt"
echo "Redis数据大小: $(du -h "$BACKUP_DIR/redis.rdb" | cut -f1)" >> "$BACKUP_DIR/backup_info.txt"

# 压缩备份文件
print_info "压缩备份文件..."
tar -czf "$BACKUP_DIR.tar.gz" -C backups "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

# 删除30天前的备份
print_info "清理旧备份..."
find backups -name "*.tar.gz" -mtime +30 -delete

print_info "备份完成！"
print_info "备份文件: $BACKUP_DIR.tar.gz" 