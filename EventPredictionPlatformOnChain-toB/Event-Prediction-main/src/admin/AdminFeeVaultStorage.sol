// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interfaces/admin/IAdminFeeVault.sol";

/**
 * @title AdminFeeVaultStorage
 * @notice AdminFeeVault 的存储层合约
 * @dev 存储平台级手续费数据、受益人配置等
 */
abstract contract AdminFeeVaultStorage is IAdminFeeVault {
    // ============ 授权管理 Authorization Management ============

    /// @notice 授权的 FeeVaultPod 映射
    mapping(address => bool) public authorizedPods;

    /// @notice 授权的 Pod 列表
    address[] internal authorizedPodsList;

    // ============ 受益人配置 Beneficiary Configuration ============

    /// @notice 受益人地址映射: role => beneficiary
    /// @dev 例如: beneficiaries["treasury"] = 0x123...
    mapping(bytes32 => address) internal beneficiaries;

    /// @notice 分配比例映射: role => ratio (basis points)
    /// @dev 例如: allocationRatios["treasury"] = 5000 表示 50%
    mapping(bytes32 => uint256) internal allocationRatios;

    /// @notice 受益人角色列表
    bytes32[] internal beneficiaryRoles;

    /// @notice 角色是否存在
    mapping(bytes32 => bool) internal roleExists;

    // ============ 手续费余额管理 Fee Balance Management ============

    /// @notice Token 手续费总余额: token => balance
    mapping(address => uint256) public feeBalances;

    /// @notice 待分配余额: token => pending
    mapping(address => uint256) public pendingDistribution;

    /// @notice 受益人已分配余额: beneficiary => token => amount
    mapping(address => mapping(address => uint256)) public beneficiaryBalances;

    // ============ 手续费统计 Fee Statistics ============

    /// @notice 总收集量: token => total
    mapping(address => uint256) public totalCollected;

    /// @notice 总分配量: token => total
    mapping(address => uint256) public totalDistributed;

    /// @notice 总提取量: token => total
    mapping(address => uint256) public totalWithdrawn;

    /// @notice 按类别统计: category => token => amount
    mapping(bytes32 => mapping(address => uint256)) public collectedByCategory;

    // ============ 常量 Constants ============

    /// @notice 分配比例精度(基点)
    uint256 public constant RATIO_PRECISION = 10000;

    /// @notice 最大总分配比例(100%)
    uint256 public constant MAX_TOTAL_RATIO = 10000;

    // ============ 预留升级空间 Upgrade Reserve ============

    /// @notice 预留 storage slots
    uint256[35] private __gap;
}
