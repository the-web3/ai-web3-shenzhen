// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Import all contracts
import "../src/admin/AdminFeeVault.sol";
import "../src/oracle/OracleManager.sol";
import "../src/oracle/OracleAdapter.sol";
import "../src/event/core/EventManager.sol";
import "../src/event/core/OrderBookManager.sol";
import "../src/event/core/FundingManager.sol";
import "../src/event/core/FeeVaultManager.sol";
import "../src/event/factory/PodDeployer.sol";
import "../src/event/factory/PodFactory.sol";
import "../src/event/pod/EventPod.sol";
import "../src/event/pod/OrderBookPod.sol";
import "../src/event/pod/FundingPod.sol";
import "../src/event/pod/FeeVaultPod.sol";

// Import config and helpers
import "./config/DeploymentConfig.sol";
import "./config/DeploymentAddresses.sol";
import "./utils/DeploymentConstants.sol";

/**
 * @title Deploy
 * @notice Main deployment script for the prediction market platform
 * @dev Deploys 17 contracts in 6 phases with proper initialization and wiring
 */
contract Deploy is Script, DeploymentConfig {
    using DeploymentConstants for *;

    DeployedAddresses public deployed;
    NetworkConfig public config;

    function run() external {
        config = getConfig();

        vm.startBroadcast();

        console.log("=== Starting Deployment ===");
        console.log("Network:", config.networkName);
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("Initial Owner:", config.initialOwner);
        console.log("");

        deployPhase1_PodImplementations();
        deployPhase2_Managers();
        deployPhase3_Factory();
        deployPhase4_AdminAndOracle();
        deployPhase5_WireContracts();
        deployPhase6_ConfigureSystem();

        vm.stopBroadcast();

        // Verification (view calls, no transactions)
        verifyDeployment();

        // Save addresses
        saveAddresses();

        printSummary();
    }

    /**
     * @notice Phase 1: Deploy pod implementations (no proxies, used for cloning)
     */
    function deployPhase1_PodImplementations() internal {
        console.log("=== Phase 1: Deploying Pod Implementations ===");

        deployed.eventPodImpl = address(new EventPod());
        console.log("EventPod Implementation:", deployed.eventPodImpl);

        deployed.orderBookPodImpl = address(new OrderBookPod());
        console.log("OrderBookPod Implementation:", deployed.orderBookPodImpl);

        deployed.fundingPodImpl = address(new FundingPod());
        console.log("FundingPod Implementation:", deployed.fundingPodImpl);

        deployed.feeVaultPodImpl = address(new FeeVaultPod());
        console.log("FeeVaultPod Implementation:", deployed.feeVaultPodImpl);

        console.log("");
    }

    /**
     * @notice Phase 2: Deploy all 4 managers behind proxies
     */
    function deployPhase2_Managers() internal {
        console.log("=== Phase 2: Deploying Managers ===");

        // EventManager
        EventManager eventManagerImpl = new EventManager();
        deployed.eventManagerImpl = address(eventManagerImpl);

        bytes memory initData = abi.encodeCall(EventManager.initialize, (config.initialOwner));
        deployed.eventManagerProxy =
            address(new ERC1967Proxy(deployed.eventManagerImpl, initData));
        console.log("EventManager Proxy:", deployed.eventManagerProxy);

        // OrderBookManager
        OrderBookManager orderBookManagerImpl = new OrderBookManager();
        deployed.orderBookManagerImpl = address(orderBookManagerImpl);

        initData = abi.encodeCall(OrderBookManager.initialize, (config.initialOwner));
        deployed.orderBookManagerProxy =
            address(new ERC1967Proxy(deployed.orderBookManagerImpl, initData));
        console.log("OrderBookManager Proxy:", deployed.orderBookManagerProxy);

        // FundingManager
        FundingManager fundingManagerImpl = new FundingManager();
        deployed.fundingManagerImpl = address(fundingManagerImpl);

        initData = abi.encodeCall(FundingManager.initialize, (config.initialOwner));
        deployed.fundingManagerProxy =
            address(new ERC1967Proxy(deployed.fundingManagerImpl, initData));
        console.log("FundingManager Proxy:", deployed.fundingManagerProxy);

        // FeeVaultManager
        FeeVaultManager feeVaultManagerImpl = new FeeVaultManager();
        deployed.feeVaultManagerImpl = address(feeVaultManagerImpl);

        initData = abi.encodeCall(FeeVaultManager.initialize, (config.initialOwner));
        deployed.feeVaultManagerProxy =
            address(new ERC1967Proxy(deployed.feeVaultManagerImpl, initData));
        console.log("FeeVaultManager Proxy:", deployed.feeVaultManagerProxy);

        console.log("");
    }

    /**
     * @notice Phase 3: Deploy factory layer (PodDeployer, PodFactory) behind proxies
     */
    function deployPhase3_Factory() internal {
        console.log("=== Phase 3: Deploying Factory Layer ===");

        // PodDeployer (requires all 4 manager addresses)
        PodDeployer podDeployerImpl = new PodDeployer();
        deployed.podDeployerImpl = address(podDeployerImpl);

        bytes memory initData = abi.encodeCall(
            PodDeployer.initialize,
            (
                config.initialOwner,
                deployed.eventManagerProxy,
                deployed.orderBookManagerProxy,
                deployed.feeVaultManagerProxy,
                deployed.fundingManagerProxy
            )
        );
        deployed.podDeployerProxy = address(new ERC1967Proxy(deployed.podDeployerImpl, initData));
        console.log("PodDeployer Proxy:", deployed.podDeployerProxy);

        // PodFactory
        PodFactory podFactoryImpl = new PodFactory();
        deployed.podFactoryImpl = address(podFactoryImpl);

        initData = abi.encodeCall(PodFactory.initialize, (config.initialOwner));
        deployed.podFactoryProxy = address(new ERC1967Proxy(deployed.podFactoryImpl, initData));
        console.log("PodFactory Proxy:", deployed.podFactoryProxy);

        console.log("");
    }

    /**
     * @notice Phase 4: Deploy admin and oracle contracts behind proxies
     */
    function deployPhase4_AdminAndOracle() internal {
        console.log("=== Phase 4: Deploying Admin & Oracle ===");

        // AdminFeeVault
        AdminFeeVault adminFeeVaultImpl = new AdminFeeVault();
        deployed.adminFeeVaultImpl = address(adminFeeVaultImpl);

        bytes memory initData = abi.encodeCall(AdminFeeVault.initialize, (config.initialOwner));
        deployed.adminFeeVaultProxy =
            address(new ERC1967Proxy(deployed.adminFeeVaultImpl, initData));
        console.log("AdminFeeVault Proxy:", deployed.adminFeeVaultProxy);

        // OracleManager
        OracleManager oracleManagerImpl = new OracleManager();
        deployed.oracleManagerImpl = address(oracleManagerImpl);

        initData = abi.encodeCall(OracleManager.initialize, (config.initialOwner));
        deployed.oracleManagerProxy =
            address(new ERC1967Proxy(deployed.oracleManagerImpl, initData));
        console.log("OracleManager Proxy:", deployed.oracleManagerProxy);

        // OracleAdapter (use eventManager as placeholder for oracleConsumer)
        OracleAdapter oracleAdapterImpl = new OracleAdapter();
        deployed.oracleAdapterImpl = address(oracleAdapterImpl);

        initData = abi.encodeCall(
            OracleAdapter.initialize,
            (config.initialOwner, deployed.eventManagerProxy, deployed.eventManagerProxy) // Placeholder
        );
        deployed.oracleAdapterProxy =
            address(new ERC1967Proxy(deployed.oracleAdapterImpl, initData));
        console.log("OracleAdapter Proxy:", deployed.oracleAdapterProxy);

        console.log("");
    }

    /**
     * @notice Phase 5: Wire all contracts together by setting cross-references
     */
    function deployPhase5_WireContracts() internal {
        console.log("=== Phase 5: Wiring Contracts ===");

        // Get contract instances
        EventManager eventManager = EventManager(deployed.eventManagerProxy);
        OrderBookManager orderBookManager = OrderBookManager(deployed.orderBookManagerProxy);
        FundingManager fundingManager = FundingManager(payable(deployed.fundingManagerProxy));
        FeeVaultManager feeVaultManager = FeeVaultManager(deployed.feeVaultManagerProxy);
        PodDeployer podDeployer = PodDeployer(deployed.podDeployerProxy);
        PodFactory podFactory = PodFactory(deployed.podFactoryProxy);

        // Configure EventManager
        eventManager.setPodFactory(deployed.podFactoryProxy);
        eventManager.setPodDeployer(deployed.podDeployerProxy);
        eventManager.setOrderBookManager(deployed.orderBookManagerProxy);
        console.log("EventManager configured");

        // Configure OrderBookManager
        orderBookManager.setFactory(deployed.podFactoryProxy);
        orderBookManager.setPodDeployer(deployed.podDeployerProxy);
        console.log("OrderBookManager configured");

        // Configure FundingManager
        fundingManager.setFactory(deployed.podFactoryProxy);
        fundingManager.setPodDeployer(deployed.podDeployerProxy);
        console.log("FundingManager configured");

        // Configure FeeVaultManager
        feeVaultManager.setFactory(deployed.podFactoryProxy);
        feeVaultManager.setPodDeployer(deployed.podDeployerProxy);
        console.log("FeeVaultManager configured");

        // Configure PodFactory
        podFactory.setPodDeployer(deployed.podDeployerProxy);
        podFactory.setEventManager(deployed.eventManagerProxy);
        podFactory.setOrderBookManager(deployed.orderBookManagerProxy);
        podFactory.setFundingManager(deployed.fundingManagerProxy);
        podFactory.setFeeVaultManager(deployed.feeVaultManagerProxy);
        console.log("PodFactory configured");

        // Configure PodDeployer with pod implementations
        podDeployer.setPodImplementation(
            DeploymentConstants.POD_TYPE_EVENT, deployed.eventPodImpl
        );
        podDeployer.setPodImplementation(
            DeploymentConstants.POD_TYPE_ORDERBOOK, deployed.orderBookPodImpl
        );
        podDeployer.setPodImplementation(
            DeploymentConstants.POD_TYPE_FEEVAULT, deployed.feeVaultPodImpl
        );
        podDeployer.setPodImplementation(
            DeploymentConstants.POD_TYPE_FUNDING, deployed.fundingPodImpl
        );
        console.log("PodDeployer pod implementations registered");

        console.log("");
    }

    /**
     * @notice Phase 6: Configure system parameters (fees, oracles, ratios)
     */
    function deployPhase6_ConfigureSystem() internal {
        console.log("=== Phase 6: Configuring System ===");

        AdminFeeVault adminFeeVault = AdminFeeVault(payable(deployed.adminFeeVaultProxy));
        OracleManager oracleManager = OracleManager(deployed.oracleManagerProxy);
        OracleAdapter oracleAdapter = OracleAdapter(payable(deployed.oracleAdapterProxy));

        // Configure AdminFeeVault beneficiaries
        adminFeeVault.setBeneficiary(
            DeploymentConstants.BENEFICIARY_TREASURY, config.feeConfig.treasuryRecipient
        );
        adminFeeVault.setBeneficiary(
            DeploymentConstants.BENEFICIARY_TEAM, config.feeConfig.teamRecipient
        );
        adminFeeVault.setBeneficiary(
            DeploymentConstants.BENEFICIARY_LIQUIDITY, config.feeConfig.liquidityRecipient
        );
        console.log("AdminFeeVault beneficiaries set");

        // Configure AdminFeeVault allocation ratios
        adminFeeVault.setAllocationRatio(
            DeploymentConstants.BENEFICIARY_TREASURY, config.feeConfig.treasuryRatio
        );
        adminFeeVault.setAllocationRatio(
            DeploymentConstants.BENEFICIARY_TEAM, config.feeConfig.teamRatio
        );
        adminFeeVault.setAllocationRatio(
            DeploymentConstants.BENEFICIARY_LIQUIDITY, config.feeConfig.liquidityRatio
        );
        console.log("AdminFeeVault allocation ratios set");

        // Configure Oracle
        oracleManager.addOracleAdapter(deployed.oracleAdapterProxy, "DefaultAdapter");
        oracleManager.setDefaultAdapter(deployed.oracleAdapterProxy);
        console.log("OracleManager adapter registered");

        oracleAdapter.setRequestTimeout(config.requestTimeout);
        oracleAdapter.setMinConfirmations(config.minConfirmations);
        console.log("OracleAdapter configured");

        // Add initial oracles if provided
        for (uint256 i = 0; i < config.initialOracles.length; i++) {
            oracleAdapter.addAuthorizedOracle(config.initialOracles[i]);
            console.log("Added authorized oracle:", config.initialOracles[i]);
        }

        console.log("");
    }

    /**
     * @notice Verify all contracts deployed correctly
     */
    function verifyDeployment() internal view {
        console.log("=== Verification ===");

        // Check all addresses are non-zero
        require(deployed.adminFeeVaultProxy != address(0), "AdminFeeVault not deployed");
        require(deployed.oracleManagerProxy != address(0), "OracleManager not deployed");
        require(deployed.oracleAdapterProxy != address(0), "OracleAdapter not deployed");
        require(deployed.eventManagerProxy != address(0), "EventManager not deployed");
        require(deployed.orderBookManagerProxy != address(0), "OrderBookManager not deployed");
        require(deployed.fundingManagerProxy != address(0), "FundingManager not deployed");
        require(deployed.feeVaultManagerProxy != address(0), "FeeVaultManager not deployed");
        require(deployed.podDeployerProxy != address(0), "PodDeployer not deployed");
        require(deployed.podFactoryProxy != address(0), "PodFactory not deployed");
        require(deployed.eventPodImpl != address(0), "EventPod impl not deployed");
        require(deployed.orderBookPodImpl != address(0), "OrderBookPod impl not deployed");
        require(deployed.fundingPodImpl != address(0), "FundingPod impl not deployed");
        require(deployed.feeVaultPodImpl != address(0), "FeeVaultPod impl not deployed");

        console.log("All verification checks passed");
        console.log("");
    }

    /**
     * @notice Save deployment addresses to JSON file
     */
    function saveAddresses() internal view {
        console.log("=== Saving Addresses ===");
        console.log("JSON save skipped (enable in script if needed)");
        console.log("All addresses printed in deployment summary below");
        console.log("");

        // Commented out due to Foundry fs permissions
        // To enable: add fs_permissions in foundry.toml
        /*
        string memory json = "deployment";

        // Network info
        vm.serializeString(json, "network", config.networkName);
        vm.serializeUint(json, "chainId", block.chainid);
        vm.serializeAddress(json, "deployer", msg.sender);
        vm.serializeUint(json, "timestamp", block.timestamp);

        // Admin
        vm.serializeAddress(json, "adminFeeVaultImpl", deployed.adminFeeVaultImpl);
        vm.serializeAddress(json, "adminFeeVaultProxy", deployed.adminFeeVaultProxy);

        // Oracle
        vm.serializeAddress(json, "oracleManagerImpl", deployed.oracleManagerImpl);
        vm.serializeAddress(json, "oracleManagerProxy", deployed.oracleManagerProxy);
        vm.serializeAddress(json, "oracleAdapterImpl", deployed.oracleAdapterImpl);
        vm.serializeAddress(json, "oracleAdapterProxy", deployed.oracleAdapterProxy);

        // Managers
        vm.serializeAddress(json, "eventManagerImpl", deployed.eventManagerImpl);
        vm.serializeAddress(json, "eventManagerProxy", deployed.eventManagerProxy);
        vm.serializeAddress(json, "orderBookManagerImpl", deployed.orderBookManagerImpl);
        vm.serializeAddress(json, "orderBookManagerProxy", deployed.orderBookManagerProxy);
        vm.serializeAddress(json, "fundingManagerImpl", deployed.fundingManagerImpl);
        vm.serializeAddress(json, "fundingManagerProxy", deployed.fundingManagerProxy);
        vm.serializeAddress(json, "feeVaultManagerImpl", deployed.feeVaultManagerImpl);
        vm.serializeAddress(json, "feeVaultManagerProxy", deployed.feeVaultManagerProxy);

        // Factory
        vm.serializeAddress(json, "podDeployerImpl", deployed.podDeployerImpl);
        vm.serializeAddress(json, "podDeployerProxy", deployed.podDeployerProxy);
        vm.serializeAddress(json, "podFactoryImpl", deployed.podFactoryImpl);
        vm.serializeAddress(json, "podFactoryProxy", deployed.podFactoryProxy);

        // Pod implementations
        vm.serializeAddress(json, "eventPodImpl", deployed.eventPodImpl);
        vm.serializeAddress(json, "orderBookPodImpl", deployed.orderBookPodImpl);
        vm.serializeAddress(json, "fundingPodImpl", deployed.fundingPodImpl);
        string memory finalJson =
            vm.serializeAddress(json, "feeVaultPodImpl", deployed.feeVaultPodImpl);

        // Save to file
        string memory filename =
            string.concat("./broadcast/deployments-", config.networkName, ".json");
        vm.writeJson(finalJson, filename);

        console.log("Addresses saved to:", filename);
        console.log("");
        */
    }

    /**
     * @notice Print deployment summary
     */
    function printSummary() internal view {
        console.log("=== Deployment Summary ===");
        console.log("Network:", config.networkName);
        console.log("Chain ID:", block.chainid);
        console.log("");
        console.log("== Pod Implementations (for cloning) ==");
        console.log("  EventPod:", deployed.eventPodImpl);
        console.log("  OrderBookPod:", deployed.orderBookPodImpl);
        console.log("  FundingPod:", deployed.fundingPodImpl);
        console.log("  FeeVaultPod:", deployed.feeVaultPodImpl);
        console.log("");
        console.log("== Core Contracts (proxies) ==");
        console.log("  PodFactory:", deployed.podFactoryProxy);
        console.log("  PodDeployer:", deployed.podDeployerProxy);
        console.log("  EventManager:", deployed.eventManagerProxy);
        console.log("  OrderBookManager:", deployed.orderBookManagerProxy);
        console.log("  FundingManager:", deployed.fundingManagerProxy);
        console.log("  FeeVaultManager:", deployed.feeVaultManagerProxy);
        console.log("  OracleManager:", deployed.oracleManagerProxy);
        console.log("  OracleAdapter:", deployed.oracleAdapterProxy);
        console.log("  AdminFeeVault:", deployed.adminFeeVaultProxy);
        console.log("");
        console.log("Deployment completed successfully!");
        console.log("==========================================");
    }
}
