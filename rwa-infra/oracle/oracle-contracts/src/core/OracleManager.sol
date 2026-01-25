// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";

import "../libraries/SafeCall.sol";
import "../interfaces/IOracleManager.sol";
import "../interfaces/IBLSApkRegistry.sol";
import "../interfaces/IOraclePod.sol";

import "./OracleManagerStorage.sol";

/// @title OracleManager - RWA Oracle Price Manager
/// @notice Manages oracle operators and price submissions with BLS signature verification
contract OracleManager is OwnableUpgradeable, OracleManagerStorage, IOracleManager {
    modifier onlyAggregatorManager() {
        require(
            msg.sender == aggregatorAddress,
            "OracleManager: not the aggregator address"
        );
        _;
    }

    modifier onlyPodWhitelistedForFill(IOraclePod oraclePod) {
        require(
            podIsWhitelistedForFill[oraclePod],
            "OracleManager: oraclePod not whitelisted"
        );
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _initialOwner,
        address _blsApkRegistry,
        address _aggregatorAddress
    ) external initializer {
        __Ownable_init(_initialOwner);
        blsApkRegistry = IBLSApkRegistry(_blsApkRegistry);
        aggregatorAddress = _aggregatorAddress;
        confirmBatchId = 0;
    }

    function registerOperator(string calldata nodeUrl) external {
        require(
            operatorWhitelist[msg.sender],
            "OracleManager: no permission to register"
        );
        blsApkRegistry.registerOperator(msg.sender);
        emit OperatorRegistered(msg.sender, nodeUrl);
    }

    function deRegisterOperator() external {
        require(
            operatorWhitelist[msg.sender],
            "OracleManager: no permission to deregister"
        );
        blsApkRegistry.deregisterOperator(msg.sender);
        emit OperatorDeRegistered(msg.sender);
    }

    /// @notice New: Fill prices array with BLS signature verification
    /// @param oraclePod The oracle pod to update
    /// @param priceBatch The price batch containing prices array
    /// @param oracleNonSignerAndSignature BLS signature data
    function fillPricesWithSignature(
        IOraclePod oraclePod,
        OraclePriceBatch calldata priceBatch,
        IBLSApkRegistry.OracleNonSignerAndSignature memory oracleNonSignerAndSignature
    ) external onlyAggregatorManager onlyPodWhitelistedForFill(oraclePod) {
        require(priceBatch.prices.length > 0, "OracleManager: empty prices");
        require(
            priceBatch.prices.length == priceBatch.weights.length,
            "OracleManager: length mismatch"
        );

        // Verify BLS signature
        (
            uint256 totalStaking,
            bytes32 signatoryRecordHash
        ) = blsApkRegistry.checkSignatures(
            priceBatch.msgHash,
            priceBatch.blockNumber,
            oracleNonSignerAndSignature
        );

        // Calculate aggregated price for event (actual calculation done in Pod)
        uint256 aggregatedPrice = _calculateWeightedAverage(
            priceBatch.prices,
            priceBatch.weights
        );

        // Fill prices to the oracle pod (Pod will calculate weighted average)
        oraclePod.fillPrices(priceBatch.prices, priceBatch.weights);

        emit PricesSubmitted(
            confirmBatchId++,
            aggregatedPrice,
            priceBatch.prices.length,
            signatoryRecordHash
        );
    }

    /// @notice Calculate weighted average (for event logging)
    function _calculateWeightedAverage(
        uint256[] calldata prices,
        uint256[] calldata weights
    ) internal pure returns (uint256) {
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < prices.length; i++) {
            weightedSum += prices[i] * weights[i];
            totalWeight += weights[i];
        }

        if (totalWeight == 0) return 0;
        return weightedSum / totalWeight;
    }

    // ============ Legacy Function (Deprecated) ============

    /// @notice Legacy: Fill price as string (deprecated)
    function fillSymbolPriceWithSignature(
        IOraclePod oraclePod,
        OracleBatch calldata oracleBatch,
        IBLSApkRegistry.OracleNonSignerAndSignature memory oracleNonSignerAndSignature
    ) external onlyAggregatorManager onlyPodWhitelistedForFill(oraclePod) {
        (
            uint256 totalStaking,
            bytes32 signatoryRecordHash
        ) = blsApkRegistry.checkSignatures(
            oracleBatch.msgHash,
            oracleBatch.blockNumber,
            oracleNonSignerAndSignature
        );

        string memory symbolPrice = oracleBatch.symbolPrice;
        oraclePod.fillSymbolPrice(symbolPrice);

        emit VerifyOracleSig(confirmBatchId++, totalStaking, signatoryRecordHash, symbolPrice);
    }

    // ============ Admin Functions ============

    function addOrRemoveOperatorWhitelist(address operator, bool isAdd) external onlyAggregatorManager {
        require(operator != address(0), "OracleManager: zero address");
        operatorWhitelist[operator] = isAdd;
    }

    function setAggregatorAddress(address _aggregatorAddress) external onlyOwner {
        require(_aggregatorAddress != address(0), "OracleManager: zero address");
        aggregatorAddress = _aggregatorAddress;
    }

    function addOraclePodToFillWhitelist(IOraclePod oraclePod) external onlyAggregatorManager {
        podIsWhitelistedForFill[oraclePod] = true;
        emit OraclePodAddedToFillWhitelist(oraclePod);
    }

    function removeOraclePodToFillWhitelist(IOraclePod oraclePod) external onlyAggregatorManager {
        podIsWhitelistedForFill[oraclePod] = false;
        emit OraclePodRemoveToFillWhitelist(oraclePod);
    }
}
