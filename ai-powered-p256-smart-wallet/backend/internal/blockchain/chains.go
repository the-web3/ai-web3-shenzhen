package blockchain

// ChainConfig represents a blockchain network configuration
type ChainConfig struct {
	ChainID     int64  `json:"chainId"`
	Name        string `json:"name"`
	ShortName   string `json:"shortName"`
	NativeCoin  string `json:"nativeCoin"`
	Symbol      string `json:"symbol"`
	RpcURL      string `json:"rpcUrl"`
	ExplorerURL string `json:"explorerUrl"`
	IsTestnet   bool   `json:"isTestnet"`
}

// SupportedChains contains all supported blockchain networks
var SupportedChains = map[int64]ChainConfig{
	// Mainnets
	1: {
		ChainID:     1,
		Name:        "Ethereum Mainnet",
		ShortName:   "Ethereum",
		NativeCoin:  "Ether",
		Symbol:      "ETH",
		RpcURL:      "https://eth.llamarpc.com",
		ExplorerURL: "https://etherscan.io",
		IsTestnet:   false,
	},
	56: {
		ChainID:     56,
		Name:        "BNB Smart Chain",
		ShortName:   "BSC",
		NativeCoin:  "BNB",
		Symbol:      "BNB",
		RpcURL:      "https://bsc-dataseed1.binance.org",
		ExplorerURL: "https://bscscan.com",
		IsTestnet:   false,
	},
	137: {
		ChainID:     137,
		Name:        "Polygon Mainnet",
		ShortName:   "Polygon",
		NativeCoin:  "MATIC",
		Symbol:      "MATIC",
		RpcURL:      "https://polygon-rpc.com",
		ExplorerURL: "https://polygonscan.com",
		IsTestnet:   false,
	},
	42161: {
		ChainID:     42161,
		Name:        "Arbitrum One",
		ShortName:   "Arbitrum",
		NativeCoin:  "Ether",
		Symbol:      "ETH",
		RpcURL:      "https://arb1.arbitrum.io/rpc",
		ExplorerURL: "https://arbiscan.io",
		IsTestnet:   false,
	},
	10: {
		ChainID:     10,
		Name:        "Optimism",
		ShortName:   "Optimism",
		NativeCoin:  "Ether",
		Symbol:      "ETH",
		RpcURL:      "https://mainnet.optimism.io",
		ExplorerURL: "https://optimistic.etherscan.io",
		IsTestnet:   false,
	},
	8453: {
		ChainID:     8453,
		Name:        "Base",
		ShortName:   "Base",
		NativeCoin:  "Ether",
		Symbol:      "ETH",
		RpcURL:      "https://mainnet.base.org",
		ExplorerURL: "https://basescan.org",
		IsTestnet:   false,
	},

	// Testnets
	133: {
		ChainID:     133,
		Name:        "HashKey Chain Testnet",
		ShortName:   "HashKey Testnet",
		NativeCoin:  "HashKey Token",
		Symbol:      "HSK",
		RpcURL:      "https://hashkeychain-testnet.alt.technology",
		ExplorerURL: "https://testnet-explorer.hsk.xyz",
		IsTestnet:   true,
	},
	11155111: {
		ChainID:     11155111,
		Name:        "Sepolia Testnet",
		ShortName:   "Sepolia",
		NativeCoin:  "Sepolia Ether",
		Symbol:      "ETH",
		RpcURL:      "https://ethereum-sepolia-rpc.publicnode.com",
		ExplorerURL: "https://sepolia.etherscan.io",
		IsTestnet:   true,
	},
	97: {
		ChainID:     97,
		Name:        "BSC Testnet",
		ShortName:   "BSC Testnet",
		NativeCoin:  "Test BNB",
		Symbol:      "tBNB",
		RpcURL:      "https://data-seed-prebsc-1-s1.binance.org:8545",
		ExplorerURL: "https://testnet.bscscan.com",
		IsTestnet:   true,
	},
	80001: {
		ChainID:     80001,
		Name:        "Mumbai Testnet",
		ShortName:   "Mumbai",
		NativeCoin:  "Test MATIC",
		Symbol:      "MATIC",
		RpcURL:      "https://rpc-mumbai.maticvigil.com",
		ExplorerURL: "https://mumbai.polygonscan.com",
		IsTestnet:   true,
	},
}

// GetChainConfig returns the configuration for a specific chain
func GetChainConfig(chainID int64) (ChainConfig, bool) {
	config, exists := SupportedChains[chainID]
	return config, exists
}

// GetAllChains returns all supported chains
func GetAllChains() []ChainConfig {
	chains := make([]ChainConfig, 0, len(SupportedChains))
	for _, config := range SupportedChains {
		chains = append(chains, config)
	}
	return chains
}

// GetMainnetChains returns only mainnet chains
func GetMainnetChains() []ChainConfig {
	chains := make([]ChainConfig, 0)
	for _, config := range SupportedChains {
		if !config.IsTestnet {
			chains = append(chains, config)
		}
	}
	return chains
}

// GetTestnetChains returns only testnet chains
func GetTestnetChains() []ChainConfig {
	chains := make([]ChainConfig, 0)
	for _, config := range SupportedChains {
		if config.IsTestnet {
			chains = append(chains, config)
		}
	}
	return chains
}
