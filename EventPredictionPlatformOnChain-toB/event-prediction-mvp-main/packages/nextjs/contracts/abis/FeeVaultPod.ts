export const FeeVaultPodAbi = [
  {
    type: "function",
    name: "getFeeBalance",
    inputs: [{ name: "tokenAddress", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateFee",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "feeType", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFeeRate",
    inputs: [{ name: "feeType", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawFee",
    inputs: [
      { name: "tokenAddress", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPendingFees",
    inputs: [{ name: "tokenAddress", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pushFees",
    inputs: [{ name: "tokenAddress", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "FeeCollected",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "eventId", type: "uint256", indexed: false },
      { name: "feeType", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FeeWithdrawn",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
