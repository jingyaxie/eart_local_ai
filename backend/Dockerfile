# 使用阿里云镜像源的 Python 3.9 基础镜像
FROM registry.cn-hangzhou.aliyuncs.com/library/python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 配置apt使用阿里云镜像源
RUN echo "deb https://mirrors.aliyun.com/debian/ bullseye main non-free contrib" > /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian/ bullseye-updates main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian/ bullseye-backports main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian-security bullseye-security main non-free contrib" >> /etc/apt/sources.list

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 配置pip使用国内镜像
RUN mkdir -p /etc/pip && \
    echo "[global]" > /etc/pip/pip.conf && \
    echo "index-url = https://mirrors.aliyun.com/pypi/simple/" >> /etc/pip/pip.conf && \
    echo "extra-index-url = https://pypi.tuna.tsinghua.edu.cn/simple/ https://pypi.doubanio.com/simple/ https://pypi.mirrors.ustc.edu.cn/simple/" >> /etc/pip/pip.conf && \
    echo "[install]" >> /etc/pip/pip.conf && \
    echo "trusted-host = mirrors.aliyun.com pypi.tuna.tsinghua.edu.cn pypi.doubanio.com pypi.mirrors.ustc.edu.cn" >> /etc/pip/pip.conf

# 复制项目文件
COPY requirements.txt .
COPY app/ app/
COPY config/ config/

# 安装 Python 依赖
RUN pip install -r requirements.txt

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 