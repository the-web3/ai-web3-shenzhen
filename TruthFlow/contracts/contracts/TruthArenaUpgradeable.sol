// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title TruthArenaUpgradeable
 * @dev 可升级版本的预测市场合约
 * @notice 采用 UUPS 代理模式，支持动态选项扩展
 * @notice 核心数据结构已改为 Mapping，支持无限扩展选项，同时预留了 Storage Gap
 */
contract TruthArenaUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    enum MarketStatus { Active, Resolved, Cancelled }
    
    struct Market {
        string question;
        string description;
        uint256 endTime;
        uint256 outcomeCount;   // 选项数量 (例如: 2 代表 Yes/No, 3 代表 A/B/C)
        MarketStatus status;
        uint256 winningOutcome; // 最终获胜的选项 ID
        bytes32 verifiedTxHash;
        uint256 createdAt;
        address creator;
        bool yieldEnabled;
    }
    
    // 用户的持仓数据
    struct UserPosition {
        uint256 shares; // 持有的份额
        uint256 cost;   // 投入的成本
    }
    
    // --- Storage Layout (必须保持顺序不变) ---
    
    // 市场基本信息: marketId => Market Struct
    mapping(uint256 => Market) public markets;
    
    // 核心改造：使用 Mapping 存储资金池和份额，支持动态扩展
    // marketId => outcomeId => amount
    mapping(uint256 => mapping(uint256 => uint256)) public marketPools; 
    // marketId => outcomeId => shares
    mapping(uint256 => mapping(uint256 => uint256)) public marketTotalShares;
    
    // 用户持仓: marketId => userAddress => outcomeId => Position
    mapping(uint256 => mapping(address => mapping(uint256 => UserPosition))) public userPositions;
    
    // 领奖记录: marketId => userAddress => hasClaimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    
    uint256 public marketCount;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant PLATFORM_FEE = 200; // 2%
    uint256 public constant BASIS_POINTS = 10000;
    
    address public oracle;
    uint256 public collectedFees;
    
    // 预留存储空间，防止未来升级冲突 (Gap Pattern)
    // 这是一个非常重要的最佳实践，为未来可能添加的变量预留 50 个槽位
    uint256[50] private __gap;

    // Events
    event MarketCreated(uint256 indexed marketId, string question, uint256 outcomes, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, address indexed user, uint256 outcomeId, uint256 amount, uint256 shares);
    event MarketResolved(uint256 indexed marketId, uint256 outcomeId, bytes32 txHash);
    event RewardClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event OracleUpdated(address newOracle);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev 初始化函数 (替代构造函数)
     */
    function initialize(address _oracle) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        oracle = _oracle;
    }

    /**
     * @dev 授权升级 (UUPS 必须实现)
     * @notice 只有 owner 可以升级合约逻辑
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- 业务逻辑 (与 V3 保持一致) ---

    /**
     * @dev 创建新市场 (支持自定义选项数量)
     * @param _outcomeCount 选项数量 (例如 2 代表 Yes/No)
     */
    function createMarket(
        string memory _question,
        string memory _description,
        uint256 _duration,
        uint256 _outcomeCount
    ) external returns (uint256) {
        require(_duration > 0, "Duration must be positive");
        require(bytes(_question).length > 0, "Question required");
        require(_outcomeCount >= 2, "At least 2 outcomes required");
        
        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];
        
        market.question = _question;
        market.description = _description;
        market.endTime = block.timestamp + _duration;
        market.outcomeCount = _outcomeCount;
        market.status = MarketStatus.Active;
        market.createdAt = block.timestamp;
        market.creator = msg.sender;
        
        emit MarketCreated(marketId, _question, _outcomeCount, market.endTime);
        return marketId;
    }
    
    /**
     * @dev 下注 (指定 outcomeId)
     */
    function placeBet(uint256 _marketId, uint256 _outcomeId) external payable {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");
        require(msg.value >= MIN_BET, "Below minimum bet");
        require(_outcomeId < market.outcomeCount, "Invalid outcome ID");
        
        // 计算平台费
        uint256 fee = (msg.value * PLATFORM_FEE) / BASIS_POINTS;
        uint256 netAmount = msg.value - fee;
        collectedFees += fee;
        
        // 计算份额
        // 逻辑：当前选项池 vs 所有其他选项池的总和 (AMM)
        uint256 currentPool = marketPools[_marketId][_outcomeId];
        uint256 otherPoolsTotal = _getOtherPoolsTotal(_marketId, _outcomeId, market.outcomeCount);
        
        uint256 shares = calculateShares(currentPool, otherPoolsTotal, netAmount);
        
        // 更新 Mapping 状态
        marketPools[_marketId][_outcomeId] += netAmount;
        marketTotalShares[_marketId][_outcomeId] += shares;
        
        UserPosition storage pos = userPositions[_marketId][msg.sender][_outcomeId];
        pos.shares += shares;
        pos.cost += msg.value;
        
        emit BetPlaced(_marketId, msg.sender, _outcomeId, msg.value, shares);
    }

    /**
     * @dev 辅助函数：计算其他所有池子的总资金
     */
    function _getOtherPoolsTotal(uint256 _marketId, uint256 _targetOutcomeId, uint256 _totalOutcomes) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < _totalOutcomes; i++) {
            if (i != _targetOutcomeId) {
                total += marketPools[_marketId][i];
            }
        }
        return total;
    }

    /**
     * @dev 计算份额 (CPMM / AMM 公式)
     */
    function calculateShares(uint256 currentPool, uint256 oppositePool, uint256 amount) internal pure returns (uint256) {
        if (currentPool == 0 && oppositePool == 0) return amount;
        uint256 bonus = (amount * oppositePool) / (currentPool + 1 ether);
        return amount + bonus / 2;
    }
    
    /**
     * @dev 结算市场
     */
    function resolveMarket(
        uint256 _marketId,
        uint256 _winningOutcomeId,
        bytes32 _txHash
    ) external onlyOracle {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(_winningOutcomeId < market.outcomeCount, "Invalid outcome ID");
        
        market.status = MarketStatus.Resolved;
        market.winningOutcome = _winningOutcomeId;
        market.verifiedTxHash = _txHash;
        
        emit MarketResolved(_marketId, _winningOutcomeId, _txHash);
    }
    
    /**
     * @dev 领取奖励
     */
    function claimReward(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");
        
        uint256 winningId = market.winningOutcome;
        UserPosition storage pos = userPositions[_marketId][msg.sender][winningId];
        
        require(pos.shares > 0, "No winning shares");
        
        // 计算总奖池 (所有池子加起来)
        uint256 totalMarketPool = 0;
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            totalMarketPool += marketPools[_marketId][i];
        }
        
        // 奖金 = (你的份额 / 获胜方总份额) * 总奖池
        uint256 payout = (pos.shares * totalMarketPool) / marketTotalShares[_marketId][winningId];
        
        require(payout > 0, "Nothing to claim");
        hasClaimed[_marketId][msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(_marketId, msg.sender, payout);
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid address");
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }
}
