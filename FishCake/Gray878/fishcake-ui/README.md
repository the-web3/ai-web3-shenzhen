# Fishcake Wallet UI

## 启动开发服务器

```bash
npm run dev
```

## 常见问题

### 1. 如果看到 Vite + TypeScript 默认页面

**原因**：可能是浏览器缓存或开发服务器没有正确重启

**解决方法**：
1. 停止当前的开发服务器（Ctrl+C）
2. 清除浏览器缓存（Ctrl+Shift+Delete 或硬刷新 Ctrl+F5）
3. 重新启动开发服务器：`npm run dev`
4. 确保访问的是正确的 URL（通常是 `http://localhost:5173`）

### 2. 如果页面显示空白

**检查**：
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页是否有错误
- 查看 Network 标签页，确认 `main.tsx` 是否正确加载

### 3. 如果样式没有加载

**检查**：
- 确认 `src/index.css` 文件存在
- 确认 Tailwind CSS 配置正确
- 检查浏览器控制台是否有 CSS 相关错误

## 项目结构

```
fishcake-ui/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   ├── index.css            # 全局样式
│   ├── components/          # React 组件
│   └── hooks/               # React Hooks
├── index.html               # HTML 入口
└── vite.config.ts           # Vite 配置
```

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- @headlessui/react
- @heroicons/react
