"use client";

import { useEffect, useMemo, useState } from "react";
import { keccak256, parseAbiItem, stringToHex } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Header } from "../_components/Header";
import { rwaManagerAbi } from "../../lib/abi";
import { getEnv } from "../../lib/env";
import { useMounted } from "../../lib/useMounted";
import { shortAddr } from "../../lib/format";

type PendingRedeem = {
  requestId: string;
  requester: string;
  tokenId: string;
  amount: string;
  blockNumber: string;
  timestamp?: string;
};

function hash32(s: string) {
  return keccak256(stringToHex(s));
}

// Token 配置
const TOKENS = [
  { id: 1, name: "飞天茅台 2023", icon: "", unit: "瓶" },
  { id: 2, name: "五粮液 2023", icon: "", unit: "瓶" },
];

type Role = "issuer" | "compliance" | "none";

export default function AdminPage() {
  const mounted = useMounted();
  const publicClient = usePublicClient();
  const { isConnected, isConnecting, isReconnecting, address } = useAccount();
  const { rwaManager, issuer, compliance } = getEnv();

  // 判断当前用户角色
  const role: Role = useMemo(() => {
    if (!address) return "none";
    const addr = address.toLowerCase();
    if (addr === issuer.toLowerCase()) return "issuer";
    if (addr === compliance.toLowerCase()) return "compliance";
    return "none";
  }, [address, issuer, compliance]);

  const [selectedTokenId, setSelectedTokenId] = useState(1);
  const token = TOKENS.find((t) => t.id === selectedTokenId) || TOKENS[0];

  // 待审批赎回申请列表
  const [pendingRedeems, setPendingRedeems] = useState<PendingRedeem[]>([]);
  const [loadingRedeems, setLoadingRedeems] = useState(false);

  // 查询待审批的赎回申请
  useEffect(() => {
    if (role !== "compliance" || !publicClient || !rwaManager) return;

    let cancelled = false;
    async function fetchPendingRedeems() {
      setLoadingRedeems(true);
      try {
        const latest = await publicClient!.getBlockNumber();
        const fromBlock = latest > BigInt(10000) ? latest - BigInt(10000) : BigInt(0);

        // 获取所有赎回申请
        const requestedEvent = parseAbiItem(
          "event RedeemRequested(uint256 indexed requestId, address indexed requester, uint256 indexed tokenId, uint256 amount, bytes32 deliveryInfoHash)"
        );
        const requestedLogs = await publicClient!.getLogs({
          address: rwaManager as `0x${string}`,
          event: requestedEvent,
          fromBlock,
          toBlock: latest,
        });

        // 获取所有已审批的
        const approvedEvent = parseAbiItem(
          "event RedeemApproved(uint256 indexed requestId, address indexed approver, bytes32 evidenceHash)"
        );
        const approvedLogs = await publicClient!.getLogs({
          address: rwaManager as `0x${string}`,
          event: approvedEvent,
          fromBlock,
          toBlock: latest,
        });

        // 找出已审批的 requestId
        const approvedIds = new Set(
          approvedLogs.map((l) => String((l.args as { requestId?: bigint })?.requestId ?? ""))
        );

        // 过滤出待审批的
        const pending: PendingRedeem[] = [];
        for (const l of requestedLogs) {
          const args = l.args as {
            requestId?: bigint;
            requester?: string;
            tokenId?: bigint;
            amount?: bigint;
          };
          const rid = String(args.requestId ?? "");
          if (!approvedIds.has(rid)) {
            pending.push({
              requestId: rid,
              requester: String(args.requester ?? ""),
              tokenId: String(args.tokenId ?? ""),
              amount: String(args.amount ?? ""),
              blockNumber: String(l.blockNumber ?? ""),
            });
          }
        }

        // 按 requestId 降序
        pending.sort((a, b) => Number(b.requestId) - Number(a.requestId));

        if (!cancelled) setPendingRedeems(pending);
      } catch (e) {
        console.error("Failed to fetch pending redeems:", e);
      } finally {
        if (!cancelled) setLoadingRedeems(false);
      }
    }

    fetchPendingRedeems();
    return () => {
      cancelled = true;
    };
  }, [role, publicClient, rwaManager]);

  // Issuer: 发行
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("10");
  const [mintDoc, setMintDoc] = useState("");

  // Compliance: 冻结/解冻账户
  const [freezeAcctAddr, setFreezeAcctAddr] = useState("");
  const [freezeAcctEvidence, setFreezeAcctEvidence] = useState("");
  const [unfreezeAcctAddr, setUnfreezeAcctAddr] = useState("");
  const [unfreezeAcctEvidence, setUnfreezeAcctEvidence] = useState("");

  // Compliance: 冻结/解冻份额
  const [freezeBalAddr, setFreezeBalAddr] = useState("");
  const [freezeBalAmount, setFreezeBalAmount] = useState("1");
  const [freezeBalEvidence, setFreezeBalEvidence] = useState("");
  const [unfreezeBalAddr, setUnfreezeBalAddr] = useState("");
  const [unfreezeBalAmount, setUnfreezeBalAmount] = useState("1");
  const [unfreezeBalEvidence, setUnfreezeBalEvidence] = useState("");

  // Compliance: 审批赎回
  const [approveRequestId, setApproveRequestId] = useState("");
  const [approveEvidence, setApproveEvidence] = useState("");

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const mintAmountBn = useMemo(() => BigInt(Math.max(0, Math.floor(Number(mintAmount) || 0))), [mintAmount]);
  const freezeBalAmountBn = useMemo(() => BigInt(Math.max(0, Math.floor(Number(freezeBalAmount) || 0))), [freezeBalAmount]);
  const unfreezeBalAmountBn = useMemo(() => BigInt(Math.max(0, Math.floor(Number(unfreezeBalAmount) || 0))), [unfreezeBalAmount]);
  const approveRidBn = useMemo(() => BigInt(Math.max(0, Math.floor(Number(approveRequestId) || 0))), [approveRequestId]);

  const disabledBase = !isConnected || !rwaManager || isPending;

  // 未挂载或正在连接时显示空白
  if (!mounted || isConnecting || isReconnecting) {
    return (
      <>
        <Header />
        <div className="adminWrap" />
      </>
    );
  }

  // 未连接钱包
  if (!isConnected) {
    return (
      <>
        <Header />
        <div className="adminWrap">
          <div className="adminNoAccess">
            <div className="noAccessIcon">🔒</div>
            <h2>请先连接钱包</h2>
            <p>连接钱包后将根据您的地址判断管理权限</p>
          </div>
        </div>
      </>
    );
  }

  // 无权限
  if (role === "none") {
    return (
      <>
        <Header />
        <div className="adminWrap">
          <div className="adminNoAccess">
            <div className="noAccessIcon">🚫</div>
            <h2>无访问权限</h2>
            <p>当前地址不是发行方或合规方，无法访问管理后台。</p>
            <div className="noAccessAddr">
              <code>{address}</code>
            </div>
            <div className="noAccessHint">
              <div>发行方地址: <code>{issuer}</code></div>
              <div>合规方地址: <code>{compliance}</code></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="adminWrap">
        {/* 角色标识 */}
        <div className="adminHeader">
          <div className="adminRole">
            <span className={`roleBadge ${role}`}>
              {role === "issuer" ? "🏛️ 发行方" : "⚖️ 合规方"}
            </span>
          </div>
          <h1 className="adminTitle">管理后台</h1>
          <p className="adminDesc">
            {role === "issuer"
              ? "您拥有资产发行权限，可以为用户铸造 RWA 代币。"
              : "您拥有合规管理权限，可以冻结/解冻账户、份额，以及审批赎回申请。"}
          </p>
        </div>

        {/* Token 选择 */}
        <div className="tokenCards" style={{ marginBottom: 24, justifyContent: "flex-start" }}>
          {TOKENS.map((t) => {
            const isSelected = selectedTokenId === t.id;
            return (
              <button
                key={t.id}
                className={`tokenCard ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedTokenId(t.id)}
              >
                {t.icon && <span className="tokenCardIcon">{t.icon}</span>}
                <span className="tokenCardName">{t.name}</span>
                {isSelected && <span className="tokenCardCheck">✓</span>}
              </button>
            );
          })}
        </div>

        {/* 交易状态 */}
        {(txHash || error) && (
          <div className={`txStatus ${receipt.isSuccess ? "success" : error ? "error" : "pending"}`}>
            {receipt.isSuccess && (
              <>
                <span className="txStatusIcon">✓</span>
                <span>交易成功</span>
              </>
            )}
            {receipt.isLoading && (
              <>
                <span className="spinner" />
                <span>交易确认中...</span>
              </>
            )}
            {error && (
              <>
                <span className="txStatusIcon">✕</span>
                <span>交易失败: {error.message.slice(0, 60)}...</span>
              </>
            )}
            <button className="txStatusClose" onClick={reset}>×</button>
          </div>
        )}

        {/* 发行方功能 */}
        {role === "issuer" && (
          <div className="adminSection">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                资产发行
              </h2>
              <p className="sectionDesc">向用户铸造新的 RWA 代币</p>
            </div>
            <div className="adminCard">
              <div className="formGrid">
                <div className="formField">
                  <label>接收地址</label>
                  <input
                    className="adminInput"
                    value={mintTo}
                    onChange={(e) => setMintTo(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <div className="formField">
                  <label>发行数量</label>
                  <div className="inputWithUnit">
                    <input
                      type="number"
                      className="adminInput"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="0"
                    />
                    <span className="inputUnit">{token.unit}</span>
                  </div>
                </div>
                <div className="formField full">
                  <label>凭证备注（可选）</label>
                  <input
                    className="adminInput"
                    value={mintDoc}
                    onChange={(e) => setMintDoc(e.target.value)}
                    placeholder="如：采购单号、仓单编号等"
                  />
                </div>
              </div>
              <button
                className="adminBtn primary"
                disabled={disabledBase || !mintTo || mintAmountBn === BigInt(0)}
                onClick={() => {
                  if (!rwaManager) return;
                  writeContract({
                    abi: rwaManagerAbi,
                    address: rwaManager,
                    functionName: "issueMint",
                    args: [mintTo as `0x${string}`, BigInt(selectedTokenId), mintAmountBn, hash32(mintDoc || "mint")],
                  });
                }}
              >
                {isPending ? "发行中..." : `发行 ${mintAmount || 0} ${token.unit} ${token.name}`}
              </button>
            </div>
          </div>
        )}

        {/* 合规方功能 */}
        {role === "compliance" && (
          <>
            {/* 账户冻结/解冻 */}
            <div className="adminSection">
              <div className="sectionHeader">
              <h2 className="sectionTitle">
                账户管理
              </h2>
                <p className="sectionDesc">冻结或解冻整个账户的所有操作权限</p>
              </div>
              <div className="adminCardRow">
                <div className="adminCard">
                  <h3 className="cardTitle freeze">冻结账户</h3>
                  <div className="formField">
                    <label>目标地址</label>
                    <input
                      className="adminInput"
                      value={freezeAcctAddr}
                      onChange={(e) => setFreezeAcctAddr(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="formField">
                    <label>冻结原因</label>
                    <input
                      className="adminInput"
                      value={freezeAcctEvidence}
                      onChange={(e) => setFreezeAcctEvidence(e.target.value)}
                      placeholder="如：法院冻结令编号"
                    />
                  </div>
                  <button
                    className="adminBtn danger"
                    disabled={disabledBase || !freezeAcctAddr}
                    onClick={() => {
                      if (!rwaManager) return;
                      writeContract({
                        abi: rwaManagerAbi,
                        address: rwaManager,
                        functionName: "freezeAccount",
                        args: [freezeAcctAddr as `0x${string}`, hash32(freezeAcctEvidence || "freeze")],
                      });
                    }}
                  >
                    {isPending ? "处理中..." : "冻结账户"}
                  </button>
                </div>

                <div className="adminCard">
                  <h3 className="cardTitle unfreeze">解冻账户</h3>
                  <div className="formField">
                    <label>目标地址</label>
                    <input
                      className="adminInput"
                      value={unfreezeAcctAddr}
                      onChange={(e) => setUnfreezeAcctAddr(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="formField">
                    <label>解冻原因</label>
                    <input
                      className="adminInput"
                      value={unfreezeAcctEvidence}
                      onChange={(e) => setUnfreezeAcctEvidence(e.target.value)}
                      placeholder="如：解冻裁定书编号"
                    />
                  </div>
                  <button
                    className="adminBtn success"
                    disabled={disabledBase || !unfreezeAcctAddr}
                    onClick={() => {
                      if (!rwaManager) return;
                      writeContract({
                        abi: rwaManagerAbi,
                        address: rwaManager,
                        functionName: "unfreezeAccount",
                        args: [unfreezeAcctAddr as `0x${string}`, hash32(unfreezeAcctEvidence || "unfreeze")],
                      });
                    }}
                  >
                    {isPending ? "处理中..." : "解冻账户"}
                  </button>
                </div>
              </div>
            </div>

            {/* 份额冻结/解冻 */}
            <div className="adminSection">
              <div className="sectionHeader">
              <h2 className="sectionTitle">
                份额管理
              </h2>
                <p className="sectionDesc">冻结或解冻账户的部分资产份额</p>
              </div>
              <div className="adminCardRow">
                <div className="adminCard">
                  <h3 className="cardTitle freeze">冻结份额</h3>
                  <div className="formField">
                    <label>目标地址</label>
                    <input
                      className="adminInput"
                      value={freezeBalAddr}
                      onChange={(e) => setFreezeBalAddr(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="formField">
                    <label>冻结数量</label>
                    <div className="inputWithUnit">
                      <input
                        type="number"
                        className="adminInput"
                        value={freezeBalAmount}
                        onChange={(e) => setFreezeBalAmount(e.target.value)}
                        placeholder="0"
                      />
                      <span className="inputUnit">{token.unit}</span>
                    </div>
                  </div>
                  <div className="formField">
                    <label>冻结原因</label>
                    <input
                      className="adminInput"
                      value={freezeBalEvidence}
                      onChange={(e) => setFreezeBalEvidence(e.target.value)}
                      placeholder="如：财产保全裁定编号"
                    />
                  </div>
                  <button
                    className="adminBtn danger"
                    disabled={disabledBase || !freezeBalAddr || freezeBalAmountBn === BigInt(0)}
                    onClick={() => {
                      if (!rwaManager) return;
                      writeContract({
                        abi: rwaManagerAbi,
                        address: rwaManager,
                        functionName: "freezeBalance",
                        args: [freezeBalAddr as `0x${string}`, BigInt(selectedTokenId), freezeBalAmountBn, hash32(freezeBalEvidence || "freeze")],
                      });
                    }}
                  >
                    {isPending ? "处理中..." : "冻结份额"}
                  </button>
                </div>

                <div className="adminCard">
                  <h3 className="cardTitle unfreeze">解冻份额</h3>
                  <div className="formField">
                    <label>目标地址</label>
                    <input
                      className="adminInput"
                      value={unfreezeBalAddr}
                      onChange={(e) => setUnfreezeBalAddr(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="formField">
                    <label>解冻数量</label>
                    <div className="inputWithUnit">
                      <input
                        type="number"
                        className="adminInput"
                        value={unfreezeBalAmount}
                        onChange={(e) => setUnfreezeBalAmount(e.target.value)}
                        placeholder="0"
                      />
                      <span className="inputUnit">{token.unit}</span>
                    </div>
                  </div>
                  <div className="formField">
                    <label>解冻原因</label>
                    <input
                      className="adminInput"
                      value={unfreezeBalEvidence}
                      onChange={(e) => setUnfreezeBalEvidence(e.target.value)}
                      placeholder="如：解除保全裁定编号"
                    />
                  </div>
                  <button
                    className="adminBtn success"
                    disabled={disabledBase || !unfreezeBalAddr || unfreezeBalAmountBn === BigInt(0)}
                    onClick={() => {
                      if (!rwaManager) return;
                      writeContract({
                        abi: rwaManagerAbi,
                        address: rwaManager,
                        functionName: "unfreezeBalance",
                        args: [unfreezeBalAddr as `0x${string}`, BigInt(selectedTokenId), unfreezeBalAmountBn, hash32(unfreezeBalEvidence || "unfreeze")],
                      });
                    }}
                  >
                    {isPending ? "处理中..." : "解冻份额"}
                  </button>
                </div>
              </div>
            </div>

            {/* 赎回审批 */}
            <div className="adminSection">
              <div className="sectionHeader">
                <h2 className="sectionTitle">
                  赎回审批
                </h2>
                <p className="sectionDesc">审核用户的赎回申请，批准后将销毁代币并安排交割</p>
              </div>

              {/* 待审批列表 */}
              <div className="adminCard" style={{ marginBottom: 16 }}>
                <div className="cardTitle" style={{ color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>待审批申请 ({pendingRedeems.length})</span>
                  {loadingRedeems && <span style={{ fontSize: 12, opacity: 0.6 }}>加载中...</span>}
                </div>
                {pendingRedeems.length === 0 ? (
                  <div style={{ opacity: 0.6, fontSize: 14, padding: "16px 0" }}>
                    {loadingRedeems ? "正在加载..." : "暂无待审批的赎回申请"}
                  </div>
                ) : (
                  <div className="pendingList">
                    {pendingRedeems.map((p) => {
                      const tokenInfo = TOKENS.find((t) => t.id === Number(p.tokenId));
                      return (
                        <div key={p.requestId} className="pendingItem">
                          <div className="pendingInfo">
                            <div className="pendingTitle">
                              申请 #{p.requestId}
                            </div>
                            <div className="pendingMeta">
                              {shortAddr(p.requester)} · {p.amount} {tokenInfo?.unit || "份"} {tokenInfo?.name || `Token ${p.tokenId}`}
                            </div>
                          </div>
                          <button
                            className="approveBtn"
                            disabled={isPending}
                            onClick={() => {
                              if (!rwaManager) return;
                              writeContract({
                                abi: rwaManagerAbi,
                                address: rwaManager,
                                functionName: "approveRedeem",
                                args: [BigInt(p.requestId), hash32("approved")],
                              });
                            }}
                          >
                            {isPending ? "..." : "通过"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 手动审批 */}
              <div className="adminCard">
                <div className="cardTitle" style={{ color: "inherit" }}>手动审批</div>
                <div className="formGrid">
                  <div className="formField">
                    <label>申请编号</label>
                    <input
                      type="number"
                      className="adminInput"
                      value={approveRequestId}
                      onChange={(e) => setApproveRequestId(e.target.value)}
                      placeholder="如：1"
                    />
                  </div>
                  <div className="formField">
                    <label>审批备注</label>
                    <input
                      className="adminInput"
                      value={approveEvidence}
                      onChange={(e) => setApproveEvidence(e.target.value)}
                      placeholder="如：交割单号、物流单号"
                    />
                  </div>
                </div>
                <button
                  className="adminBtn primary"
                  disabled={disabledBase || !approveRequestId || approveRidBn === BigInt(0)}
                  onClick={() => {
                    if (!rwaManager) return;
                    writeContract({
                      abi: rwaManagerAbi,
                      address: rwaManager,
                      functionName: "approveRedeem",
                      args: [approveRidBn, hash32(approveEvidence || "approve")],
                    });
                  }}
                >
                  {isPending ? "审批中..." : `批准赎回申请 #${approveRequestId || "?"}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
