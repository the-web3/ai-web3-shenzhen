import type { Abi } from "viem";

// Minimal ABIs for the MVP demo pages (read/write only what we use).

export const rwa1155Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

export const rwaManagerAbi = [
  {
    type: "function",
    name: "availableBalance",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTokenPrice",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "decimals", type: "uint8" },
      { name: "updatedAt", type: "uint256" },
      { name: "fresh", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "getTokenPriceString",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "priceStr", type: "string" },
      { name: "updatedAt", type: "uint256" },
      { name: "fresh", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "requestRedeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "deliveryInfoHash", type: "bytes32" },
    ],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    type: "function",
    name: "issueMint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "docHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "freezeAccount",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "unfreezeAccount",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "freezeBalance",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "unfreezeBalance",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approveRedeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isAccountFrozen",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

export const oraclePodAbi = [
  {
    type: "event",
    name: "PriceUpdated",
    inputs: [
      { name: "oldPrice", type: "uint256", indexed: false },
      { name: "newPrice", type: "uint256", indexed: false },
      { name: "nodeCount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

