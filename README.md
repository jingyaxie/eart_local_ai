# AI辅助课程系统

一个用于管理课程、文件和学习资源的综合性Web应用程序，集成了AI辅助功能。

## 功能特点

### 用户管理
- 用户认证和授权
- 个人资料管理（支持头像上传）
- 双因素认证
- 通知偏好设置
- 语言和主题设置

### 文件管理
- 文件上传（支持进度跟踪）
- 批量上传支持
- 拖放功能
- 多种格式文件预览
- 文件版本控制
- 文件共享和协作
- 高级搜索和过滤
- 标签管理

### 课程管理
- 课程创建和管理
- 学习资源组织
- 进度跟踪
- 课程统计
- 学生注册

### AI集成
- AI驱动的聊天助手
- 智能文件分类
- 内容推荐
- 学习路径优化

### 通知系统
- 邮件通知
- 推送通知
- 应用内通知
- 通知偏好设置
- 免打扰时间

### 帮助与支持
- 可搜索的帮助内容
- 常见问题解答
- 视频教程
- 文档
- 联系支持

## 技术栈

### 前端
- React
- Material-UI
- Axios
- React Router
- React Dropzone
- React Beautiful DnD

### 后端
- Node.js
- Express
- MongoDB
- JWT认证
- AWS S3（用于文件存储）

## 开始使用

### 前提条件
- Node.js（v14或更高版本）
- MongoDB
- AWS账户（用于S3）

### 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/ai-assisted-course-system.git
cd ai-assisted-course-system
```

2. 安装依赖：
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量：
```bash
# 后端 (.env)
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name

# 前端 (.env)
REACT_APP_API_URL=http://localhost:5000
```

4. 启动开发服务器：
```bash
# 启动后端服务器
cd backend
npm run dev

# 启动前端服务器
cd ../frontend
npm start
```

## 项目结构

```
ai-assisted-course-system/
├── backend/                # 后端代码
│   ├── controllers/        # 控制器
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   ├── middleware/        # 中间件
│   ├── utils/             # 工具函数
│   └── server.js          # 服务器入口
├── frontend/              # 前端代码
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── context/       # 上下文
│   │   ├── utils/         # 工具函数
│   │   ├── App.jsx        # 应用入口
│   │   └── index.jsx      # 渲染入口
│   └── package.json       # 依赖配置
└── README.md              # 项目文档
```

## API文档

### 认证
- POST /api/auth/register - 注册新用户
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出
- GET /api/auth/me - 获取当前用户信息

### 文件
- GET /api/files - 获取所有文件
- POST /api/files - 上传文件
- GET /api/files/:id - 获取指定文件
- PUT /api/files/:id - 更新文件
- DELETE /api/files/:id - 删除文件
- POST /api/files/:id/share - 共享文件
- GET /api/files/:id/versions - 获取文件版本

### 课程
- GET /api/courses - 获取所有课程
- POST /api/courses - 创建课程
- GET /api/courses/:id - 获取指定课程
- PUT /api/courses/:id - 更新课程
- DELETE /api/courses/:id - 删除课程

### 通知
- GET /api/notifications - 获取所有通知
- PUT /api/notifications/:id/read - 标记通知为已读
- DELETE /api/notifications/:id - 删除通知
- PUT /api/notifications/settings - 更新通知设置

### 个人资料
- GET /api/profile - 获取用户资料
- PUT /api/profile - 更新资料
- POST /api/profile/avatar - 上传头像

## 贡献指南

1. Fork仓库
2. 创建特性分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m '添加新特性'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件

## 致谢

- Material-UI提供的组件库
- React团队提供的优秀框架
- MongoDB提供的数据库
- AWS提供的云服务 