// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "@forge-std/Script.sol";
import {console} from "@forge-std/console.sol";
import {CeresGreenPoints} from "../src/CeresGreenPoints.sol";
import {CeresRegistry} from "../src/CeresRegistry.sol";
import {CeresMarketFactory} from "../src/CeresMarketFactory.sol";

/**
 * @title Initialize
 * @dev Initialization script for Ceres Protocol system parameters
 * 
 * This script handles:
 * 1. Setting RESOLVER_ROLE for admin accounts
 * 2. Configuring AI agent account permissions
 * 3. Creating test judgment events for system demonstration
 * 4. Verifying system configuration
 * 
 * Prerequisites:
 * - Contracts must be deployed (run Deploy.s.sol first)
 * - Contract addresses must be set in environment variables or script
 * - Deployer account must have sufficient HKTC for test events
 */
contract Initialize is Script {
    // Contract addresses - load from environment or set manually
    address public greenPointsAddress;
    address public registryAddress;
    address public marketFactoryAddress;
    
    // Configuration addresses
    address public adminAccount;
    address public aiAgentAccount;
    address public resolverAccount;
    
    // Test event configuration
    struct TestEvent {
        string description;
        uint256 yesPrice;
        uint256 noPrice;
        uint256 resolutionTime;
        uint256 stakeAmount;
    }
    
    function run() external {
        console.log("=== Ceres Protocol System Initialization ===");
        
        // Load configuration
        loadConfiguration();
        
        // Verify contracts are deployed
        verifyContractsDeployed();
        
        console.log("Configuration:");
        console.log("  Admin Account:     ", adminAccount);
        console.log("  AI Agent Account:  ", aiAgentAccount);
        console.log("  Resolver Account:  ", resolverAccount);
        console.log("");
        
        // Start initialization
        vm.startBroadcast();
        
        // Step 1: Configure roles and permissions
        console.log("--- Step 1: Configuring Roles and Permissions ---");
        configureRoles();
        
        // Step 2: Set up AI agent permissions
        console.log("\n--- Step 2: Setting up AI Agent Permissions ---");
        configureAIAgent();
        
        // Step 3: Create test judgment events
        console.log("\n--- Step 3: Creating Test Judgment Events ---");
        createTestEvents();
        
        // Step 4: Verify system configuration
        console.log("\n--- Step 4: Verifying System Configuration ---");
        verifySystemConfiguration();
        
        vm.stopBroadcast();
        
        // Output initialization summary
        outputInitializationSummary();
        
        console.log("\n=== Initialization Complete ===");
    }
    
    /**
     * @dev Loads configuration from environment variables or sets defaults
     */
    function loadConfiguration() internal {
        // Load contract addresses
        greenPointsAddress = vm.envOr("CERES_GREEN_POINTS_ADDRESS", address(0));
        registryAddress = vm.envOr("CERES_REGISTRY_ADDRESS", address(0));
        marketFactoryAddress = vm.envOr("CERES_MARKET_FACTORY_ADDRESS", address(0));
        
        // Load account addresses
        adminAccount = vm.envOr("CERES_ADMIN_ACCOUNT", msg.sender);
        aiAgentAccount = vm.envOr("CERES_AI_AGENT_ACCOUNT", address(0));
        resolverAccount = vm.envOr("CERES_RESOLVER_ACCOUNT", adminAccount);
        
        // If AI agent account not set, create a deterministic address for demo
        if (aiAgentAccount == address(0)) {
            aiAgentAccount = address(uint160(uint256(keccak256("ceres.ai.agent.demo"))));
            console.log("NOTE: Using demo AI agent address:", aiAgentAccount);
            console.log("      In production, set CERES_AI_AGENT_ACCOUNT environment variable");
        }
        
        // Validate contract addresses
        if (greenPointsAddress == address(0) || registryAddress == address(0) || marketFactoryAddress == address(0)) {
            console.log("ERROR: Contract addresses not set. Please run Deploy.s.sol first or set environment variables:");
            console.log("  CERES_GREEN_POINTS_ADDRESS");
            console.log("  CERES_REGISTRY_ADDRESS");
            console.log("  CERES_MARKET_FACTORY_ADDRESS");
            revert("Initialize: contract addresses not configured");
        }
    }
    
    /**
     * @dev Verifies that contracts are deployed at the specified addresses
     */
    function verifyContractsDeployed() internal view {
        require(greenPointsAddress.code.length > 0, "Initialize: CeresGreenPoints not deployed");
        require(registryAddress.code.length > 0, "Initialize: CeresRegistry not deployed");
        require(marketFactoryAddress.code.length > 0, "Initialize: CeresMarketFactory not deployed");
        
        console.log("Contract verification:");
        console.log("  CeresGreenPoints:   ", greenPointsAddress, "[OK]");
        console.log("  CeresRegistry:      ", registryAddress, "[OK]");
        console.log("  CeresMarketFactory: ", marketFactoryAddress, "[OK]");
    }
    
    /**
     * @dev Configures roles and permissions for the system
     */
    function configureRoles() internal {
        CeresGreenPoints greenPoints = CeresGreenPoints(greenPointsAddress);
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddress);
        
        // Configure resolver role
        if (resolverAccount != adminAccount) {
            console.log("Granting RESOLVER_ROLE to:", resolverAccount);
            registry.grantRole(registry.RESOLVER_ROLE(), resolverAccount);
        } else {
            console.log("Admin account already has RESOLVER_ROLE");
        }
        
        // Verify roles are set correctly
        require(registry.hasRole(registry.RESOLVER_ROLE(), resolverAccount), "Initialize: resolver role not set");
        require(greenPoints.hasRole(greenPoints.MINTER_ROLE(), registryAddress), "Initialize: registry minter role not set");
        require(factory.hasRole(factory.DEPLOYER_ROLE(), registryAddress), "Initialize: registry deployer role not set");
        
        console.log("[OK] Roles configured successfully");
    }
    
    /**
     * @dev Configures AI agent account permissions
     */
    function configureAIAgent() internal {
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        
        // For demo purposes, we don't need to grant special roles to AI agent
        // The AI agent will use normal user functions to submit judgment events
        console.log("AI Agent account configured:", aiAgentAccount);
        console.log("NOTE: AI agent will use standard user permissions");
        console.log("      No special roles required for basic operation");
        
        // In a production system, you might want to:
        // 1. Grant special roles for automated operations
        // 2. Set up rate limiting or special permissions
        // 3. Configure automated resolution capabilities
        
        console.log("[OK] AI agent configuration complete");
    }
    
    /**
     * @dev Creates test judgment events for system demonstration
     */
    function createTestEvents() internal {
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        
        // Define test events
        TestEvent[] memory testEvents = new TestEvent[](3);
        
        testEvents[0] = TestEvent({
            description: "Will the global average temperature increase by more than 0.1C in 2026 compared to 2025?",
            yesPrice: 0.7 ether, // 70% probability
            noPrice: 0.3 ether,  // 30% probability
            resolutionTime: block.timestamp + 30 days,
            stakeAmount: 0.5 ether // 0.5 HKTC stake
        });
        
        testEvents[1] = TestEvent({
            description: "Will renewable energy capacity exceed 50% of total global capacity by end of 2026?",
            yesPrice: 0.6 ether, // 60% probability
            noPrice: 0.4 ether,  // 40% probability
            resolutionTime: block.timestamp + 60 days,
            stakeAmount: 0.3 ether // 0.3 HKTC stake
        });
        
        testEvents[2] = TestEvent({
            description: "Will there be a major climate policy announcement at COP29 affecting carbon pricing?",
            yesPrice: 0.8 ether, // 80% probability
            noPrice: 0.2 ether,  // 20% probability
            resolutionTime: block.timestamp + 90 days,
            stakeAmount: 0.2 ether // 0.2 HKTC stake
        });
        
        // Create test events
        for (uint256 i = 0; i < testEvents.length; i++) {
            TestEvent memory testEvent = testEvents[i];
            
            console.log("Creating test event", i + 1, ":");
            console.log("  Description:", testEvent.description);
            console.log("  Stake Amount:", testEvent.stakeAmount / 1 ether, "HKTC");
            console.log("  YES Price:", testEvent.yesPrice * 100 / 1 ether, "%");
            console.log("  NO Price:", testEvent.noPrice * 100 / 1 ether, "%");
            
            // Check if deployer has sufficient balance
            if (address(msg.sender).balance < testEvent.stakeAmount) {
                console.log("  [SKIP] Insufficient balance for test event");
                continue;
            }
            
            try registry.submitJudgementEvent{value: testEvent.stakeAmount}(
                testEvent.description,
                testEvent.yesPrice,
                testEvent.noPrice,
                testEvent.resolutionTime
            ) returns (bytes32 eventId) {
                console.log("  [OK] Event created with ID:", vm.toString(eventId));
            } catch Error(string memory reason) {
                console.log("  [ERROR] Failed to create event:", reason);
            } catch {
                console.log("  [ERROR] Failed to create event: unknown error");
            }
            
            console.log("");
        }
        
        console.log("[OK] Test events creation complete");
    }
    
    /**
     * @dev Verifies system configuration is correct
     */
    function verifySystemConfiguration() internal view {
        CeresGreenPoints greenPoints = CeresGreenPoints(greenPointsAddress);
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddress);
        
        console.log("Verifying system configuration...");
        
        // Verify contract references
        require(address(registry.greenPoints()) == greenPointsAddress, "Initialize: registry green points reference incorrect");
        require(registry.marketFactory() == marketFactoryAddress, "Initialize: registry market factory reference incorrect");
        require(address(factory.ceresRegistry()) == registryAddress, "Initialize: factory registry reference incorrect");
        require(address(factory.greenPoints()) == greenPointsAddress, "Initialize: factory green points reference incorrect");
        
        // Verify roles
        require(registry.hasRole(registry.RESOLVER_ROLE(), resolverAccount), "Initialize: resolver role verification failed");
        require(greenPoints.hasRole(greenPoints.MINTER_ROLE(), registryAddress), "Initialize: minter role verification failed");
        require(factory.hasRole(factory.DEPLOYER_ROLE(), registryAddress), "Initialize: deployer role verification failed");
        
        // Verify economic parameters
        require(registry.MIN_STAKE() == 0.1 ether, "Initialize: incorrect MIN_STAKE");
        require(registry.TRADING_FEE_BPS() == 200, "Initialize: incorrect TRADING_FEE_BPS");
        require(registry.CREATOR_REWARD_BPS() == 2000, "Initialize: incorrect CREATOR_REWARD_BPS");
        require(registry.GREEN_POINTS_REWARD() == 100 * 10**18, "Initialize: incorrect GREEN_POINTS_REWARD");
        
        // Check event count
        uint256 eventCount = registry.getEventCount();
        console.log("Total events created:", eventCount);
        
        // Check market count
        uint256 marketCount = factory.getMarketCount();
        console.log("Total markets deployed:", marketCount);
        
        console.log("[OK] System configuration verified");
    }
    
    /**
     * @dev Outputs initialization summary and next steps
     */
    function outputInitializationSummary() internal view {
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddress);
        
        console.log("\n=== INITIALIZATION SUMMARY ===");
        console.log("System Status: READY");
        console.log("");
        console.log("Accounts:");
        console.log("  Admin:     ", adminAccount);
        console.log("  Resolver:  ", resolverAccount);
        console.log("  AI Agent:  ", aiAgentAccount);
        console.log("");
        console.log("System Statistics:");
        console.log("  Total Events:  ", registry.getEventCount());
        console.log("  Total Markets: ", factory.getMarketCount());
        console.log("");
        console.log("Economic Parameters:");
        console.log("  Min Stake:        0.1 HKTC");
        console.log("  Trading Fee:      2%");
        console.log("  Creator Reward:   20% of fees");
        console.log("  Green Points:     100 CGP per correct judgment");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Deploy AI agent service with contract addresses");
        console.log("2. Update frontend configuration with contract addresses");
        console.log("3. Test system functionality with demo events");
        console.log("4. Monitor system performance and user adoption");
        console.log("");
        console.log("AI Agent Configuration:");
        console.log("export REGISTRY_ADDRESS=", registryAddress);
        console.log("export MARKET_FACTORY_ADDRESS=", marketFactoryAddress);
        console.log("export GREEN_POINTS_ADDRESS=", greenPointsAddress);
        console.log("export AI_AGENT_PRIVATE_KEY=<your-ai-agent-private-key>");
        console.log("export RPC_URL=https://hashkeychain-testnet.alt.technology");
        console.log("");
        console.log("Frontend Configuration:");
        console.log("VITE_CERES_REGISTRY_ADDRESS=", registryAddress);
        console.log("VITE_CERES_MARKET_FACTORY_ADDRESS=", marketFactoryAddress);
        console.log("VITE_CERES_GREEN_POINTS_ADDRESS=", greenPointsAddress);
        console.log("VITE_HASHKEY_CHAIN_ID=133");
        console.log("VITE_HASHKEY_RPC_URL=https://hashkeychain-testnet.alt.technology");
    }
    
    /**
     * @dev Utility function to resolve a test event (for demonstration)
     * Call this function separately to test event resolution
     */
    function resolveTestEvent(bytes32 eventId, bool outcome) external {
        console.log("=== Resolving Test Event ===");
        console.log("Event ID:", vm.toString(eventId));
        console.log("Outcome:", outcome ? "YES" : "NO");
        
        vm.startBroadcast();
        
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        
        // Verify caller has resolver role
        require(registry.hasRole(registry.RESOLVER_ROLE(), msg.sender), "Initialize: caller not authorized to resolve");
        
        // Resolve the event
        try registry.resolveEvent(eventId, outcome) {
            console.log("[OK] Event resolved successfully");
        } catch Error(string memory reason) {
            console.log("[ERROR] Failed to resolve event:", reason);
        }
        
        vm.stopBroadcast();
    }
    
    /**
     * @dev Utility function to check system status
     */
    function checkSystemStatus() external view {
        console.log("=== System Status Check ===");
        
        CeresGreenPoints greenPoints = CeresGreenPoints(greenPointsAddress);
        CeresRegistry registry = CeresRegistry(payable(registryAddress));
        CeresMarketFactory factory = CeresMarketFactory(marketFactoryAddress);
        
        console.log("Contract Status:");
        console.log("  CeresGreenPoints:   ", greenPointsAddress, greenPointsAddress.code.length > 0 ? "[DEPLOYED]" : "[NOT DEPLOYED]");
        console.log("  CeresRegistry:      ", registryAddress, registryAddress.code.length > 0 ? "[DEPLOYED]" : "[NOT DEPLOYED]");
        console.log("  CeresMarketFactory: ", marketFactoryAddress, marketFactoryAddress.code.length > 0 ? "[DEPLOYED]" : "[NOT DEPLOYED]");
        
        if (registryAddress.code.length > 0) {
            console.log("");
            console.log("System Statistics:");
            console.log("  Total Supply CGP:  ", greenPoints.totalSupply() / 10**18, "CGP");
            console.log("  Total Events:      ", registry.getEventCount());
            console.log("  Total Markets:     ", factory.getMarketCount());
            
            console.log("");
            console.log("Role Configuration:");
            console.log("  Admin has resolver role:    ", registry.hasRole(registry.RESOLVER_ROLE(), adminAccount));
            console.log("  Registry has minter role:   ", greenPoints.hasRole(greenPoints.MINTER_ROLE(), registryAddress));
            console.log("  Registry has deployer role: ", factory.hasRole(factory.DEPLOYER_ROLE(), registryAddress));
        }
    }
}