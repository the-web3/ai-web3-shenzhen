export const PodFactoryAbi = [
  {
    type: "function",
    name: "getVendorInfo",
    inputs: [{ name: "vendorId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "vendorId", type: "uint256" },
          { name: "vendorAddress", type: "address" },
          { name: "feeRecipient", type: "address" },
          { name: "isActive", type: "bool" },
          {
            name: "podSet",
            type: "tuple",
            components: [
              { name: "eventPod", type: "address" },
              { name: "orderBookPod", type: "address" },
              { name: "feeVaultPod", type: "address" },
              { name: "fundingPod", type: "address" },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVendorByAddress",
    inputs: [{ name: "vendorAddress", type: "address" }],
    outputs: [{ name: "vendorId", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerVendor",
    inputs: [
      { name: "vendorAddress", type: "address" },
      { name: "feeRecipient", type: "address" },
    ],
    outputs: [{ name: "vendorId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "VendorRegistered",
    inputs: [
      { name: "vendorId", type: "uint256", indexed: true },
      { name: "vendorAddress", type: "address", indexed: true },
      { name: "feeRecipient", type: "address", indexed: false },
    ],
  },
] as const;
