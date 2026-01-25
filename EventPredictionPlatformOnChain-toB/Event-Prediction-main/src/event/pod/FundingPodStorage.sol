// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IFundingPod.sol";

/**
 * @title FundingPodStorage
 * @notice FundingPod 的存储层合约
 * @dev 存储与逻辑分离
 */
abstract contract FundingPodStorage is IFundingPod {
    // ============ 常量 Constants ============

    /// @notice ETH 地址表示
    address public constant ETHAddress = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    // ============ 基础状态变量 Basic State Variables ============

    /// @notice FundingManager 合约地址
    address public fundingManager;

    /// @notice OrderBookPod 合约地址(用于调用权限控制)
    address public orderBookPod;

    /// @notice EventPod 合约地址(用于调用权限控制)
    address public eventPod;

    /// @notice 支持的 Token 列表
    address[] public SupportTokens;

    /// @notice Token 是否支持映射
    mapping(address => bool) public IsSupportToken;

    // ============ 余额管理 Balance Management ============

    /// @notice Pod 总 Token 余额: token => totalBalance
    mapping(address => uint256) public tokenBalances;

    /// @notice 用户可用余额: user => token => balance
    mapping(address => mapping(address => uint256)) public userTokenBalances;

    // ============ 虚拟 Long Token 持仓 Virtual Long Token Positions ============

    /// @notice 用户虚拟 Long Token 持仓: user => token => eventId => outcomeIndex => longBalance
    /// @dev 代表用户持有的某个结果的 Long token 数量
    mapping(address => mapping(address => mapping(uint256 => mapping(uint8 => uint256)))) public longPositions;

    /// @notice 订单锁定的 USDT: orderId => lockedUSDT
    /// @dev 买单锁定 USDT,撮合时释放
    mapping(uint256 => uint256) public orderLockedUSDT;

    /// @notice 订单锁定的 Long Token: orderId => eventId => outcomeIndex => lockedLong
    /// @dev 卖单锁定 Long token,撮合时释放
    mapping(uint256 => mapping(uint256 => mapping(uint8 => uint256))) public orderLockedLong;

    // ============ 事件奖金池管理 Event Prize Pool ============

    /// @notice 事件奖金池: eventId => token => prizePool
    mapping(uint256 => mapping(address => uint256)) public eventPrizePool;

    /// @notice 事件结算状态: eventId => settled
    mapping(uint256 => bool) public eventSettled;

    /// @notice 事件获胜结果: eventId => winningOutcomeIndex
    mapping(uint256 => uint8) public eventWinningOutcome;

    // ============ 统计信息 Statistics ============

    /// @notice 总入金量: token => totalDeposited
    mapping(address => uint256) public totalDeposited;

    /// @notice 总提现量: token => totalWithdrawn
    mapping(address => uint256) public totalWithdrawn;

    // ============ 事件结果信息 Event Outcome Info ============

    /// @notice 事件的所有结果索引: eventId => outcomeIndices[]
    /// @dev 用于铸造完整集合时遍历所有结果
    mapping(uint256 => uint8[]) public eventOutcomes;

}
