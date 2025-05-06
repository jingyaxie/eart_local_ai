# 使用 Python 3.9 作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY . .

# 设置执行权限
RUN chmod +x /app/scripts/install_deps.sh \
    && chmod +x /app/scripts/start.sh

# 安装Python依赖
RUN /app/scripts/install_deps.sh

# 创建日志目录和数据目录
RUN mkdir -p /app/logs /app/data

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["/app/scripts/start.sh"] 