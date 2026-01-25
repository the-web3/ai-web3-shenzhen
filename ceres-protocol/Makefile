# Ceres Protocol Makefile

# Load environment variables
include .env
export

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

## Help
help: ## Show this help message
	@echo "$(GREEN)Ceres Protocol - Available Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(YELLOW)<target>$(NC)\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

## Build
build: ## Compile all contracts
	@echo "$(GREEN)Building contracts...$(NC)"
	forge build

clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	forge clean

## Test
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	forge test -vv

test-gas: ## Run tests with gas reporting
	@echo "$(GREEN)Running tests with gas reporting...$(NC)"
	forge test --gas-report

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	forge coverage

## Network Connection
test-connection: ## Test connection to Hashkey Chain testnet
	@echo "$(GREEN)Testing Hashkey Chain connection...$(NC)"
	forge script script/TestConnection.s.sol --rpc-url $(HASHKEY_TESTNET_RPC_URL)

## Deployment
deploy-testnet: ## Deploy contracts to Hashkey Chain testnet
	@echo "$(GREEN)Deploying to Hashkey Chain testnet...$(NC)"
	forge script script/Deploy.s.sol --rpc-url $(HASHKEY_TESTNET_RPC_URL) --broadcast --verify

## Verification
verify: ## Verify contracts on Hashkey Chain explorer
	@echo "$(GREEN)Verifying contracts...$(NC)"
	forge verify-contract $(CONTRACT_ADDRESS) $(CONTRACT_NAME) --chain-id 133

## Development
format: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	forge fmt

lint: ## Lint code
	@echo "$(GREEN)Linting code...$(NC)"
	forge fmt --check

## Setup
install: ## Install dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	forge install

update: ## Update dependencies
	@echo "$(GREEN)Updating dependencies...$(NC)"
	forge update

setup-env: ## Copy .env.example to .env
	@echo "$(GREEN)Setting up environment file...$(NC)"
	cp .env.example .env
	@echo "$(YELLOW)Please edit .env file with your configuration$(NC)"

.PHONY: help build clean test test-gas test-coverage test-connection deploy-testnet verify format lint install update setup-env