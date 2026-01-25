// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./IPodFactory.sol";

/**
 * @title IEventManager
 * @notice Vendor Registry 接口 - 管理 vendor 注册和平台配置
 * @dev Vendors 直接与其 pods 交互,EventManager 仅作为注册表
 */
interface IEventManager {
    // ============ 事件 Events ============

    /// @notice EventPod 部署事件
    event EventPodDeployed(uint256 indexed vendorId, address indexed eventPod);

    /// @notice Vendor 注册事件
    event VendorRegistered(uint256 indexed vendorId);

    /// @notice Vendor 注销事件
    event VendorUnregistered(uint256 indexed vendorId);

    /// @notice 预言机注册事件
    event OracleRegistered(address indexed oracle);

    /// @notice 预言机移除事件
    event OracleRemoved(address indexed oracle);

    // ============ Pod 部署功能 ============

    /**
     * @notice 部署 EventPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @return eventPod EventPod 地址
     */
    function deployEventPod(uint256 vendorId, address vendorAddress) external returns (address eventPod);

    /**
     * @notice 获取 vendor 的 EventPod 地址
     * @param vendorId Vendor ID
     * @return eventPod EventPod 地址
     */
    function getVendorEventPod(uint256 vendorId) external view returns (address);

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external;

    // ============ Vendor 管理功能 ============

    /**
     * @notice 注册 vendor
     * @param vendorId Vendor ID
     */
    function registerVendor(uint256 vendorId) external;

    /**
     * @notice 注销 vendor
     * @param vendorId Vendor ID
     */
    function unregisterVendor(uint256 vendorId) external;

    // ============ 预言机管理功能 ============

    /**
     * @notice 注册预言机
     * @param oracle 预言机地址
     */
    function registerOracle(address oracle) external;

    /**
     * @notice 移除预言机
     * @param oracle 预言机地址
     */
    function removeOracle(address oracle) external;

    /**
     * @notice 检查预言机是否已授权
     * @param oracle 预言机地址
     * @return isAuthorized 是否已授权
     */
    function isOracleAuthorized(address oracle) external view returns (bool);

    // ============ 查询功能 ============

    /**
     * @notice 获取 vendor 的 pod set
     * @param vendorId Vendor ID
     * @return podSet Vendor 的 pod set 信息
     */
    function getVendorPodSet(uint256 vendorId) external view returns (IPodFactory.VendorPodSet memory);
}
