// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "@forge-std/Script.sol";
import {console} from "@forge-std/console.sol";

/**
 * @title Verify
 * @dev Script for verifying deployed contracts on Hashkey Chain testnet
 * 
 * This script handles:
 * 1. Contract verification on Hashkey Chain explorer
 * 2. ABI file generation for frontend integration
 * 3. Verification status checking
 * 
 * Usage:
 * 1. Set contract addresses in the script or pass as environment variables
 * 2. Run: forge script script/Verify.s.sol --rpc-url hashkey_testnet --broadcast
 * 3. Or use the manual verification commands output by this script
 */
contract Verify is Script {
    // Contract addresses - set these after deployment
    address public greenPointsAddress;
    address public registryAddress;
    address public marketFactoryAddress;
    
    // Verification configuration
    struct VerificationConfig {
        string explorerUrl;
        string apiKey;
        bool useForgeVerify;
    }
    
    function run() external {
        console.log("=== Ceres Protocol Contract Verification ===");
        
        // Get contract addresses from environment or use defaults
        loadContractAddresses();
        
        // Get verification configuration
        VerificationConfig memory config = getVerificationConfig();
        
        console.log("Contract Addresses:");
        console.log("  CeresGreenPoints:   ", greenPointsAddress);
        console.log("  CeresRegistry:      ", registryAddress);
        console.log("  CeresMarketFactory: ", marketFactoryAddress);
        console.log("");
        
        if (config.useForgeVerify) {
            // Use forge verify-contract commands
            outputForgeVerifyCommands();
        } else {
            // Output manual verification instructions
            outputManualVerificationInstructions(config);
        }
        
        // Generate ABI files
        generateABIFiles();
        
        console.log("=== Verification Setup Complete ===");
    }
    
    /**
     * @dev Loads contract addresses from environment variables or prompts for manual input
     */
    function loadContractAddresses() internal {
        // Try to load from environment variables
        greenPointsAddress = vm.envOr("CERES_GREEN_POINTS_ADDRESS", address(0));
        registryAddress = vm.envOr("CERES_REGISTRY_ADDRESS", address(0));
        marketFactoryAddress = vm.envOr("CERES_MARKET_FACTORY_ADDRESS", address(0));
        
        // If not set, use placeholder addresses and prompt user
        if (greenPointsAddress == address(0)) {
            console.log("WARNING: CERES_GREEN_POINTS_ADDRESS not set in environment");
            console.log("Please set contract addresses manually in the script or environment");
            
            // Example addresses for demonstration (replace with actual deployed addresses)
            greenPointsAddress = address(0x1234567890123456789012345678901234567890);
            registryAddress = address(0x2345678901234567890123456789012345678901);
            marketFactoryAddress = address(0x3456789012345678901234567890123456789012);
            
            console.log("Using placeholder addresses - REPLACE WITH ACTUAL ADDRESSES:");
        }
    }
    
    /**
     * @dev Gets verification configuration for Hashkey Chain
     */
    function getVerificationConfig() internal view returns (VerificationConfig memory config) {
        config = VerificationConfig({
            explorerUrl: "https://hashkeychain-testnet-explorer.alt.technology",
            apiKey: vm.envOr("HASHKEY_API_KEY", string("")),
            useForgeVerify: bytes(vm.envOr("HASHKEY_API_KEY", string(""))).length > 0
        });
        
        if (!config.useForgeVerify) {
            console.log("NOTE: HASHKEY_API_KEY not set - will output manual verification instructions");
        }
    }
    
    /**
     * @dev Outputs forge verify-contract commands for automated verification
     */
    function outputForgeVerifyCommands() internal view {
        console.log("=== Automated Verification Commands ===");
        console.log("Run these commands to verify contracts:");
        console.log("");
        
        // CeresGreenPoints verification
        console.log("# Verify CeresGreenPoints");
        console.log("forge verify-contract \\");
        console.log("  --chain-id 133 \\");
        console.log("  --num-of-optimizations 200 \\");
        console.log("  --watch \\");
        string memory greenPointsArgs = string(abi.encodePacked("$(cast abi-encode \"constructor(address)\" ", vm.toString(msg.sender), ")"));
        console.log("  --constructor-args", greenPointsArgs, "\\");
        console.log("  --etherscan-api-key $HASHKEY_API_KEY \\");
        console.log("  --verifier-url https://hashkeychain-testnet-explorer.alt.technology/api \\");
        console.log(" ", vm.toString(greenPointsAddress), "\\");
        console.log("  src/CeresGreenPoints.sol:CeresGreenPoints");
        console.log("");
        
        // CeresRegistry verification
        console.log("# Verify CeresRegistry");
        console.log("forge verify-contract \\");
        console.log("  --chain-id 133 \\");
        console.log("  --num-of-optimizations 200 \\");
        console.log("  --watch \\");
        string memory registryArgs = string(abi.encodePacked("$(cast abi-encode \"constructor(address,address)\" ", vm.toString(greenPointsAddress), " ", vm.toString(msg.sender), ")"));
        console.log("  --constructor-args", registryArgs, "\\");
        console.log("  --etherscan-api-key $HASHKEY_API_KEY \\");
        console.log("  --verifier-url https://hashkeychain-testnet-explorer.alt.technology/api \\");
        console.log(" ", vm.toString(registryAddress), "\\");
        console.log("  src/CeresRegistry.sol:CeresRegistry");
        console.log("");
        
        // CeresMarketFactory verification
        console.log("# Verify CeresMarketFactory");
        console.log("forge verify-contract \\");
        console.log("  --chain-id 133 \\");
        console.log("  --num-of-optimizations 200 \\");
        console.log("  --watch \\");
        string memory factoryArgs = string(abi.encodePacked("$(cast abi-encode \"constructor(address,address,address)\" ", vm.toString(registryAddress), " ", vm.toString(greenPointsAddress), " ", vm.toString(msg.sender), ")"));
        console.log("  --constructor-args", factoryArgs, "\\");
        console.log("  --etherscan-api-key $HASHKEY_API_KEY \\");
        console.log("  --verifier-url https://hashkeychain-testnet-explorer.alt.technology/api \\");
        console.log(" ", vm.toString(marketFactoryAddress), "\\");
        console.log("  src/CeresMarketFactory.sol:CeresMarketFactory");
        console.log("");
        
        console.log("NOTE: Make sure to set HASHKEY_API_KEY environment variable");
        console.log("NOTE: Replace constructor arguments with actual deployment parameters if different");
    }
    
    /**
     * @dev Outputs manual verification instructions for Hashkey Chain explorer
     */
    function outputManualVerificationInstructions(VerificationConfig memory config) internal view {
        console.log("=== Manual Verification Instructions ===");
        console.log("Visit the Hashkey Chain testnet explorer and verify each contract manually:");
        console.log("Explorer URL:", config.explorerUrl);
        console.log("");
        
        console.log("1. CeresGreenPoints Contract:");
        console.log("   Address:", vm.toString(greenPointsAddress));
        console.log("   Contract Name: CeresGreenPoints");
        console.log("   Compiler Version: 0.8.20");
        console.log("   Optimization: Enabled (200 runs)");
        console.log("   Constructor Arguments:");
        console.log("     admin (address):", vm.toString(msg.sender));
        console.log("");
        
        console.log("2. CeresRegistry Contract:");
        console.log("   Address:", vm.toString(registryAddress));
        console.log("   Contract Name: CeresRegistry");
        console.log("   Compiler Version: 0.8.20");
        console.log("   Optimization: Enabled (200 runs)");
        console.log("   Constructor Arguments:");
        console.log("     _greenPoints (address):", vm.toString(greenPointsAddress));
        console.log("     admin (address):", vm.toString(msg.sender));
        console.log("");
        
        console.log("3. CeresMarketFactory Contract:");
        console.log("   Address:", vm.toString(marketFactoryAddress));
        console.log("   Contract Name: CeresMarketFactory");
        console.log("   Compiler Version: 0.8.20");
        console.log("   Optimization: Enabled (200 runs)");
        console.log("   Constructor Arguments:");
        console.log("     _ceresRegistry (address):", vm.toString(registryAddress));
        console.log("     _greenPoints (address):", vm.toString(greenPointsAddress));
        console.log("     admin (address):", vm.toString(msg.sender));
        console.log("");
        
        console.log("For each contract:");
        console.log("1. Go to the contract address page on the explorer");
        console.log("2. Click 'Verify & Publish' or similar button");
        console.log("3. Select 'Solidity (Single file)' or 'Solidity (Standard JSON)'");
        console.log("4. Upload the flattened contract source code");
        console.log("5. Set the compiler version and optimization settings");
        console.log("6. Enter the constructor arguments (encoded)");
        console.log("7. Submit for verification");
    }
    
    /**
     * @dev Generates ABI files for frontend integration
     */
    function generateABIFiles() internal {
        console.log("=== ABI File Generation ===");
        console.log("ABI files are automatically generated during compilation.");
        console.log("Location: out/[ContractName].sol/[ContractName].json");
        console.log("");
        console.log("Frontend Integration Files:");
        console.log("  CeresGreenPoints ABI:   out/CeresGreenPoints.sol/CeresGreenPoints.json");
        console.log("  CeresRegistry ABI:      out/CeresRegistry.sol/CeresRegistry.json");
        console.log("  CeresMarketFactory ABI: out/CeresMarketFactory.sol/CeresMarketFactory.json");
        console.log("  CeresPredictionMarket ABI: out/CeresPredictionMarket.sol/CeresPredictionMarket.json");
        console.log("");
        
        console.log("To extract just the ABI (for frontend use):");
        console.log("jq '.abi' out/CeresGreenPoints.sol/CeresGreenPoints.json > frontend/abis/CeresGreenPoints.json");
        console.log("jq '.abi' out/CeresRegistry.sol/CeresRegistry.json > frontend/abis/CeresRegistry.json");
        console.log("jq '.abi' out/CeresMarketFactory.sol/CeresMarketFactory.json > frontend/abis/CeresMarketFactory.json");
        console.log("jq '.abi' out/CeresPredictionMarket.sol/CeresPredictionMarket.json > frontend/abis/CeresPredictionMarket.json");
        console.log("");
        
        console.log("TypeScript Interface Generation (optional):");
        console.log("npx typechain --target ethers-v6 --out-dir frontend/types 'out/**/*.json'");
    }
    
    /**
     * @dev Utility function to check if contracts are verified
     * Note: This would require actual API calls to the explorer
     */
    function checkVerificationStatus() external view {
        console.log("=== Verification Status Check ===");
        console.log("To check verification status, visit the explorer URLs:");
        console.log("");
        console.log("CeresGreenPoints:   https://hashkeychain-testnet-explorer.alt.technology/address/", vm.toString(greenPointsAddress));
        console.log("CeresRegistry:      https://hashkeychain-testnet-explorer.alt.technology/address/", vm.toString(registryAddress));
        console.log("CeresMarketFactory: https://hashkeychain-testnet-explorer.alt.technology/address/", vm.toString(marketFactoryAddress));
        console.log("");
        console.log("Look for 'Contract' tab and green checkmark indicating verification");
    }
    
    /**
     * @dev Generates a complete deployment configuration file for frontend
     */
    function generateDeploymentConfig() external view {
        console.log("=== Frontend Configuration File ===");
        console.log("Create a file: frontend/src/config/contracts.ts");
        console.log("");
        console.log("export const CONTRACTS = {");
        console.log("  HASHKEY_TESTNET: {");
        console.log("    chainId: 133,");
        console.log("    name: 'Hashkey Chain Testnet',");
        console.log("    rpcUrl: 'https://hashkeychain-testnet.alt.technology',");
        console.log("    explorerUrl: 'https://hashkeychain-testnet-explorer.alt.technology',");
        console.log("    contracts: {");
        console.log("      CeresGreenPoints: '", vm.toString(greenPointsAddress), "',");
        console.log("      CeresRegistry: '", vm.toString(registryAddress), "',");
        console.log("      CeresMarketFactory: '", vm.toString(marketFactoryAddress), "',");
        console.log("    },");
        console.log("  },");
        console.log("} as const;");
        console.log("");
        console.log("export type ContractName = keyof typeof CONTRACTS.HASHKEY_TESTNET.contracts;");
        console.log("export type NetworkName = keyof typeof CONTRACTS;");
    }
}