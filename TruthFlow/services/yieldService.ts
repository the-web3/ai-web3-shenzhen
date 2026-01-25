/**
 * 生息服务 - 计算市场押金的实时利息
 */

export interface YieldConfig {
    enabled: boolean;
    apr: number; // 年化收益率 (%)
    depositAmount: number; // 押金金额 (ETH)
}

export class YieldService {
    // 年化收益率 5%
    private readonly APR = 0.05;

    /**
     * 检查是否应该开启生息
     * @param depositAmount 押金金额 (ETH)
     * @returns 是否开启生息
     */
    shouldEnableYield(depositAmount: number): boolean {
        return depositAmount > 1;
    }

    /**
     * 计算实时累计利息
     * @param depositAmount 押金金额 (ETH)
     * @param createdAt 创建时间戳 (ms)
     * @returns 累计利息 (ETH)
     */
    calculateAccumulatedYield(depositAmount: number, createdAt: number): number {
        if (!this.shouldEnableYield(depositAmount)) {
            return 0;
        }

        const now = Date.now();
        const elapsedSeconds = (now - createdAt) / 1000;
        const elapsedYears = elapsedSeconds / (365 * 24 * 60 * 60);

        // 简单利息计算: 本金 × 年化收益率 × 时间(年)
        const yield_ = depositAmount * this.APR * elapsedYears;

        return yield_;
    }

    /**
     * 获取年化收益率
     */
    getAPR(): number {
        return this.APR;
    }

    /**
     * 计算预期年收益
     * @param depositAmount 押金金额 (ETH)
     */
    calculateYearlyYield(depositAmount: number): number {
        if (!this.shouldEnableYield(depositAmount)) {
            return 0;
        }
        return depositAmount * this.APR;
    }

    /**
     * 格式化利息显示
     * @param yieldAmount 利息金额 (ETH)
     */
    formatYield(yieldAmount: number): string {
        if (yieldAmount < 0.0001) {
            return '< 0.0001 METH';
        }
        return `${yieldAmount.toFixed(6)} METH`;
    }
}

// 创建全局实例
export const yieldService = new YieldService();
