export enum Outcome {
  YES = 'SECURE', // 资产安全 (Defended by AI)
  NO = 'COMPROMISED',   // 资产存在漏洞 (Attacked by Hunters)
}

export interface MarketHistoryPoint {
  timestamp: number;
  probYes: number; // 0 to 1
}

export interface Syndicate {
  id: string;
  hunterName: string;
  exploitTitle: string;
  feePercent: number; // e.g., 20%
  totalFollowers: number;
  totalStaked: number;
}

export interface Market {
  id: number;
  title: string; // EN Title
  titleCN?: string; // CN Title
  description: string;
  rwaType?: 'Infra' | 'Energy' | 'SupplyChain' | 'Finance';
  yesPool: number; // Defensive Liquidity
  noPool: number;  // Offensive Liquidity
  resolved: boolean;
  cancelled?: boolean;
  outcome: boolean | null;
  history: MarketHistoryPoint[];
  imageUrl?: string;
  activeSyndicates?: Syndicate[]; // Active attacks users can join
  hasZeroDayOffer?: boolean; // Is AI offering to buy 0-day intel?
  depositAmount?: number; // METH 押金金额
  yieldEnabled?: boolean; // 是否开启生息
  accumulatedYield?: number; // 累计利息 (METH)
  createdAt?: number; // 创建时间戳
  depositId?: number; // 押金合约中的押金ID
  depositWithdrawn?: boolean; // 押金是否已提取
  creator?: string; // 创建者地址
  category?: string; // 分类
  icon?: string; // 图标
  duration?: number; // 持续时间（秒）
}

export interface AIProfile {
  name: string;
  type: 'Citadel' | 'Hunter' | 'Whale';
  color: string;
}

export interface Trade {
  marketId: number;
  amount: number;
  direction: Outcome;
  timestamp: number;
  trader: string; 
}
