// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title DeploymentConstants
 * @notice Constants used throughout the deployment scripts
 */
library DeploymentConstants {
    // Pod Types (must match PodDeployer enum)
    uint256 constant POD_TYPE_EVENT = 0;
    uint256 constant POD_TYPE_ORDERBOOK = 1;
    uint256 constant POD_TYPE_FEEVAULT = 2;
    uint256 constant POD_TYPE_FUNDING = 3;

    // Fee allocation (basis points, total = 10000)
    uint256 constant TREASURY_RATIO = 5000; // 50%
    uint256 constant TEAM_RATIO = 3000; // 30%
    uint256 constant LIQUIDITY_RATIO = 2000; // 20%

    // Oracle defaults
    uint256 constant DEFAULT_REQUEST_TIMEOUT = 1 hours;
    uint256 constant DEFAULT_MIN_CONFIRMATIONS = 1;

    // Beneficiary names
    string constant BENEFICIARY_TREASURY = "treasury";
    string constant BENEFICIARY_TEAM = "team";
    string constant BENEFICIARY_LIQUIDITY = "liquidity";
}
