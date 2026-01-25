// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IFeeVaultPod
 * @notice 手续费金库 Pod 接口 - 负责手续费收取和分配
 * @dev 每个 FeeVaultPod 独立管理一组事件的手续费
 */
interface IFeeVaultPod {
    // ============ 事件 Events ============

    /// @notice 手续费收取事件
    event FeeCollected(address indexed token, address indexed payer, uint256 amount, uint256 eventId, string feeType);

    /// @notice 手续费提取事件
    event FeeWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    /// @notice 手续费率更新事件
    event FeeRateUpdated(string indexed feeType, uint256 oldRate, uint256 newRate);

    /// @notice 手续费接收者更新事件
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    /// @notice 手续费转账到 AdminFeeVault 事件
    event FeeTransferredToAdmin(
        address indexed token,
        uint256 amount,
        string category
    );

    /// @notice AdminFeeVault 地址更新事件
    event AdminFeeVaultUpdated(
        address indexed oldVault,
        address indexed newVault
    );

    /// @notice 转账阈值更新事件
    event TransferThresholdUpdated(
        address indexed token,
        uint256 oldThreshold,
        uint256 newThreshold
    );

    // ============ 错误 Errors ============

    error InvalidFeeRate(uint256 rate);
    error InvalidRecipient(address recipient);
    error InsufficientFeeBalance(address token, uint256 requested, uint256 available);
    error InvalidAmount(uint256 amount);

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 收取交易手续费
     * @param token Token 地址
     * @param payer 支付者地址
     * @param amount 手续费金额
     * @param eventId 事件 ID
     * @param feeType 手续费类型("trade", "settlement", etc.)
     */
    function collectFee(
        address token,
        address payer,
        uint256 amount,
        uint256 eventId,
        string calldata feeType
    ) external;

    /**
     * @notice 提取手续费
     * @param token Token 地址
     * @param recipient 接收者地址
     * @param amount 提取金额
     */
    function withdrawFee(address token, address recipient, uint256 amount) external;

    /**
     * @notice 设置手续费率
     * @param feeType 手续费类型
     * @param rate 费率(基点, 1-10000)
     */
    function setFeeRate(string calldata feeType, uint256 rate) external;

    /**
     * @notice 设置手续费接收者
     * @param recipient 接收者地址
     */
    function setFeeRecipient(address recipient) external;

    /**
     * @notice 设置 AdminFeeVault 地址
     * @param vault AdminFeeVault 合约地址
     */
    function setAdminFeeVault(address vault) external;

    /**
     * @notice 设置自动转账阈值
     * @param token Token 地址
     * @param threshold 阈值金额
     */
    function setTransferThreshold(address token, uint256 threshold) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取手续费余额
     * @param token Token 地址
     * @return balance 手续费余额
     */
    function getFeeBalance(address token) external view returns (uint256 balance);

    /**
     * @notice 获取手续费率
     * @param feeType 手续费类型
     * @return rate 费率(基点)
     */
    function getFeeRate(string calldata feeType) external view returns (uint256 rate);

    /**
     * @notice 获取手续费接收者
     * @return recipient 接收者地址
     */
    function getFeeRecipient() external view returns (address recipient);

    /**
     * @notice 计算手续费
     * @param amount 交易金额
     * @param feeType 手续费类型
     * @return fee 手续费金额
     */
    function calculateFee(uint256 amount, string calldata feeType) external view returns (uint256 fee);
}
