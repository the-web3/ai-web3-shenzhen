/**
 * Event Service
 *
 * Handles interactions with the EventManager smart contract.
 * Provides high-level APIs for creating, joining, and querying events.
 *
 * @module EventService
 */

import { ethers, Contract } from 'ethers';
import { KeyManager } from '../core/KeyManager';
import { WalletManager } from '../core/WalletManager';
import { ChainRouter } from '../chain/ChainRouter';
import { SmartChainSelector } from '../chain/SmartChainSelector';
import { AutoChainSwitcher } from '../chain/AutoChainSwitcher';
import { chainRegistry } from '../chain/ChainRegistry';
import { getEventManagerAddress } from '../config/deployedContracts';
import type { ChainName, ChainConfig } from '../types';

// EventManager ABI (minimal interface)
const EVENT_MANAGER_ABI = [
  'function createEvent(string memory title, string memory description, uint256 entryFee, uint256 maxParticipants) external returns (uint256)',
  'function joinEvent(uint256 eventId) external payable',
  'function cancelEvent(uint256 eventId) external',
  'function getEvent(uint256 eventId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 entryFee, uint256 maxParticipants, uint256 currentParticipants, uint256 createdAt, bool isActive))',
  'function events(uint256 eventId) external view returns (uint256 id, address creator, string title, string description, uint256 entryFee, uint256 maxParticipants, uint256 currentParticipants, uint256 createdAt, bool isActive)',
  'function hasJoined(uint256 eventId, address user) external view returns (bool)',
  'function getUserCreatedEvents(address user) external view returns (uint256[] memory)',
  'function getUserJoinedEvents(address user) external view returns (uint256[] memory)',
  'function getTotalEvents() external view returns (uint256)',
  'event EventCreated(uint256 indexed eventId, address indexed creator, string title, uint256 entryFee, uint256 maxParticipants)',
  'event EventJoined(uint256 indexed eventId, address indexed participant, uint256 amountPaid)',
  'event EventCancelled(uint256 indexed eventId, address indexed creator)',
];

/**
 * Event creation parameters
 */
export interface CreateEventParams {
  /** Event title (max 100 characters) */
  title: string;
  /** Event description (max 500 characters) */
  description: string;
  /** Entry fee in ETH/BNB/etc. (e.g., "0.01") */
  entryFee: string;
  /** Maximum participants (0 = unlimited) */
  maxParticipants: number;
  /** Optional chain preference */
  chainPreference?: ChainName;
}

/**
 * Event creation result
 */
export interface CreateEventResult {
  /** Event ID */
  eventId: bigint;
  /** Chain where event was created */
  chain: ChainName;
  /** Contract address */
  contractAddress: string;
  /** Transaction hash */
  txHash: string;
  /** Gas used */
  gasUsed: string;
}

/**
 * Event join result
 */
export interface JoinEventResult {
  /** Event ID */
  eventId: number;
  /** Chain where event is deployed */
  chain: ChainName;
  /** Transaction hash */
  txHash: string;
  /** Amount paid (in ETH/BNB/etc.) */
  amountPaid: string;
}

/**
 * Event details
 */
export interface EventDetails {
  /** Event ID */
  id: bigint;
  /** Creator address */
  creator: string;
  /** Event title */
  title: string;
  /** Event description */
  description: string;
  /** Entry fee (in Wei) */
  entryFee: bigint;
  /** Maximum participants */
  maxParticipants: bigint;
  /** Current participants */
  currentParticipants: bigint;
  /** Creation timestamp */
  createdAt: bigint;
  /** Is event active */
  isActive: boolean;
  /** Chain where event is deployed */
  chain: ChainName;
  /** Contract address */
  contractAddress: string;
}

/**
 * EventService class
 *
 * Handles all event-related operations including:
 * - Creating events with smart chain selection
 * - Joining events
 * - Querying event details
 */
export class EventService {
  constructor(
    private _keyManager: KeyManager,
    private _walletManager: WalletManager,
    private _chainRouter: ChainRouter, // Reserved for future use
    private smartChainSelector: SmartChainSelector,
    private autoChainSwitcher: AutoChainSwitcher
  ) {
    // Suppress unused variable warning
    void this._chainRouter;
  }

  /**
   * Get EventManager contract instance
   *
   * @param chain - Chain name
   * @param signerOrProvider - Signer or provider
   * @returns Contract instance
   */
  private getEventManagerContract(
    chain: ChainName,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Contract {
    const chainConfig = chainRegistry.getChain(chain);
    
    // First try to get from chain config (for mainnet)
    let contractAddress = chainConfig.contracts.eventManager;
    
    // If not found, try to get from deployedContracts (for testnets)
    if (!contractAddress) {
      contractAddress = getEventManagerAddress(chainConfig.chainId);
    }

    if (!contractAddress) {
      throw new Error(
        `EventManager contract not deployed on ${chainConfig.displayName} (${chain}, Chain ID: ${chainConfig.chainId}). ` +
        `Please deploy the EventManager contract first using: npm run deploy:sepolia (or other testnet). ` +
        `Then update src/config/deployedContracts.ts with the deployed address.`
      );
    }

    return new ethers.Contract(contractAddress, EVENT_MANAGER_ABI, signerOrProvider);
  }

  private async getReadProvider(chain: ChainName): Promise<ethers.JsonRpcProvider> {
    const chainConfig = chainRegistry.getChain(chain);
    let lastError: unknown;

    for (const rpcUrl of chainConfig.rpcUrls) {
      try {
        const provider = new ethers.JsonRpcProvider(
          rpcUrl,
          chainConfig.chainId,
          { staticNetwork: true }
        );
        await provider.getBlockNumber();
        return provider;
      } catch (error) {
        lastError = error;
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Unknown RPC error';
    throw new Error(`All RPC endpoints failed for ${chainConfig.displayName}: ${message}`);
  }

  /**
   * Get chains where EventManager contract is deployed
   * 
   * @returns Array of chain configurations with deployed contracts
   */
  private getDeployedChains(): ChainConfig[] {
    const allChains = chainRegistry.getAllChains();
    const deployedChains: ChainConfig[] = [];

    for (const chain of allChains) {
      // Check if contract is in chain config (for mainnet)
      if (chain.contracts.eventManager) {
        deployedChains.push(chain);
        continue;
      }

      // Check if contract is in deployedContracts (for testnets)
      const contractAddress = getEventManagerAddress(chain.chainId);
      if (contractAddress && contractAddress.trim() !== '') {
        deployedChains.push(chain);
      }
    }

    return deployedChains;
  }

  /**
   * Get safe gas prices for EIP-1559 transactions
   * 
   * Adds buffer and minimum values to prevent "max fee per gas less than block base fee" errors
   * 
   * @param provider - Ethers provider
   * @returns Gas prices with safety margins
   */
  private async getSafeGasPrices(provider: ethers.Provider): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const feeData = await provider.getFeeData();
    
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      // Fallback to safe defaults
      return {
        maxFeePerGas: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei'),
      };
    }
    
    // Add 50% buffer to gas prices (20% was not enough for volatile prices)
    let maxFeePerGas = (feeData.maxFeePerGas * 150n) / 100n;
    let maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 150n) / 100n;
    
    // Ensure minimum values to handle very low initial estimates
    const minMaxFeePerGas = ethers.parseUnits('0.1', 'gwei'); // 0.1 Gwei minimum
    const minPriorityFee = ethers.parseUnits('0.01', 'gwei'); // 0.01 Gwei minimum
    
    if (maxFeePerGas < minMaxFeePerGas) {
      maxFeePerGas = minMaxFeePerGas;
    }
    if (maxPriorityFeePerGas < minPriorityFee) {
      maxPriorityFeePerGas = minPriorityFee;
    }
    
    return { maxFeePerGas, maxPriorityFeePerGas };
  }


  /**
   * Create a new event
   *
   * This method:
   * 1. Selects the optimal chain from deployed chains only (if no preference provided)
   * 2. Switches to the selected chain (if using MetaMask)
   * 3. Creates the event on the selected chain
   *
   * @param params - Event creation parameters
   * @returns Event creation result
   */
  async createEvent(params: CreateEventParams): Promise<CreateEventResult> {
    console.log('🎯 Creating event:', params.title);

    // Step 1: Select optimal chain
    let selectedChain: ChainName;
    if (params.chainPreference) {
      selectedChain = params.chainPreference;
      console.log(`📍 Using preferred chain: ${selectedChain}`);
      
      // Verify the preferred chain has contract deployed
      const preferredChain = chainRegistry.getChain(selectedChain);
      const contractAddress = preferredChain.contracts.eventManager || getEventManagerAddress(preferredChain.chainId);
      if (!contractAddress || contractAddress.trim() === '') {
        throw new Error(
          `EventManager contract not deployed on ${preferredChain.displayName}. ` +
          `Please deploy the contract first or choose a different chain. ` +
          `Available chains: ${this.getDeployedChains().map(c => c.displayName).join(', ')}`
        );
      }
    } else {
      // Get only chains where contract is deployed
      const deployedChains = this.getDeployedChains();
      
      if (deployedChains.length === 0) {
        throw new Error(
          'No chains with deployed EventManager contract found. ' +
          'Please deploy the contract to at least one chain first using: npm run deploy:sepolia'
        );
      }

      console.log(`📋 Found ${deployedChains.length} chain(s) with deployed contract:`, 
        deployedChains.map(c => c.displayName).join(', '));

      // Use smart chain selector, but only from deployed chains
      // CRITICAL: Use requireContract to enforce contract deployment constraint
      const selectedChainConfig = await this.smartChainSelector.selectOptimalChain({
        preferL2: true,
        requireContract: 'eventManager', // 🔒 LAYER 1: Only select chains with deployed contract
        userAddress: this._walletManager.getWalletInstance()?.address,
      });
      selectedChain = selectedChainConfig.name;
      console.log(`�?Optimal chain selected: ${selectedChain} (${selectedChainConfig.displayName})`);
    }

    const chainConfig = chainRegistry.getChain(selectedChain);

    // Step 2: Switch to selected chain (if using MetaMask)
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🔄 Switching to', selectedChain);
      await this.autoChainSwitcher.ensureChain(chainConfig);
    }

    // Step 3: Get signer
    // Priority: 1. Local wallet (from WalletManager) 2. MetaMask
    let signer: ethers.Signer;

    // Try to get local wallet first
    const walletInstance = this._walletManager.getWalletInstance();
    if (walletInstance) {
      // Use local wallet with KeyManager to get signer
      console.log('🔑 Using local wallet for signing');
      signer = await this._keyManager.getSigner(walletInstance, selectedChain);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      // Fallback to MetaMask
      console.log('🦊 Using MetaMask for signing');
      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    } else {
      throw new Error(
        'No wallet connected. Please call createWallet(), restoreFromMnemonic(), importFromPrivateKey(), or connectMetaMask() first.'
      );
    }

    // Step 4: Get contract instance
    const contract = this.getEventManagerContract(selectedChain, signer);

    // Step 5: Parse entry fee to Wei
    const entryFeeWei = ethers.parseEther(params.entryFee);

    // Step 6: Create event
    console.log('📝 Sending transaction to create event...');
    
    // Estimate gas and get current gas price
    let gasLimit: bigint;
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    
    try {
      const estimatedGas = await contract.createEvent.estimateGas(
        params.title,
        params.description,
        entryFeeWei,
        params.maxParticipants
      );
      // Add 50% buffer to estimated gas
      gasLimit = (estimatedGas * 150n) / 100n;
      console.log(`⛽ Estimated gas: ${estimatedGas.toString()}, using: ${gasLimit.toString()}`);
      
      // Get current fee data for EIP-1559 chains
      if (chainConfig.features.supportsEIP1559) {
        // CRITICAL: Use direct RPC provider instead of signer.provider (which may be MetaMask)
        // MetaMask's provider may return inaccurate gas prices
        const rpcProvider = await this.getReadProvider(selectedChain);
        const gasPrices = await this.getSafeGasPrices(rpcProvider);
        maxFeePerGas = gasPrices.maxFeePerGas;
        maxPriorityFeePerGas = gasPrices.maxPriorityFeePerGas;
        console.log(`⛽ EIP-1559 Gas Prices (with 50% buffer + minimum protection):`);
        console.log(`   maxFeePerGas: ${ethers.formatUnits(maxFeePerGas, 'gwei')} Gwei`);
        console.log(`   maxPriorityFeePerGas: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} Gwei`);
      }
    } catch (error) {
      console.warn('⚠️  Gas estimation failed, using default values');
      // Fallback to a safe default (300k should be enough for createEvent)
      gasLimit = 300000n;
    }
    
    // Build transaction options
    const txOptions: any = { gasLimit };
    if (maxFeePerGas && maxPriorityFeePerGas) {
      txOptions.maxFeePerGas = maxFeePerGas;
      txOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;
    }
    
    const tx = await contract.createEvent(
      params.title,
      params.description,
      entryFeeWei,
      params.maxParticipants,
      txOptions
    );

    console.log('�?Waiting for transaction confirmation...');
    console.log(`🔗 Transaction hash: ${tx.hash}`);

    const receipt = await tx.wait();

    // Extract event ID from EventCreated event
    const eventCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'EventCreated';
      } catch {
        return false;
      }
    });

    let eventId: bigint;
    if (eventCreatedEvent) {
      const parsed = contract.interface.parseLog(eventCreatedEvent);
      eventId = parsed!.args[0]; // First argument is eventId
    } else {
      throw new Error('EventCreated event not found in transaction receipt');
    }

    console.log('�?Event created successfully!');
    console.log(`🎉 Event ID: ${eventId}`);
    console.log(`⛓️  Chain: ${selectedChain}`);

    return {
      eventId,
      chain: selectedChain,
      contractAddress: await contract.getAddress(),
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Join an existing event
   *
   * @param eventId - Event ID
   * @param chain - Chain where the event is deployed (optional, will auto-detect if not provided)
   * @returns Join result
   */
  async joinEvent(eventId: number, chain?: ChainName): Promise<JoinEventResult> {
    // Auto-detect chain if not provided
    if (!chain) {
      console.log(`🔍 Auto-detecting chain for event ${eventId}...`);
      chain = await this.detectEventChain(eventId);
      console.log(`�?Event ${eventId} found on ${chain}`);
    }

    console.log(`🎯 Joining event ${eventId} on ${chain}`);

    const chainConfig = chainRegistry.getChain(chain);

    // Step 1: Switch to correct chain (if using MetaMask)
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🔄 Switching to', chain);
      await this.autoChainSwitcher.ensureChain(chainConfig);
    }

    // Step 2: Get signer
    // Priority: 1. Local wallet (from WalletManager) 2. MetaMask
    let signer: ethers.Signer;

    // Try to get local wallet first
    const walletInstance = this._walletManager.getWalletInstance();
    if (walletInstance) {
      // Use local wallet with KeyManager to get signer
      console.log('🔑 Using local wallet for signing');
      signer = await this._keyManager.getSigner(walletInstance, chain);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      // Fallback to MetaMask
      console.log('🦊 Using MetaMask for signing');
      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    } else {
      throw new Error(
        'No wallet connected. Please call createWallet(), restoreFromMnemonic(), importFromPrivateKey(), or connectMetaMask() first.'
      );
    }

    // Step 3: Get contract instance
    const contract = this.getEventManagerContract(chain, signer);

    // Step 4: Get event details to know the entry fee
    // Note: eventId is uint256 in contract, ethers will handle conversion
    // Use type assertion to bypass TypeScript type checking for contract method
    const eventData: any = await (contract as any).getEvent(eventId);
    const entryFee = eventData[4]; // entryFee is the 5th field (index 4)

    // Step 5: Join event with entry fee
    console.log(`💰 Entry fee: ${ethers.formatEther(entryFee)} ${chainConfig.nativeCurrency.symbol}`);
    console.log('📝 Sending transaction to join event...');

    // Estimate gas and get current gas price
    let gasLimit: bigint;
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    
    try {
      const estimatedGas = await contract.joinEvent.estimateGas(eventId, { value: entryFee });
      // Add 50% buffer to estimated gas
      gasLimit = (estimatedGas * 150n) / 100n;
      console.log(`⛽ Estimated gas: ${estimatedGas.toString()}, using: ${gasLimit.toString()}`);
      
      // Get current fee data for EIP-1559 chains
      if (chainConfig.features.supportsEIP1559) {
        // CRITICAL: Use direct RPC provider instead of signer.provider (which may be MetaMask)
        // MetaMask's provider may return inaccurate gas prices
        const rpcProvider = await this.getReadProvider(chain);
        const gasPrices = await this.getSafeGasPrices(rpcProvider);
        maxFeePerGas = gasPrices.maxFeePerGas;
        maxPriorityFeePerGas = gasPrices.maxPriorityFeePerGas;
        console.log(`⛽ EIP-1559 Gas Prices (with 50% buffer + minimum protection):`);
        console.log(`   maxFeePerGas: ${ethers.formatUnits(maxFeePerGas, 'gwei')} Gwei`);
        console.log(`   maxPriorityFeePerGas: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} Gwei`);
      }
    } catch (error) {
      console.warn('⚠️  Gas estimation failed, using default values');
      // Fallback to a safe default (150k should be enough for joinEvent)
      gasLimit = 150000n;
    }

    // Build transaction options
    const txOptions: any = { value: entryFee, gasLimit };
    if (maxFeePerGas && maxPriorityFeePerGas) {
      txOptions.maxFeePerGas = maxFeePerGas;
      txOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;
    }

    const tx = await contract.joinEvent(eventId, txOptions);

    console.log('�?Waiting for transaction confirmation...');
    console.log(`🔗 Transaction hash: ${tx.hash}`);

    await tx.wait();

    console.log('�?Successfully joined event!');
    console.log(`🎉 Event ID: ${eventId}`);

    return {
      eventId,
      chain,
      txHash: tx.hash,
      amountPaid: ethers.formatEther(entryFee),
    };
  }

  /**
   * Get event details
   *
   * Auto-detect which chain an event is deployed on
   * 
   * Queries all chains with deployed EventManager contracts to find the event.
   * 
   * @param eventId - Event ID to search for
   * @returns Chain name where event is found
   */
  private async detectEventChain(eventId: number): Promise<ChainName> {
    const deployedChains = this.getDeployedChains();
    
    if (deployedChains.length === 0) {
      throw new Error('No chains with deployed EventManager contract found');
    }

    console.log(`🔍 Searching for event ${eventId} across ${deployedChains.length} chain(s)...`);

    // Query all chains concurrently
    const searchPromises = deployedChains.map(async (chain) => {
      try {
        const provider = await this.getReadProvider(chain.name);
        const contract = this.getEventManagerContract(chain.name, provider);
        
        // Try to get event details
        const eventData: any = await (contract as any).getEvent(eventId);
        
        // Check if event exists (isActive field or id > 0)
        if (eventData && (eventData[8] === true || eventData[0] > 0n)) {
          console.log(`   �?${chain.displayName}: Event found`);
          return chain.name;
        }
        
        console.log(`   �?${chain.displayName}: Event not found`);
        return null;
      } catch (error) {
        console.log(`   �?${chain.displayName}: Query failed`);
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Find first chain where event was found
    const foundChain = results.find((chain) => chain !== null);
    
    if (!foundChain) {
      throw new Error(
        `Event ${eventId} not found on any chain. ` +
        `Searched chains: ${deployedChains.map(c => c.displayName).join(', ')}`
      );
    }

    return foundChain;
  }

  /**
   * Get event details
   *
   * @param eventId - Event ID
   * @param chain - Chain where the event is deployed (optional, will auto-detect if not provided)
   * @returns Event details
   */
  async getEvent(eventId: number, chain?: ChainName): Promise<EventDetails> {
    // Auto-detect chain if not provided
    if (!chain) {
      console.log(`🔍 Auto-detecting chain for event ${eventId}...`);
      chain = await this.detectEventChain(eventId);
      console.log(`�?Event ${eventId} found on ${chain}`);
    }

    const provider = await this.getReadProvider(chain);
    const contract = this.getEventManagerContract(chain, provider);
    let eventData: any;
    let primaryError: unknown;

    try {
      eventData = await (contract as any).getEvent(eventId);
    } catch (error) {
      primaryError = error;
      try {
        eventData = await (contract as any).events(eventId);
      } catch (fallbackError) {
        const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new Error(`Failed to fetch event ${eventId}: ${primaryMessage}; fallback: ${fallbackMessage}`);
      }
    }

    // Parse event tuple (matches Solidity struct)
    return {
      id: eventData[0],
      creator: eventData[1],
      title: eventData[2],
      description: eventData[3],
      entryFee: eventData[4],
      maxParticipants: eventData[5],
      currentParticipants: eventData[6],
      createdAt: eventData[7],
      isActive: eventData[8],
      chain,
      contractAddress: await contract.getAddress(),
    };
  }

  /**
   * Get events created by a user
   *
   * @param userAddress - User wallet address
   * @param chain - Chain to query
   * @returns Array of event IDs
   */
  async getUserCreatedEvents(userAddress: string, chain: ChainName): Promise<bigint[]> {
    const provider = await this.getReadProvider(chain);
    const contract = this.getEventManagerContract(chain, provider);

    return await contract.getUserCreatedEvents(userAddress);
  }

  /**
   * Get events joined by a user
   *
   * @param userAddress - User wallet address
   * @param chain - Chain to query
   * @returns Array of event IDs
   */
  async getUserJoinedEvents(userAddress: string, chain: ChainName): Promise<bigint[]> {
    const provider = await this.getReadProvider(chain);
    const contract = this.getEventManagerContract(chain, provider);

    return await contract.getUserJoinedEvents(userAddress);
  }

  /**
   * Check if user has joined an event
   *
   * @param eventId - Event ID
   * @param userAddress - User wallet address
   * @param chain - Chain where the event is deployed (optional, will auto-detect if not provided)
   * @returns True if user has joined
   */
  async hasJoinedEvent(eventId: number, userAddress: string, chain?: ChainName): Promise<boolean> {
    // Auto-detect chain if not provided
    if (!chain) {
      console.log(`🔍 Auto-detecting chain for event ${eventId}...`);
      chain = await this.detectEventChain(eventId);
    }

    const provider = await this.getReadProvider(chain);
    const contract = this.getEventManagerContract(chain, provider);

    return await contract.hasJoined(eventId, userAddress);
  }

  /**
   * Get total number of events on a chain
   *
   * @param chain - Chain to query
   * @returns Total event count
   */
  async getTotalEvents(chain: ChainName): Promise<bigint> {
    const provider = await this.getReadProvider(chain);
    const contract = this.getEventManagerContract(chain, provider);

    return await contract.getTotalEvents();
  }

  /**
   * Cancel an event (only creator can cancel)
   *
   * @param eventId - Event ID to cancel
   * @param chain - Chain where the event is deployed (optional, will auto-detect if not provided)
   * @returns Cancel transaction result
   */
  async cancelEvent(eventId: number, chain?: ChainName): Promise<{
    eventId: number;
    chain: ChainName;
    txHash: string;
    gasUsed: string;
  }> {
    // Auto-detect chain if not provided
    if (!chain) {
      console.log(`🔍 Auto-detecting chain for event ${eventId}...`);
      chain = await this.detectEventChain(eventId);
      console.log(`�?Event ${eventId} found on ${chain}`);
    }

    console.log(`🚫 Cancelling event ${eventId} on ${chain}`);

    const chainConfig = chainRegistry.getChain(chain);

    // Step 1: Switch to correct chain (if using MetaMask)
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🔄 Switching to', chain);
      await this.autoChainSwitcher.ensureChain(chainConfig);
    }

    // Step 2: Get signer
    // Priority: 1. Local wallet (from WalletManager) 2. MetaMask
    let signer: ethers.Signer;

    const walletInstance = this._walletManager.getWalletInstance();
    if (walletInstance) {
      console.log('🔑 Using local wallet for signing');
      signer = await this._keyManager.getSigner(walletInstance, chain);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🦊 Using MetaMask for signing');
      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    } else {
      throw new Error(
        'No wallet connected. Please call createWallet(), restoreFromMnemonic(), importFromPrivateKey(), or connectMetaMask() first.'
      );
    }

    // Step 3: Get contract instance
    const contract = this.getEventManagerContract(chain, signer);

    // Step 4: Cancel event
    console.log('📝 Sending transaction to cancel event...');
    const tx = await contract.cancelEvent(eventId);

    console.log('�?Waiting for transaction confirmation...');
    console.log(`🔗 Transaction hash: ${tx.hash}`);

    const receipt = await tx.wait();

    console.log('�?Event cancelled successfully!');
    console.log(`🎉 Event ID: ${eventId}`);

    return {
      eventId,
      chain,
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
    };
  }
}

