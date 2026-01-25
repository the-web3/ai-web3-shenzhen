// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "@forge-std/Script.sol";
import {console} from "@forge-std/console.sol";
import {CeresGreenPoints} from "../src/CeresGreenPoints.sol";
import {CeresRegistry} from "../src/CeresRegistry.sol";
import {CeresMarketFactory} from "../src/CeresMarketFactory.sol";

/**
 * @title Deploy
 * @dev Deployment script for Ceres Protocol contracts to Hashkey Chain testnet
 * 
 * Deployment order (按依赖顺序):
 * 1. CeresGreenPoints (独立合约)
 * 2. CeresRegistry (依赖 CeresGreenPoints)
 * 3. CeresMarketFactory (依赖 CeresRegistry 和 CeresGreenPoints)
 * 
 * After deployment, the script will:
 * - Configure contract permissions and roles
 * - Set up inter-contract references
 * - Verify deployment state
 * - Output deployment addresses for frontend integration
 */
contract Deploy is Script {
    // Deployment addresses (will be populated during deployment)
    address public greenPointsAddress;
    address public registryAddress;
    address public marketFactoryAddress;
    
    // Admin address (deployer by default, can be changed)
    address public admin;
    
    // Deployment configuration
    struct DeploymentConfig {
        uint256 chainId;
        string networkName;
        bool verifyContracts;
        address adminOverride; // If set, use this instead of deployer as admin
    }
    
    function run() external {
        // Get deployment configuration
        DeploymentConfig memory config = getDeploymentConfig();
        
        console.log("=== Ceres Protocol Deployment ===");
        console.log("Network:", config.networkName);
        console.log("Chain ID:", config.chainId);
        console.log("Deployer:", msg.sender);
        
        // Verify we're on the correct network
        require(block.chainid == config.chainId, "Deploy: incorrect chain ID");
        
        // Set admin address
        admin = config.adminOverride != address(0) ? config.adminOverride : msg.sender;
        console.log("Admin address:", admin);
        
        // Start deployment
        vm.startBroadcast();
        
        // Step 1: Deploy CeresGreenPoints
        console.log("\n--- Step 1: Deploying CeresGreenPoints ---");
        deployGreenPoints();
        
        // Step 2: Deploy CeresRegistry
        console.log("\n--- Step 2: Deploying CeresRegistry ---");
        deployRegistry();
        
        // Step 3: Deploy CeresMarketFactory
        console.log("\n--- Step 3: Deploying CeresMarketFactory ---");
        deployMarketFactory();
        
        // Step 4: Configure contracts
        console.log("\n--- Step 4: Configuring Contracts ---");
        configureContracts();
        
        // Step 5: Verify deployment
        console.log("\n--- Step 5: Verifying Deployment ---");
        verifyDeployment();
        
        vm.stopBroadcast();
        
        // Output deployment summary
        outputDeploymentSummary();
        
        console.log("\n=== Deployment Complete ===");
    }
    
    /**
     * @dev Gets deployment configuration based on current chain
     */
    function getDeploymentConfig() internal view returns (DeploymentConfig memory config) {
        if (block.chainid == 133) {
            // Hashkey Chain Testnet
            config = DeploymentConfig({
                chainId: 133,
                networkName: "Hashkey Chain Testnet",
                verifyContracts: true,
                adminOverride: address(0) // Use deployer as admin
            });
        } else if (block.chainid == 31337) {
            // Local Anvil/Hardhat
            config = DeploymentConfig({
                chainId: 31337,
                networkName: "Local Development",
                verifyContracts: false,
                adminOverride: address(0)
            });
        } else {
            revert("Deploy: unsupported chain ID");
        }
    }
    
    /**
     * @dev Deploys CeresGreenPoints contract
     */
    function deployGreenPoints() internal {
        console.log("Deploying CeresGreenPoints with admin:", admin);
        
        CeresGreenPoints greenPoints = new CeresGreenPoints(admin);
        greenPointsAddress = address(greenPoints);
        
        console.log("CeresGreenPoints deployed at:", greenPointsAddress);
        
        // Verify basic functionality
        require(greenPoints.hasRole(greenPoints.DEFAULT_ADMIN_ROLE(), admin), "Deploy: admin role not set");
        require(greenPoints.hasRole(greenPoints.MINTER_ROLE(), admin), "Deploy: minter role not set");
        
        console.log("[OK] CeresGreenPoints deployment verified");
    }
    
    /**
     * @dev Deploys CeresRegistry contract
     */
    function deployRegistry() internal {
        require(greenPointsAddress != address(0), "Deploy: CeresGreenPoints not deployed");
        
        console.log("Deploying CeresRegistry with:");
        console.log("  Green Points:", greenPointsAddress);
        console.log("  Admin:", admin);
        
        CeresRegistry registry = new CeresRegistry(greenPointsAddress, admin);
        registryAddress = address(registry);
        
        console.log("CeresRegistry deployed at:", registryAddress);
        
        // Verify basic functionality
        require(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin), "Deploy: admin role not set");
        require(registry.hasRole(registry.RESOLVER_ROLE(), admin), "Deploy: resolver role not set");
        require(address(registry.greenPoints()) == greenPointsAddress, "Deploy: green points reference incorrect");
        
        console.log("[OK] CeresRegistry deployment verified");
    }
    
    /**
     * @dev Deploys CeresMarketFactory contract
     */
    function deployMarketFactory() internal {
        require(registryAddress != address(0), "Deploy: CeresRegistry not deployed");
        require(greenPointsAddress != address(0), "Deploy: CeresGreenPoints not deployed");
        
        console.log("Deploying CeresMarketFactory with:");
        console.log("  Registry:", registryAddress);
        console.log("  Green Points:", greenPointsAddress);
        console.log("  Admin:", admin);
        
        CeresMarketFactory factory = new CeresMarketFactory(
            registryAddress,
            greenPointsAddress,
            admin
        );
        marketFactoryAddress = address(factory);
        
        console.log("CeresMarketFactory deployed at:", marketFactoryAddress);
        
        // Verify basic functionality
        require(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin), "Deploy: admin role not set");
        require(factory.hasRole(factory.DEPLOYER_ROLE(), admin), "Deploy: deployer role not set");
        require(address(factory.ceresRegistry()) == registryAddress, "Deploy: registry reference incorrect");
        require(address(factory.greenPoints()) == greenPointsAddress, "Deploy: green points reference incorrect");
        
        console.log("[OK] CeresMarketFactory deployment verified");
    }
    
    /**
     * @dev Configures contracts with proper permissions and references
     */
    function configureContracts() internal {
        console.log("Configuring contract permissions and references...");
        
        // 1. Grant CeresRegistry MINTER_ROLE on CeresGreenPoints
        console.log("Granting MINTER_ROLE to CeresRegistry on CeresGreenPoints");
        CeresGreenPoints greenPoints = CeresGreenPoints(greenPointsAddress);
        greenPoints.grantRole(greenPoints.MINTER_ROLE(), registryAddress);
        
        // 2. Set MarketFactory address on CeresRegistry
        console.log("Setting MarketFactory address on CeresRegistry");
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        registry.setMarketFactory(marketFactoryAddress);
        
        // 3. Verify CeresMarketFactory has DEPLOYER_ROLE on itself for CeresRegistry
        console.log("Verifying MarketFactory DEPLOYER_ROLE configuration");
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddress);
        require(factory.hasRole(factory.DEPLOYER_ROLE(), registryAddress), "Deploy: registry deployer role not set");
        
        console.log("[OK] Contract configuration complete");
    }
    
    /**
     * @dev Verifies the deployment state and contract interactions
     */
    function verifyDeployment() internal view {
        console.log("Verifying deployment state...");
        
        // Verify CeresGreenPoints
        CeresGreenPoints greenPoints = CeresGreenPoints(greenPointsAddress);
        require(greenPoints.totalSupply() == 0, "Deploy: unexpected initial supply");
        require(greenPoints.hasRole(greenPoints.MINTER_ROLE(), registryAddress), "Deploy: registry minter role not set");
        
        // Verify CeresRegistry
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        require(registry.getEventCount() == 0, "Deploy: unexpected initial events");
        require(registry.marketFactory() == marketFactoryAddress, "Deploy: market factory not set");
        
        // Verify CeresMarketFactory
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddress);
        require(factory.getMarketCount() == 0, "Deploy: unexpected initial markets");
        require(address(factory.ceresRegistry()) == registryAddress, "Deploy: factory registry reference incorrect");
        
        // Verify economic constants
        require(registry.MIN_STAKE() == 0.1 ether, "Deploy: incorrect MIN_STAKE");
        require(registry.TRADING_FEE_BPS() == 200, "Deploy: incorrect TRADING_FEE_BPS");
        require(registry.CREATOR_REWARD_BPS() == 2000, "Deploy: incorrect CREATOR_REWARD_BPS");
        require(registry.GREEN_POINTS_REWARD() == 100 * 10**18, "Deploy: incorrect GREEN_POINTS_REWARD");
        
        console.log("[OK] Deployment verification complete");
    }
    
    /**
     * @dev Outputs deployment summary with addresses and next steps
     */
    function outputDeploymentSummary() internal view {
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Hashkey Chain Testnet (Chain ID: 133)");
        console.log("Admin Address:", admin);
        console.log("");
        console.log("Contract Addresses:");
        console.log("  CeresGreenPoints:   ", greenPointsAddress);
        console.log("  CeresRegistry:      ", registryAddress);
        console.log("  CeresMarketFactory: ", marketFactoryAddress);
        console.log("");
        console.log("Configuration:");
        console.log("  MIN_STAKE:          0.1 HKTC");
        console.log("  TRADING_FEE:        2% (200 BPS)");
        console.log("  CREATOR_REWARD:     20% of fees (2000 BPS)");
        console.log("  GREEN_POINTS_REWARD: 100 CGP");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Run contract verification: forge verify-contract");
        console.log("2. Run initialization script: forge script script/Initialize.s.sol");
        console.log("3. Update frontend configuration with contract addresses");
        console.log("4. Deploy AI agent service with contract addresses");
        console.log("");
        console.log("Frontend Configuration (add to .env):");
        console.log("VITE_CERES_GREEN_POINTS_ADDRESS=", greenPointsAddress);
        console.log("VITE_CERES_REGISTRY_ADDRESS=", registryAddress);
        console.log("VITE_CERES_MARKET_FACTORY_ADDRESS=", marketFactoryAddress);
        console.log("VITE_HASHKEY_CHAIN_ID=133");
        console.log("");
        console.log("AI Agent Configuration (add to .env):");
        console.log("REGISTRY_ADDRESS=", registryAddress);
        console.log("MARKET_FACTORY_ADDRESS=", marketFactoryAddress);
        console.log("GREEN_POINTS_ADDRESS=", greenPointsAddress);
        console.log("RPC_URL=https://hashkeychain-testnet.alt.technology");
    }
    
    /**
     * @dev Emergency function to verify deployment on existing addresses
     * Useful for testing or re-running verification
     */
    function verifyExistingDeployment(
        address _greenPoints,
        address _registry,
        address _marketFactory
    ) external view {
        console.log("Verifying existing deployment...");
        
        // Set addresses
        address greenPointsAddr = _greenPoints;
        address registryAddr = _registry;
        address marketFactoryAddr = _marketFactory;
        
        // Verify contracts exist and have correct interfaces
        require(greenPointsAddr.code.length > 0, "Deploy: CeresGreenPoints not deployed");
        require(registryAddr.code.length > 0, "Deploy: CeresRegistry not deployed");
        require(marketFactoryAddr.code.length > 0, "Deploy: CeresMarketFactory not deployed");
        
        // Verify contract references
        CeresRegistry registry = CeresRegistry(payable(registryAddr));
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddr);
        
        require(address(registry.greenPoints()) == greenPointsAddr, "Deploy: registry green points reference incorrect");
        require(registry.marketFactory() == marketFactoryAddr, "Deploy: registry market factory reference incorrect");
        require(address(factory.ceresRegistry()) == registryAddr, "Deploy: factory registry reference incorrect");
        require(address(factory.greenPoints()) == greenPointsAddr, "Deploy: factory green points reference incorrect");
        
        console.log("[OK] Existing deployment verification complete");
        console.log("CeresGreenPoints:   ", greenPointsAddr);
        console.log("CeresRegistry:      ", registryAddr);
        console.log("CeresMarketFactory: ", marketFactoryAddr);
    }
}