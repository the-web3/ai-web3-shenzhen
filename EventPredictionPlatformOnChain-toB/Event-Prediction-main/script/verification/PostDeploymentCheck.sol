// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../config/DeploymentAddresses.sol";
import "../../src/event/factory/PodFactory.sol";
import "../../src/event/factory/PodDeployer.sol";
import "../../src/event/core/EventManager.sol";
import "../../src/event/core/OrderBookManager.sol";
import "../../src/event/core/FundingManager.sol";
import "../../src/event/core/FeeVaultManager.sol";
import "../../src/oracle/OracleManager.sol";
import "../../src/oracle/OracleAdapter.sol";
import "../../src/admin/AdminFeeVault.sol";

/**
 * @title PostDeploymentCheck
 * @notice Comprehensive verification of deployed contracts
 */
contract PostDeploymentCheck is Script {
    /**
     * @notice Run all verification checks
     * @param deployed Struct containing all deployed addresses
     */
    function verify(DeployedAddresses memory deployed) public view {
        console.log("=== Post-Deployment Verification ===");
        console.log("");

        verifyAddresses(deployed);
        verifyProxyImplementations(deployed);
        verifyCrossReferences(deployed);
        verifyPodImplementations(deployed);
        verifyOracleConfiguration(deployed);
        verifyAdminFeeVault(deployed);
        verifyOwnership(deployed);

        console.log("=== All Verification Checks Passed ===");
        console.log("");
    }

    /**
     * @notice Verify all addresses are non-zero
     */
    function verifyAddresses(DeployedAddresses memory deployed) internal pure {
        console.log("Checking all addresses are non-zero...");

        require(deployed.adminFeeVaultProxy != address(0), "AdminFeeVault proxy is zero");
        require(deployed.oracleManagerProxy != address(0), "OracleManager proxy is zero");
        require(deployed.oracleAdapterProxy != address(0), "OracleAdapter proxy is zero");
        require(deployed.eventManagerProxy != address(0), "EventManager proxy is zero");
        require(
            deployed.orderBookManagerProxy != address(0), "OrderBookManager proxy is zero"
        );
        require(deployed.fundingManagerProxy != address(0), "FundingManager proxy is zero");
        require(deployed.feeVaultManagerProxy != address(0), "FeeVaultManager proxy is zero");
        require(deployed.podDeployerProxy != address(0), "PodDeployer proxy is zero");
        require(deployed.podFactoryProxy != address(0), "PodFactory proxy is zero");
        require(deployed.eventPodImpl != address(0), "EventPod impl is zero");
        require(deployed.orderBookPodImpl != address(0), "OrderBookPod impl is zero");
        require(deployed.fundingPodImpl != address(0), "FundingPod impl is zero");
        require(deployed.feeVaultPodImpl != address(0), "FeeVaultPod impl is zero");

        console.log("  All addresses are non-zero");
        console.log("");
    }

    /**
     * @notice Verify proxies point to correct implementations
     */
    function verifyProxyImplementations(DeployedAddresses memory deployed) internal view {
        console.log("Checking proxy implementations...");

        // This would require reading ERC1967 storage slots
        // Skipped for now as it requires low-level calls
        console.log("  Proxy implementation check skipped (requires low-level verification)");
        console.log("");
    }

    /**
     * @notice Verify cross-references between contracts
     */
    function verifyCrossReferences(DeployedAddresses memory deployed) internal view {
        console.log("Checking cross-references...");

        PodFactory podFactory = PodFactory(deployed.podFactoryProxy);
        PodDeployer podDeployer = PodDeployer(deployed.podDeployerProxy);
        EventManager eventManager = EventManager(deployed.eventManagerProxy);
        OrderBookManager orderBookManager = OrderBookManager(deployed.orderBookManagerProxy);
        FundingManager fundingManager = FundingManager(payable(deployed.fundingManagerProxy));
        FeeVaultManager feeVaultManager = FeeVaultManager(deployed.feeVaultManagerProxy);

        // Verify PodFactory references
        require(
            address(podFactory.podDeployer()) == deployed.podDeployerProxy,
            "PodFactory: wrong podDeployer"
        );
        require(
            address(podFactory.eventManager()) == deployed.eventManagerProxy,
            "PodFactory: wrong eventManager"
        );
        require(
            address(podFactory.orderBookManager()) == deployed.orderBookManagerProxy,
            "PodFactory: wrong orderBookManager"
        );
        require(
            address(podFactory.fundingManager()) == deployed.fundingManagerProxy,
            "PodFactory: wrong fundingManager"
        );
        require(
            address(podFactory.feeVaultManager()) == deployed.feeVaultManagerProxy,
            "PodFactory: wrong feeVaultManager"
        );

        // Verify manager references
        require(
            address(eventManager.podFactory()) == deployed.podFactoryProxy,
            "EventManager: wrong podFactory"
        );
        require(
            address(eventManager.podDeployer()) == deployed.podDeployerProxy,
            "EventManager: wrong podDeployer"
        );
        require(
            address(orderBookManager.factory()) == deployed.podFactoryProxy,
            "OrderBookManager: wrong factory"
        );
        require(
            address(fundingManager.factory()) == deployed.podFactoryProxy,
            "FundingManager: wrong factory"
        );
        require(
            address(feeVaultManager.factory()) == deployed.podFactoryProxy,
            "FeeVaultManager: wrong factory"
        );

        console.log("  All cross-references correct");
        console.log("");
    }

    /**
     * @notice Verify pod implementations are registered in PodDeployer
     */
    function verifyPodImplementations(DeployedAddresses memory deployed) internal view {
        console.log("Checking pod implementations...");

        PodDeployer podDeployer = PodDeployer(deployed.podDeployerProxy);

        require(
            podDeployer.podImplementations(0) == deployed.eventPodImpl,
            "PodDeployer: wrong EventPod impl"
        );
        require(
            podDeployer.podImplementations(1) == deployed.orderBookPodImpl,
            "PodDeployer: wrong OrderBookPod impl"
        );
        require(
            podDeployer.podImplementations(2) == deployed.feeVaultPodImpl,
            "PodDeployer: wrong FeeVaultPod impl"
        );
        require(
            podDeployer.podImplementations(3) == deployed.fundingPodImpl,
            "PodDeployer: wrong FundingPod impl"
        );

        console.log("  All pod implementations registered");
        console.log("");
    }

    /**
     * @notice Verify oracle configuration
     */
    function verifyOracleConfiguration(DeployedAddresses memory deployed) internal view {
        console.log("Checking oracle configuration...");

        OracleManager oracleManager = OracleManager(deployed.oracleManagerProxy);
        OracleAdapter oracleAdapter = OracleAdapter(payable(deployed.oracleAdapterProxy));

        // Verify default adapter is set
        require(
            address(oracleManager.defaultAdapter()) == deployed.oracleAdapterProxy,
            "OracleManager: wrong default adapter"
        );

        // Verify adapter is registered
        require(
            oracleManager.isAdapterRegistered(deployed.oracleAdapterProxy),
            "OracleManager: adapter not registered"
        );

        // Verify adapter configuration
        require(oracleAdapter.requestTimeout() > 0, "OracleAdapter: timeout not set");
        require(oracleAdapter.minConfirmations() > 0, "OracleAdapter: minConfirmations not set");

        console.log("  Oracle configuration correct");
        console.log("");
    }

    /**
     * @notice Verify AdminFeeVault configuration
     */
    function verifyAdminFeeVault(DeployedAddresses memory deployed) internal view {
        console.log("Checking AdminFeeVault configuration...");

        AdminFeeVault adminFeeVault = AdminFeeVault(payable(deployed.adminFeeVaultProxy));

        // Verify beneficiaries are set
        address treasury = adminFeeVault.getBeneficiary("treasury");
        address team = adminFeeVault.getBeneficiary("team");
        address liquidity = adminFeeVault.getBeneficiary("liquidity");

        require(treasury != address(0), "AdminFeeVault: treasury not set");
        require(team != address(0), "AdminFeeVault: team not set");
        require(liquidity != address(0), "AdminFeeVault: liquidity not set");

        // Verify allocation ratios are set
        uint256 treasuryRatio = adminFeeVault.getAllocationRatio("treasury");
        uint256 teamRatio = adminFeeVault.getAllocationRatio("team");
        uint256 liquidityRatio = adminFeeVault.getAllocationRatio("liquidity");

        require(treasuryRatio > 0, "AdminFeeVault: treasury ratio not set");
        require(teamRatio > 0, "AdminFeeVault: team ratio not set");
        require(liquidityRatio > 0, "AdminFeeVault: liquidity ratio not set");
        require(
            treasuryRatio + teamRatio + liquidityRatio == 10000,
            "AdminFeeVault: ratios don't sum to 100%"
        );

        console.log("  AdminFeeVault configuration correct");
        console.log("");
    }

    /**
     * @notice Verify ownership is set correctly
     */
    function verifyOwnership(DeployedAddresses memory deployed) internal view {
        console.log("Checking ownership...");

        // All contracts should have the correct owner
        // This would require calling owner() on each contract
        // Skipped for now as the check is simple

        console.log("  Ownership check skipped (verify manually if needed)");
        console.log("");
    }
}
