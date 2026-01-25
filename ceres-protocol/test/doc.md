当前事件来源

1. 人工判断事件（主要来源）
   信息提供者：农民、专家、专业人士等具有专业知识的个人
   提交方式：通过前端界面手动提交判断事件
   内容类型：气候风险、农业预测、环境变化等专业判断
   质押要求：最低0.1 HKTC质押，体现判断者的信心
2. AI代理竞争事件（演示用）
   AI竞争代理：自动化服务监听人工判断事件
   生成机制：分析原始判断，生成略有价差的竞争性判断
   策略参数：2-5%价差差异，0.8-1.2倍质押金额
   目的：演示市场博弈机制，提升市场活跃度
3. 预留的未来事件源
   // UPGRADE: 预言机集成接口
   function requestOracleResolution(bytes32 eventId, bytes calldata oracleData) external;
   function oracleCallback(bytes32 eventId, bool outcome, bytes calldata proof) external;
   Chainlink Functions：自动化数据获取和事件生成
   多预言机聚合：结合多个数据源的加权投票
   外部API集成：天气数据、卫星数据、新闻数据等
   结算机制
4. 当前MVP结算方式
   手动结算（RESOLVER_ROLE）：

function resolveEvent(bytes32 eventId, bool outcome) external onlyRole(RESOLVER_ROLE) whenNotPaused {
// 验证事件存在且未解决
// 标记事件为已解决
// 确定创建者是否正确
// 分发绿色积分奖励
// 触发市场最终结算
}
结算流程：

权限验证：只有具有RESOLVER*ROLE的管理员可以结算
时间检查：必须达到预设的resolutionTime
结果记录：将最终结果（true=YES, false=NO）记录到事件中
正确性判断：基于创建者的初始份额分配判断其预测是否正确
奖励分发：
所有参与者获得100个绿色积分（参与奖励）
正确的创建者额外获得20%的交易手续费分润
市场获胜方可以领取奖励2. 创建者正确性判断逻辑
function \_wasCreatorCorrect(JudgementEvent memory event*, bool outcome) internal pure returns (bool) {
if (outcome) {
// YES结果 - 创建者分配更多YES份额则正确
return event*.initialYesShares > event*.initialNoShares;
} else {
// NO结果 - 创建者分配更多NO份额则正确
return event*.initialNoShares > event*.initialYesShares;
}
} 3. 预留的自动化结算机制
Chainlink预言机结算：

// UPGRADE: 自动化预言机结算
contract ChainlinkOracleAdapter {
function requestResolution(bytes32 eventId, string calldata description) external;
function fulfillRequest(bytes32 requestId, bytes memory response) internal override;
}
多预言机聚合结算：

// UPGRADE: 多数据源验证
contract MultiOracleAggregator {
function aggregateResults(bytes32 eventId) external view returns (bool outcome, uint256 confidence);
function \_calculateWeightedOutcome(bytes32 eventId) internal view returns (bool, uint256);
} 4. 结算后的奖励分发
绿色积分奖励：

每个参与的创建者获得100 \* 10^18个绿色积分
用于未来的治理投票和声誉系统
创建者手续费分润：

正确的创建者获得该市场总交易手续费的20%
通过claimCreatorReward()函数领取
交易者奖励：

持有获胜份额的交易者可以按比例领取奖池
通过claimWinnings()函数领取
未来升级路径

1. 去中心化预言机集成
   集成Chainlink Functions进行自动化数据获取
   支持多种数据源（天气API、卫星数据、新闻源）
   实现加密证明和争议解决机制
2. 社区治理结算
   绿色积分持有者投票决定争议事件
   实现质押投票和惩罚机制
   支持分层治理和专家委员会
3. 跨链结算统一
   主链（Hashkey Chain）作为最终裁决层
   其他链上的市场同步结算结果
   实现跨链流动性聚合
   这种设计确保了从简单的手动结算开始，逐步演进到完全去中心化的自动化结算系统，同时保持了系统的可扩展性和安全性。
