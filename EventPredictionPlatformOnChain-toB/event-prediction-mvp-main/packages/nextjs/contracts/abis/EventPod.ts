export const EventPodAbi = [
  {
    type: "function",
    name: "getEvent",
    inputs: [{ name: "eventId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "eventId", type: "uint256" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "deadline", type: "uint256" },
          { name: "settlementTime", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "creator", type: "address" },
          { name: "outcomeCount", type: "uint8" },
          { name: "winningOutcomeIndex", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOutcome",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "description", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createEvent",
    inputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "deadline", type: "uint256" },
      { name: "settlementTime", type: "uint256" },
      {
        name: "outcomes",
        type: "tuple[]",
        components: [
          { name: "name", type: "string" },
          { name: "description", type: "string" },
        ],
      },
    ],
    outputs: [{ name: "eventId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateEventStatus",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelEvent",
    inputs: [{ name: "eventId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settleEvent",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "winningOutcomeIndex", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getEventCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "EventCreated",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
      { name: "outcomeCount", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EventStatusChanged",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true },
      { name: "oldStatus", type: "uint8", indexed: false },
      { name: "newStatus", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EventSettled",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true },
      { name: "winningOutcomeIndex", type: "uint8", indexed: false },
      { name: "settlementTime", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EventCancelled",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const;
