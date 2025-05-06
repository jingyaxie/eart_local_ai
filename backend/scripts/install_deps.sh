#!/bin/bash

# 设置pip配置
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
pip config set global.timeout 1000

# 升级pip
pip install --no-cache-dir --upgrade pip

# 安装基础依赖
echo "Installing base dependencies..."
pip install --no-cache-dir fastapi==0.85.1 uvicorn==0.18.3 python-multipart==0.0.5 pydantic==1.10.8 python-jose==3.3.0 passlib==1.7.4 python-dotenv==1.0.0 sqlalchemy==1.4.41 psycopg2-binary==2.9.6 redis==4.5.4 alembic==1.7.1 websockets==11.0.3 python-socketio==5.8.0 aiofiles==23.1.0 requests>=2.28.0,<3.0.0

# 安装AI相关依赖
echo "Installing AI dependencies..."
pip install --no-cache-dir openai==0.27.8 langchain==0.0.267 chromadb==0.3.29 tiktoken==0.4.0 sentence-transformers==2.2.2 pymilvus==2.3.3

# 安装文档处理依赖
echo "Installing document processing dependencies..."
pip install --no-cache-dir PyPDF2==1.26.0 python-docx==0.8.11 pytesseract==0.3.8 SpeechRecognition==3.10.0 pillow==9.5.0 pydub==0.25.1

# 安装数据处理依赖
echo "Installing data processing dependencies..."
pip install --no-cache-dir numpy==1.24.3 pandas==1.3.3 openpyxl==3.0.9 python-magic==0.4.24 beautifulsoup4==4.9.3 lxml==4.6.3 pyyaml==5.4.1 