// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IFundingManager.sol";

/**
 * @title FundingManagerStorage
 * @notice FundingManager 的存储层合约
 * @dev 存储与逻辑分离,便于合约升级
 */
abstract contract FundingManagerStorage is IFundingManager {
    // ============ 状态变量 State Variables ============

    /// @notice Vendor ID 到 FundingPod 地址的映射
    mapping(uint256 => address) public vendorToFundingPod;

    /// @notice FundingPod 部署状态
    mapping(address => bool) internal fundingPodIsDeployed;

    /// @notice PodDeployer 合约地址
    address public podDeployer;

    /// @notice PodFactory 合约地址
    address public factory;

    /// @notice 预留升级空间(OpenZeppelin 升级模式)
    /// @dev 减去已使用的 slot 数量: 4 个映射/变量
    uint256[46] private _gap;
}
