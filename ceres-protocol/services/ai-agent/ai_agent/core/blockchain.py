"""Blockchain integration for the AI agent."""

import json
import logging
from typing import Dict, Any, Optional, List
from web3 import Web3
from web3.contract import Contract
from web3.types import TxReceipt, EventData
from eth_account import Account
from eth_account.signers.local import LocalAccount

from .config import BlockchainConfig

logger = logging.getLogger(__name__)


class BlockchainClient:
    """Web3 client for interacting with Ceres Protocol contracts."""
    
    def __init__(self, config: BlockchainConfig):
        """Initialize blockchain client with configuration."""
        self.config = config
        self.w3 = Web3(Web3.HTTPProvider(config.rpc_url))
        
        # Verify connection
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to blockchain at {config.rpc_url}")
        
        # Set up account
        self.account: LocalAccount = Account.from_key(config.private_key)
        logger.info(f"Initialized blockchain client for account: {self.account.address}")
        
        # Contract instances (will be initialized when needed)
        self._registry_contract: Optional[Contract] = None
        self._factory_contract: Optional[Contract] = None
        self._green_points_contract: Optional[Contract] = None
        
        # Load contract ABIs
        self._load_contract_abis()
    
    def _load_contract_abis(self) -> None:
        """Load contract ABIs from compiled artifacts."""
        # In a real implementation, these would be loaded from JSON files
        # For now, we'll define minimal ABIs for the functions we need
        
        self.registry_abi = [
            {
                "inputs": [
                    {"name": "description", "type": "string"},
                    {"name": "yesPrice", "type": "uint256"},
                    {"name": "noPrice", "type": "uint256"},
                    {"name": "resolutionTime", "type": "uint256"}
                ],
                "name": "submitJudgementEvent",
                "outputs": [{"name": "eventId", "type": "bytes32"}],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "description", "type": "string"},
                    {"name": "yesPrice", "type": "uint256"},
                    {"name": "noPrice", "type": "uint256"},
                    {"name": "resolutionTime", "type": "uint256"},
                    {"name": "marketType", "type": "string"},
                    {"name": "metadata", "type": "bytes"}
                ],
                "name": "submitJudgementEventWithType",
                "outputs": [{"name": "eventId", "type": "bytes32"}],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "eventId", "type": "bytes32"},
                    {"indexed": True, "name": "creator", "type": "address"},
                    {"indexed": False, "name": "description", "type": "string"},
                    {"indexed": False, "name": "stakeAmount", "type": "uint256"},
                    {"indexed": False, "name": "initialYesShares", "type": "uint256"},
                    {"indexed": False, "name": "initialNoShares", "type": "uint256"},
                    {"indexed": False, "name": "resolutionTime", "type": "uint256"}
                ],
                "name": "JudgementEventCreated",
                "type": "event"
            }
        ]
        
        self.factory_abi = [
            {
                "inputs": [{"name": "eventId", "type": "bytes32"}],
                "name": "createMarketForEvent",
                "outputs": [{"name": "marketAddress", "type": "address"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "eventId", "type": "bytes32"}],
                "name": "getMarketAddress",
                "outputs": [{"name": "marketAddress", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        self.green_points_abi = [
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    @property
    def registry_contract(self) -> Contract:
        """Get CeresRegistry contract instance."""
        if self._registry_contract is None:
            self._registry_contract = self.w3.eth.contract(
                address=self.config.ceres_registry_address,
                abi=self.registry_abi
            )
        return self._registry_contract
    
    @property
    def factory_contract(self) -> Contract:
        """Get CeresMarketFactory contract instance."""
        if self._factory_contract is None:
            self._factory_contract = self.w3.eth.contract(
                address=self.config.ceres_market_factory_address,
                abi=self.factory_abi
            )
        return self._factory_contract
    
    @property
    def green_points_contract(self) -> Contract:
        """Get CeresGreenPoints contract instance."""
        if self._green_points_contract is None:
            self._green_points_contract = self.w3.eth.contract(
                address=self.config.ceres_green_points_address,
                abi=self.green_points_abi
            )
        return self._green_points_contract
    
    def get_balance(self) -> float:
        """Get HKTC balance of the agent account."""
        balance_wei = self.w3.eth.get_balance(self.account.address)
        return self.w3.from_wei(balance_wei, 'ether')
    
    def get_green_points_balance(self) -> float:
        """Get green points balance of the agent account."""
        balance_wei = self.green_points_contract.functions.balanceOf(self.account.address).call()
        return self.w3.from_wei(balance_wei, 'ether')
    
    def submit_judgment_event(
        self,
        description: str,
        yes_price: float,
        no_price: float,
        resolution_time: int,
        stake_amount: float,
        market_type: str = "amm",
        metadata: bytes = b""
    ) -> str:
        """Submit a judgment event to the registry."""
        
        # Convert prices to wei
        yes_price_wei = self.w3.to_wei(yes_price, 'ether')
        no_price_wei = self.w3.to_wei(no_price, 'ether')
        stake_amount_wei = self.w3.to_wei(stake_amount, 'ether')
        
        # Validate prices sum to 1
        if abs((yes_price + no_price) - 1.0) > 0.001:
            raise ValueError("Yes and no prices must sum to 1.0")
        
        # Choose function based on whether market type is specified
        if market_type == "amm" and not metadata:
            # Use standard function for AMM markets
            function = self.registry_contract.functions.submitJudgementEvent(
                description,
                yes_price_wei,
                no_price_wei,
                resolution_time
            )
        else:
            # Use typed function for orderbook or custom markets
            function = self.registry_contract.functions.submitJudgementEventWithType(
                description,
                yes_price_wei,
                no_price_wei,
                resolution_time,
                market_type,
                metadata
            )
        
        # Build transaction
        tx = function.build_transaction({
            'from': self.account.address,
            'value': stake_amount_wei,
            'gas': self.config.gas_limit,
            'gasPrice': self._get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
        })
        
        # Sign and send transaction
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        logger.info(f"Submitted judgment event transaction: {tx_hash.hex()}")
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt.status == 1:
            logger.info(f"Judgment event created successfully: {tx_hash.hex()}")
            return tx_hash.hex()
        else:
            logger.error(f"Judgment event creation failed: {tx_hash.hex()}")
            raise RuntimeError(f"Transaction failed: {tx_hash.hex()}")
    
    def listen_for_judgment_events(self, from_block: str = "latest") -> List[EventData]:
        """Listen for JudgementEventCreated events."""
        event_filter = self.registry_contract.events.JudgementEventCreated.create_filter(
            fromBlock=from_block
        )
        
        return event_filter.get_new_entries()
    
    def get_market_address(self, event_id: str) -> str:
        """Get market address for a judgment event."""
        event_id_bytes = bytes.fromhex(event_id.replace('0x', ''))
        market_address = self.factory_contract.functions.getMarketAddress(event_id_bytes).call()
        return market_address
    
    def _get_gas_price(self) -> int:
        """Get gas price for transactions."""
        if self.config.gas_price_gwei:
            return self.w3.to_wei(self.config.gas_price_gwei, 'gwei')
        else:
            # Use network gas price
            return self.w3.eth.gas_price
    
    def estimate_gas(self, function_call, value: int = 0) -> int:
        """Estimate gas for a function call."""
        return function_call.estimate_gas({
            'from': self.account.address,
            'value': value
        })
    
    def get_transaction_receipt(self, tx_hash: str) -> TxReceipt:
        """Get transaction receipt."""
        return self.w3.eth.get_transaction_receipt(tx_hash)
    
    def get_latest_block_number(self) -> int:
        """Get latest block number."""
        return self.w3.eth.block_number
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain."""
        return self.w3.is_connected()
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get network information."""
        return {
            "chain_id": self.w3.eth.chain_id,
            "latest_block": self.w3.eth.block_number,
            "gas_price": self.w3.eth.gas_price,
            "is_connected": self.w3.is_connected(),
            "account_address": self.account.address,
            "account_balance": self.get_balance(),
        }