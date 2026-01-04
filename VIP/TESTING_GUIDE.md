# VIP 插件完整测试指南

## 📋 测试前准备

### 1. 确保后端服务运行

```bash
# 在项目根目录
cd server
npm run build
npm start
```

服务器应该在 `http://localhost:5000` 运行。

### 2. 确保前端服务运行（可选）

```bash
cd client
npm start
```

前端在 `http://localhost:3000` 运行。

### 3. 准备测试视频文件

确认 `test_video` 目录结构：

```
test_video/
├── 1/
│   ├── AI_fengmian_out.png  (普通用户外封面)
│   ├── AI_fengmian_in.png   (普通用户内封面)
│   ├── AI_video.mp4         (普通视频)
│   ├── fengmian_out.png     (VIP 外封面)
│   ├── fengmian_in.png      (VIP 内封面)
│   └── V2.zip               (VIP 高清视频压缩包)
├── 2/ ... (same structure)
├── 3/ ... (same structure)
├── 4/ ... (same structure)
├── 5/ ... (same structure)
└── 6/ ... (same structure)
```

---

## 🔧 步骤 1：安装 Chrome 插件

### 1.1 打开 Chrome 扩展管理页面

在地址栏输入：
```
chrome://extensions/
```

### 1.2 启用开发者模式

点击页面右上角的 **"开发者模式"** 切换开关，确保它是打开的。

### 1.3 加载插件

1. 点击左上角的 **"加载已解压的扩展程序"** 按钮
2. 浏览到项目目录：`C:\Guanhua_Zhu\Business Empire Plan\guozuyin\VIP`
3. 选择 `VIP` 文件夹
4. 点击 **"选择文件夹"**

### 1.4 验证安装

安装成功后，您会看到：
- 扩展程序列表中出现 "奇幻世界 VIP"
- 状态显示为 "已启用"
- 浏览器工具栏可能出现插件图标（如果有图标文件）

### 1.5 查看 VIP 状态

1. 点击浏览器工具栏的拼图图标（扩展程序）
2. 找到 "奇幻世界 VIP"
3. 点击插件，会弹出状态窗口
4. 确认显示 "✓ VIP 已激活"
5. 记下显示的 **会员 ID** 和 **有效期**

---

## 🧪 步骤 2：测试后端 VIP 认证

### 2.1 打开浏览器开发者工具

1. 在 Chrome 中按 `F12` 或右键 → "检查"
2. 切换到 **"Console"** 标签
3. 切换到 **"Network"** 标签

### 2.2 测试视频列表接口

在 Console 中输入并执行：

```javascript
fetch('http://localhost:5000/api/videos')
  .then(res => res.json())
  .then(data => {
    console.log('VIP 状态:', data.videos[0]._isVIP);
    console.log('封面 URL:', data.videos[0].thumbnailUrl);
    console.log('预期包含: /test_video/1/fengmian_out.png (VIP) 或 AI_fengmian_out.png (普通)');
  });
```

**预期结果：**
- `_isVIP: true` - 表示被识别为 VIP 用户
- `thumbnailUrl` 包含 `fengmian_out.png`（VIP 封面）

### 2.3 检查请求头

在 Network 标签中：
1. 找到 `videos` 请求
2. 点击查看详情
3. 切换到 **"Headers"** 标签
4. 在 "Request Headers" 中查找：
   - `X-VIP-Token`: 应该有一个长字符串（JWT Token）
   - `X-Client-Version`: `2.0-premium`

**预期结果：**
两个自定义 header 都存在，说明插件正常工作。

### 2.4 查看后端日志

在运行服务器的终端中，您应该看到：

```
[VIP Auth] ✓ VIP user authenticated: vip-1735862400000-abc123xyz
```

这表示后端成功验证了 VIP Token。

---

## 🎨 步骤 3：测试普通用户 vs VIP 用户

### 3.1 对比测试 - VIP 用户

**插件已安装**的状态下访问：`http://localhost:3000`

1. 打开视频列表页面
2. 观察视频封面
3. 点击任意视频查看详情
4. 观察内封面
5. （如果已购买）点击下载按钮

**预期结果：**
- 视频外封面：显示 `fengmian_out.png`（高清版）
- 视频内封面：显示 `fengmian_in.png`（高清版）
- 下载文件：`V2.zip`（高清压缩包）

### 3.2 对比测试 - 普通用户

**禁用或卸载插件**后访问：

1. 在 `chrome://extensions/` 中禁用 "奇幻世界 VIP"
2. 刷新网页
3. 观察同样的视频

**预期结果：**
- 视频外封面：显示 `AI_fengmian_out.png`（AI 生成版）
- 视频内封面：显示 `AI_fengmian_in.png`（AI 生成版）
- 下载文件：`AI_video.mp4`（普通视频）

### 3.3 对比表格

| 功能 | 普通用户 | VIP 用户 |
|------|---------|----------|
| 外封面 | AI_fengmian_out.png | fengmian_out.png ✨ |
| 内封面 | AI_fengmian_in.png | fengmian_in.png ✨ |
| 下载文件 | AI_video.mp4 | V2.zip ✨ |
| 视频质量 | 标准 | 高清加长 ✨ |

---

## 🔍 步骤 4：调试和问题排查

### 4.1 插件未生效

**症状：** 访问网站时没有显示 VIP 内容

**检查清单：**

1. ✅ 插件是否已启用？
   - 访问 `chrome://extensions/`
   - 确认 "奇幻世界 VIP" 显示为 "已启用"

2. ✅ 插件是否生成了 Token？
   - 点击插件图标
   - 查看是否显示会员 ID

3. ✅ 请求是否包含 VIP Header？
   - 打开 Network 标签
   - 刷新页面
   - 查看 API 请求是否包含 `X-VIP-Token` header

4. ✅ 后端是否识别 VIP？
   - 查看服务器终端日志
   - 应该看到 `[VIP Auth] ✓ VIP user authenticated`

### 4.2 Token 验证失败

**症状：** 后端日志显示 `[VIP Auth] ✗ Token validation failed`

**可能原因：**

1. **密钥不匹配**
   - 检查 `VIP/crypto-utils.js` 中的 `SECRET_KEY`
   - 检查 `server/src/middleware/vipAuth.ts` 中的 `SECRET_KEY`
   - 确保两者完全一致

2. **Token 过期**
   - 点击插件图标
   - 查看 "有效期至" 是否已过期
   - 点击 "刷新 Token" 按钮

3. **客户端版本不匹配**
   - 检查请求头中的 `X-Client-Version`
   - 应该为 `2.0-premium`

### 4.3 文件路径错误

**症状：** 图片或视频无法加载，显示 404 错误

**检查：**

1. 确认 `test_video` 目录在项目根目录
2. 确认目录结构正确（1-6 子目录）
3. 确认文件名拼写正确
4. 检查服务器配置是否正确提供静态文件：

```typescript
// server/src/index.ts
app.use('/test_video', express.static(path.join(__dirname, '../../test_video')));
```

如果没有这一行，需要添加。

### 4.4 CORS 错误

**症状：** 浏览器控制台显示 CORS 错误

**解决方案：**

确保服务器的 CORS 配置包含正确的 origin：

```typescript
// server/src/index.ts
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

---

## 📊 步骤 5：完整功能测试清单

### 5.1 插件功能

- [ ] 插件成功安装
- [ ] 插件图标显示正常（如果有图标）
- [ ] 点击插件显示 VIP 状态
- [ ] VIP 状态显示 "已激活"
- [ ] 会员 ID 正确显示
- [ ] 有效期正确显示
- [ ] "刷新 Token" 按钮可用

### 5.2 后端认证

- [ ] VIP Token 自动添加到请求头
- [ ] 服务器日志显示 VIP 认证成功
- [ ] Token 验证通过
- [ ] 非 VIP 请求被正确识别

### 5.3 内容区分

- [ ] VIP 用户看到高清外封面
- [ ] VIP 用户看到高清内封面
- [ ] VIP 用户可下载高清压缩包
- [ ] 普通用户看到 AI 生成外封面
- [ ] 普通用户看到 AI 生成内封面
- [ ] 普通用户只能下载普通视频

### 5.4 API 响应

- [ ] 视频列表 API 返回正确封面 URL
- [ ] 视频详情 API 返回正确封面 URL
- [ ] 下载 API 返回正确文件 URL
- [ ] 推荐视频 API 返回正确封面 URL

---

## 🚀 步骤 6：生产部署准备

### 6.1 修改域名配置

在 `VIP/manifest.json` 中，添加生产环境域名：

```json
"host_permissions": [
  "https://qihuanshijie.xyz/*",
  "https://www.qihuanshijie.xyz/*"
]
```

### 6.2 移除调试信息

在生产环境中，可以移除以下调试信息：

1. **backend.js** - 移除 console.log
2. **vipContent.ts** - 移除 `_isVIP` 字段
3. **videos.ts** - 下载接口移除 `isVIP` 字段

### 6.3 打包插件分发

1. 确保所有文件完整（包括图标）
2. 将 `VIP` 文件夹压缩为 `.zip` 文件
3. 分发给用户
4. 提供安装说明（见 README.md）

### 6.4 上传视频到 CDN

将 `test_video` 目录上传到 Bunny CDN 后：

1. 修改 `vipContent.ts` 中的 `baseDir`：
   ```typescript
   const baseDir = `https://qihuanshijie-cdn.b-cdn.net/video/${videoNumber}`;
   ```

2. 确保 CDN 路径结构与本地一致

---

## 📝 测试记录模板

```
测试日期：________
测试人员：________
浏览器版本：Chrome _______

□ 插件安装成功
□ VIP Token 生成成功
  会员 ID: __________________

□ 后端认证成功
  服务器日志确认：是 / 否

□ VIP 内容显示正确
  外封面：fengmian_out.png / AI_fengmian_out.png
  内封面：fengmian_in.png / AI_fengmian_in.png
  下载文件：V2.zip / AI_video.mp4

□ 普通用户内容显示正确
  外封面：AI_fengmian_out.png
  内封面：AI_fengmian_in.png
  下载文件：AI_video.mp4

□ 问题记录：
  ____________________________
  ____________________________
```

---

## ✅ 测试完成

如果所有测试都通过，恭喜！VIP 插件系统已成功部署。

如有问题，请参考 **步骤 4：调试和问题排查** 部分。
