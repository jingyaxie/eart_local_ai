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
if [ "$EUID" -ne 0 ]; then
    print_error "请使用root用户运行此脚本"
    exit 1
fi

# 更新系统
print_info "更新系统..."
apt-get update
apt-get upgrade -y

# 安装必要的软件包
print_info "安装必要的软件包..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    nginx \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx

# 安装Docker
print_info "安装Docker..."
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
print_info "安装Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 配置Docker用户组
print_info "配置Docker用户组..."
usermod -aG docker $SUDO_USER

# 配置防火墙
print_info "配置防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# 配置fail2ban
print_info "配置fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# 配置系统限制
print_info "配置系统限制..."
cat > /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
EOF

# 配置系统参数
print_info "配置系统参数..."
cat > /etc/sysctl.conf << EOF
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
EOF

sysctl -p

# 创建应用目录
print_info "创建应用目录..."
mkdir -p /opt/ai_course_system
chown -R $SUDO_USER:$SUDO_USER /opt/ai_course_system

# 创建环境变量文件
print_info "创建环境变量文件..."
cat > /opt/ai_course_system/.env << EOF
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
APP_URL=https://your-domain.com
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
STORAGE_URL=https://your-domain.com/storage

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
CORS_ORIGINS=https://your-domain.com
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

# 配置Nginx
print_info "配置Nginx..."
cat > /etc/nginx/conf.d/ai_course_system.conf << EOF
server {
    listen 80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 创建SSL证书目录
mkdir -p /etc/nginx/ssl

# 生成自签名SSL证书
print_info "生成SSL证书..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"

# 重启Nginx
systemctl restart nginx

# 创建定时备份任务
print_info "配置定时备份..."
cat > /etc/cron.d/ai_course_system_backup << EOF
0 2 * * * root /opt/ai_course_system/backup.sh >> /var/log/ai_course_system_backup.log 2>&1
EOF

# 创建日志轮转配置
print_info "配置日志轮转..."
cat > /etc/logrotate.d/ai_course_system << EOF
/var/log/ai_course_system_*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

# 显示完成信息
print_info "服务器配置完成！"
print_info "请执行以下步骤："
print_info "1. 编辑 /opt/ai_course_system/.env 文件，配置必要的环境变量"
print_info "2. 将应用代码复制到 /opt/ai_course_system 目录"
print_info "3. 运行 ./deploy.sh 部署应用"
print_info "4. 检查服务状态：docker-compose ps"
print_info "5. 查看日志：docker-compose logs -f" 