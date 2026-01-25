'use client';
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
} from '@mui/material';
import JSONUIRenderer from '@/components/JSONUIRenderer';
import { AIResponse } from '@/types';

export default function PreviewPage() {
  const [activeTab, setActiveTab] = useState(0);

  // 示例 1: 转账操作 (完整示例)
  const transferExample: AIResponse = {
    problem: {
      type: 'info',
      title: '转账请求已识别',
      description: '您即将执行一笔代币转账操作，请仔细核对以下信息。',
      suggestions: [
        '请确认接收地址准确无误',
        '确保账户余额充足',
        '当前网络 Gas 费用较低，是转账的好时机',
      ],
    },
    operation: {
      action: 'transfer',
      asset: 'USDT',
      amount: 100,
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      chainId: 133,
      gasEstimate: '0.003 HSK (~$8.50)',
      parameters: {
        deadline: Date.now() + 1200000,
        slippage: '0.5%',
        priorityFee: '2 gwei',
      },
    },
    supplement: {
      priceData: {
        symbol: 'USDT',
        currentPrice: 1.0,
        change24h: 0.02,
      },
      riskScore: 25,
      news: [
        {
          title: 'Tether 稳定性报告',
          summary: 'USDT 继续保持与美元的 1:1 锚定，市场信心稳固。',
          timestamp: new Date().toISOString(),
        },
      ],
      alternatives: ['使用 Layer 2 降低费用', '批量转账节省成本', '等待 Gas 更低时段'],
    },
  };

  // 示例 2: 兑换操作 (带警告)
  const swapExample: AIResponse = {
    problem: {
      type: 'warning',
      title: '检测到价格波动',
      description: '当前市场波动较大，兑换价格可能在交易确认期间发生变化。',
      suggestions: [
        '建议设置较高的滑点容差',
        '考虑分批兑换以降低风险',
        '查看流动性池深度',
      ],
    },
    operation: {
      action: 'swap',
      asset: 'HSK → USDC',
      amount: 1.5,
      chainId: 133,
      gasEstimate: '0.005 HSK (~$14.20)',
      parameters: {
        fromToken: 'HSK',
        toToken: 'USDC',
        amountIn: '1.5',
        amountOutMin: '3450.75',
        slippage: '1%',
        dex: 'Uniswap V3',
        priceImpact: '0.15%',
      },
    },
    supplement: {
      priceData: {
        symbol: 'HSK',
        currentPrice: 2301.5,
        change24h: -2.3,
      },
      riskScore: 45,
      news: [
        {
          title: 'HSK 市场更新',
          summary: 'HashKey Token 在近期波动后显示出盘整模式。',
          timestamp: new Date().toISOString(),
        },
      ],
      alternatives: ['等待更好的汇率', '使用限价单', '尝试其他 DEX'],
    },
  };

  // 示例 3: 仅错误提示
  const errorExample: AIResponse = {
    problem: {
      type: 'error',
      title: '余额不足',
      description: '您的账户余额不足以完成此次交易，请充值后重试。',
      suggestions: [
        '从交易所转入资金',
        '减少交易金额',
        '检查是否有其他账户可用余额',
      ],
    },
  };

  // 示例 4: 仅价格查询
  const priceQueryExample: AIResponse = {
    supplement: {
      priceData: {
        symbol: 'BTC',
        currentPrice: 45230.8,
        change24h: 3.7,
      },
      news: [
        {
          title: 'Bitcoin 市场分析',
          summary: '比特币在关键支撑位上方维持强劲走势。',
          timestamp: new Date().toISOString(),
        },
        {
          title: 'DeFi 活动更新',
          summary: '去中心化金融协议中锁定的总价值达到新里程碑。',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    },
  };

  // 示例 5: 质押操作
  const stakeExample: AIResponse = {
    problem: {
      type: 'info',
      title: '质押操作',
      description: '您即将质押 HSK 以获取奖励，质押期间资金将被锁定。',
      suggestions: [
        '了解解除质押需要等待期',
        '确认年化收益率',
        '评估流动性需求',
      ],
    },
    operation: {
      action: 'stake',
      asset: 'HSK',
      amount: 32,
      chainId: 133,
      gasEstimate: '0.008 HSK (~$22.80)',
      parameters: {
        validator: '0x1234567890abcdef1234567890abcdef12345678',
        duration: '无固定期限',
        apy: '4.2%',
        lockPeriod: '解除质押需等待 7-14 天',
      },
    },
    supplement: {
      priceData: {
        symbol: 'HSK',
        currentPrice: 2850.0,
        change24h: 1.2,
      },
      riskScore: 30,
      alternatives: ['流动性质押 (如 Lido)', '定期理财产品', '流动性挖矿'],
    },
  };

  // 示例 6: 高风险操作
  const highRiskExample: AIResponse = {
    problem: {
      type: 'error',
      title: '高风险警告',
      description: '检测到目标地址存在可疑活动记录，强烈建议取消此次交易。',
      suggestions: [
        '验证接收地址来源',
        '咨询专业人士',
        '使用小额测试转账',
      ],
    },
    operation: {
      action: 'transfer',
      asset: 'HSK',
      amount: 5.0,
      recipient: '0xSuspiciousAddress123456789012345678901234',
      chainId: 133,
      gasEstimate: '0.002 HSK (~$5.70)',
    },
    supplement: {
      riskScore: 85,
      news: [
        {
          title: '⚠️ 安全警报',
          summary: '此地址与多起诈骗案件有关联，请谨慎操作！',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  };

  const examples = [
    { label: '转账操作 (完整)', data: transferExample },
    { label: '兑换操作 (警告)', data: swapExample },
    { label: '余额不足 (错误)', data: errorExample },
    { label: '价格查询', data: priceQueryExample },
    { label: '质押操作', data: stakeExample },
    { label: '高风险交易', data: highRiskExample },
  ];

  const handleConfirm = (operation: any) => {
    alert(`已确认操作: ${operation.action}\n金额: ${operation.amount} ${operation.asset}`);
  };

  const handleCancel = () => {
    alert('操作已取消');
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* 标题 */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            JSON UI 组件预览
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            展示 AI 钱包支持的所有 JSON 驱动 UI 组件。AI 根据用户意图返回结构化的 JSON，
            前端自动渲染为友好的确认界面。
          </Typography>
        </Box>

        {/* 说明卡片 */}
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(236, 72, 153, 0.05))' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            AI 响应结构说明
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            每个 AI 响应包含三个可选部分（根据场景灵活组合）：
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'info.main' }}>
                1. Problem（问题分析）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                分析用户请求中的潜在问题或风险，提供建议。支持 info/warning/error 三种类型。
              </Typography>
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                2. Operation（操作提案）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                生成需要用户确认的操作详情，包括资产、金额、接收方、Gas 费用等，支持自定义参数。
              </Typography>
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                3. Supplement（补充信息）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                提供辅助决策的参考信息：实时价格、新闻、风险评分、替代方案等。
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* 选项卡 */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {examples.map((example, idx) => (
              <Tab
                key={idx}
                label={example.label}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* 内容展示 */}
        <Paper sx={{ p: 3, minHeight: 400 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {examples[activeTab].label}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                console.log('JSON 数据：', examples[activeTab].data);
                alert('JSON 数据已输出到控制台');
              }}
            >
              查看 JSON
            </Button>
          </Box>

          <JSONUIRenderer
            data={examples[activeTab].data}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </Paper>

        {/* JSON Schema 说明 */}
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            JSON Schema 参考
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: '#111827',
              color: '#F9FAFB',
              borderRadius: 2,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          >
{`{
  "problem": {                      // [可选] 问题分析
    "type": "info|warning|error",   // 类型
    "title": "标题",
    "description": "详细描述",
    "suggestions": ["建议1", ...]    // 建议列表
  },
  "operation": {                    // [可选] 操作提案
    "action": "transfer|swap|stake|...",
    "asset": "资产名称",
    "amount": 数量,
    "recipient": "接收地址",         // transfer 需要
    "chainId": 链ID,
    "gasEstimate": "Gas估算",
    "parameters": {                  // 自定义参数
      "key": "value"
    }
  },
  "supplement": {                   // [可选] 补充信息
    "priceData": {
      "symbol": "代币符号",
      "currentPrice": 当前价格,
      "change24h": 24h涨跌幅
    },
    "riskScore": 0-100,              // 风险评分
    "news": [                        // 新闻列表
      {
        "title": "标题",
        "summary": "摘要",
        "url": "链接",
        "timestamp": "时间戳"
      }
    ],
    "alternatives": ["替代方案1", ...] // 替代方案
  }
}`}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
