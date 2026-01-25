// 系统钱包配置
// ⚠️ 警告：这是测试环境配置，生产环境请使用环境变量或密钥管理服务

export const SYSTEM_WALLET_CONFIG = {
    // 系统钱包地址
    address: '0x569Fe9311d92322c3b755B426D6f8Be9d9F1f2f6',
    
    // 私钥（仅用于测试）
    // ⚠️ 生产环境绝不要将私钥硬编码在代码中
    privateKey: '0x692041f3884ff9a40c8512c16a654ce6866da528cc8a6e5afb56a2da53dbe731',
    
    // 用途说明
    description: 'TruthFlow 系统钱包 - 用于接收所有用户付款和发送奖励',
    
    // 功能
    functions: {
        receivePayments: true,      // 接收用户付款
        sendRewards: true,           // 发送奖励给用户
        collectPlatformFees: true,   // 收取平台费
        manageMarkets: true          // 管理市场资金
    }
};

// 安全提示
export const SECURITY_NOTICE = `
⚠️ 安全提示：
1. 此配置仅用于测试环境
2. 生产环境请使用以下方式管理私钥：
   - 环境变量 (process.env.PRIVATE_KEY)
   - AWS Secrets Manager
   - HashiCorp Vault
   - 硬件钱包
3. 永远不要将私钥提交到 Git 仓库
4. 定期轮换测试私钥
`;

// 导出配置
export default SYSTEM_WALLET_CONFIG;
