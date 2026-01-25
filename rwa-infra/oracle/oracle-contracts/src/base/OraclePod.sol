// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";

import { OraclePodStorage } from "./OraclePodStorage.sol";

/// @title OraclePod - RWA Asset Price Oracle
/// @notice Stores aggregated asset prices from multiple oracle nodes
contract OraclePod is Initializable, OwnableUpgradeable, OraclePodStorage {
    constructor() {
        _disableInitializers();
    }

    modifier onlyOracleManager() {
        require(
            msg.sender == oracleManager,
            "OraclePod: caller is not the oracle manager"
        );
        _;
    }

    function initialize(address _initialOwner, address _oracleManager) external initializer {
        __Ownable_init(_initialOwner);
        oracleManager = _oracleManager;
    }

    /// @notice Fill prices from multiple oracle nodes and calculate weighted average
    /// @param prices Array of prices from each node
    /// @param weights Array of weights for each node
    function fillPrices(
        uint256[] calldata prices,
        uint256[] calldata weights
    ) external onlyOracleManager {
        require(prices.length > 0, "OraclePod: empty prices array");
        require(prices.length == weights.length, "OraclePod: length mismatch");

        uint256 oldPrice = aggregatedPrice;
        uint256 newPrice = _calculateWeightedAverage(prices, weights);

        aggregatedPrice = newPrice;
        updateTimestamp = block.timestamp;

        emit PriceUpdated(oldPrice, newPrice, prices.length, block.timestamp);
    }

    /// @notice Calculate weighted average of prices
    /// @param prices Array of prices
    /// @param weights Array of weights
    /// @return The weighted average price
    function _calculateWeightedAverage(
        uint256[] calldata prices,
        uint256[] calldata weights
    ) internal pure returns (uint256) {
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < prices.length; i++) {
            require(prices[i] > 0, "OraclePod: invalid price");
            require(weights[i] > 0, "OraclePod: invalid weight");

            weightedSum += prices[i] * weights[i];
            totalWeight += weights[i];
        }

        require(totalWeight > 0, "OraclePod: zero total weight");

        return weightedSum / totalWeight;
    }

    /// @notice Get the aggregated price
    /// @return The weighted average price
    function getPrice() external view returns (uint256) {
        return aggregatedPrice;
    }

    /// @notice Get price with decimals info
    /// @return price The aggregated price
    /// @return decimals The number of decimals
    function getPriceWithDecimals() external view returns (uint256 price, uint8 decimals) {
        return (aggregatedPrice, PRICE_DECIMALS);
    }

    /// @notice Check if the price data is fresh
    /// @param _maxAge Maximum age in seconds
    /// @return True if data is fresh
    function isDataFresh(uint256 _maxAge) external view returns (bool) {
        return block.timestamp - updateTimestamp <= _maxAge;
    }

    /// @notice Get the last update timestamp
    /// @return The timestamp of last update
    function getUpdateTimestamp() external view returns (uint256) {
        return updateTimestamp;
    }

    /// @notice Set oracle manager address
    /// @param _oracleManager New oracle manager address
    function setOracleManager(address _oracleManager) external onlyOwner {
        require(_oracleManager != address(0), "OraclePod: zero address");
        address oldManager = oracleManager;
        oracleManager = _oracleManager;
        emit OracleManagerUpdate(oldManager, _oracleManager);
    }

    // ============ Legacy Functions (Deprecated) ============

    /// @notice Legacy: Fill price as string (deprecated)
    /// @param price Price as string
    function fillSymbolPrice(string memory price) external onlyOracleManager {
        string memory oldPrice = marketPrice;
        marketPrice = price;
        updateTimestamp = block.timestamp;
        emit MarketPriceUpdated(oldPrice, marketPrice, updateTimestamp);
    }

    /// @notice Legacy: Get price as string (deprecated)
    /// @return Price as string
    function getSymbolPrice() external view returns (string memory) {
        return marketPrice;
    }
}
