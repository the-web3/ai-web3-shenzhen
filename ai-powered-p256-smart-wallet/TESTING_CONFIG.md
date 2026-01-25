# 测试配置切换指南

## 当前配置：电脑本地测试（localhost）

**访问地址：** http://localhost:3000

**特点：**
- ✅ Passkey功能正常
- ✅ 只能在本机测试
- ❌ 手机无法访问

---

## 切换到手机测试配置

如果需要在手机上测试（包括Passkey功能），按以下步骤操作：

### 步骤1：切换后端配置

```bash
cd backend
cp .env.mobile .env
```

### 步骤2：切换前端配置

```bash
cd frontend
cp .env.local.mobile .env.local
```

### 步骤3：重启服务

```bash
# 后端
cd backend
pkill -f './server'
./server > server.log 2>&1 &

# 前端
cd frontend
pkill -f 'next-server'
npm run dev
```

### 步骤4：在手机上访问

**访问地址：** http://appledeMacBook-Air.local:3000

**要求：**
- 手机和电脑必须在同一WiFi网络
- iPhone/iPad自动支持 `.local` 域名（mDNS/Bonjour）
- 安卓手机可能需要额外设置或使用支持mDNS的浏览器

---

## 如果 .local 不工作

某些网络或设备可能不支持 .local 域名，此时可以：

### 选项A：使用IP地址（但Passkey不可用）

前端访问：http://192.168.66.87:3000
- ⚠️ Passkey会失败（WebAuthn不支持IP地址的RP_ID）
- ✅ 可以测试UI和其他功能

### 选项B：使用ngrok（完美方案）

```bash
# 安装ngrok
brew install ngrok

# 启动ngrok隧道
ngrok http 3000
```

ngrok会提供一个HTTPS URL（如：https://abc123.ngrok.io），可以在任何设备使用，包括Passkey功能。

---

## 快速切换回本地配置

```bash
# 后端
cd backend
git checkout .env  # 恢复原配置

# 前端  
cd frontend
git checkout .env.local  # 恢复原配置

# 重启服务（同上）
```

---

## 当前IP地址

- **本机IP:** 192.168.66.87
- **本机域名:** appledeMacBook-Air.local
- **localhost:** 127.0.0.1

---

## 故障排查

### 问题：手机无法访问 .local 域名

**解决方案：**
1. 确保手机和电脑在同一WiFi
2. 尝试在手机浏览器输入：http://192.168.66.87:3000（虽然Passkey不能用）
3. 使用ngrok创建HTTPS隧道

### 问题：Passkey报错 "relying party ID is not a registrable domain"

**原因：** RP_ID配置与访问域名不匹配

**解决方案：**
- 使用localhost时，RP_ID=localhost
- 使用.local域名时，RP_ID=appledeMacBook-Air.local
- IP地址无法用于Passkey（需要真实域名或localhost）

### 问题：Origin validation error

**解决方案：**
- 确保 RP_ORIGIN 与实际访问地址完全一致（包括端口号）
- 例如：访问 http://localhost:3000，则 RP_ORIGIN=http://localhost:3000
