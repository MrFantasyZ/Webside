# 部署指南

本文档介绍如何将AI Video Store部署到生产环境。

## 环境准备

### 系统要求
- Ubuntu 20.04 LTS 或 CentOS 8
- Node.js 16.x 或更高版本
- MongoDB 4.4 或更高版本
- Nginx (推荐)
- SSL证书 (推荐HTTPS)

### 服务器配置建议
- **最小配置**: 2核CPU, 4GB RAM, 20GB存储
- **推荐配置**: 4核CPU, 8GB RAM, 100GB SSD

## 步骤1: 服务器初始设置

### 更新系统
```bash
sudo apt update
sudo apt upgrade -y
```

### 安装Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 安装MongoDB
```bash
# 添加MongoDB官方GPG密钥
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# 添加MongoDB存储库
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动并启用MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 安装Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 安装PM2
```bash
sudo npm install -g pm2
```

## 步骤2: 应用部署

### 克隆代码
```bash
cd /var/www
sudo git clone <your-repository-url> ai-video-store
sudo chown -R $USER:$USER ai-video-store
cd ai-video-store
```

### 安装依赖
```bash
npm run install:all
```

### 配置环境变量
```bash
cp server/.env.example server/.env
```

编辑生产环境配置：
```bash
sudo nano server/.env
```

```env
# 生产环境配置
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/ai-video-store-prod
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d

# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password

# 前端URL配置
FRONTEND_URL=https://your-domain.com
```

### 构建应用
```bash
# 构建后端
npm run server:build

# 构建前端
npm run client:build
```

### 初始化数据库
```bash
cd server
npm run init-db
```

## 步骤3: 配置PM2

创建PM2配置文件：
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'ai-video-store',
    script: './server/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
```

启动应用：
```bash
# 创建日志目录
mkdir logs

# 启动应用
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

## 步骤4: 配置Nginx

### 创建Nginx配置
```bash
sudo nano /etc/nginx/sites-available/ai-video-store
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/javascript
        text/plain
        text/xml;
    
    # 前端静态文件
    location / {
        root /var/www/ai-video-store/client/build;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API请求代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
    
    # 上传文件代理
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 防盗链（可选）
        valid_referers none blocked your-domain.com *.your-domain.com;
        if ($invalid_referer) {
            return 403;
        }
    }
    
    # 安全配置
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 启用站点
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/ai-video-store /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl reload nginx
```

## 步骤5: SSL证书配置

### 使用Let's Encrypt（免费）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 步骤6: 数据库安全配置

### 创建MongoDB用户
```bash
mongosh

use ai-video-store-prod

# 创建应用用户
db.createUser({
  user: "appuser",
  pwd: "strong-password-here",
  roles: ["readWrite"]
})

# 创建备份用户
db.createUser({
  user: "backup",
  pwd: "another-strong-password",
  roles: ["backup"]
})
```

### 启用MongoDB认证
```bash
sudo nano /etc/mongod.conf
```

```yaml
security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
```

### 更新应用数据库连接
```bash
nano server/.env
```

```env
MONGODB_URI=mongodb://appuser:strong-password-here@localhost:27017/ai-video-store-prod?authSource=ai-video-store-prod
```

重启应用：
```bash
pm2 restart ai-video-store
```

## 步骤7: 监控和日志

### 设置日志轮转
```bash
sudo nano /etc/logrotate.d/ai-video-store
```

```
/var/www/ai-video-store/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload ai-video-store > /dev/null 2>&1 || true
    endscript
}
```

### 监控脚本
创建健康检查脚本：
```bash
nano /var/www/ai-video-store/health-check.sh
```

```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ $response != "200" ]; then
    echo "$(date): Health check failed, restarting application"
    pm2 restart ai-video-store
fi
```

```bash
chmod +x /var/www/ai-video-store/health-check.sh

# 添加到crontab
crontab -e
# 添加：*/5 * * * * /var/www/ai-video-store/health-check.sh >> /var/log/health-check.log 2>&1
```

## 步骤8: 备份策略

### 数据库备份脚本
```bash
nano /var/www/ai-video-store/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ai-video-store"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
mongodump --uri="mongodb://backup:password@localhost:27017/ai-video-store-prod?authSource=ai-video-store-prod" --out $BACKUP_DIR/db_$DATE

# 压缩备份
tar -czf $BACKUP_DIR/db_$DATE.tar.gz -C $BACKUP_DIR db_$DATE
rm -rf $BACKUP_DIR/db_$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed: db_$DATE.tar.gz"
```

```bash
chmod +x /var/www/ai-video-store/backup.sh

# 每日凌晨2点备份
crontab -e
# 添加：0 2 * * * /var/www/ai-video-store/backup.sh >> /var/log/backup.log 2>&1
```

## 步骤9: 防火墙配置

```bash
# 启用UFW
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 检查状态
sudo ufw status
```

## 步骤10: 性能优化

### 操作系统优化
```bash
# 增加文件描述符限制
echo '* soft nofile 65535' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65535' | sudo tee -a /etc/security/limits.conf

# TCP优化
echo 'net.core.somaxconn = 1024' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 1024' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### MongoDB优化
```bash
sudo nano /etc/mongod.conf
```

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2  # 根据服务器内存调整

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp
```

## 故障排除

### 常用命令
```bash
# 查看应用状态
pm2 status
pm2 logs ai-video-store

# 查看Nginx状态
sudo systemctl status nginx
sudo nginx -t

# 查看MongoDB状态
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ismaster')"

# 查看系统资源
htop
df -h
free -h
```

### 常见问题

1. **应用无法启动**
   - 检查端口占用：`lsof -i :5000`
   - 查看PM2日志：`pm2 logs ai-video-store`

2. **数据库连接失败**
   - 检查MongoDB状态：`sudo systemctl status mongod`
   - 验证连接字符串

3. **SSL证书问题**
   - 检查证书有效期：`sudo certbot certificates`
   - 测试SSL配置：`openssl s_client -connect your-domain.com:443`

## 维护清单

### 日常维护
- [ ] 检查应用状态（PM2）
- [ ] 查看错误日志
- [ ] 监控磁盘使用情况
- [ ] 检查SSL证书状态

### 周期维护
- [ ] 更新系统包
- [ ] 备份验证
- [ ] 性能监控检查
- [ ] 安全更新

### 月度维护
- [ ] 日志清理
- [ ] 数据库优化
- [ ] 安全审计
- [ ] 容量规划评估