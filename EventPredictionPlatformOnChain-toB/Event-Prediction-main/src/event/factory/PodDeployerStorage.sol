// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IPodDeployer.sol";

/**
 * @title PodDeployerStorage
 * @notice Storage contract for PodDeployer
 * @dev Separates storage from logic for upgradeability
 */
abstract contract PodDeployerStorage is IPodDeployer {
    // ============ Constants ============

    /// @notice Pod type identifiers
    uint256 public constant POD_TYPE_EVENT = 0;
    uint256 public constant POD_TYPE_ORDERBOOK = 1;
    uint256 public constant POD_TYPE_FEEVAULT = 2;
    uint256 public constant POD_TYPE_FUNDING = 3;

    // ============ State Variables ============

    /// @notice Mapping from pod type to implementation address
    mapping(uint256 => address) public podImplementations;

    /// @notice Mapping to track deployed vendor pod sets
    mapping(uint256 => bool) public vendorPodSetDeployed;

    /// @notice EventManager address for pod initialization
    address public eventManager;

    /// @notice OrderBookManager address for pod initialization
    address public orderBookManager;

    /// @notice FeeVaultManager address for pod initialization
    address public feeVaultManager;

    /// @notice FundingManager address for pod initialization
    address public fundingManager;

    /// @notice Storage gap for future upgrades (50 slots reserved)
    /// @dev Subtract used slots: 6 variables = 6 slots used
    uint256[44] private _gap;
}
