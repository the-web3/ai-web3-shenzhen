// ============================================================
// Constants
// ============================================================

// 事件状态
export const EVENT_STATUS = {
  CREATED: 0,
  ACTIVE: 1,
  SETTLED: 2,
  CANCELLED: 3,
} as const;

export const EVENT_STATUS_LABELS: Record<number, string> = {
  [EVENT_STATUS.CREATED]: "Created",
  [EVENT_STATUS.ACTIVE]: "Active",
  [EVENT_STATUS.SETTLED]: "Settled",
  [EVENT_STATUS.CANCELLED]: "Cancelled",
};

// 订单状态
export const ORDER_STATUS = {
  PENDING: 0,
  PARTIAL: 1,
  FILLED: 2,
  CANCELLED: 3,
} as const;

export const ORDER_STATUS_LABELS: Record<number, string> = {
  [ORDER_STATUS.PENDING]: "Pending",
  [ORDER_STATUS.PARTIAL]: "Partial",
  [ORDER_STATUS.FILLED]: "Filled",
  [ORDER_STATUS.CANCELLED]: "Cancelled",
};

// 订单方向
export const ORDER_SIDE = {
  BUY: 0,
  SELL: 1,
} as const;

export const ORDER_SIDE_LABELS: Record<number, string> = {
  [ORDER_SIDE.BUY]: "Buy",
  [ORDER_SIDE.SELL]: "Sell",
};

// 邀请码状态
export const INVITE_STATUS = {
  REVOKED: 0,
  ACTIVE: 1,
  EXPIRED: 2,
} as const;

export const INVITE_STATUS_LABELS: Record<number, string> = {
  [INVITE_STATUS.REVOKED]: "Revoked",
  [INVITE_STATUS.ACTIVE]: "Active",
  [INVITE_STATUS.EXPIRED]: "Expired",
};

// 申请状态
export const APPLICATION_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

export const APPLICATION_STATUS_LABELS: Record<number, string> = {
  [APPLICATION_STATUS.PENDING]: "Pending",
  [APPLICATION_STATUS.APPROVED]: "Approved",
  [APPLICATION_STATUS.REJECTED]: "Rejected",
};

// 价格精度
export const PRICE_PRECISION = 10000; // 10000 = 100%

// 轮询间隔
export const POLLING_INTERVAL = 10000; // 10 seconds

// 默认 token 地址 (USDT on local/testnet - placeholder)
export const DEFAULT_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

// ETH 地址表示
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
