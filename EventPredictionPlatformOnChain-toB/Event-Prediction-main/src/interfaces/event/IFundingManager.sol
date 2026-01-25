// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IFundingManager
 * @notice 资金管理器接口 - 负责资金池管理和 Pod 路由
 * @dev Manager 层负责协调,Pod 层负责执行
 */
interface IFundingManager {
    // ============ 事件 Events ============

    /// @notice FundingPod 部署事件
    event FundingPodDeployed(uint256 indexed vendorId, address indexed fundingPod);

    // ============ Pod 部署功能 ============

    /**
     * @notice 部署 FundingPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @param orderBookPod OrderBookPod 地址
     * @param eventPod EventPod 地址
     * @return fundingPod FundingPod 地址
     */
    function deployFundingPod(
        uint256 vendorId,
        address vendorAddress,
        address orderBookPod,
        address eventPod
    ) external returns (address fundingPod);

    /**
     * @notice 获取 vendor 的 FundingPod 地址
     * @param vendorId Vendor ID
     * @return fundingPod FundingPod 地址
     */
    function getVendorFundingPod(uint256 vendorId) external view returns (address);

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取 Vendor Pod 的总余额
     * @param vendorId Vendor ID
     * @param tokenAddress Token 地址
     * @return balance 总余额
     */
    function getVendorPodBalance(uint256 vendorId, address tokenAddress) external view returns (uint256);
}
