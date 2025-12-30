# AI Video Store - AI视频素材电商网站

一个基于Node.js、React和TypeScript构建的AI视频素材电商平台。

## 功能特性

### 前端功能
- 🔍 **视频搜索与筛选** - 支持关键词搜索和分类筛选
- 👤 **用户认证系统** - 注册、登录、找回密码
- 🛒 **购物车功能** - 添加/删除商品、批量购买
- 💳 **支付集成** - 支持支付宝和微信支付
- 📱 **响应式设计** - 适配桌面和移动端
- 🎬 **视频预览** - 高清缩略图预览
- 📊 **个人中心** - 购买历史、下载管理

### 后端功能
- 🔐 **JWT身份验证** - 安全的用户会话管理
- 📧 **邮件服务** - 找回密码、欢迎邮件
- 🛡️ **安全防护** - 请求限制、输入验证、SQL注入防护
- 💾 **数据存储** - MongoDB数据库
- ⏰ **下载管理** - 48小时限时下载
- 🔄 **自动过期** - 购买记录自动过期处理

## 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Router** - 路由管理
- **React Query** - 数据获取和缓存
- **React Hook Form** - 表单处理
- **Axios** - HTTP客户端

### 后端
- **Node.js** - 运行时环境
- **Express** - Web框架
- **TypeScript** - 类型安全
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份验证
- **bcryptjs** - 密码哈希
- **Nodemailer** - 邮件发送

## 快速开始

### 环境要求
- Node.js 16+
- MongoDB 4.4+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-video-store
```

### 2. 安装依赖
```bash
npm run install:all
```

### 3. 环境配置
复制环境变量文件并配置：
```bash
cp server/.env.example server/.env
```

编辑 `server/.env` 文件：
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-video-store
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 支付配置（可选）
ALIPAY_APP_ID=your-alipay-app-id
WECHAT_APP_ID=your-wechat-app-id
```

### 4. 启动数据库
确保MongoDB服务正在运行：
```bash
# Windows
net start MongoDB

# macOS (使用Homebrew)
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

### 5. 初始化数据库
```bash
cd server
npm run init-db
```

### 6. 启动开发服务器
```bash
# 同时启动前后端
npm run dev

# 或者分别启动
npm run server:dev  # 后端服务 (端口5000)
npm run client:dev  # 前端服务 (端口3000)
```

### 7. 访问应用
- 前端应用：http://localhost:3000
- 后端API：http://localhost:5000

## 开发指南

### 项目结构
```
ai-video-store/
├── client/                 # React前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── contexts/       # Context提供者
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   └── types/          # TypeScript类型
│   ├── public/
│   └── package.json
├── server/                 # Node.js后端应用
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── scripts/        # 工具脚本
│   │   └── utils/          # 工具函数
│   └── package.json
└── package.json            # 根package.json
```

### API接口

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/forgot-password` - 申请重置密码
- `POST /api/auth/reset-password` - 重置密码

#### 视频相关
- `GET /api/videos` - 获取视频列表
- `GET /api/videos/:id` - 获取视频详情
- `GET /api/videos/categories` - 获取分类列表
- `GET /api/videos/:id/download` - 获取下载链接

#### 购物车相关
- `GET /api/cart` - 获取购物车
- `POST /api/cart/add` - 添加到购物车
- `DELETE /api/cart/remove/:videoId` - 移除商品

#### 订单相关
- `POST /api/purchases/create-order` - 创建订单
- `POST /api/purchases/complete-payment` - 完成支付
- `GET /api/purchases/history` - 购买历史

### 数据模型

#### 用户模型 (User)
```typescript
{
  username: string;    // 用户名
  password: string;    // 加密密码
  email?: string;      // 邮箱（可选）
  phone?: string;      // 手机号（可选）
  createdAt: Date;     // 创建时间
  updatedAt: Date;     // 更新时间
}
```

#### 视频模型 (Video)
```typescript
{
  title: string;         // 标题
  description: string;   // 描述
  category: string;      // 分类
  price: number;         // 价格
  thumbnailUrl: string;  // 缩略图URL
  videoUrl: string;      // 视频文件URL
  duration?: number;     // 时长（秒）
  tags: string[];        // 标签
  createdAt: Date;       // 创建时间
}
```

#### 购买记录模型 (Purchase)
```typescript
{
  userId: ObjectId;           // 用户ID
  videoId: ObjectId;          // 视频ID
  purchaseTime: Date;         // 购买时间
  downloadExpiresAt: Date;    // 下载过期时间
  downloadCount: number;      // 已下载次数
  maxDownloads: number;       // 最大下载次数
  paymentStatus: string;      // 支付状态
  amount: number;             // 支付金额
}
```

## 部署

### 开发环境
```bash
npm run dev
```

### 生产环境

#### 1. 构建应用
```bash
npm run server:build
npm run client:build
```

#### 2. 启动生产服务器
```bash
npm run server:start
```

#### 3. 配置反向代理
使用Nginx配置反向代理：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/client/build;
        try_files $uri $uri/ /index.html;
    }

    # API请求代理到后端
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4. 使用PM2管理进程
```bash
npm install -g pm2

# 启动应用
pm2 start server/dist/index.js --name "ai-video-store"

# 保存PM2配置
pm2 save
pm2 startup
```

## 测试账户

初始化数据库后，可以使用以下测试账户：

- **管理员账户**
  - 用户名：`admin`
  - 密码：`admin123`
  - 邮箱：`admin@example.com`

- **测试用户**
  - 用户名：`testuser`
  - 密码：`password123`
  - 邮箱：`test@example.com`

## 注意事项

### 安全配置
1. **更改默认密钥** - 修改 `.env` 中的 `JWT_SECRET`
2. **配置HTTPS** - 生产环境建议使用HTTPS
3. **数据库安全** - 配置MongoDB认证和访问控制
4. **定期备份** - 设置数据库自动备份

### 支付集成
当前版本包含支付接口的模拟实现。在生产环境中，需要：
1. 申请支付宝/微信支付商户账号
2. 获取相应的API密钥和证书
3. 实现真实的支付回调处理
4. 配置支付安全验证

### 文件存储
示例中视频文件存储在本地 `/uploads` 目录。生产环境建议：
1. 使用云存储服务（如阿里云OSS、腾讯云COS）
2. 配置CDN加速
3. 实现防盗链保护

## 故障排除

### 常见问题

**1. MongoDB连接失败**
```bash
# 检查MongoDB服务状态
sudo systemctl status mongod

# 启动MongoDB服务
sudo systemctl start mongod
```

**2. 端口被占用**
```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :5000

# 终止进程
kill -9 <PID>
```

**3. 邮件发送失败**
- 检查邮箱配置是否正确
- 确认已启用邮箱的SMTP服务
- 使用应用专用密码而不是登录密码

**4. 前端构建失败**
```bash
# 清除缓存重新安装
cd client
rm -rf node_modules package-lock.json
npm install
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License