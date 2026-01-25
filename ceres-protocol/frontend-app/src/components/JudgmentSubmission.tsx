import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { useNetwork } from "wagmi";
import { calculateShares, validatePrices } from "@/utils/StakeCalculator";
import { ECONOMIC_PARAMS } from "@/config/contracts";
import { getNetworkDiagnostics } from "@/utils/networkUtils";
import {
  Send,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface JudgmentSubmissionProps {
  onSubmit?: (data: JudgmentData) => void;
  className?: string;
}

export interface JudgmentData {
  description: string;
  yesPrice: number;
  noPrice: number;
  stakeAmount: number;
  marketType: "AMM" | "ORDERBOOK";
}

export function JudgmentSubmission({
  onSubmit,
  className = "",
}: JudgmentSubmissionProps) {
  const {
    isConnected,
    isCorrectNetwork,
    balanceFormatted,
    isLoadingBalance,
    balanceError,
    address,
  } = useWeb3();
  const { chain } = useNetwork();

  // Form state
  const [description, setDescription] = useState("");
  const [yesPrice, setYesPrice] = useState(0.5);
  const [noPrice, setNoPrice] = useState(0.5);
  const [stakeAmount, setStakeAmount] = useState(
    parseFloat(ECONOMIC_PARAMS.MIN_STAKE),
  );
  const [marketType, setMarketType] = useState<"AMM" | "ORDERBOOK">("AMM");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Calculated values
  const [expectedShares, setExpectedShares] = useState({ yes: 0, no: 0 });
  const [isValid, setIsValid] = useState(false);

  // Update noPrice when yesPrice changes
  useEffect(() => {
    setNoPrice(1 - yesPrice);
  }, [yesPrice]);

  // Validate form and calculate shares
  const validateAndCalculate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate description
    if (!description.trim()) {
      newErrors.description = "请输入判断描述";
    } else if (description.length > 500) {
      newErrors.description = "描述不能超过500个字符";
    }

    // Validate prices
    const priceValidation = validatePrices(yesPrice, noPrice);
    if (!priceValidation.isValid) {
      newErrors.prices = priceValidation.error || "价格设置无效";
    }

    // Validate stake amount
    const minStake = parseFloat(ECONOMIC_PARAMS.MIN_STAKE);
    if (stakeAmount < minStake) {
      newErrors.stakeAmount = `最低质押金额为 ${minStake} HSK`;
    }

    // Check balance - only validate if balance is loaded and we're on correct network
    if (isConnected && isCorrectNetwork) {
      const userBalance = parseFloat(balanceFormatted || "0");
      console.log("Balance check:", {
        balanceFormatted,
        userBalance,
        stakeAmount,
        isLoadingBalance,
        balanceError: balanceError?.message,
        isCorrectNetwork,
        chainId: chain?.id,
        address,
      });

      if (isLoadingBalance) {
        // 如果余额还在加载中，不显示错误，也不设置为有效
        console.log("Balance is still loading, skipping validation");
        // 不设置错误，但也不允许提交
        newErrors.stakeAmount = "正在加载余额...";
      } else if (balanceError) {
        // 如果有余额读取错误
        newErrors.stakeAmount = `余额读取失败: ${balanceError.message}`;
      } else if (balanceFormatted && stakeAmount > userBalance) {
        newErrors.stakeAmount = `余额不足 (当前: ${userBalance.toFixed(4)} HSK, 需要: ${stakeAmount} HSK)`;
      } else if (!balanceFormatted) {
        // 如果余额加载完成但没有值，可能是网络问题
        newErrors.stakeAmount = "无法读取余额，请检查网络连接";
      }
    }

    setErrors(newErrors);

    // Calculate expected shares if valid
    if (Object.keys(newErrors).length === 0) {
      const shares = calculateShares(stakeAmount, yesPrice, noPrice);
      setExpectedShares(shares);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [description, yesPrice, noPrice, stakeAmount, balanceFormatted]);

  useEffect(() => {
    validateAndCalculate();
  }, [validateAndCalculate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !isConnected || !isCorrectNetwork) {
      return;
    }

    setIsSubmitting(true);

    try {
      const judgmentData: JudgmentData = {
        description: description.trim(),
        yesPrice,
        noPrice,
        stakeAmount,
        marketType,
      };

      await onSubmit?.(judgmentData);

      // Reset form on success
      setDescription("");
      setYesPrice(0.5);
      setStakeAmount(parseFloat(ECONOMIC_PARAMS.MIN_STAKE));
      setMarketType("AMM");
      setShowPreview(false);
    } catch (error) {
      console.error("Failed to submit judgment:", error);
      setErrors({ submit: "提交失败，请重试" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = isValid && isConnected && isCorrectNetwork && !isSubmitting;

  return (
    <div className={`bg-card rounded-3xl p-8 shadow-soft ${className}`}>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-foreground mb-3">
          创建判断事件
        </h2>
        <p className="text-muted-foreground font-medium">
          创建一个新的预测市场，其他用户可以对您的判断进行交易
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description Input */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-3">
            判断描述 *
            <span className="text-xs text-muted-foreground ml-2 font-medium">
              ({description.length}/500)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：全球平均温度是否会在2030年前超过工业化前水平1.5°C？"
            className={`w-full px-4 py-4 bg-card border border-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-foreground placeholder:text-muted-foreground h-32 resize-none ${errors.description ? "border-destructive" : ""}`}
            maxLength={500}
          />
          {errors.description && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              {errors.description}
            </div>
          )}
        </div>

        {/* Market Type Selection */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-3">
            市场类型
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMarketType("AMM")}
              className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 shadow-soft-sm hover:-translate-y-1 ${
                marketType === "AMM"
                  ? "border-primary bg-secondary text-primary shadow-soft"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <div className="font-bold text-lg mb-2">AMM 模式</div>
              <div className="text-sm text-muted-foreground font-medium">
                自动做市商，适合人工判断事件
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMarketType("ORDERBOOK")}
              className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 shadow-soft-sm hover:-translate-y-1 ${
                marketType === "ORDERBOOK"
                  ? "border-primary bg-secondary text-primary shadow-soft"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <div className="font-bold text-lg mb-2">订单簿模式</div>
              <div className="text-sm text-muted-foreground font-medium">
                订单匹配，适合AI生成事件
              </div>
            </button>
          </div>
        </div>

        {/* Price Distribution */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-3">
            价格分布 (YES/NO)
            {errors.prices && (
              <span className="text-destructive text-sm ml-2 font-medium">
                - {errors.prices}
              </span>
            )}
          </label>

          <div className="space-y-6">
            {/* YES Price Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yes" />
                  <span className="text-sm font-bold text-foreground">
                    YES 价格
                  </span>
                </div>
                <span className="text-sm font-black bg-yes-light text-yes px-3 py-1.5 rounded-full">
                  {(yesPrice * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={yesPrice}
                onChange={(e) => setYesPrice(parseFloat(e.target.value))}
                className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer slider-yes"
                style={{
                  background: `linear-gradient(to right, hsl(var(--yes)) 0%, hsl(var(--yes)) ${yesPrice * 100}%, hsl(var(--muted)) ${yesPrice * 100}%, hsl(var(--muted)) 100%)`,
                }}
              />
            </div>

            {/* NO Price Display */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-no" />
                  <span className="text-sm font-bold text-foreground">
                    NO 价格
                  </span>
                </div>
                <span className="text-sm font-black bg-no-light text-no px-3 py-1.5 rounded-full">
                  {(noPrice * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full relative overflow-hidden">
                <div
                  className="h-full bg-no rounded-full transition-all duration-200"
                  style={{ width: `${noPrice * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-secondary rounded-2xl shadow-soft-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm text-primary">
                <div className="font-bold mb-2">价格说明</div>
                <div className="font-medium">
                  价格反映您对事件发生的信心度。YES价格越高，表示您认为事件越可能发生。
                  价格总和始终为100%。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stake Amount */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-3">
            质押金额 (HSK) *
            <span className="text-xs text-muted-foreground ml-2 font-medium">
              最低 {ECONOMIC_PARAMS.MIN_STAKE} HSK
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={ECONOMIC_PARAMS.MIN_STAKE}
              step="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 pr-20 bg-card border border-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-foreground ${errors.stakeAmount ? "border-destructive" : ""}`}
              placeholder={ECONOMIC_PARAMS.MIN_STAKE}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">
              HSK
            </div>
          </div>
          {errors.stakeAmount && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              {errors.stakeAmount}
            </div>
          )}

          {/* Balance Display */}
          <div className="mt-3 text-sm font-medium">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">可用余额:</span>
              <span
                className={`${isLoadingBalance ? "text-muted-foreground" : balanceError ? "text-destructive" : "text-foreground"}`}
              >
                {isLoadingBalance ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                    加载中...
                  </span>
                ) : balanceError ? (
                  <span className="text-destructive">读取失败</span>
                ) : balanceFormatted ? (
                  `${parseFloat(balanceFormatted).toFixed(4)} HSK`
                ) : (
                  <span className="text-destructive">0.0000 HSK</span>
                )}
              </span>
            </div>
            {balanceError && (
              <div className="text-xs text-destructive mt-1">
                错误: {balanceError.message}
              </div>
            )}
            {!isLoadingBalance &&
              !balanceError &&
              !balanceFormatted &&
              isConnected &&
              isCorrectNetwork && (
                <div className="text-xs text-destructive mt-1">
                  无法读取余额，请检查网络连接或稍后重试
                </div>
              )}
          </div>
        </div>

        {/* Expected Shares Preview */}
        {isValid && (
          <div className="p-6 bg-muted rounded-2xl shadow-soft-sm">
            <h3 className="font-bold text-foreground mb-4 text-lg">
              预期份额分配
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-yes mb-1">
                  {expectedShares.yes.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  YES 份额
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-no mb-1">
                  {expectedShares.no.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  NO 份额
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground font-medium space-y-1">
              <div>
                • 创建者奖励: {ECONOMIC_PARAMS.CREATOR_REWARD_BPS / 100}%
                手续费分润
              </div>
              <div>
                • 绿色积分奖励: {ECONOMIC_PARAMS.GREEN_POINTS_REWARD} 积分
              </div>
              <div>• 交易手续费: {ECONOMIC_PARAMS.TRADING_FEE_BPS / 100}%</div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!isValid}
            className="flex-1 px-6 py-4 bg-muted text-foreground rounded-2xl font-bold transition-all duration-200 hover:-translate-y-1 press-down shadow-soft-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showPreview ? "隐藏预览" : "预览"}
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 px-6 py-4 btn-jelly flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSubmitting ? "提交中..." : "创建判断事件"}
          </button>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="p-4 bg-secondary border border-primary/20 rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              请先连接钱包
            </div>
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              请切换到 HashKey Chain 测试网
            </div>
          </div>
        )}

        {/* Debug Section - 仅在开发环境显示 */}
        {isConnected && process.env.NODE_ENV === "development" && (
          <div className="p-4 bg-muted border border-border rounded-2xl shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                网络调试
              </span>
              <button
                type="button"
                onClick={async () => {
                  console.log("=== 网络诊断开始 ===");
                  const diagnostics = await getNetworkDiagnostics(address);
                  console.log("网络诊断结果:", diagnostics);

                  // 显示详细的诊断信息
                  const balanceInfo = diagnostics.balance?.success
                    ? `${diagnostics.balance.balanceFormatted} HSK`
                    : `读取失败: ${diagnostics.balance?.error}`;

                  const connectionInfo = diagnostics.connection?.success
                    ? `连接正常 (延迟: ${diagnostics.connection.latency}ms, 区块: ${diagnostics.connection.blockNumber})`
                    : `连接失败: ${diagnostics.connection?.error}`;

                  alert(
                    `网络诊断完成:\n\n连接状态: ${connectionInfo}\n余额: ${balanceInfo}\n\n详细信息请查看控制台`,
                  );
                }}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
              >
                测试网络连接
              </button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>地址: {address}</div>
              <div>
                网络: {chain?.name} (ID: {chain?.id})
              </div>
              <div>
                余额状态:{" "}
                {isLoadingBalance
                  ? "加载中"
                  : balanceFormatted
                    ? `${balanceFormatted} HSK`
                    : "读取失败"}
              </div>
              <div>网络正确: {isCorrectNetwork ? "是" : "否"}</div>
              <div>
                RPC: {isCorrectNetwork ? "https://testnet.hsk.xyz" : "未连接"}
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="p-4 bg-secondary border border-primary/20 rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              请先连接钱包
            </div>
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              请切换到 HashKey Chain 测试网
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {errors.submit}
            </div>
          </div>
        )}
      </form>

      {/* Preview Modal */}
      {showPreview && isValid && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-soft-lg">
            <div className="p-8">
              <h3 className="text-2xl font-black text-foreground mb-6">
                判断事件预览
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2 font-medium">
                    描述
                  </div>
                  <div className="p-4 bg-muted rounded-2xl text-sm font-medium text-foreground">
                    {description}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2 font-medium">
                    市场类型
                  </div>
                  <div className="font-bold text-foreground">{marketType}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2 font-medium">
                      YES 价格
                    </div>
                    <div className="font-black text-yes text-xl">
                      {(yesPrice * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2 font-medium">
                      NO 价格
                    </div>
                    <div className="font-black text-no text-xl">
                      {(noPrice * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2 font-medium">
                    质押金额
                  </div>
                  <div className="font-black text-foreground text-xl">
                    {stakeAmount} HSK
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 bg-muted text-foreground rounded-2xl font-bold transition-all duration-200 hover:-translate-y-1 press-down shadow-soft-sm"
                >
                  关闭
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 btn-jelly px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
