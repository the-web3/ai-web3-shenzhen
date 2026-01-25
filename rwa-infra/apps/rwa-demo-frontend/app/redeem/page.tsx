"use client";

import { useMemo, useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Header } from "../_components/Header";
import { RequireWallet } from "../_components/RequireWallet";
import { rwaManagerAbi, rwa1155Abi } from "../../lib/abi";
import { getEnv } from "../../lib/env";

// Token 配置
const TOKENS = [
  { id: 1, name: "飞天茅台 2023", icon: "", unit: "瓶" },
  { id: 2, name: "五粮液 2023", icon: "", unit: "瓶" },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function RedeemPage() {
  const { isConnected, address } = useAccount();
  const { rwaManager, rwa1155, tokenId1 } = getEnv();

  const [selectedTokenId, setSelectedTokenId] = useState(tokenId1);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");

  const token = TOKENS.find((t) => t.id === selectedTokenId) || TOKENS[0];

  // 查询余额
  const bal = useReadContract({
    abi: rwa1155Abi,
    address: (rwa1155 ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "balanceOf",
    args: [(address ?? ZERO_ADDRESS) as `0x${string}`, BigInt(selectedTokenId)],
    query: { enabled: Boolean(rwa1155 && address) },
  });

  const avail = useReadContract({
    abi: rwaManagerAbi,
    address: (rwaManager ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "availableBalance",
    args: [(address ?? ZERO_ADDRESS) as `0x${string}`, BigInt(selectedTokenId)],
    query: { enabled: Boolean(rwaManager && address) },
  });

  // 查询账户冻结状态
  const accountFrozen = useReadContract({
    abi: rwaManagerAbi,
    address: (rwaManager ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "isAccountFrozen",
    args: [(address ?? ZERO_ADDRESS) as `0x${string}`],
    query: { enabled: Boolean(address && rwaManager) },
  });

  const isAccountFrozen = accountFrozen.data === true;

  const totalBalance = bal.data ?? BigInt(0);
  const availBalance = avail.data ?? BigInt(0);
  const frozenBalance = totalBalance - availBalance;

  // 构建交割信息
  const deliveryInfo = useMemo(() => {
    return `收货人:${deliveryName};电话:${deliveryPhone};地址:${deliveryAddress}`;
  }, [deliveryName, deliveryPhone, deliveryAddress]);
  const deliveryHash = useMemo(() => keccak256(stringToHex(deliveryInfo)), [deliveryInfo]);

  const amountBn = useMemo(() => {
    const n = Number(redeemAmount);
    if (!Number.isFinite(n) || n <= 0) return BigInt(0);
    return BigInt(Math.floor(n));
  }, [redeemAmount]);

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  // 表单验证
  const isFormValid =
    !isAccountFrozen &&
    deliveryName.trim() !== "" &&
    deliveryPhone.trim() !== "" &&
    deliveryAddress.trim() !== "" &&
    amountBn > BigInt(0) &&
    amountBn <= availBalance;

  const handleSubmit = () => {
    if (!rwaManager || !isFormValid || isAccountFrozen) return;
    writeContract({
      abi: rwaManagerAbi,
      address: rwaManager,
      functionName: "requestRedeem",
      args: [BigInt(selectedTokenId), amountBn, deliveryHash],
    });
  };

  // 监听交易成功
  if (receipt.isSuccess && step !== "success") {
    setStep("success");
  }

  const handleReset = () => {
    setRedeemAmount("");
    setDeliveryName("");
    setDeliveryPhone("");
    setDeliveryAddress("");
    setStep("form");
    reset();
  };

  return (
    <>
      <Header />
      <div className="redeemWrap">
        <RequireWallet>
          {/* 账户冻结警告 */}
          {isAccountFrozen && (
            <div className="accountFrozenBanner">
              <span className="frozenIcon">⚠️</span>
              <div className="frozenContent">
                <div className="frozenTitle">账户已被冻结</div>
                <div className="frozenDesc">您的账户已被合规方冻结，无法发起赎回申请。如有疑问请联系管理员。</div>
              </div>
            </div>
          )}

          {/* 资产选择 */}
          <div className="redeemHeader">
            <h1 className="redeemTitle">资产赎回</h1>
            <p className="redeemDesc">
              选择您要赎回的资产类型，填写交割信息后提交申请。
              审核通过后资产将被销毁并完成实物交割。
            </p>
          </div>

          {/* Token 选择卡片 */}
          <div className="tokenCards">
            {TOKENS.map((t) => {
              const isSelected = selectedTokenId === t.id;
              return (
                <button
                  key={t.id}
                  className={`tokenCard ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTokenId(t.id);
                    setRedeemAmount("");
                  }}
                >
                  {t.icon && <span className="tokenCardIcon">{t.icon}</span>}
                  <span className="tokenCardName">{t.name}</span>
                  {isSelected && <span className="tokenCardCheck">✓</span>}
                </button>
              );
            })}
          </div>

          {step === "form" && (
            <div className="redeemForm">
              {/* 持仓信息 */}
              <div className="holdingSummary">
                <div className="holdingItem">
                  <span className="holdingLabel">持有总量</span>
                  <span className="holdingValue">
                    {totalBalance.toString()} {token.unit}
                  </span>
                </div>
                <div className="holdingDivider" />
                <div className="holdingItem">
                  <span className="holdingLabel">可赎回</span>
                  <span className="holdingValue available">
                    {availBalance.toString()} {token.unit}
                  </span>
                </div>
                <div className="holdingDivider" />
                <div className="holdingItem">
                  <span className="holdingLabel">已冻结</span>
                  <span className="holdingValue frozen">
                    {frozenBalance.toString()} {token.unit}
                  </span>
                </div>
              </div>

              {/* 赎回数量 */}
              <div className="formSection">
                <label className="formLabel">赎回数量</label>
                <div className="amountInputWrap">
                  <input
                    type="number"
                    className="amountInput"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    max={availBalance.toString()}
                  />
                  <span className="amountUnit">{token.unit}</span>
                  <button
                    className="maxBtn"
                    onClick={() => setRedeemAmount(availBalance.toString())}
                    disabled={availBalance === BigInt(0)}
                  >
                    最大
                  </button>
                </div>
                {amountBn > availBalance && (
                  <p className="formError">超过可赎回数量</p>
                )}
              </div>

              {/* 交割信息 */}
              <div className="formSection">
                <label className="formLabel">交割信息</label>
                <p className="formHint">
                  请填写实物资产的收货信息，此信息将加密存证上链
                </p>
                <div className="deliveryForm">
                  <input
                    className="deliveryInput"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    placeholder="收货人姓名"
                  />
                  <input
                    className="deliveryInput"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="联系电话"
                  />
                  <input
                    className="deliveryInput full"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="详细收货地址"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                className="submitBtn"
                disabled={!isConnected || !isFormValid || isPending}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <span className="spinner" /> 提交中...
                  </>
                ) : (
                  "提交赎回申请"
                )}
              </button>

              {error && (
                <div className="errorMsg">
                  提交失败：{error.message.slice(0, 100)}
                </div>
              )}

              <p className="formNote">
                * 提交申请后，资产不会立即扣除。需等待管理员审核通过后才会执行销毁。
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="successCard">
              <div className="successIcon">✓</div>
              <h2 className="successTitle">申请已提交</h2>
              <p className="successDesc">
                您的赎回申请已成功提交，请等待管理员审核。
                <br />
                审核通过后将完成资产销毁和实物交割。
              </p>
              <div className="successDetails">
                <div className="successItem">
                  <span>资产类型</span>
                  <span>
                    {token.icon} {token.name}
                  </span>
                </div>
                <div className="successItem">
                  <span>赎回数量</span>
                  <span>
                    {redeemAmount} {token.unit}
                  </span>
                </div>
                <div className="successItem">
                  <span>收货人</span>
                  <span>{deliveryName}</span>
                </div>
              </div>
              <button className="submitBtn" onClick={handleReset}>
                发起新的赎回
              </button>
            </div>
          )}
        </RequireWallet>
      </div>
    </>
  );
}
