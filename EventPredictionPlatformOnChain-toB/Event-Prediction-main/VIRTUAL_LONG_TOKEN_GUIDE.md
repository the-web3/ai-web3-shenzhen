# 虚拟 Long Token 模型使用指南

## 📖 概述

本系统采用虚拟 Long Token 模型实现去中心化预测市场，基于 Polymarket 的完整集合模型 (Complete Set Model)。

---

## 🎯 核心概念

### 1. 完整集合 (Complete Set)

- **定义**: 1 完整集合 = 1 USDT
- **组成**: 每个完整集合包含所有结果各 1 份 Long Token
- **示例**: 世界杯有 4 支队，1 完整集合 = 1 阿根廷Long + 1 巴西Long + 1 法国Long + 1 德国Long

### 2. 虚拟 Long Token

- **类型**: Mapping-based 虚拟代币，非 ERC-1155
- **优势**: Gas 成本降低 2-5x，实现简单
- **权衡**: 不支持二级市场交易 (可通过 Wrapper 升级)

### 3. 资金流

```
USDT → mintCompleteSet() → Long Token → 订单簿交易 → 事件结算 → USDT
```

---

## 🚀 快速开始

### 步骤 1: 入金

```solidity
// 批准 USDT 给 FundingManager
IERC20(USDT).approve(address(fundingManager), 100 ether);

// 入金到 FundingPod
fundingManager.depositErc20IntoPod(fundingPod, USDT, 100 ether);
```

**结果**: userTokenBalances[user][USDT] = 100 ether

---

### 步骤 2: 铸造完整集合

```solidity
// 铸造 100 个完整集合
fundingManager.mintCompleteSet(
    fundingPod,
    eventId,      // 事件 ID
    USDT,         // Token 地址
    100 ether     // 数量
);
```

**结果**:
- userTokenBalances[user][USDT]: 100 → 0
- longPositions[user][USDT][eventId][阿根廷]: 0 → 100
- longPositions[user][USDT][eventId][巴西]: 0 → 100
- longPositions[user][USDT][eventId][法国]: 0 → 100
- longPositions[user][USDT][eventId][德国]: 0 → 100

---

### 步骤 3: 交易 Long Token

#### 3a. 卖出 Long Token

```solidity
// 卖出 100 份 "法国" Long @ 0.2
orderBookManager.placeOrder(
    eventId,
    法国OutcomeId,
    IOrderBookPod.OrderSide.Sell,
    2000,         // 价格 0.2 (2000 basis points)
    100 ether,    // 数量
    USDT
);
```

**资金流**:
- longPositions[user][USDT][eventId][法国]: 100 → 0
- orderLockedLong[orderId][eventId][法国]: 0 → 100

#### 3b. 买入 Long Token

```solidity
// 买入 100 份 "法国" Long @ 0.2
orderBookManager.placeOrder(
    eventId,
    法国OutcomeId,
    IOrderBookPod.OrderSide.Buy,
    2000,         // 价格 0.2
    100 ether,    // 数量
    USDT
);
```

**资金流**:
- userTokenBalances[buyer][USDT]: 100 → 80
- orderLockedUSDT[orderId]: 0 → 20

---

### 步骤 4: 撮合成交 (自动)

系统自动撮合买卖单:

```
买家支付: 20 USDT
卖家获得: 20 USDT
买家获得: 100 法国Long
卖家失去: 100 法国Long
奖金池增加: 100 (完整集合价值)
```

---

### 步骤 5: 查询持仓

```solidity
// 查询用户 USDT 余额
uint256 balance = fundingManager.getUserBalance(
    fundingPod,
    userAddress,
    USDT
);

// 查询用户 Long Token 持仓
uint256 longPosition = fundingManager.getLongPosition(
    fundingPod,
    userAddress,
    USDT,
    eventId,
    法国OutcomeId
);

// 查询事件奖金池
uint256 prizePool = fundingManager.getEventPrizePool(
    fundingPod,
    eventId,
    USDT
);
```

---

### 步骤 6: 事件结算 (预言机)

```solidity
// 预言机提交结果
eventPod.fulfillResult(requestId, eventId, 法国OutcomeId, merkleProof);

// FundingPod 自动结算
// 持有 "法国" Long 的用户按比例分配奖金池
```

**结算公式**:
```
reward = (prizePool * userLongPosition) / totalWinningLongPositions
```

---

### 步骤 7: 销毁完整集合 (可选)

如果用户持有完整集合 (所有结果各 N 份)，可以销毁换回 USDT:

```solidity
fundingManager.burnCompleteSet(
    fundingPod,
    eventId,
    USDT,
    100 ether
);
```

**结果**:
- longPositions[user][USDT][eventId][阿根廷]: 100 → 0
- longPositions[user][USDT][eventId][巴西]: 100 → 0
- longPositions[user][USDT][eventId][法国]: 100 → 0
- longPositions[user][USDT][eventId][德国]: 100 → 0
- userTokenBalances[user][USDT]: 0 → 100

---

## 📊 完整交易示例

### 场景: 世界杯冠军预测

```solidity
// ===== Alice 操作 =====

// 1. 入金 100 USDT
fundingManager.depositErc20IntoPod(fundingPod, USDT, 100 ether);

// 2. 铸造完整集合
fundingManager.mintCompleteSet(fundingPod, worldCupEventId, USDT, 100 ether);
// 获得: 阿根廷 100, 巴西 100, 法国 100, 德国 100

// 3. 卖出不看好的队伍
orderBookManager.placeOrder(
    worldCupEventId,
    法国OutcomeId,
    Sell,
    2000,  // 价格 0.2
    100 ether,
    USDT
);
orderBookManager.placeOrder(
    worldCupEventId,
    德国OutcomeId,
    Sell,
    1000,  // 价格 0.1
    100 ether,
    USDT
);


// ===== Bob 操作 =====

// 1. 入金 100 USDT
fundingManager.depositErc20IntoPod(fundingPod, USDT, 100 ether);

// 2. 买入 "法国"
orderBookManager.placeOrder(
    worldCupEventId,
    法国OutcomeId,
    Buy,
    2000,
    100 ether,
    USDT
);
// 撮合: Bob 支付 20 USDT,获得 100 法国Long
//      Alice 获得 20 USDT


// ===== Charlie 操作 =====

// 1. 入金 100 USDT
fundingManager.depositErc20IntoPod(fundingPod, USDT, 100 ether);

// 2. 买入 "德国"
orderBookManager.placeOrder(
    worldCupEventId,
    德国OutcomeId,
    Buy,
    1000,
    100 ether,
    USDT
);
// 撮合: Charlie 支付 10 USDT,获得 100 德国Long
//      Alice 获得 10 USDT


// ===== 事件结算 (法国获胜) =====

// 预言机提交结果
eventPod.fulfillResult(requestId, worldCupEventId, 法国OutcomeId, proof);

// 奖金池正确计算:
// - Alice 铸造 100 完整集合: 奖金池 += 100
// - Bob 买 100 法国 @ 0.2 撮合: 奖金池不变 (仅 USDT 和 Long 交换)
// - Charlie 买 100 德国 @ 0.1 撮合: 奖金池不变
// - 总奖金池 = 100 USDT ✅

// Bob 持有 100 法国Long
// reward = (prizePool * 100) / 100 = 100 USDT
// Bob 最终余额: 80 + 100 = 180 USDT
// Bob 净利润: 180 - 100 = 80 USDT ✅


// ===== 最终结果 =====
// Alice: 100 - 100 + 30 = 30 USDT (亏 70)
// Bob: 100 - 20 + 100 = 180 USDT (赚 80)  ✅
// Charlie: 100 - 10 = 90 USDT (亏 10)
// 总计: 30 + 180 + 90 = 300 USDT ✅ (守恒)
// 验证: 70 + 10 = 80 ✅
```

---

## 🔍 关键函数参考

### FundingManager

| 函数 | 功能 | Gas |
|------|------|-----|
| depositErc20IntoPod() | ERC20 入金 | 低 |
| withdrawFromPod() | 提现 | 低 |
| mintCompleteSet() | 铸造完整集合 | 中等 |
| burnCompleteSet() | 销毁完整集合 | 中等 |
| getUserBalance() | 查询余额 | 0 |
| getLongPosition() | 查询持仓 | 0 |

### OrderBookManager

| 函数 | 功能 | Gas |
|------|------|-----|
| placeOrder() | 下单 | 高 |
| cancelOrder() | 撤单 | 中等 |

### FundingPod (内部)

| 函数 | 功能 | 说明 |
|------|------|------|
| registerEvent() | 注册事件 | OrderBookPod 自动调用 |
| lockForOrder() | 锁定资金 | OrderBookPod 自动调用 |
| unlockForOrder() | 解锁资金 | OrderBookPod 自动调用 |
| settleMatchedOrder() | 结算撮合 | OrderBookPod 自动调用 |
| settleEvent() | 事件结算 | EventPod 自动调用 |

---

## ⚠️ 重要提示

### 1. 铸造完整集合的必要性

卖单必须先持有 Long Token，有两种方式:
- **方式 A**: 铸造完整集合 → 卖出部分 Long
- **方式 B**: 从买单中获得 Long → 再卖出

### 2. 销毁完整集合的条件

必须持有所有结果各 N 份 Long Token 才能销毁:
```solidity
// ✅ 可以销毁:
阿根廷: 100, 巴西: 100, 法国: 100, 德国: 100

// ❌ 无法销毁:
阿根廷: 100, 巴西: 100, 法国: 0, 德国: 100
```

### 3. 奖金池计算

奖金池只在撮合时增加:
```
奖金池 = Σ 所有撮合的 matchAmount
```

### 4. 事件结算

只有持有获胜结果 Long Token 的用户才能获得奖金:
```
reward = (prizePool * userLongPosition) / totalWinningLongPositions
```

---

## 🔧 故障排查

### 问题 1: mintCompleteSet 失败

**原因**: 余额不足
```
Error: InsufficientBalance(user, token, amount, availableBalance)
```

**解决**: 先调用 depositErc20IntoPod() 入金

---

### 问题 2: placeOrder 卖单失败

**原因**: 没有 Long Token
```
Error: InsufficientLongPosition(user, token, eventId, outcomeId)
```

**解决**: 先调用 mintCompleteSet() 或从买单中获得 Long

---

### 问题 3: burnCompleteSet 失败

**原因**: 不持有完整集合
```
Error: InsufficientLongPosition(user, token, eventId, outcomes[i])
```

**解决**: 确保持有所有结果各 N 份 Long Token

---

## 📚 进阶主题

### 1. 做市策略

```solidity
// 做市商流程:
// 1. 铸造完整集合 (成本: 1 USDT)
// 2. 分别卖出所有结果
// 3. 如果 Σ 卖出价格 > 1,则盈利

// 示例:
// 铸造 100 完整集合,成本 100 USDT
// 卖出: 阿根廷 @ 0.4 → 收 40
//      巴西 @ 0.3 → 收 30
//      法国 @ 0.2 → 收 20
//      德国 @ 0.15 → 收 15
// 总收入: 105 USDT
// 利润: 5 USDT
```

### 2. 套利机会

如果 Σ 所有结果价格 ≠ 1，存在套利空间:
- **价格和 > 1**: 铸造 → 卖出 → 盈利
- **价格和 < 1**: 买入 → 销毁 → 盈利

### 3. 风险对冲

持有完整集合 = 零风险 (任何结果都能兑换 1 USDT)

---

## 🎉 总结

虚拟 Long Token 模型提供了:
- ✅ 清晰的资金流
- ✅ 公平的交易机制
- ✅ 低 Gas 成本
- ✅ 多结果市场原生支持
- ✅ 灵活的做市和套利机会

开始使用预测市场吧！
