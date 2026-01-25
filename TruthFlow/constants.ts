import { Market, AIProfile } from './types';

export const MOCK_MARKETS: Market[] = [
  {
    id: 1,
    title: "Target: Lithium Reserve #L-992",
    titleCN: "目标：阿根廷 #L-992 锂矿储备",
    description: "Audit the satellite spectral analysis of the brine pools. AI Citadel claims extraction rates match blockchain records. Hunters suspect 'Ghost Inventory'. / 审计盐湖光谱分析数据。AI堡垒声称开采率与链上记录匹配，猎人怀疑存在“幽灵库存”。",
    rwaType: 'Energy',
    // CPMM: To show ~85% Safety (YES), we need Low Yes Reserve, High No Reserve.
    // Price(Yes) = No / (Yes + No) = 250 / (45 + 250) = 0.84
    yesPool: 45000, 
    noPool: 250000,
    resolved: false,
    outcome: null,
    history: [],
    imageUrl: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&q=80&w=600&h=400',
    activeSyndicates: [
        { id: 's1', hunterName: '0xSatoshi_Hunter', exploitTitle: 'Spectral Anomaly / 光谱异常', feePercent: 20, totalFollowers: 124, totalStaked: 15000 }
    ],
    hasZeroDayOffer: false,
    depositAmount: 5.5,
    yieldEnabled: true,
    accumulatedYield: 0,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7天前创建
  },
  {
    id: 2,
    title: "Target: GPU Cluster Rent-Fi",
    titleCN: "目标：新加坡 GPU 算力租赁集群",
    description: "Verify uptime of 10,000 H100 GPUs tokenized on HashKey. Zero-day rumor: Virtual Machine looping same workload to fake activity. / 验证1万张H100显卡的在线率。零日传闻：虚拟机循环跑同一个任务伪造活跃度。",
    rwaType: 'Infra',
    // CPMM: To show ~47% Safety (Attack occurring).
    // Price(Yes) = 80 / (92 + 80) = 0.46
    yesPool: 92000,
    noPool: 80000, 
    resolved: false,
    outcome: null,
    history: [],
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?auto=format&fit=crop&q=80&w=600&h=401',
    activeSyndicates: [
         { id: 's2', hunterName: 'DeepRed_Team', exploitTitle: 'Loopback Attack / 回环攻击 PoC', feePercent: 25, totalFollowers: 890, totalStaked: 65000 }
    ],
    hasZeroDayOffer: true, // AI is scared and wants to buy intel
    depositAmount: 0.5,
    yieldEnabled: false,
    accumulatedYield: 0,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3天前创建
  },
  {
    id: 3,
    title: "Target: CBAM Carbon Credits",
    titleCN: "目标：欧盟 CBAM 碳信用额度",
    description: "Validate the biomass energy inputs for Batch #EU-882. Suspicion of double-spending credits across different chains. / 验证 #EU-882 批次的生物质能源输入。怀疑存在跨链双花碳信用。",
    rwaType: 'SupplyChain',
    // High Safety
    yesPool: 10000,
    noPool: 120000,
    resolved: false,
    outcome: null,
    history: [],
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600&h=402',
    activeSyndicates: [],
    hasZeroDayOffer: false,
    depositAmount: 2.0,
    yieldEnabled: true,
    accumulatedYield: 0,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000 // 14天前创建
  },
  {
    id: 4,
    title: "Target: Cold Chain Logistics",
    titleCN: "目标：智利-广州 冷链物流",
    description: "IoT sensor audit. Validate temperature logs for cherry shipment. AI claims 100% integrity. / IoT传感器审计。验证车厘子运输温控记录。AI声称100%完整。",
    rwaType: 'SupplyChain',
    // Very High Safety
    yesPool: 12000,
    noPool: 180000,
    resolved: false,
    outcome: null,
    history: [],
    imageUrl: 'https://images.unsplash.com/photo-1592323528224-b630e620593c?auto=format&fit=crop&q=80&w=600&h=403',
    activeSyndicates: [],
    hasZeroDayOffer: false,
    depositAmount: 10.0,
    yieldEnabled: true,
    accumulatedYield: 0,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 // 30天前创建
  }
];

export const AI_AGENTS: AIProfile[] = [
  { name: 'Citadel_Core (AI堡垒)', type: 'Citadel', color: '#10b981' }, // Defender
  { name: 'Spectre_Ops (幽灵猎人)', type: 'Hunter', color: '#ef4444' }, // Attacker
  { name: 'Whale_Vanguard (巨鲸)', type: 'Whale', color: '#8b5cf6' }, // Follower
];