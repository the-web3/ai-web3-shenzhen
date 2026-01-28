// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title FeeConfig
 * @notice Configuration for fee distribution
 */
struct FeeConfig {
    address treasuryRecipient;
    address teamRecipient;
    address liquidityRecipient;
    uint256 treasuryRatio;
    uint256 teamRatio;
    uint256 liquidityRatio;
}

/**
 * @title NetworkConfig
 * @notice Network-specific deployment configuration
 */
struct NetworkConfig {
    string networkName;
    address initialOwner;
    uint256 requestTimeout;
    uint256 minConfirmations;
    address[] initialOracles;
    FeeConfig feeConfig;
}

/**
 * @title DeploymentConfig
 * @notice Provides network-specific deployment configurations
 */
contract DeploymentConfig is Script {
    /**
     * @notice Get configuration for current network
     * @return config Network configuration struct
     */
    function getConfig() internal view returns (NetworkConfig memory) {
        uint256 chainId = block.chainid;

        if (chainId == 31337) {
            // Local Anvil
            return getAnvilConfig();
        } else if (chainId == 11155111) {
            // Sepolia
            return getSepoliaConfig();
        } else if (chainId == 84532) {
            // Base Sepolia
            return getBaseSepoliaConfig();
        } else if (chainId == 421614) {
            // Arbitrum Sepolia
            return getArbitrumSepoliaConfig();
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            return getOptimismSepoliaConfig();
        } else if (chainId == 90101) {
            // Roothash Testnet
            return getRoothashConfig();
        }

        revert("Unsupported network");
    }

    /**
     * @notice Anvil (local) network configuration
     */
    function getAnvilConfig() internal view returns (NetworkConfig memory) {
        address deployer = msg.sender;
        address[] memory oracles = new address[](0);

        return NetworkConfig({
            networkName: "anvil",
            initialOwner: deployer,
            requestTimeout: 1 hours,
            minConfirmations: 1,
            initialOracles: oracles,
            feeConfig: FeeConfig({
                treasuryRecipient: deployer,
                teamRecipient: deployer,
                liquidityRecipient: deployer,
                treasuryRatio: 5000,
                teamRatio: 3000,
                liquidityRatio: 2000
            })
        });
    }

    /**
     * @notice Sepolia testnet configuration
     */
    function getSepoliaConfig() internal view returns (NetworkConfig memory) {
        // Load from environment variables
        address owner = vm.envOr("INITIAL_OWNER", msg.sender);
        address treasury = vm.envOr("TREASURY_RECIPIENT", msg.sender);
        address team = vm.envOr("TEAM_RECIPIENT", msg.sender);
        address liquidity = vm.envOr("LIQUIDITY_RECIPIENT", msg.sender);

        // Load oracle address if provided
        address[] memory oracles;
        try vm.envAddress("ORACLE_ADDRESS") returns (address oracleAddr) {
            oracles = new address[](1);
            oracles[0] = oracleAddr;
        } catch {
            oracles = new address[](0);
        }

        return NetworkConfig({
            networkName: "sepolia",
            initialOwner: owner,
            requestTimeout: 1 hours,
            minConfirmations: 1,
            initialOracles: oracles,
            feeConfig: FeeConfig({
                treasuryRecipient: treasury,
                teamRecipient: team,
                liquidityRecipient: liquidity,
                treasuryRatio: 5000,
                teamRatio: 3000,
                liquidityRatio: 2000
            })
        });
    }

    /**
     * @notice Base Sepolia testnet configuration
     */
    function getBaseSepoliaConfig() internal view returns (NetworkConfig memory) {
        // Same as Sepolia for now
        return getSepoliaConfig();
    }

    /**
     * @notice Arbitrum Sepolia testnet configuration
     */
    function getArbitrumSepoliaConfig() internal view returns (NetworkConfig memory) {
        // Load from environment variables (same pattern as Sepolia)
        address owner = vm.envOr("INITIAL_OWNER", msg.sender);
        address treasury = vm.envOr("TREASURY_RECIPIENT", msg.sender);
        address team = vm.envOr("TEAM_RECIPIENT", msg.sender);
        address liquidity = vm.envOr("LIQUIDITY_RECIPIENT", msg.sender);

        // Load oracle address if provided
        address[] memory oracles;
        try vm.envAddress("ORACLE_ADDRESS") returns (address oracleAddr) {
            oracles = new address[](1);
            oracles[0] = oracleAddr;
        } catch {
            oracles = new address[](0);
        }

        return NetworkConfig({
            networkName: "arbitrum-sepolia",
            initialOwner: owner,
            requestTimeout: 1 hours,
            minConfirmations: 1,
            initialOracles: oracles,
            feeConfig: FeeConfig({
                treasuryRecipient: treasury,
                teamRecipient: team,
                liquidityRecipient: liquidity,
                treasuryRatio: 5000,
                teamRatio: 3000,
                liquidityRatio: 2000
            })
        });
    }

    /**
     * @notice Optimism Sepolia testnet configuration
     */
    function getOptimismSepoliaConfig() internal view returns (NetworkConfig memory) {
        // Load from environment variables (same pattern as Sepolia)
        address owner = vm.envOr("INITIAL_OWNER", msg.sender);
        address treasury = vm.envOr("TREASURY_RECIPIENT", msg.sender);
        address team = vm.envOr("TEAM_RECIPIENT", msg.sender);
        address liquidity = vm.envOr("LIQUIDITY_RECIPIENT", msg.sender);

        // Load oracle address if provided
        address[] memory oracles;
        try vm.envAddress("ORACLE_ADDRESS") returns (address oracleAddr) {
            oracles = new address[](1);
            oracles[0] = oracleAddr;
        } catch {
            oracles = new address[](0);
        }

        return NetworkConfig({
            networkName: "optimism-sepolia",
            initialOwner: owner,
            requestTimeout: 1 hours,
            minConfirmations: 1,
            initialOracles: oracles,
            feeConfig: FeeConfig({
                treasuryRecipient: treasury,
                teamRecipient: team,
                liquidityRecipient: liquidity,
                treasuryRatio: 5000,
                teamRatio: 3000,
                liquidityRatio: 2000
            })
        });
    }

    /**
     * @notice Roothash testnet configuration
     */
    function getRoothashConfig() internal view returns (NetworkConfig memory) {
        // Load from environment variables (same pattern as Sepolia)
        address owner = vm.envOr("INITIAL_OWNER", msg.sender);
        address treasury = vm.envOr("TREASURY_RECIPIENT", msg.sender);
        address team = vm.envOr("TEAM_RECIPIENT", msg.sender);
        address liquidity = vm.envOr("LIQUIDITY_RECIPIENT", msg.sender);

        // Load oracle address if provided
        address[] memory oracles;
        try vm.envAddress("ORACLE_ADDRESS") returns (address oracleAddr) {
            oracles = new address[](1);
            oracles[0] = oracleAddr;
        } catch {
            oracles = new address[](0);
        }

        return NetworkConfig({
            networkName: "roothash-testnet",
            initialOwner: owner,
            requestTimeout: 1 hours,
            minConfirmations: 1,
            initialOracles: oracles,
            feeConfig: FeeConfig({
                treasuryRecipient: treasury,
                teamRecipient: team,
                liquidityRecipient: liquidity,
                treasuryRatio: 5000,
                teamRatio: 3000,
                liquidityRatio: 2000
            })
        });
    }
}
