// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IFeeVaultPod.sol";

/**
 * @title FeeVaultPodStorage
 * @notice FeeVaultPod 的存储层合约
 * @dev 存储手续费余额、费率配置等数据
 */
abstract contract FeeVaultPodStorage is IFeeVaultPod {
    // ============ 合约地址 Contract Addresses ============

    /// @notice FeeVaultManager 合约地址
    address public feeVaultManager;

    /// @notice OrderBookPod 合约地址
    address public orderBookPod;

    // ============ 手续费配置 Fee Configuration ============

    /// @notice 手续费接收者
    address public feeRecipient;

    /// @notice 手续费率映射: feeType => rate (basis points)
    /// @dev 例如: feeRates["trade"] = 30 表示 0.3% 交易手续费
    mapping(bytes32 => uint256) internal feeRates;

    /// @notice 手续费率键列表(用于遍历)
    bytes32[] internal feeRateKeys;

    /// @notice 手续费率键是否存在
    mapping(bytes32 => bool) internal feeRateKeyExists;

    // ============ 手续费余额管理 Fee Balance Management ============

    /// @notice Token 手续费余额: token => balance
    mapping(address => uint256) public feeBalances;

    /// @notice 总手续费收取: token => totalCollected
    mapping(address => uint256) public totalFeesCollected;

    /// @notice 总手续费提取: token => totalWithdrawn
    mapping(address => uint256) public totalFeesWithdrawn;

    // ============ 手续费统计 Fee Statistics ============

    /// @notice 事件手续费统计: eventId => token => amount
    mapping(uint256 => mapping(address => uint256)) public eventFees;

    /// @notice 用户支付的手续费: user => token => amount
    mapping(address => mapping(address => uint256)) public userPaidFees;

    // ============ AdminFeeVault 集成 AdminFeeVault Integration ============

    /// @notice AdminFeeVault 合约地址
    address public adminFeeVault;

    /// @notice 自动转账阈值: token => threshold
    /// @dev 当 feeBalances[token] >= transferThreshold[token] 时自动转账到 AdminFeeVault
    mapping(address => uint256) public transferThreshold;

    // ============ 常量 Constants ============

    /// @notice 费率精度(基点)
    uint256 public constant FEE_PRECISION = 10000;

    /// @notice 最大费率(10%)
    uint256 public constant MAX_FEE_RATE = 1000;

}
