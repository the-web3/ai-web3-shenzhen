# 新功能实现指南

## ✅ 后端已完成

### 1. 上下文记忆 ✅
- 支持历史消息传递
- API 请求格式更新：
```json
{
  "message": "用户消息",
  "history": [
    {"role": "user", "content": "之前的用户消息"},
    {"role": "assistant", "content": "之前的 AI 回复"}
  ]
}
```

### 2. 表单 UI ✅  
- 新增 `form` 字段到 AI 响应
- AI 可以生成表单收集用户输入
- 示例响应：
```json
{
  "message": "好的，请填写下面的表单：",
  "aiResponse": {
    "form": {
      "title": "转账信息",
      "fields": [
        {
          "name": "recipient",
          "label": "收款地址",
          "type": "text",
          "placeholder": "0x...",
          "required": true,
          "validation": "ethereum_address"
        },
        {
          "name": "amount",
          "label": "金额 (USDT)",
          "type": "number",
          "value": "100",
          "required": true
        }
      ],
      "submitLabel": "确认转账"
    }
  }
}
```

## 🔧 前端需要实现

### 1. 更新 ChatInterface.tsx

#### 添加历史消息管理
```typescript
const handleSendMessage = async (messageText?: string) => {
  const textToSend = messageText || input;
  if (!textToSend.trim() || loading) return;

  // ... 添加用户消息到 messages

  // 构建历史消息（排除第一条欢迎消息，只保留最近10条）
  const history = messages
    .slice(1, -10) // 最近10条
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: textToSend,
      history: history // 传递历史消息
    }),
  });
  // ...
};
```

#### 添加表单提交处理
```typescript
const handleFormSubmit = (formData: Record<string, any>) => {
  // 将表单数据转换为自然语言消息
  const message = Object.entries(formData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  // 自动发送消息
  handleSendMessage(message);
};
```

#### 传递 onFormSubmit 到 JSONUIRenderer
```typescript
<JSONUIRenderer
  data={message.aiResponse}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  onFormSubmit={handleFormSubmit} // 新增
/>
```

### 2. 更新 JSONUIRenderer.tsx

#### 添加表单渲染组件
```typescript
import { TextField, Button, Box, Card, CardContent } from '@mui/material';

// 在 JSONUIRenderer 组件中添加：
const JSONUIRenderer: React.FC<JSONUIComponentProps> = ({
  data,
  onConfirm,
  onCancel,
  onFormSubmit, // 新增
}) => {
  const { problem, operation, supplement, form } = data;
  const [formData, setFormData] = useState<Record<string, any>>({});

  // 初始化表单默认值
  useEffect(() => {
    if (form) {
      const initialData: Record<string, any> = {};
      form.fields.forEach(field => {
        if (field.value) {
          initialData[field.name] = field.value;
        }
      });
      setFormData(initialData);
    }
  }, [form]);

  const handleFormFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmitClick = () => {
    if (onFormSubmit) {
      onFormSubmit(formData);
    }
  };

  // ... 其他现有代码

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* 现有的 problem 区域 */}
      {problem && (
        <Alert>...</Alert>
      )}

      {/* 新增：表单区域 */}
      {form && (
        <Card sx={{ mb: 2, border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              {form.title}
            </Typography>
            {form.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {form.description}
              </Typography>
            )}
            
            {/* 表单字段 */}
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.fields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  fullWidth
                  variant="outlined"
                />
              ))}
              
              {/* 提交按钮 */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleFormSubmitClick}
                size="large"
                fullWidth
              >
                {form.submitLabel || '提交'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 现有的 operation 区域 */}
      {operation && (
        <Card>...</Card>
      )}

      {/* 现有的 supplement 区域 */}
      {supplement && (
        <Card>...</Card>
      )}
    </Box>
  );
};
```

### 3. 添加二次确认弹窗

在 ChatInterface.tsx 中添加：

```typescript
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const [confirmDialog, setConfirmDialog] = useState<{
  open: boolean;
  operation?: Operation;
}>({ open: false });

const handleConfirm = (operation: Operation) => {
  // 显示确认对话框
  setConfirmDialog({ open: true, operation });
};

const handleConfirmExecute = async () => {
  if (!confirmDialog.operation) return;
  
  try {
    // TODO: 执行真实的区块链交易
    console.log('执行操作:', confirmDialog.operation);
    
    // 关闭对话框
    setConfirmDialog({ open: false });
    
    // 显示成功消息
    alert('交易已提交！');
  } catch (error) {
    console.error('交易失败:', error);
    alert('交易失败: ' + error.message);
  }
};

// 在 return 中添加：
<Dialog
  open={confirmDialog.open}
  onClose={() => setConfirmDialog({ open: false })}
>
  <DialogTitle>确认交易</DialogTitle>
  <DialogContent>
    <Typography variant="body1" sx={{ mb: 2 }}>
      请确认以下交易信息：
    </Typography>
    {confirmDialog.operation && (
      <Box>
        <Typography><strong>操作:</strong> {confirmDialog.operation.action}</Typography>
        <Typography><strong>资产:</strong> {confirmDialog.operation.asset}</Typography>
        <Typography><strong>金额:</strong> {confirmDialog.operation.amount}</Typography>
        <Typography><strong>接收地址:</strong> {confirmDialog.operation.recipient}</Typography>
        <Typography><strong>Gas 费用:</strong> {confirmDialog.operation.gasEstimate}</Typography>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDialog({ open: false })} color="secondary">
      取消
    </Button>
    <Button onClick={handleConfirmExecute} variant="contained" color="primary">
      确认执行
    </Button>
  </DialogActions>
</Dialog>
```

## 🧪 测试流程

### 测试上下文记忆
1. 输入: "转 100 USDT 给小明"
2. AI 返回表单
3. 填写地址: "0x742d35..."  
4. 提交表单
5. AI 应该记住之前的对话，直接生成确认卡片

### 测试表单输入
1. 输入: "转账 USDT"
2. 应该看到表单 UI
3. 填写地址和金额
4. 点击提交
5. 应该生成新消息并调用 AI

### 测试二次确认
1. 完成转账信息填写
2. 点击"确认操作"
3. 应该弹出对话框
4. 再次确认才执行

## 📊 API 测试

### 测试上下文
```bash
# 第一轮
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"转 100 USDT 给小明","history":[]}'

# 第二轮（带历史）
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "history":[
      {"role":"user","content":"转 100 USDT 给小明"},
      {"role":"assistant","content":"好的，我来帮你转 100 USDT。请填写表单："}
    ]
  }'
```

## 🎯 预期效果

### 对话流程
```
用户: "转 100 USDT 给小明"
AI: "好的，请填写下面的表单："
   [显示表单：收款地址、金额]

用户: [填写表单并提交]
AI: "收到！我已经准备好转账..."
   [显示警告 + 确认卡片]

用户: [点击"确认操作"]
   [弹出二次确认对话框]

用户: [再次确认]
   [执行真实交易]
```

## ⚠️ 注意事项

1. **历史消息管理**
   - 只保留最近 10 条
   - 排除欢迎消息
   - 发送前转换为简单格式

2. **表单验证**
   - 前端验证地址格式
   - 检查必填字段
   - 数字类型验证

3. **二次确认**
   - 所有涉及资产的操作都需要二次确认
   - 显示完整交易信息
   - 用户明确点击才执行

4. **错误处理**
   - API 调用失败的提示
   - 交易执行失败的回滚
   - 网络错误的重试机制

## 🚀 后续优化

1. **会话管理**
   - 支持多个会话标签页
   - 会话历史持久化
   - 会话导出/导入

2. **表单增强**
   - 地址簿选择
   - 金额快捷输入（25%, 50%, 75%, 100%）
   - 实时余额显示
   - Gas 费用估算

3. **确认优化**
   - 交易模拟预览
   - 风险评分显示
   - 交易时间轴
   - 签名可视化

---

**当前状态**: 后端完成 ✅ | 前端需实现 ⏳
