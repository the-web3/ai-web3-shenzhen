/**
 * Fishcake Multi-Chain Wallet
 *
 * Main entry point for the Fishcake Wallet SDK
 */

export const VERSION = '1.0.0';

// Core modules
export { WalletManager } from './core/WalletManager';
export { KeyManager } from './core/KeyManager';
export { BalanceManager } from './core/BalanceManager';
export { TransactionManager } from './core/TransactionManager';

// Chain abstraction modules
export { ChainRegistry, chainRegistry } from './chain/ChainRegistry';
export { ChainRouter, chainRouter } from './chain/ChainRouter';
export { SmartChainSelector, smartChainSelector } from './chain/SmartChainSelector';
export { AutoChainSwitcher, autoChainSwitcher } from './chain/AutoChainSwitcher';

// SDK
export { FishcakeSDK } from './sdk/FishcakeSDK';
export { EventService } from './sdk/EventService';
export type {
  SDKConfig,
  SDKInitResult,
} from './sdk/FishcakeSDK';
export type {
  CreateEventParams,
  CreateEventResult,
  JoinEventResult,
  EventDetails,
} from './sdk/EventService';

// Types
export * from './types';
