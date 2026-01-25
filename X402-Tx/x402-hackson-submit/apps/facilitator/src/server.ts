import "dotenv/config";
import { Hono } from "hono";
import type { Context } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const envSchema = z.object({
    PORT: z.string().default("8789"),
    RPC_URL: z.string().url().default("https://testnet.hsk.xyz"),
    NETWORK: z.string().default("eip155:133"),
    DRY_RUN: z.string().default("true"),
    SETTLE_TX_HASH: z.string().default("0xsettle"),
    TOKEN_ADDRESS: z.string().optional(),
    SETTLE_PRIVATE_KEY: z.string().optional(),
});

const env = envSchema.parse({
    PORT: process.env.PORT,
    RPC_URL: process.env.RPC_URL,
    NETWORK: process.env.NETWORK,
    DRY_RUN: process.env.DRY_RUN,
    SETTLE_TX_HASH: process.env.SETTLE_TX_HASH,
    TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
    SETTLE_PRIVATE_KEY: process.env.SETTLE_PRIVATE_KEY,
});

const app = new Hono();

const verifySchema = z.object({
    signature: z.string().min(1),
    requirements: z.object({
        scheme: z.string().min(1),
        network: z.string().min(1),
        asset: z.string().min(1),
        price: z.string().min(1),
    }),
});

const signaturePayloadSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    value: z.string().min(1),
    validAfter: z.string().min(1),
    validBefore: z.string().min(1),
    nonce: z.string().min(1),
    v: z.number(),
    r: z.string().min(1),
    s: z.string().min(1),
});

const tokenAbi = [
    {
        type: "function",
        name: "transferWithAuthorization",
        stateMutability: "nonpayable",
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
            { name: "v", type: "uint8" },
            { name: "r", type: "bytes32" },
            { name: "s", type: "bytes32" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
] as const;

function parseSignaturePayload(signature: string) {
    const trimmed = signature.trim();
    try {
        if (trimmed.startsWith("{")) {
            return signaturePayloadSchema.parse(JSON.parse(trimmed));
        }
        const decoded = Buffer.from(trimmed, "base64").toString("utf8");
        return signaturePayloadSchema.parse(JSON.parse(decoded));
    } catch {
        throw new Error("invalid_signature_payload");
    }
}

app.get("/healthcheck", (c: Context) => c.json({ ok: true }));

app.get("/v2/x402/supported", (c: Context) =>
    c.json({
        schemes: ["exact"],
        networks: [env.NETWORK],
    }),
);

app.post("/v2/x402/verify", async (c: Context) => {
    const body = await c.req.json();
    const parsed = verifySchema.parse(body);
    if (parsed.requirements.network !== env.NETWORK) {
        return c.json({ ok: false, error: "unsupported_network" }, 400);
    }
    try {
        parseSignaturePayload(parsed.signature);
    } catch {
        return c.json({ ok: false, error: "invalid_signature" }, 400);
    }
    return c.json({ ok: true });
});

app.post("/v2/x402/settle", async (c: Context) => {
    const body = await c.req.json();
    const parsed = verifySchema.parse(body);
    if (parsed.requirements.network !== env.NETWORK) {
        return c.json({ ok: false, error: "unsupported_network" }, 400);
    }

    if (env.DRY_RUN === "true") {
        return c.json({ ok: true, txHash: env.SETTLE_TX_HASH });
    }

    if (!env.TOKEN_ADDRESS || !env.SETTLE_PRIVATE_KEY) {
        return c.json({ ok: false, error: "missing_token_or_key" }, 500);
    }

    const payload = parseSignaturePayload(parsed.signature);
    const account = privateKeyToAccount(env.SETTLE_PRIVATE_KEY as `0x${string}`);
    const wallet = createWalletClient({
        account,
        transport: http(env.RPC_URL),
    });

    const hash = await wallet.writeContract({
        address: env.TOKEN_ADDRESS as `0x${string}`,
        abi: tokenAbi,
        functionName: "transferWithAuthorization",
        args: [
            payload.from as `0x${string}`,
            payload.to as `0x${string}`,
            BigInt(payload.value),
            BigInt(payload.validAfter),
            BigInt(payload.validBefore),
            payload.nonce as `0x${string}`,
            payload.v,
            payload.r as `0x${string}`,
            payload.s as `0x${string}`,
        ],
    });

    return c.json({ ok: true, txHash: hash });
});

app.onError((err: Error, c: Context) => {
    return c.json({ error: "internal_error", message: err.message }, 500);
});

const port = Number(env.PORT);
serve({ fetch: app.fetch, port });
console.log(`facilitator listening on http://localhost:${port}`);

