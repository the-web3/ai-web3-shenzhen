export const OrderBookPodAbi = [
  {
    type: "function",
    name: "placeOrder",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
      { name: "side", type: "uint8" }, // 0=Buy, 1=Sell
      { name: "price", type: "uint256" }, // 1-10000 basis points
      { name: "amount", type: "uint256" },
      { name: "tokenAddress", type: "address" },
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelOrder",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getOrder",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "orderId", type: "uint256" },
          { name: "user", type: "address" },
          { name: "eventId", type: "uint256" },
          { name: "outcomeIndex", type: "uint8" },
          { name: "side", type: "uint8" },
          { name: "price", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "filledAmount", type: "uint256" },
          { name: "remainingAmount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "timestamp", type: "uint256" },
          { name: "tokenAddress", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPosition",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBestBid",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
    ],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBestAsk",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
    ],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOrderCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "OrderPlaced",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "eventId", type: "uint256", indexed: true },
      { name: "outcomeIndex", type: "uint8", indexed: false },
      { name: "side", type: "uint8", indexed: false },
      { name: "price", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderMatched",
    inputs: [
      { name: "buyOrderId", type: "uint256", indexed: true },
      { name: "sellOrderId", type: "uint256", indexed: true },
      { name: "eventId", type: "uint256", indexed: true },
      { name: "outcomeIndex", type: "uint8", indexed: false },
      { name: "price", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderCancelled",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "cancelledAmount", type: "uint256", indexed: false },
    ],
  },
] as const;
