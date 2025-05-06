# 使用官方 Python 3.9 基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_CONNECT_TIMEOUT=100

# 配置apt使用清华镜像源
RUN echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye main non-free contrib" > /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye-updates main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye-backports main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bullseye-security main non-free contrib" >> /etc/apt/sources.list

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 配置pip使用国内镜像
RUN mkdir -p /etc/pip && \
    echo "[global]" > /etc/pip/pip.conf && \
    echo "index-url = https://pypi.tuna.tsinghua.edu.cn/simple/" >> /etc/pip/pip.conf && \
    echo "extra-index-url = https://mirrors.aliyun.com/pypi/simple/ https://pypi.doubanio.com/simple/ https://pypi.mirrors.ustc.edu.cn/simple/" >> /etc/pip/pip.conf && \
    echo "[install]" >> /etc/pip/pip.conf && \
    echo "trusted-host = pypi.tuna.tsinghua.edu.cn mirrors.aliyun.com pypi.doubanio.com pypi.mirrors.ustc.edu.cn" >> /etc/pip/pip.conf && \
    echo "timeout = 100" >> /etc/pip/pip.conf && \
    echo "retries = 3" >> /etc/pip/pip.conf

# 升级pip并安装wheel
RUN pip install --no-cache-dir --upgrade pip wheel setuptools

# 复制项目文件
COPY requirements.txt .

# 分批安装依赖
RUN pip install --no-cache-dir -r requirements.txt --timeout 100 --retries 3 || \
    (pip install --no-cache-dir -r requirements.txt --timeout 100 --retries 3 --no-deps && \
     pip install --no-cache-dir -r requirements.txt --timeout 100 --retries 3)

# 复制应用代码
COPY app/ app/
COPY config/ config/

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 