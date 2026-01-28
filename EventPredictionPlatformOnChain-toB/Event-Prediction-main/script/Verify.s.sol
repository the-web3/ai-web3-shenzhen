// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "./config/DeploymentAddresses.sol";

/**
 * @title Verify
 * @notice Script to verify all deployed contracts on block explorer
 * @dev Run after deployment to verify implementation contracts
 */
contract Verify is Script {
    // Deployed addresses from Roothash testnet
    DeployedAddresses public deployed = DeployedAddresses({
        // Admin
        adminFeeVaultImpl: 0x27D290d32a79207Ad5773e643377e5f18998A4c6,
        adminFeeVaultProxy: 0x219189B134cEd02166b20409C28A555421ad7B06,
        // Oracle
        oracleManagerImpl: 0xF93e19E489bD1a5C2BB693f769E8CB7f2777A0c0,
        oracleManagerProxy: 0x9Ed2fcD62fF9f4291c698CcFd9DBdbd9271e8904,
        oracleAdapterImpl: 0x8431F0b53B3CbFb13b546F2803a020864d611d80,
        oracleAdapterProxy: 0xB2520360f49368ED0d212A0A590C4e6Fb2012c2D,
        // Managers
        eventManagerImpl: 0x21B0999BFAfE1fa4d994fd4A15D0D2Ac58157D17,
        eventManagerProxy: 0x92383b49e597162d43378Ea7Afc6fD3D38333c1c,
        orderBookManagerImpl: 0x0F1Dc47020a04943b8C563b04470FAF7D6f22F0e,
        orderBookManagerProxy: 0x7bfF4f84e5E1dB6a7da3d9191c2BcfE2de898e4D,
        fundingManagerImpl: 0x8731B7d11D2eeb66f58112E7Dd81A9A01D6e2e9c,
        fundingManagerProxy: 0xfc92adB24Cd4A5e403D2b197D5E9A76D1EF50B54,
        feeVaultManagerImpl: 0x4a0b9808218a999a4E486Cf26c0928ED1066402d,
        feeVaultManagerProxy: 0xA6D1cfd2094eAdE839F5fd3b30B107962E4f459d,
        // Factory
        podDeployerImpl: 0xdfCFC84fFbE233ffA245f4fdf737d48E077f5B6e,
        podDeployerProxy: 0xAE8e502Ec43627b5C44e156a890d15d5E920E5D1,
        podFactoryImpl: 0x279Da44a64696f5D1A65e89711B3702EE6a98AEe,
        podFactoryProxy: 0x51366cd826D1de34f687717ac9770739f9153E2B,
        // Pod implementations
        eventPodImpl: 0xccD33225316e0660B064E564FD24F01ACa313cc3,
        orderBookPodImpl: 0x745ed68f8EF727a9B80e9a7CD48583864169acd6,
        fundingPodImpl: 0x970D203944Ebc552F313C24B6d896afA9aDCfbD8,
        feeVaultPodImpl: 0x2C535088020aDA6ee6885e38aCaa7750a44eB756
    });

    function run() external view {
        console.log("=== Contract Verification Guide ===");
        console.log("");
        console.log("Verify each implementation contract with the following commands:");
        console.log("");

        printVerificationCommand(
            "AdminFeeVault",
            deployed.adminFeeVaultImpl,
            "src/admin/AdminFeeVault.sol:AdminFeeVault"
        );

        printVerificationCommand(
            "OracleManager",
            deployed.oracleManagerImpl,
            "src/oracle/OracleManager.sol:OracleManager"
        );

        printVerificationCommand(
            "OracleAdapter",
            deployed.oracleAdapterImpl,
            "src/oracle/OracleAdapter.sol:OracleAdapter"
        );

        printVerificationCommand(
            "EventManager",
            deployed.eventManagerImpl,
            "src/event/core/EventManager.sol:EventManager"
        );

        printVerificationCommand(
            "OrderBookManager",
            deployed.orderBookManagerImpl,
            "src/event/core/OrderBookManager.sol:OrderBookManager"
        );

        printVerificationCommand(
            "FundingManager",
            deployed.fundingManagerImpl,
            "src/event/core/FundingManager.sol:FundingManager"
        );

        printVerificationCommand(
            "FeeVaultManager",
            deployed.feeVaultManagerImpl,
            "src/event/core/FeeVaultManager.sol:FeeVaultManager"
        );

        printVerificationCommand(
            "PodDeployer",
            deployed.podDeployerImpl,
            "src/event/factory/PodDeployer.sol:PodDeployer"
        );

        printVerificationCommand(
            "PodFactory",
            deployed.podFactoryImpl,
            "src/event/factory/PodFactory.sol:PodFactory"
        );

        printVerificationCommand(
            "EventPod", deployed.eventPodImpl, "src/event/pod/EventPod.sol:EventPod"
        );

        printVerificationCommand(
            "OrderBookPod",
            deployed.orderBookPodImpl,
            "src/event/pod/OrderBookPod.sol:OrderBookPod"
        );

        printVerificationCommand(
            "FundingPod", deployed.fundingPodImpl, "src/event/pod/FundingPod.sol:FundingPod"
        );

        printVerificationCommand(
            "FeeVaultPod", deployed.feeVaultPodImpl, "src/event/pod/FeeVaultPod.sol:FeeVaultPod"
        );

        printVerificationCommand(
            "ERC1967Proxy",
            deployed.adminFeeVaultProxy,
            "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
        );

        console.log("");
        console.log("=== Batch Verification Script ===");
        console.log(
            "Or run: forge script script/VerifyBatch.s.sol:VerifyBatch --rpc-url $RHS_TESTNET_RPC_URL --verify --verifier blockscout --verifier-url https://explorer-testnet.roothashpay.com/api/ --broadcast"
        );
        console.log("");
    }

    function printVerificationCommand(
        string memory name,
        address contractAddress,
        string memory contractPath
    ) internal pure {
        console.log("");
        console.log(string.concat("# ", name));
        console.log(
            string.concat(
                "forge verify-contract ",
                vm.toString(contractAddress),
                " ",
                contractPath,
                " --rpc-url $RHS_TESTNET_RPC_URL --verifier blockscout --verifier-url https://explorer-testnet.roothashpay.com/api/"
            )
        );
    }
}
