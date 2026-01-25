// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IFeeVaultManager
 * @notice 手续费管理器接口 - 负责 Pod 路由和手续费管理
 * @dev Manager 层负责协调,Pod 层负责执行
 */
interface IFeeVaultManager {
    // ============ 事件 Events ============

    /// @notice FeeVaultPod 部署事件
    event FeeVaultPodDeployed(uint256 indexed vendorId, address indexed feeVaultPod);

    // ============ Pod 部署功能 ============

    /**
     * @notice 部署 FeeVaultPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @param feeRecipient 手续费接收地址
     * @param orderBookPod OrderBookPod 地址
     * @return feeVaultPod FeeVaultPod 地址
     */
    function deployFeeVaultPod(
        uint256 vendorId,
        address vendorAddress,
        address feeRecipient,
        address orderBookPod
    ) external returns (address feeVaultPod);

    /**
     * @notice 获取 vendor 的 FeeVaultPod 地址
     * @param vendorId Vendor ID
     * @return feeVaultPod FeeVaultPod 地址
     */
    function getVendorFeeVaultPod(uint256 vendorId) external view returns (address);

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external;

    // ============ Pod 管理功能 ============

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取 Vendor Pod 的手续费余额
     * @param vendorId Vendor ID
     * @param token Token 地址
     * @return balance 手续费余额
     */
    function getVendorPodFeeBalance(uint256 vendorId, address token) external view returns (uint256 balance);
}
