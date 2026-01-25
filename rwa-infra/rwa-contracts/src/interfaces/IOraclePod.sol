// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/// @notice Minimal interface for consuming oracle prices from the existing oracle project.
/// @dev Keep this interface small to avoid coupling the RWA contracts to oracle implementation details.
interface IOraclePod {
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 nodeCount, uint256 timestamp);

    function getPriceWithDecimals() external view returns (uint256 price, uint8 decimals);
    // Legacy (string price). Useful for demo compatibility with the oracle-node manager's legacy fill path.
    function getSymbolPrice() external view returns (string memory);
    function getUpdateTimestamp() external view returns (uint256);
    function isDataFresh(uint256 _maxAge) external view returns (bool);
}

