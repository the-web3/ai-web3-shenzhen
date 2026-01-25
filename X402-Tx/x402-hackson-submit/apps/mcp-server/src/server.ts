import "dotenv/config";
import crypto from "node:crypto";
import {
  Server,
} from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { eventSpecSchema, evidenceSchema } from "@x402-stack/shared";
import {
  createPublicClient,
  createWalletClient,
  hexToSignature,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const envSchema = z.object({
  FACT_API_URL: z.string().url(),
  BUYER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  BUYER_RPC_URL: z.string().url().default("https://testnet.hsk.xyz"),
  BUYER_CHAIN_ID: z.string().default("133"),
  PAYMENT_TOKEN_NAME: z.string().default("Mock EIP-3009 Token"),
});

const env = envSchema.parse({
  FACT_API_URL: process.env.FACT_API_URL,
  BUYER_PRIVATE_KEY: process.env.BUYER_PRIVATE_KEY,
  BUYER_RPC_URL: process.env.BUYER_RPC_URL,
  BUYER_CHAIN_ID: process.env.BUYER_CHAIN_ID,
  PAYMENT_TOKEN_NAME: process.env.PAYMENT_TOKEN_NAME,
});

const registerInput = eventSpecSchema;
const resolveInput = evidenceSchema.omit({ eventId: true }).extend({
  eventId: z.string().min(1),
});
const attestInput = z.object({ eventId: z.string().min(1) });
const paymentRequirementsSchema = z.object({
  scheme: z.string().optional(),
  network: z.string().min(1),
  asset: z.string().min(1),
  price: z.string().min(1),
  payee: z.string().optional(),
});

const buyerAccount = privateKeyToAccount(env.BUYER_PRIVATE_KEY as `0x${string}`);
const publicClient = createPublicClient({
  transport: http(env.BUYER_RPC_URL),
});
const walletClient = createWalletClient({
  account: buyerAccount,
  transport: http(env.BUYER_RPC_URL),
});

const tokenAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const transferWithAuthorizationTypes = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

function parseChainId(network: string) {
  const parts = network.split(":");
  if (parts.length === 2 && parts[0] === "eip155") {
    const value = Number(parts[1]);
    if (!Number.isNaN(value)) return value;
  }
  return Number(env.BUYER_CHAIN_ID);
}

async function buildPaymentSignature(requirements: {
  network: string;
  asset: string;
  price: string;
  payee?: string;
}) {
  const chainId = parseChainId(requirements.network);
  const verifyingContract = requirements.asset as `0x${string}`;
  if (!isAddress(verifyingContract)) {
    throw new Error("Invalid payment asset address");
  }

  const tokenName = await publicClient
    .readContract({
      address: verifyingContract,
      abi: tokenAbi,
      functionName: "name",
    })
    .catch(() => env.PAYMENT_TOKEN_NAME);

  const nonce = `0x${crypto.randomBytes(32).toString("hex")}` as `0x${string}`;
  const now = Math.floor(Date.now() / 1000);
  const validAfter = BigInt(0);
  const validBefore = BigInt(now + 3600);
  const payee = requirements.payee ?? buyerAccount.address;

  const signature = await walletClient.signTypedData({
    domain: {
      name: tokenName,
      version: "1",
      chainId,
      verifyingContract,
    },
    types: transferWithAuthorizationTypes,
    primaryType: "TransferWithAuthorization",
    message: {
      from: buyerAccount.address,
      to: payee as `0x${string}`,
      value: BigInt(requirements.price),
      validAfter,
      validBefore,
      nonce,
    },
  });

  const { v, r, s } = hexToSignature(signature);
  return {
    from: buyerAccount.address,
    to: payee,
    value: requirements.price,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce,
    v: Number(v),
    r,
    s,
  };
}

const server = new Server(
  { name: "x402-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "register_event",
        description: "Register a new event in the Fact API",
        inputSchema: zodToJsonSchema(registerInput),
      },
      {
        name: "resolve_event",
        description: "Submit evidence and produce an attestation",
        inputSchema: zodToJsonSchema(resolveInput),
      },
      {
        name: "get_attestation",
        description: "Fetch a paid attestation for an event",
        inputSchema: zodToJsonSchema(attestInput),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "register_event") {
    const parsed = registerInput.parse(args);
    const res = await fetch(`${env.FACT_API_URL}/v1/events/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const payload = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  }

  if (name === "resolve_event") {
    const parsed = resolveInput.parse(args);
    const res = await fetch(`${env.FACT_API_URL}/v1/events/${parsed.eventId}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const payload = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  }

  if (name === "get_attestation") {
    const parsed = attestInput.parse(args);
    const url = `${env.FACT_API_URL}/v1/events/${parsed.eventId}/attest`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });

    if (res.status === 402) {
      const payment = (await res.json()) as {
        payment?: unknown;
        requirements?: unknown;
      };
      const requirements = paymentRequirementsSchema.parse(
        payment?.payment ?? payment?.requirements ?? payment,
      );
      const signaturePayload = await buildPaymentSignature(requirements);
      const retry = await fetch(url, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "PAYMENT-SIGNATURE": JSON.stringify(signaturePayload),
        },
      });
      const retryPayload = await retry.json();
      return { content: [{ type: "text", text: JSON.stringify(retryPayload) }] };
    }

    const payload = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);

