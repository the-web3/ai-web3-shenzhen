// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title DeployedAddresses
 * @notice Tracks all deployed contract addresses (implementations and proxies)
 */
struct DeployedAddresses {
    // Tier 0 - Admin
    address adminFeeVaultImpl;
    address adminFeeVaultProxy;
    // Tier 1 - Oracle
    address oracleManagerImpl;
    address oracleManagerProxy;
    address oracleAdapterImpl;
    address oracleAdapterProxy;
    // Tier 2 - Managers
    address eventManagerImpl;
    address eventManagerProxy;
    address orderBookManagerImpl;
    address orderBookManagerProxy;
    address fundingManagerImpl;
    address fundingManagerProxy;
    address feeVaultManagerImpl;
    address feeVaultManagerProxy;
    // Tier 3 - Factory
    address podDeployerImpl;
    address podDeployerProxy;
    address podFactoryImpl;
    address podFactoryProxy;
    // Tier 4 - Pod Implementations (no proxies - used for cloning)
    address eventPodImpl;
    address orderBookPodImpl;
    address fundingPodImpl;
    address feeVaultPodImpl;
}
