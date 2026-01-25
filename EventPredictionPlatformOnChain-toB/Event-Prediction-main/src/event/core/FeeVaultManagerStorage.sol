// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IFeeVaultManager.sol";

/**
 * @title FeeVaultManagerStorage
 * @notice FeeVaultManager 的存储层合约
 * @dev 存储与逻辑分离,便于合约升级
 */
abstract contract FeeVaultManagerStorage is IFeeVaultManager {
    // ============ Pod 管理 Pod Management ============

    /// @notice Vendor ID 到 FeeVaultPod 地址的映射
    mapping(uint256 => address) public vendorToFeeVaultPod;

    /// @notice FeeVaultPod 部署状态
    mapping(address => bool) internal feeVaultPodIsDeployed;

    /// @notice PodDeployer 合约地址
    address public podDeployer;

    /// @notice PodFactory 合约地址
    address public factory;

    // ============ 预留升级空间 Upgrade Reserve ============

    /// @notice 预留 storage slots
    /// @dev 减去已使用的 slot 数量: 4 个映射/变量
    uint256[96] private __gap;
}
