// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IAdminFeeVault
 * @notice 平台级费用金库接口 - 管理整个平台的手续费收入
 * @dev 这是一个单例合约,管理所有 FeeVaultPod 的手续费汇总
 */
interface IAdminFeeVault {
    // ============ 事件 Events ============

    /// @notice 手续费收集事件
    event FeeCollected(address indexed token, address indexed from, uint256 amount, string category);

    /// @notice 手续费分配事件
    event FeeDistributed(address indexed token, address indexed recipient, uint256 amount, string category);

    /// @notice 手续费提取事件
    event FeeWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    /// @notice 受益人更新事件
    event BeneficiaryUpdated(string indexed role, address indexed oldBeneficiary, address indexed newBeneficiary);

    /// @notice 分配比例更新事件
    event AllocationRatioUpdated(string indexed role, uint256 oldRatio, uint256 newRatio);

    // ============ 错误 Errors ============

    error InvalidAddress(address addr);
    error InvalidAmount(uint256 amount);
    error InvalidRatio(uint256 ratio);
    error InsufficientBalance(address token, uint256 requested, uint256 available);
    error TotalRatioExceedsMax(uint256 total);

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 从 FeeVaultPod 收集手续费
     * @param token Token 地址
     * @param amount 金额
     * @param category 类别("trade", "settlement", etc.)
     */
    function collectFeeFromPod(address token, uint256 amount, string calldata category) external;

    /**
     * @notice 分配手续费给受益人
     * @param token Token 地址
     */
    function distributeFees(address token) external;

    /**
     * @notice 提取手续费
     * @param token Token 地址
     * @param recipient 接收者地址
     * @param amount 金额
     */
    function withdraw(address token, address recipient, uint256 amount) external;

    /**
     * @notice 设置受益人地址
     * @param role 角色("treasury", "team", "liquidity", etc.)
     * @param beneficiary 受益人地址
     */
    function setBeneficiary(string calldata role, address beneficiary) external;

    /**
     * @notice 设置分配比例
     * @param role 角色
     * @param ratio 比例(基点, 0-10000)
     */
    function setAllocationRatio(string calldata role, uint256 ratio) external;

    /**
     * @notice 添加授权的 Pod
     * @param pod Pod 地址
     */
    function addAuthorizedPod(address pod) external;

    /**
     * @notice 移除授权的 Pod
     * @param pod Pod 地址
     */
    function removeAuthorizedPod(address pod) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取手续费余额
     * @param token Token 地址
     * @return balance 余额
     */
    function getFeeBalance(address token) external view returns (uint256 balance);

    /**
     * @notice 获取待分配余额
     * @param token Token 地址
     * @return pending 待分配金额
     */
    function getPendingDistribution(address token) external view returns (uint256 pending);

    /**
     * @notice 获取受益人地址
     * @param role 角色
     * @return beneficiary 受益人地址
     */
    function getBeneficiary(string calldata role) external view returns (address beneficiary);

    /**
     * @notice 获取分配比例
     * @param role 角色
     * @return ratio 比例(基点)
     */
    function getAllocationRatio(string calldata role) external view returns (uint256 ratio);

    /**
     * @notice 检查 Pod 是否授权
     * @param pod Pod 地址
     * @return isAuthorized 是否授权
     */
    function isAuthorizedPod(address pod) external view returns (bool isAuthorized);

    /**
     * @notice 获取总收集量
     * @param token Token 地址
     * @return total 总收集量
     */
    function getTotalCollected(address token) external view returns (uint256 total);

    /**
     * @notice 获取总分配量
     * @param token Token 地址
     * @return total 总分配量
     */
    function getTotalDistributed(address token) external view returns (uint256 total);
}
