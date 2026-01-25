// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IPodFactory.sol";

/**
 * @title PodFactoryStorage
 * @notice Storage contract for PodFactory
 * @dev Separates storage from logic for upgradeability
 */
abstract contract PodFactoryStorage is IPodFactory {
    // ============ State Variables ============

    /// @notice PodDeployer contract address
    address public podDeployer;

    /// @notice Manager contract addresses
    address public eventManager;
    address public orderBookManager;
    address public fundingManager;
    address public feeVaultManager;

    /// @notice Next vendor ID counter (starts from 1)
    uint256 public nextVendorId;

    /// @notice Mapping from vendorId to VendorInfo
    mapping(uint256 => VendorInfo) public vendors;

    /// @notice Mapping from vendor address to vendorId
    mapping(address => uint256) public vendorAddressToId;

    /// @notice Storage gap for future upgrades (50 slots reserved)
    /// @dev Subtract used slots: 8 variables = 8 slots used
    uint256[42] private _gap;
}
