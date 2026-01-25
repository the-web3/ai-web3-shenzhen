// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TruthArenaV2
 * @dev 预测市场合约 - 支持动态分层生息策略
 * @notice 根据资金池规模和市场周期自动决定是否启用生息
 */
contract TruthArenaV2 {
    
    enum MarketStatus { Active, Resolved, Cancelled }
    enum Outcome { Unresolved, Yes, No }
    
    struct Market {
        string question;
        string description;
        uint256 endTime;
        uint256 yesPool;
        uint256 noPool;
        uint256 totalYesShares;
        uint256 totalNoShares;
        MarketStatus status;
        Outcome outcome;
        bytes32 verifiedTxHash;
        uint256 createdAt;
        address creator;
        bool yieldEnabled;  // 是否启用生息
    }
    
    struct Position {
        uint256 yesShares;
        uint256 noShares;
        uint256 yesCost;
        uint256 noCost;
    }
    
    // 分层策略配置
    struct YieldTier {
        uint256 duration;      // 市场周期（秒）
        uint256 threshold;     // 资金池临界点
    }
    
    // State variables
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    
    uint256 public marketCount;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant PLATFORM_FEE = 200; // 2%
    uint256 public constant BASIS_POINTS = 10000;
    
    address public owner;
    address public oracle;
    uint256 public collectedFees;
    
    // 分层策略配置
    YieldTier[3] public yieldTiers;
    
    // Events
    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime, bool yieldEnabled);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool prediction, uint256 amount, uint256 shares);
    event MarketResolved(uint256 indexed marketId, Outcome outcome, bytes32 txHash);
    event RewardClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event YieldStrategyUpdated(uint256 indexed marketId, bool enabled);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracle || msg.sender == owner, "Only oracle");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        oracle = msg.sender;
        
        // 初始化分层策略
        // 短期市场（≤7天）：5 ETH
        yieldTiers[0] = YieldTier({
            duration: 7 days,
            threshold: 5 ether
        });
        
        // 中期市场（≤30天）：1 ETH
        yieldTiers[1] = YieldTier({
            duration: 30 days,
            threshold: 1 ether
        });
        
        // 长期市场（>30天）：0.5 ETH
        yieldTiers[2] = YieldTier({
            duration: type(uint256).max,
            threshold: 0.5 ether
        });
    }
    
    /**
     * @dev 创建新市场
     */
    function createMarket(
        string memory _question,
        string memory _description,
        uint256 _duration
    ) external returns (uint256) {
        require(_duration > 0, "Duration must be positive");
        require(bytes(_question).length > 0, "Question required");
        
        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];
        
        market.question = _question;
        market.description = _description;
        market.endTime = block.timestamp + _duration;
        market.status = MarketStatus.Active;
        market.outcome = Outcome.Unresolved;
        market.createdAt = block.timestamp;
        market.creator = msg.sender;
        market.yieldEnabled = false; // 初始不启用，等资金池达到临界点
        
        emit MarketCreated(marketId, _question, market.endTime, false);
        return marketId;
    }
    
    /**
     * @dev 下注
     */
    function placeBet(uint256 _marketId, bool _prediction) external payable {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");
        require(msg.value >= MIN_BET, "Below minimum bet");
        
        // 计算平台费
        uint256 fee = (msg.value * PLATFORM_FEE) / BASIS_POINTS;
        uint256 netAmount = msg.value - fee;
        collectedFees += fee;
        
        // 计算份额
        uint256 shares = calculateShares(
            _prediction ? market.yesPool : market.noPool,
            _prediction ? market.noPool : market.yesPool,
            netAmount
        );
        
        // 更新资金池和份额
        if (_prediction) {
            market.yesPool += netAmount;
            market.totalYesShares += shares;
            positions[_marketId][msg.sender].yesShares += shares;
            positions[_marketId][msg.sender].yesCost += msg.value;
        } else {
            market.noPool += netAmount;
            market.totalNoShares += shares;
            positions[_marketId][msg.sender].noShares += shares;
            positions[_marketId][msg.sender].noCost += msg.value;
        }
        
        // 检查是否达到生息临界点
        _checkAndEnableYield(_marketId);
        
        emit BetPlaced(_marketId, msg.sender, _prediction, msg.value, shares);
    }
    
    /**
     * @dev 检查并启用生息策略
     */
    function _checkAndEnableYield(uint256 _marketId) internal {
        Market storage market = markets[_marketId];
        
        // 如果已启用，跳过
        if (market.yieldEnabled) return;
        
        uint256 totalPool = market.yesPool + market.noPool;
        uint256 marketDuration = market.endTime - market.createdAt;
        
        // 根据市场周期确定临界点
        uint256 threshold = _getYieldThreshold(marketDuration);
        
        // 如果资金池达到临界点，启用生息
        if (totalPool >= threshold) {
            market.yieldEnabled = true;
            emit YieldStrategyUpdated(_marketId, true);
            
            // TODO: 在这里集成 Lido stETH 或其他生息协议
            // _depositToYieldProtocol(totalPool);
        }
    }
    
    /**
     * @dev 根据市场周期获取生息临界点
     */
    function _getYieldThreshold(uint256 _duration) internal view returns (uint256) {
        for (uint256 i = 0; i < yieldTiers.length; i++) {
            if (_duration <= yieldTiers[i].duration) {
                return yieldTiers[i].threshold;
            }
        }
        return yieldTiers[yieldTiers.length - 1].threshold;
    }
    
    /**
     * @dev 计算份额（AMM 公式）
     */
    function calculateShares(
        uint256 currentPool,
        uint256 oppositePool,
        uint256 amount
    ) internal pure returns (uint256) {
        if (currentPool == 0 && oppositePool == 0) {
            return amount;
        }
        
        uint256 bonus = (amount * oppositePool) / (currentPool + 1 ether);
        return amount + bonus / 2;
    }
    
    /**
     * @dev 结算市场
     */
    function resolveMarket(
        uint256 _marketId,
        Outcome _outcome,
        bytes32 _txHash
    ) external onlyOracle {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(_outcome != Outcome.Unresolved, "Invalid outcome");
        
        market.status = MarketStatus.Resolved;
        market.outcome = _outcome;
        market.verifiedTxHash = _txHash;
        
        // TODO: 如果启用了生息，从协议中提取资金
        // if (market.yieldEnabled) {
        //     _withdrawFromYieldProtocol(_marketId);
        // }
        
        emit MarketResolved(_marketId, _outcome, _txHash);
    }
    
    /**
     * @dev 领取奖励
     */
    function claimReward(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");
        
        Position storage pos = positions[_marketId][msg.sender];
        uint256 payout = 0;
        uint256 totalPool = market.yesPool + market.noPool;
        
        if (market.outcome == Outcome.Yes) {
            require(pos.yesShares > 0, "No winning shares");
            payout = (pos.yesShares * totalPool) / market.totalYesShares;
        } else if (market.outcome == Outcome.No) {
            require(pos.noShares > 0, "No winning shares");
            payout = (pos.noShares * totalPool) / market.totalNoShares;
        }
        
        require(payout > 0, "Nothing to claim");
        hasClaimed[_marketId][msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(_marketId, msg.sender, payout);
    }
    
    /**
     * @dev 取消市场
     */
    function cancelMarket(uint256 _marketId) external onlyOwner {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        market.status = MarketStatus.Cancelled;
    }
    
    /**
     * @dev 领取退款
     */
    function claimRefund(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Cancelled, "Market not cancelled");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");
        
        Position storage pos = positions[_marketId][msg.sender];
        uint256 refund = pos.yesCost + pos.noCost;
        
        require(refund > 0, "Nothing to refund");
        hasClaimed[_marketId][msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: refund}("");
        require(success, "Refund failed");
    }
    
    /**
     * @dev 获取市场详情
     */
    function getMarket(uint256 _marketId) external view returns (
        string memory question,
        string memory description,
        uint256 endTime,
        uint256 yesPool,
        uint256 noPool,
        uint256 totalYesShares,
        uint256 totalNoShares,
        MarketStatus status,
        Outcome outcome,
        bool yieldEnabled
    ) {
        Market storage m = markets[_marketId];
        return (
            m.question,
            m.description,
            m.endTime,
            m.yesPool,
            m.noPool,
            m.totalYesShares,
            m.totalNoShares,
            m.status,
            m.outcome,
            m.yieldEnabled
        );
    }
    
    /**
     * @dev 获取用户仓位
     */
    function getPosition(uint256 _marketId, address _user) external view returns (
        uint256 yesShares,
        uint256 noShares,
        uint256 yesCost,
        uint256 noCost
    ) {
        Position storage p = positions[_marketId][_user];
        return (p.yesShares, p.noShares, p.yesCost, p.noCost);
    }
    
    /**
     * @dev 获取当前价格
     */
    function getPrices(uint256 _marketId) external view returns (
        uint256 yesPrice,
        uint256 noPrice
    ) {
        Market storage m = markets[_marketId];
        uint256 total = m.yesPool + m.noPool;
        
        if (total == 0) {
            return (5000, 5000);
        }
        
        yesPrice = (m.yesPool * BASIS_POINTS) / total;
        noPrice = (m.noPool * BASIS_POINTS) / total;
    }
    
    /**
     * @dev 计算潜在收益
     */
    function calculatePotentialPayout(
        uint256 _marketId,
        uint256 _amount,
        bool _isYes
    ) external view returns (uint256) {
        Market storage m = markets[_marketId];
        uint256 fee = (_amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 netAmount = _amount - fee;
        
        uint256 shares;
        uint256 totalPool = m.yesPool + m.noPool + netAmount;
        
        if (_isYes) {
            shares = calculateShares(m.yesPool, m.noPool, netAmount);
            uint256 newTotalYesShares = m.totalYesShares + shares;
            return (shares * totalPool) / newTotalYesShares;
        } else {
            shares = calculateShares(m.noPool, m.yesPool, netAmount);
            uint256 newTotalNoShares = m.totalNoShares + shares;
            return (shares * totalPool) / newTotalNoShares;
        }
    }
    
    /**
     * @dev 更新分层策略配置（仅 owner）
     */
    function updateYieldTier(
        uint256 _tierIndex,
        uint256 _duration,
        uint256 _threshold
    ) external onlyOwner {
        require(_tierIndex < yieldTiers.length, "Invalid tier index");
        yieldTiers[_tierIndex] = YieldTier({
            duration: _duration,
            threshold: _threshold
        });
    }
    
    /**
     * @dev 获取分层策略配置
     */
    function getYieldTier(uint256 _tierIndex) external view returns (
        uint256 duration,
        uint256 threshold
    ) {
        require(_tierIndex < yieldTiers.length, "Invalid tier index");
        YieldTier storage tier = yieldTiers[_tierIndex];
        return (tier.duration, tier.threshold);
    }
    
    /**
     * @dev 设置 Oracle 地址
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid address");
        oracle = _oracle;
    }
    
    /**
     * @dev 提取平台费
     */
    function withdrawFees() external onlyOwner {
        require(collectedFees > 0, "No fees");
        
        uint256 amount = collectedFees;
        collectedFees = 0;
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdraw failed");
    }
    
    /**
     * @dev 转移所有权
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
    
    receive() external payable {}
}
