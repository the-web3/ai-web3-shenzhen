/**
 * Contract Status Utility
 * 
 * Checks if a contract is deployed on a specific chain
 */

// Import deployed contracts configuration
// Note: This should match the backend configuration
export const DEPLOYED_CONTRACTS = {
  eventManager: {
    // Mainnets (not deployed - for production use)
    ethereum: "",
    bsc: "",
    optimism: "",
    base: "",
    arbitrum: "",
    roothash: "",
    
    // Testnets (deployed for testing)
    sepolia: "0x408F996e66BbD0ae2AA28F98e95b2F638BF00579",
    bscTestnet: "",
    optimismSepolia: "0x119d4Cc0B3Bb161742DcE9f378d5726d98aA5452",
    baseSepolia: "0x7561D10D87E3B3bd764D60b5BA1B833E8A6B1b2d",
    arbitrumSepolia: "0x119d4Cc0B3Bb161742DcE9f378d5726d98aA5452",
    roothashTestnet: ""
  }
} as const

/**
 * Check if a contract is deployed on a specific chain
 */
export function hasDeployedContract(chainName: string): boolean {
  const address = DEPLOYED_CONTRACTS.eventManager[chainName as keyof typeof DEPLOYED_CONTRACTS.eventManager]
  return address !== undefined && address !== null && address !== ""
}

/**
 * Get contract address for a chain
 */
export function getContractAddress(chainName: string): string | undefined {
  const address = DEPLOYED_CONTRACTS.eventManager[chainName as keyof typeof DEPLOYED_CONTRACTS.eventManager]
  return address || undefined
}
