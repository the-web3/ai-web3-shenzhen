// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IOrderBookManager.sol";
import "../../interfaces/event/IOrderBookPod.sol";

abstract contract OrderBookManagerStorage is IOrderBookManager {
    /// @notice Vendor ID 到 OrderBookPod 地址的映射
    mapping(uint256 => address) public vendorToOrderBookPod;

    /// @notice OrderBookPod 部署状态
    mapping(address => bool) internal orderBookPodIsDeployed;

    /// @notice PodDeployer 合约地址
    address public podDeployer;

    /// @notice 授权的调用者映射 (EventManager/EventPod 等)
    mapping(address => bool) public authorizedCallers;

    /// @notice PodFactory 合约地址
    address public factory;

    /// @notice 预留升级空间
    /// @dev 减去已使用的 slot 数量: 5 个映射/变量
    uint256[95] private _gap;
}
