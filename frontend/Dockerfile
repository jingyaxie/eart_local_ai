# 构建阶段
FROM node:16-alpine as build

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV PUBLIC_URL=/

# 构建应用
RUN npm run build

# 验证构建输出
RUN ls -la /app/build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=build /app/build /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"] 