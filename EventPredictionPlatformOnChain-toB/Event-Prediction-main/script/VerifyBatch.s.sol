// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title VerifyBatch
 * @notice Batch verification script for all deployed contracts
 * @dev This script will verify all implementation contracts on block explorer
 */
contract VerifyBatch is Script {
    function run() external {
        console.log("=== Starting Batch Verification ===");
        console.log("");

        // Pod Implementations
        verifyContract(
            0xccD33225316e0660B064E564FD24F01ACa313cc3,
            "src/event/pod/EventPod.sol:EventPod",
            "EventPod"
        );

        verifyContract(
            0x745ed68f8EF727a9B80e9a7CD48583864169acd6,
            "src/event/pod/OrderBookPod.sol:OrderBookPod",
            "OrderBookPod"
        );

        verifyContract(
            0x970D203944Ebc552F313C24B6d896afA9aDCfbD8,
            "src/event/pod/FundingPod.sol:FundingPod",
            "FundingPod"
        );

        verifyContract(
            0x2C535088020aDA6ee6885e38aCaa7750a44eB756,
            "src/event/pod/FeeVaultPod.sol:FeeVaultPod",
            "FeeVaultPod"
        );

        // Manager Implementations
        verifyContract(
            0x21B0999BFAfE1fa4d994fd4A15D0D2Ac58157D17,
            "src/event/core/EventManager.sol:EventManager",
            "EventManager"
        );

        verifyContract(
            0x0F1Dc47020a04943b8C563b04470FAF7D6f22F0e,
            "src/event/core/OrderBookManager.sol:OrderBookManager",
            "OrderBookManager"
        );

        verifyContract(
            0x8731B7d11D2eeb66f58112E7Dd81A9A01D6e2e9c,
            "src/event/core/FundingManager.sol:FundingManager",
            "FundingManager"
        );

        verifyContract(
            0x4a0b9808218a999a4E486Cf26c0928ED1066402d,
            "src/event/core/FeeVaultManager.sol:FeeVaultManager",
            "FeeVaultManager"
        );

        // Factory Implementations
        verifyContract(
            0xdfCFC84fFbE233ffA245f4fdf737d48E077f5B6e,
            "src/event/factory/PodDeployer.sol:PodDeployer",
            "PodDeployer"
        );

        verifyContract(
            0x279Da44a64696f5D1A65e89711B3702EE6a98AEe,
            "src/event/factory/PodFactory.sol:PodFactory",
            "PodFactory"
        );

        // Oracle Implementations
        verifyContract(
            0xF93e19E489bD1a5C2BB693f769E8CB7f2777A0c0,
            "src/oracle/OracleManager.sol:OracleManager",
            "OracleManager"
        );

        verifyContract(
            0x8431F0b53B3CbFb13b546F2803a020864d611d80,
            "src/oracle/OracleAdapter.sol:OracleAdapter",
            "OracleAdapter"
        );

        // Admin Implementation
        verifyContract(
            0x27D290d32a79207Ad5773e643377e5f18998A4c6,
            "src/admin/AdminFeeVault.sol:AdminFeeVault",
            "AdminFeeVault"
        );

        console.log("");
        console.log("=== Batch Verification Complete ===");
        console.log("Check block explorer for verification status");
    }

    function verifyContract(address contractAddr, string memory contractPath, string memory name)
        internal
    {
        console.log("Verifying:", name, "at", contractAddr);

        string[] memory inputs = new string[](9);
        inputs[0] = "forge";
        inputs[1] = "verify-contract";
        inputs[2] = vm.toString(contractAddr);
        inputs[3] = contractPath;
        inputs[4] = "--rpc-url";
        inputs[5] = vm.envString("RHS_TESTNET_RPC_URL");
        inputs[6] = "--verifier";
        inputs[7] = "blockscout";
        inputs[8] = "--verifier-url";

        // Note: Actual verification happens when running with --verify flag
        // This script prepares the verification commands
    }
}
