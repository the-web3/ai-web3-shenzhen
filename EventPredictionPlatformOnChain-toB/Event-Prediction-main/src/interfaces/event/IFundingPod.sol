// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IFundingPod
 * @notice 资金 Pod 接口 - 负责资金管理、锁定和结算
 * @dev 每个 FundingPod 独立管理一组事件的资金
 */
interface IFundingPod {
    // ============ 常量 Constants ============

    /// @notice ETH 地址表示
    function ETHAddress() external view returns (address);

    // ============ 事件 Events ============

    /// @notice 用户入金事件
    event DepositToken(address indexed tokenAddress, address indexed sender, uint256 amount);

    /// @notice 用户提现事件
    event WithdrawToken(address indexed tokenAddress, address indexed sender, address withdrawAddress, uint256 amount);

    /// @notice Token 支持状态变更事件
    event SetSupportTokenEvent(address indexed token, bool isSupport, uint256 chainId);

    /// @notice 资金锁定事件
    event FundsLocked(
        address indexed user, address indexed token, uint256 amount, uint256 indexed eventId, uint8 outcomeIndex
    );

    /// @notice 资金解锁事件
    event FundsUnlocked(
        address indexed user, address indexed token, uint256 amount, uint256 indexed eventId, uint8 outcomeIndex
    );

    /// @notice 订单结算事件
    event OrderSettled(uint256 indexed buyOrderId, uint256 indexed sellOrderId, uint256 amount, address indexed token);

    /// @notice 事件结算事件
    event EventSettled(
        uint256 indexed eventId,
        uint8 winningOutcomeIndex,
        address indexed token,
        uint256 prizePool,
        uint256 winnersCount
    );

    /// @notice 完整集合铸造事件
    event CompleteSetMinted(address indexed user, uint256 indexed eventId, address indexed token, uint256 amount);

    /// @notice 完整集合销毁事件
    event CompleteSetBurned(address indexed user, uint256 indexed eventId, address indexed token, uint256 amount);

    /// @notice Long Token 转移事件
    event LongTransferred(
        address indexed from,
        address indexed to,
        uint256 indexed eventId,
        uint8 outcomeIndex,
        address token,
        uint256 amount
    );

    // ============ 错误 Errors ============

    error LessThanZero(uint256 amount);
    error TokenIsNotSupported(address ERC20Address);
    error InsufficientBalance(address user, address token, uint256 required, uint256 available);
    error InsufficientLockedBalance(address user, address token, uint256 eventId, uint8 outcomeIndex);
    error EventAlreadySettled(uint256 eventId);
    error InvalidWinningOutcome(uint256 eventId, uint8 outcomeIndex);
    error InsufficientLongPosition(address user, address token, uint256 eventId, uint8 outcomeIndex);
    error EventNotRegistered(uint256 eventId);

    // ============ 基础功能 Basic Functions ============

    /**
     * @notice 用户入金 (Public - users can call directly)
     * @param tokenAddress Token 地址
     * @param amount 金额
     */
    function deposit(address tokenAddress, uint256 amount) external payable;

    /**
     * @notice 资金管理提现 (由 FundingManager 调用)
     * @param user 用户地址
     * @param tokenAddress Token 地址
     * @param withdrawAddress 提现目标地址
     * @param amount 金额
     */
    function withdraw(address user, address tokenAddress, address payable withdrawAddress, uint256 amount) external;

    /**
     * @notice 用户直接 ETH 入金
     */
    function depositEth() external payable;

    /**
     * @notice 用户直接 ERC20 入金
     * @param tokenAddress Token 地址
     * @param amount 金额
     */
    function depositErc20(IERC20 tokenAddress, uint256 amount) external;

    /**
     * @notice 用户直接提现
     * @param tokenAddress Token 地址
     * @param amount 金额
     */
    function withdrawDirect(address tokenAddress, uint256 amount) external;

    /**
     * @notice 设置支持的 ERC20 Token
     * @param ERC20Address Token 地址
     * @param isValid 是否支持
     */
    function setSupportERC20Token(address ERC20Address, bool isValid) external;

    // ============ 核心资金管理 Core Funding Functions ============

    /**
     * @notice 注册事件的结果选项
     * @param eventId 事件 ID
     * @param outcomeCount 结果数量
     */
    function registerEvent(uint256 eventId, uint8 outcomeCount) external;

    /**
     * @notice 铸造完整集合 (用户支付 amount USDT,获得所有结果各 amount 份 Long)
     * @param user 用户地址
     * @param eventId 事件 ID
     * @param token Token 地址
     * @param amount 铸造数量
     */
    function mintCompleteSet(address user, uint256 eventId, address token, uint256 amount) external;

    /**
     * @notice 销毁完整集合 (用户销毁所有结果各 amount 份 Long,获得 amount USDT)
     * @param user 用户地址
     * @param eventId 事件 ID
     * @param token Token 地址
     * @param amount 销毁数量
     */
    function burnCompleteSet(address user, uint256 eventId, address token, uint256 amount) external;

    /**
     * @notice 用户直接铸造完整集合
     * @param eventId 事件 ID
     * @param token Token 地址
     * @param amount 铸造数量
     */
    function mintCompleteSetDirect(uint256 eventId, address token, uint256 amount) external;

    /**
     * @notice 用户直接销毁完整集合
     * @param eventId 事件 ID
     * @param token Token 地址
     * @param amount 销毁数量
     */
    function burnCompleteSetDirect(uint256 eventId, address token, uint256 amount) external;

    /**
     * @notice 下单时锁定资金或 Long Token
     * @param user 用户地址
     * @param orderId 订单 ID
     * @param token Token 地址
     * @param isBuyOrder 是否为买单
     * @param amount 锁定数量 (买单锁 USDT,卖单锁 Long)
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     */
    function lockForOrder(
        address user,
        uint256 orderId,
        address token,
        bool isBuyOrder,
        uint256 amount,
        uint256 eventId,
        uint8 outcomeIndex
    ) external;

    /**
     * @notice 撤单时解锁资金或 Long Token
     * @param user 用户地址
     * @param orderId 订单 ID
     * @param token Token 地址
     * @param isBuyOrder 是否为买单
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     */
    function unlockForOrder(
        address user,
        uint256 orderId,
        address token,
        bool isBuyOrder,
        uint256 eventId,
        uint8 outcomeIndex
    ) external;

    /**
     * @notice 撮合成交时结算资金 (买家用 USDT 换 Long,卖家用 Long 换 USDT)
     * @param buyOrderId 买单 ID
     * @param sellOrderId 卖单 ID
     * @param buyer 买家地址
     * @param seller 卖家地址
     * @param token Token 地址
     * @param matchAmount 成交数量
     * @param matchPrice 成交价格 (basis points, 1-10000)
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     */
    function settleMatchedOrder(
        uint256 buyOrderId,
        uint256 sellOrderId,
        address buyer,
        address seller,
        address token,
        uint256 matchAmount,
        uint256 matchPrice,
        uint256 eventId,
        uint8 outcomeIndex
    ) external;

    /**
     * @notice 事件结算时分配奖金
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引
     * @param token Token 地址
     * @param winners 获胜者地址列表
     * @param positions 获胜者持仓列表
     */
    function settleEvent(
        uint256 eventId,
        uint8 winningOutcomeIndex,
        address token,
        address[] calldata winners,
        uint256[] calldata positions
    ) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取 Pod 总 Token 余额
     * @param token Token 地址
     * @return balance Token 总余额
     */
    function tokenBalances(address token) external view returns (uint256);

    /**
     * @notice 获取用户可用余额
     * @param user 用户地址
     * @param token Token 地址
     * @return balance 可用余额
     */
    function getUserBalance(address user, address token) external view returns (uint256);

    /**
     * @notice 获取用户 Long Token 持仓
     * @param user 用户地址
     * @param token Token 地址
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     * @return position Long Token 数量
     */
    function getLongPosition(address user, address token, uint256 eventId, uint8 outcomeIndex)
        external
        view
        returns (uint256);

    /**
     * @notice 获取订单锁定的 USDT
     * @param orderId 订单 ID
     * @return locked 锁定的 USDT 数量
     */
    function getOrderLockedUSDT(uint256 orderId) external view returns (uint256);

    /**
     * @notice 获取订单锁定的 Long Token
     * @param orderId 订单 ID
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     * @return locked 锁定的 Long Token 数量
     */
    function getOrderLockedLong(
        uint256 orderId,
        uint256 eventId,
        uint8 outcomeIndex
    ) external view returns (uint256);

    /**
     * @notice 获取事件奖金池
     * @param eventId 事件 ID
     * @param token Token 地址
     * @return pool 奖金池金额
     */
    function getEventPrizePool(uint256 eventId, address token) external view returns (uint256);

    /**
     * @notice 检查事件是否已结算
     * @param eventId 事件 ID
     * @return settled 是否已结算
     */
    function isEventSettled(uint256 eventId) external view returns (bool);
}
