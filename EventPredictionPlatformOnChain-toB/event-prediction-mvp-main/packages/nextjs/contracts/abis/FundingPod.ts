export const FundingPodAbi = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "tokenAddress", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositEth",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "tokenAddress", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserBalance",
    inputs: [
      { name: "user", type: "address" },
      { name: "tokenAddress", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLongPosition",
    inputs: [
      { name: "user", type: "address" },
      { name: "tokenAddress", type: "address" },
      { name: "eventId", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mintCompleteSet",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "tokenAddress", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "burnCompleteSet",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "tokenAddress", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getEventPrizePool",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "tokenAddress", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CompleteSetMinted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "eventId", type: "uint256", indexed: true },
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CompleteSetBurned",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "eventId", type: "uint256", indexed: true },
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
