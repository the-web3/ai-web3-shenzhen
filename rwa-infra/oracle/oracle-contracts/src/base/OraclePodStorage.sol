// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { IOraclePod } from "../interfaces/IOraclePod.sol";

abstract contract OraclePodStorage is IOraclePod {
    // Oracle manager address
    address public oracleManager;

    // Aggregated price (weighted average from all nodes)
    // Uses PRICE_DECIMALS precision (e.g., 1800.50 = 1800500000 with 6 decimals)
    uint256 public aggregatedPrice;

    // Last update timestamp
    uint256 public updateTimestamp;

    // Price decimals (default 6, meaning 1800.50 = 1800500000)
    uint8 public constant PRICE_DECIMALS = 6;

    // Maximum age for fresh data (default 1 day)
    uint256 public constant maxAge = 1 days;

    // Legacy: string-based market price (deprecated, for backward compatibility)
    string public marketPrice;

    // Reserved storage gap for future upgrades
    uint256[47] private __gap;
}
