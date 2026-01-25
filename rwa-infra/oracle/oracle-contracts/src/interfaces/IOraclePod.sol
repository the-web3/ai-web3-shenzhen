// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IOraclePod {
    // Events
    event PriceUpdated(
        uint256 oldPrice,
        uint256 newPrice,
        uint256 nodeCount,
        uint256 timestamp
    );

    event OracleManagerUpdate(
        address oldManagerAddress,
        address newManagerAddress
    );

    // Legacy event (deprecated)
    event MarketPriceUpdated(
        string oldPrice,
        string price,
        uint256 timestamp
    );

    /// @notice Fill prices from multiple oracle nodes and calculate weighted average
    /// @param prices Array of prices from each node (with PRICE_DECIMALS precision)
    /// @param weights Array of weights for each node
    function fillPrices(uint256[] calldata prices, uint256[] calldata weights) external;

    /// @notice Get the aggregated price
    /// @return The weighted average price
    function getPrice() external view returns (uint256);

    /// @notice Get price with decimals info
    /// @return price The aggregated price
    /// @return decimals The number of decimals
    function getPriceWithDecimals() external view returns (uint256 price, uint8 decimals);

    /// @notice Check if the price data is fresh
    /// @param _maxAge Maximum age in seconds
    /// @return True if data is fresh
    function isDataFresh(uint256 _maxAge) external view returns (bool);

    /// @notice Get the last update timestamp
    /// @return The timestamp of last update
    function getUpdateTimestamp() external view returns (uint256);

    // Legacy functions (deprecated, for backward compatibility)
    function fillSymbolPrice(string memory price) external;
    function getSymbolPrice() external view returns (string memory);
}
