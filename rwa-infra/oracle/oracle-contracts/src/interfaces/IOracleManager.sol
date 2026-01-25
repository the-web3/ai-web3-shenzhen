// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/BN254.sol";
import "./IBLSApkRegistry.sol";
import {IOraclePod} from "./IOraclePod.sol";

interface IOracleManager {

    event OperatorRegistered(address indexed operator, string nodeUrl);
    event OperatorDeRegistered(address operator);

    event VerifyOracleSig(
        uint256 batchId,
        uint256 totalStaking,
        bytes32 signatoryRecordHash,
        string marketPrice
    );

    // New event for price array submission
    event PricesSubmitted(
        uint256 batchId,
        uint256 aggregatedPrice,
        uint256 nodeCount,
        bytes32 signatoryRecordHash
    );

    event OraclePodAddedToFillWhitelist(IOraclePod oralePod);
    event OraclePodRemoveToFillWhitelist(IOraclePod oralePod);

    // New struct for price batch with array support
    struct OraclePriceBatch {
        uint256[] prices;       // Array of prices from each node
        uint256[] weights;      // Array of weights for each node
        bytes32 blockHash;
        uint256 blockNumber;
        bytes32 msgHash;
    }

    // Legacy struct (deprecated)
    struct OracleBatch {
        string symbolPrice;
        bytes32 blockHash;
        uint256 blockNumber;
        bytes32 msgHash;
    }

    struct PubkeyRegistrationParams {
        BN254.G1Point pubkeyRegistrationSignature;
        BN254.G1Point pubkeyG1;
        BN254.G2Point pubkeyG2;
    }

    function registerOperator(string calldata nodeUrl) external;
    function deRegisterOperator() external;

    /// @notice New: Fill prices array with BLS signature verification
    /// @param oraclePod The oracle pod to update
    /// @param priceBatch The price batch containing prices array
    /// @param oracleNonSignerAndSignature BLS signature data
    function fillPricesWithSignature(
        IOraclePod oraclePod,
        OraclePriceBatch calldata priceBatch,
        IBLSApkRegistry.OracleNonSignerAndSignature memory oracleNonSignerAndSignature
    ) external;

    // Legacy function (deprecated)
    function fillSymbolPriceWithSignature(
        IOraclePod oraclePod,
        OracleBatch calldata oracleBatch,
        IBLSApkRegistry.OracleNonSignerAndSignature memory oracleNonSignerAndSignature
    ) external;

    function addOrRemoveOperatorWhitelist(address operator, bool isAdd) external;
    function setAggregatorAddress(address _aggregatorAddress) external;
    function addOraclePodToFillWhitelist(IOraclePod oraclePod) external;
    function removeOraclePodToFillWhitelist(IOraclePod oraclePod) external;
}
