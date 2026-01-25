-include .env

.PHONY:  all test clean deploy fund help install snapshot format anvil deploy-roothash

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

all: clean remove install update build

# Clean the repo
clean :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

install :; forge install OpenZeppelin/openzeppelin-contracts && forge install OpenZeppelin/openzeppelin-contracts-upgradeable && forge install foundry-rs/forge-std@v1.11.0 

# Update Dependencies
update:; forge update

build :; forge build 

test :; forge test

snapshot :; forge snapshot

format :; forge fmt 

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1


# debug :; forge test --debug --mt method

# coverage :; forge coverage --report debug > coverage.txt

# forge test --mt "testInitialSupply"

# verify :; forge verify-contract 0xA464d41eE745af9274305D455fD0274Bd5669F8B src/Raffle.sol:Raffle --etherscan-api-key $(ETHERSCAN_API_KEY) --rpc-url $(SEPOLIA_RPC_URL) --show-standard-json-input > json.json

# wallet :; cast wallet import <accountName> --interactive

# verify-roothash:;

# forge verify-contract --rpc-url https://rpc-testnet.roothashpay.com --verifier blockscout --verifier-url "https://explorer-testnet.roothashpay.com/api/" 0x827CECc85B7b14E345F501bf2D307736f072487d src/VrfMinProxyFactory.sol:VrfMinProxyFactory

# --show-standard-json-input > json.json

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast
NETWORK_SEPOLIA:= --rpc-url $(SEPOLIA_RPC_URL) --account devWallet --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv
NETWORK_ROOTHASH:= --rpc-url $(ROOTHASH_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast   -vvvv

# ============ L2 部署配置 (推荐用于生产环境) ============
# Arbitrum One (主网)
NETWORK_ARBITRUM:= --rpc-url $(ARBITRUM_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ARBISCAN_API_KEY) --verifier-url https://api.arbiscan.io/api -vvvv

# Arbitrum Sepolia (测试网)
NETWORK_ARBITRUM_SEPOLIA:= --rpc-url $(ARBITRUM_SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ARBISCAN_API_KEY) --verifier-url https://api-sepolia.arbiscan.io/api -vvvv

# Base (主网) - Gas 最低，推荐！
NETWORK_BASE:= --rpc-url $(BASE_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(BASESCAN_API_KEY) --verifier-url https://api.basescan.org/api -vvvv

# Base Sepolia (测试网)
NETWORK_BASE_SEPOLIA:= --rpc-url $(BASE_SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(BASESCAN_API_KEY) --verifier-url https://api-sepolia.basescan.org/api -vvvv

# Optimism (主网)
NETWORK_OPTIMISM:= --rpc-url $(OPTIMISM_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(OPTIMISTIC_ETHERSCAN_API_KEY) --verifier-url https://api-optimistic.etherscan.io/api -vvvv

# Optimism Sepolia (测试网)
NETWORK_OPTIMISM_SEPOLIA:= --rpc-url $(OPTIMISM_SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(OPTIMISTIC_ETHERSCAN_API_KEY) --verifier-url https://api-sepolia-optimistic.etherscan.io/api -vvvv

# ============ 部署命令 ============
deploy-sepolia:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_SEPOLIA)

deploy-local:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_ARGS)

deploy-roothash:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_ROOTHASH)

# ============ L2 部署命令 (推荐) ============
deploy-arbitrum:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_ARBITRUM)

deploy-arbitrum-sepolia:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_ARBITRUM_SEPOLIA)

deploy-base:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_BASE)

deploy-base-sepolia:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_BASE_SEPOLIA)

deploy-optimism:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_OPTIMISM)

deploy-optimism-sepolia:
	@forge script script/DeploySWToken.s.sol:DeploySWToken $(NETWORK_OPTIMISM_SEPOLIA)