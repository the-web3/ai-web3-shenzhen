/**
 * Stake Calculator - 流动性计算逻辑
 *
 * 这个模块包含与智能合约一致的流动性计算逻辑，
 * 用于前端实时计算和验证用户输入。
 */

export interface ShareCalculation {
  yes: number;
  no: number;
  total: number;
}

export interface PriceValidation {
  isValid: boolean;
  error?: string;
}

export interface TradeCalculation {
  shares: number;
  cost: number;
  priceImpact: number;
  newPrice: number;
}

/**
 * 计算基于质押金额和价格分布的份额分配
 * 匹配智能合约中的 calculateShares 逻辑
 */
export function calculateShares(
  stakeAmount: number,
  yesPrice: number,
  noPrice: number,
): ShareCalculation {
  // 验证价格总和
  if (Math.abs(yesPrice + noPrice - 1) > 0.001) {
    throw new Error("价格总和必须等于1");
  }

  // 根据价格分布计算份额
  // 价格越低，获得的份额越多（更好的赔率）
  const yesShares = stakeAmount / yesPrice;
  const noShares = stakeAmount / noPrice;

  return {
    yes: yesShares,
    no: noShares,
    total: yesShares + noShares,
  };
}

/**
 * 验证价格设置是否有效
 */
export function validatePrices(
  yesPrice: number,
  noPrice: number,
): PriceValidation {
  // 检查价格范围
  if (yesPrice < 0.01 || yesPrice > 0.99) {
    return {
      isValid: false,
      error: "YES价格必须在1%到99%之间",
    };
  }

  if (noPrice < 0.01 || noPrice > 0.99) {
    return {
      isValid: false,
      error: "NO价格必须在1%到99%之间",
    };
  }

  // 检查价格总和
  const sum = yesPrice + noPrice;
  if (Math.abs(sum - 1) > 0.001) {
    return {
      isValid: false,
      error: `价格总和必须等于100% (当前: ${(sum * 100).toFixed(1)}%)`,
    };
  }

  return { isValid: true };
}

/**
 * 计算AMM交易的价格影响和成本
 * 基于恒定乘积公式 (x * y = k)
 */
export function calculateAMMTrade(
  currentYesShares: number,
  currentNoShares: number,
  tradeAmount: number,
  isYesTrade: boolean,
  isBuy: boolean,
): TradeCalculation {
  const k = currentYesShares * currentNoShares; // 恒定乘积

  let newYesShares: number;
  let newNoShares: number;
  let shares: number;
  let cost: number;

  if (isBuy) {
    if (isYesTrade) {
      // 买入YES份额：增加NO池，减少YES池
      newNoShares = currentNoShares + tradeAmount;
      newYesShares = k / newNoShares;
      shares = currentYesShares - newYesShares;
      cost = tradeAmount;
    } else {
      // 买入NO份额：增加YES池，减少NO池
      newYesShares = currentYesShares + tradeAmount;
      newNoShares = k / newYesShares;
      shares = currentNoShares - newNoShares;
      cost = tradeAmount;
    }
  } else {
    // 卖出份额
    if (isYesTrade) {
      // 卖出YES份额：增加YES池，减少NO池
      newYesShares = currentYesShares + tradeAmount;
      newNoShares = k / newYesShares;
      shares = tradeAmount;
      cost = currentNoShares - newNoShares;
    } else {
      // 卖出NO份额：增加NO池，减少YES池
      newNoShares = currentNoShares + tradeAmount;
      newYesShares = k / newNoShares;
      shares = tradeAmount;
      cost = currentYesShares - newYesShares;
    }
  }

  // 计算新价格
  const totalShares = newYesShares + newNoShares;
  const newYesPrice = newYesShares / totalShares;
  const newNoPrice = newNoShares / totalShares;
  const newPrice = isYesTrade ? newYesPrice : newNoPrice;

  // 计算价格影响
  const oldPrice = isYesTrade
    ? currentYesShares / (currentYesShares + currentNoShares)
    : currentNoShares / (currentYesShares + currentNoShares);
  const priceImpact = Math.abs(newPrice - oldPrice) / oldPrice;

  return {
    shares: Math.max(0, shares),
    cost: Math.max(0, cost),
    priceImpact,
    newPrice,
  };
}

/**
 * 计算当前市场价格
 */
export function getCurrentPrices(
  yesShares: number,
  noShares: number,
): {
  yesPrice: number;
  noPrice: number;
} {
  const total = yesShares + noShares;

  if (total === 0) {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }

  return {
    yesPrice: yesShares / total,
    noPrice: noShares / total,
  };
}

/**
 * 计算滑点保护的最小输出
 */
export function calculateMinOutput(
  expectedOutput: number,
  slippageTolerance: number = 0.01, // 1% 默认滑点容忍度
): number {
  return expectedOutput * (1 - slippageTolerance);
}

/**
 * 计算交易手续费
 */
export function calculateTradingFee(
  amount: number,
  feeBasisPoints: number = 200, // 2% 默认手续费
): number {
  return amount * (feeBasisPoints / 10000);
}

/**
 * 计算创建者奖励
 */
export function calculateCreatorReward(
  totalFees: number,
  rewardBasisPoints: number = 2000, // 20% 默认创建者奖励
): number {
  return totalFees * (rewardBasisPoints / 10000);
}

/**
 * 格式化数字显示
 */
export function formatNumber(
  value: number,
  decimals: number = 4,
  compact: boolean = false,
): string {
  if (compact && value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (compact && value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }

  return value.toFixed(decimals);
}

/**
 * 格式化百分比显示
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + "%";
}

/**
 * 计算年化收益率 (APY)
 */
export function calculateAPY(
  initialValue: number,
  finalValue: number,
  daysHeld: number,
): number {
  if (initialValue <= 0 || daysHeld <= 0) return 0;

  const dailyReturn = finalValue / initialValue - 1;
  const annualizedReturn = Math.pow(1 + dailyReturn, 365 / daysHeld) - 1;

  return annualizedReturn;
}

/**
 * 实时更新计算器类
 * 用于组件中的实时计算和验证
 */
export class StakeCalculator {
  private yesPrice: number = 0.5;
  private noPrice: number = 0.5;
  private stakeAmount: number = 0.1;
  private listeners: Array<() => void> = [];

  constructor(initialYesPrice: number = 0.5, initialStakeAmount: number = 0.1) {
    this.updatePrices(initialYesPrice, 1 - initialYesPrice);
    this.stakeAmount = initialStakeAmount;
  }

  /**
   * 更新价格分布
   */
  updatePrices(yesPrice: number, noPrice: number): void {
    const validation = validatePrices(yesPrice, noPrice);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    this.yesPrice = yesPrice;
    this.noPrice = noPrice;
    this.notifyListeners();
  }

  /**
   * 更新质押金额
   */
  updateStakeAmount(amount: number): void {
    if (amount < 0) {
      throw new Error("质押金额不能为负数");
    }

    this.stakeAmount = amount;
    this.notifyListeners();
  }

  /**
   * 获取当前计算结果
   */
  getCalculation(): ShareCalculation & { isValid: boolean; error?: string } {
    try {
      const shares = calculateShares(
        this.stakeAmount,
        this.yesPrice,
        this.noPrice,
      );
      return { ...shares, isValid: true };
    } catch (error) {
      return {
        yes: 0,
        no: 0,
        total: 0,
        isValid: false,
        error: error instanceof Error ? error.message : "计算错误",
      };
    }
  }

  /**
   * 添加变化监听器
   */
  addListener(listener: () => void): () => void {
    this.listeners.push(listener);

    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      yesPrice: this.yesPrice,
      noPrice: this.noPrice,
      stakeAmount: this.stakeAmount,
    };
  }
}
