#!/bin/bash

# 等待数据库就绪
echo "Waiting for database to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

# 运行数据库迁移
echo "Running database migrations..."
cd /app
alembic upgrade head

# 启动应用
echo "Starting application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 