// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IEventManager.sol";

/**
 * @title EventManagerStorage
 * @notice EventManager 的存储层合约 - Vendor Registry
 * @dev 存储与逻辑分离,便于合约升级
 */
abstract contract EventManagerStorage is IEventManager {
    // ============ 状态变量 State Variables ============

    /// @notice 预言机授权映射
    mapping(address => bool) public authorizedOracles;

    /// @notice OrderBookManager 合约地址 (用于平台级配置)
    address public orderBookManager;

    /// @notice PodFactory 合约地址 (用于查询 vendor pods)
    address public podFactory;

    /// @notice Vendor ID 到 EventPod 地址的映射
    mapping(uint256 => address) public vendorToEventPod;

    /// @notice EventPod 部署状态
    mapping(address => bool) internal eventPodIsDeployed;

    /// @notice PodDeployer 合约地址
    address public podDeployer;

    /// @notice 预留升级空间(OpenZeppelin 升级模式)
    /// @dev 减去已使用的 slot 数量: 6 个映射/变量 = 6 slots
    uint256[44] private _gap;
}
