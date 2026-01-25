"use client";

import { useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { Header } from "../_components/Header";
import { RequireWallet } from "../_components/RequireWallet";
import { getEnv } from "../../lib/env";
import { asString, shortAddr, shortHash } from "../../lib/format";

type Row = {
  source: "RWAManager" | "OraclePod";
  event: string;
  blockNumber: bigint;
  blockTimestamp?: bigint;
  txHash: `0x${string}`;
  data: Record<string, unknown>;
  // 用于过滤的字段
  relatedAddresses: string[];
  tokenId?: string;
};

type EventType = "all" | "issued" | "freeze" | "unfreeze" | "redeem" | "oracle";
type Role = "issuer" | "compliance" | "user";

// Token 配置
const TOKENS = [
  { id: 0, name: "全部" },
  { id: 1, name: "飞天茅台 2023" },
  { id: 2, name: "五粮液 2023" },
];

// 事件类型配置
const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: "all", label: "全部", color: "#a5b4fc" },
  { value: "issued", label: "发行", color: "#34d399" },
  { value: "freeze", label: "冻结", color: "#f87171" },
  { value: "unfreeze", label: "解冻", color: "#fbbf24" },
  { value: "redeem", label: "赎回", color: "#60a5fa" },
  { value: "oracle", label: "价格", color: "#c084fc" },
];

function fmtTime(ts?: bigint) {
  if (ts === undefined) return "-";
  try {
    const ms = Number(ts) * 1000;
    if (!Number.isFinite(ms)) return ts.toString();
    return new Date(ms).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts.toString();
  }
}

function getEventType(event: string): EventType {
  if (event === "Issued") return "issued";
  if (event === "AccountFrozen" || event === "BalanceFrozen") return "freeze";
  if (event === "AccountUnfrozen" || event === "BalanceUnfrozen") return "unfreeze";
  if (event === "RedeemRequested" || event === "RedeemApproved") return "redeem";
  if (event === "PriceUpdated") return "oracle";
  return "all";
}

function getEventColor(event: string): string {
  const type = getEventType(event);
  return EVENT_TYPES.find((t) => t.value === type)?.color || "#a5b4fc";
}


function getEventTitle(row: Row): string {
  const a = row.data;
  switch (row.event) {
    case "Issued":
      return `发行 ${asString(a.amount)} 份给 ${shortAddr(asString(a.to))}`;
    case "AccountFrozen":
      return `冻结账户 ${shortAddr(asString(a.account))}`;
    case "AccountUnfrozen":
      return `解冻账户 ${shortAddr(asString(a.account))}`;
    case "BalanceFrozen":
      return `冻结 ${asString(a.amount)} 份 (${shortAddr(asString(a.account))})`;
    case "BalanceUnfrozen":
      return `解冻 ${asString(a.amount)} 份 (${shortAddr(asString(a.account))})`;
    case "RedeemRequested":
      return `赎回申请 #${asString(a.requestId)} (${asString(a.amount)} 份)`;
    case "RedeemApproved":
      return `审批通过 #${asString(a.requestId)}`;
    case "PriceUpdated":
      return `价格更新 ¥${asString(a.newPrice)}`;
    default:
      return row.event;
  }
}

function EventCard({ row }: { row: Row }) {
  const [expanded, setExpanded] = useState(false);
  const a = row.data;
  const color = getEventColor(row.event);
  const title = getEventTitle(row);
  const tokenName = row.tokenId ? TOKENS.find((t) => t.id === Number(row.tokenId))?.name : null;

  return (
    <div className="timelineCard" onClick={() => setExpanded(!expanded)}>
      <div className="timelineCardHeader">
        <div className="timelineDot" style={{ background: color }} />
        <div className="timelineContent">
          <div className="timelineTitle">{title}</div>
          <div className="timelineMeta">
            <span className="timelineTime">{fmtTime(row.blockTimestamp)}</span>
            {tokenName && <span className="timelineToken">{tokenName}</span>}
            <span className="timelineBlock">区块 #{row.blockNumber.toString()}</span>
          </div>
        </div>
        <div className={`timelineExpand ${expanded ? "open" : ""}`}>▼</div>
      </div>

      {expanded && (
        <div className="timelineDetails">
          <div className="detailRow">
            <span className="detailLabel">交易哈希</span>
            <code className="detailValue">{row.txHash}</code>
          </div>
          {row.event === "Issued" && (
            <>
              <div className="detailRow">
                <span className="detailLabel">接收地址</span>
                <code className="detailValue">{asString(a.to)}</code>
              </div>
              <div className="detailRow">
                <span className="detailLabel">发行数量</span>
                <span className="detailValue">{asString(a.amount)} 份</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">凭证哈希</span>
                <code className="detailValue">{shortHash(asString(a.docHash))}</code>
              </div>
            </>
          )}
          {(row.event === "AccountFrozen" || row.event === "AccountUnfrozen") && (
            <>
              <div className="detailRow">
                <span className="detailLabel">目标账户</span>
                <code className="detailValue">{asString(a.account)}</code>
              </div>
              <div className="detailRow">
                <span className="detailLabel">证据哈希</span>
                <code className="detailValue">{shortHash(asString(a.evidenceHash))}</code>
              </div>
            </>
          )}
          {(row.event === "BalanceFrozen" || row.event === "BalanceUnfrozen") && (
            <>
              <div className="detailRow">
                <span className="detailLabel">目标账户</span>
                <code className="detailValue">{asString(a.account)}</code>
              </div>
              <div className="detailRow">
                <span className="detailLabel">数量</span>
                <span className="detailValue">{asString(a.amount)} 份</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">证据哈希</span>
                <code className="detailValue">{shortHash(asString(a.evidenceHash))}</code>
              </div>
            </>
          )}
          {row.event === "RedeemRequested" && (
            <>
              <div className="detailRow">
                <span className="detailLabel">申请人</span>
                <code className="detailValue">{asString(a.requester)}</code>
              </div>
              <div className="detailRow">
                <span className="detailLabel">赎回数量</span>
                <span className="detailValue">{asString(a.amount)} 份</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">交割信息哈希</span>
                <code className="detailValue">{shortHash(asString(a.deliveryInfoHash))}</code>
              </div>
            </>
          )}
          {row.event === "RedeemApproved" && (
            <>
              <div className="detailRow">
                <span className="detailLabel">审批人</span>
                <code className="detailValue">{asString(a.approver)}</code>
              </div>
              <div className="detailRow">
                <span className="detailLabel">证据哈希</span>
                <code className="detailValue">{shortHash(asString(a.evidenceHash))}</code>
              </div>
            </>
          )}
          {row.event === "PriceUpdated" && (
            <>
              <div className="detailRow">
                <span className="detailLabel">旧价格</span>
                <span className="detailValue">¥{asString(a.oldPrice)}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">新价格</span>
                <span className="detailValue">¥{asString(a.newPrice)}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">节点数</span>
                <span className="detailValue">{asString(a.nodeCount)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { rwaManager, oraclePod, issuer, compliance } = getEnv();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 筛选状态
  const [eventFilter, setEventFilter] = useState<EventType>("all");
  const [tokenFilter, setTokenFilter] = useState(0); // 0 = 全部

  // 判断当前用户角色
  const role: Role = useMemo(() => {
    if (!address) return "user";
    const addr = address.toLowerCase();
    if (addr === issuer.toLowerCase()) return "issuer";
    if (addr === compliance.toLowerCase()) return "compliance";
    return "user";
  }, [address, issuer, compliance]);

  const enabled = Boolean(publicClient && rwaManager && oraclePod);
  const fromBlocksBack = BigInt(5000);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!enabled) return;
      setLoading(true);
      setErr(null);
      try {
        const latest = await publicClient!.getBlockNumber();
        const fromBlock = latest > fromBlocksBack ? latest - fromBlocksBack : BigInt(0);

        // RWAManager events
        const mgrEvents = [
          parseAbiItem("event Issued(address indexed to, uint256 indexed tokenId, uint256 amount, bytes32 docHash)"),
          parseAbiItem("event AccountFrozen(address indexed account, bytes32 evidenceHash)"),
          parseAbiItem("event AccountUnfrozen(address indexed account, bytes32 evidenceHash)"),
          parseAbiItem("event BalanceFrozen(address indexed account, uint256 indexed tokenId, uint256 amount, bytes32 evidenceHash)"),
          parseAbiItem("event BalanceUnfrozen(address indexed account, uint256 indexed tokenId, uint256 amount, bytes32 evidenceHash)"),
          parseAbiItem(
            "event RedeemRequested(uint256 indexed requestId, address indexed requester, uint256 indexed tokenId, uint256 amount, bytes32 deliveryInfoHash)"
          ),
          parseAbiItem("event RedeemApproved(uint256 indexed requestId, address indexed approver, bytes32 evidenceHash)"),
        ] as const;

        const mgrLogs = (
          await Promise.all(
            mgrEvents.map((event) =>
              publicClient!.getLogs({
                address: rwaManager!,
                event,
                fromBlock,
                toBlock: latest,
              })
            )
          )
        ).flat();

        // OraclePod PriceUpdated
        const oracleEvent = parseAbiItem(
          "event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 nodeCount, uint256 timestamp)"
        );
        const oracleLogs = await publicClient!.getLogs({
          address: oraclePod!,
          event: oracleEvent,
          fromBlock,
          toBlock: latest,
        });

        const nextRows: Row[] = [];

        // 先建立 requestId -> requester 的映射（用于关联 RedeemApproved 到原始申请人）
        const requestIdToRequester = new Map<string, string>();
        for (const l of mgrLogs) {
          if (l.eventName === "RedeemRequested") {
            const args = (l.args ?? {}) as Record<string, unknown>;
            if (args.requestId !== undefined && args.requester) {
              requestIdToRequester.set(String(args.requestId), String(args.requester).toLowerCase());
            }
          }
        }

        for (const l of mgrLogs) {
          const args = (l.args ?? {}) as Record<string, unknown>;
          const relatedAddresses: string[] = [];
          let tokenId: string | undefined;

          // 提取相关地址
          if (args.to) relatedAddresses.push(String(args.to).toLowerCase());
          if (args.account) relatedAddresses.push(String(args.account).toLowerCase());
          if (args.requester) relatedAddresses.push(String(args.requester).toLowerCase());
          if (args.approver) relatedAddresses.push(String(args.approver).toLowerCase());

          // 对于 RedeemApproved，也关联原始申请人
          if (l.eventName === "RedeemApproved" && args.requestId !== undefined) {
            const originalRequester = requestIdToRequester.get(String(args.requestId));
            if (originalRequester && !relatedAddresses.includes(originalRequester)) {
              relatedAddresses.push(originalRequester);
            }
          }

          // 提取 tokenId
          if (args.tokenId !== undefined) tokenId = String(args.tokenId);

          nextRows.push({
            source: "RWAManager",
            event: l.eventName ?? "Event",
            blockNumber: l.blockNumber!,
            txHash: l.transactionHash!,
            data: args,
            relatedAddresses,
            tokenId,
          });
        }

        for (const l of oracleLogs) {
          const args = (l.args ?? {}) as Record<string, unknown>;
          nextRows.push({
            source: "OraclePod",
            event: "PriceUpdated",
            blockNumber: l.blockNumber!,
            txHash: l.transactionHash!,
            data: {
              oldPrice: String(args.oldPrice ?? ""),
              newPrice: String(args.newPrice ?? ""),
              nodeCount: String(args.nodeCount ?? ""),
              timestamp: String(args.timestamp ?? ""),
            },
            relatedAddresses: [],
            tokenId: "1", // Oracle 默认关联 token 1
          });
        }

        // 获取区块时间戳
        const uniqBlocks = Array.from(new Set(nextRows.map((r) => r.blockNumber.toString()))).map((s) => BigInt(s));
        const blockMap = new Map<string, bigint>();
        await Promise.all(
          uniqBlocks.map(async (bn) => {
            const b = await publicClient!.getBlock({ blockNumber: bn });
            blockMap.set(bn.toString(), b.timestamp);
          })
        );
        for (const r of nextRows) {
          r.blockTimestamp = blockMap.get(r.blockNumber.toString());
        }

        nextRows.sort((a, b) => (a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1));

        if (!cancelled) setRows(nextRows);
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, publicClient, rwaManager, oraclePod, fromBlocksBack]);

  // 根据角色和筛选条件过滤事件
  const filteredRows = useMemo(() => {
    let result = rows;

    // 角色过滤
    if (role === "user" && address) {
      // 普通用户只能看自己相关的记录
      const userAddr = address.toLowerCase();
      result = result.filter((r) => r.relatedAddresses.includes(userAddr));
    } else if (role === "issuer") {
      // 发行方只能看发行记录
      result = result.filter((r) => r.event === "Issued");
    } else if (role === "compliance") {
      // 合规方能看冻结/解冻/赎回申请/审批记录
      result = result.filter((r) =>
        ["AccountFrozen", "AccountUnfrozen", "BalanceFrozen", "BalanceUnfrozen", "RedeemRequested", "RedeemApproved"].includes(r.event)
      );
    }

    // 事件类型过滤
    if (eventFilter !== "all") {
      result = result.filter((r) => getEventType(r.event) === eventFilter);
    }

    // Token 过滤
    if (tokenFilter !== 0) {
      result = result.filter((r) => r.tokenId === String(tokenFilter) || r.source === "OraclePod");
    }

    return result;
  }, [rows, role, address, eventFilter, tokenFilter]);

  // 获取当前角色可用的事件类型
  const availableEventTypes = useMemo(() => {
    if (role === "issuer") {
      return EVENT_TYPES.filter((t) => t.value === "all" || t.value === "issued");
    }
    if (role === "compliance") {
      return EVENT_TYPES.filter((t) => ["all", "freeze", "unfreeze", "redeem"].includes(t.value));
    }
    return EVENT_TYPES;
  }, [role]);

  const roleLabel = role === "issuer" ? "发行方" : role === "compliance" ? "合规方" : "用户";

  return (
    <>
      <Header />
      <div className="timelineWrap">
        <RequireWallet>
          {/* 头部 */}
          <div className="timelineHeader">
            <div className="timelineHeaderLeft">
              <h1 className="timelineTitle">审计记录</h1>
              <p className="timelineDesc">
                查看链上操作记录，所有数据来自区块链事件日志
              </p>
            </div>
            <div className="timelineHeaderRight">
              <div className="roleBadge" style={{ background: role === "issuer" ? "rgba(99,102,241,0.15)" : role === "compliance" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.08)" }}>
                {roleLabel}视角
              </div>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="timelineFilters">
            <div className="filterGroup">
              <span className="filterLabel">事件类型</span>
              <div className="filterBtns">
                {availableEventTypes.map((t) => (
                  <button
                    key={t.value}
                    className={`filterBtn ${eventFilter === t.value ? "active" : ""}`}
                    onClick={() => setEventFilter(t.value)}
                    style={eventFilter === t.value ? { borderColor: t.color, color: t.color } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filterGroup">
              <span className="filterLabel">资产类型</span>
              <div className="filterBtns">
                {TOKENS.map((t) => (
                  <button
                    key={t.id}
                    className={`filterBtn ${tokenFilter === t.id ? "active" : ""}`}
                    onClick={() => setTokenFilter(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 统计 */}
          <div className="timelineStats">
            <div className="statItem">
              <span className="statValue">{filteredRows.length}</span>
              <span className="statLabel">条记录</span>
            </div>
            <button
              className="refreshBtn"
              disabled={loading}
              onClick={() => window.location.reload()}
              title="刷新"
            >
              {loading ? "..." : "↻"}
            </button>
          </div>

          {/* 错误提示 */}
          {err && (
            <div className="timelineError">
              加载失败: {err}
            </div>
          )}

          {/* 事件列表 */}
          <div className="timelineList">
            {filteredRows.map((r, idx) => (
              <EventCard key={`${r.txHash}-${idx}`} row={r} />
            ))}
            {filteredRows.length === 0 && !loading && (
              <div className="timelineEmpty">
                <div className="emptyIcon">📭</div>
                <p>暂无相关记录</p>
                <p className="emptyHint">
                  {role === "user"
                    ? "您还没有任何操作记录"
                    : role === "issuer"
                    ? "还没有发行记录"
                    : "还没有合规操作记录"}
                </p>
              </div>
            )}
          </div>
        </RequireWallet>
      </div>
    </>
  );
}
