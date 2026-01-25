import "dotenv/config";
import crypto from "node:crypto";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import {
  attestationSchema,
  evidenceSchema,
  eventSpecSchema,
  type Attestation,
  type Evidence,
  type EventSpec,
} from "@x402-stack/shared";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const envSchema = z.object({
  PORT: z.string().default("8787"),
  FACILITATOR_URL: z.string().url(),
  PAYMENT_ASSET: z.string().min(1),
  PAYMENT_NETWORK: z.string().default("eip155:133"),
  PAYMENT_SCHEME: z.string().default("exact"),
  PAYMENT_PRICE: z.string().default("1000000000000000000"),
  PAYMENT_PAYEE: z.string().optional(),
  ATTESTOR_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/),
  DEV_BYPASS_PAYMENT: z.string().default("false"),
});

const env = envSchema.parse({
  PORT: process.env.PORT,
  FACILITATOR_URL: process.env.FACILITATOR_URL,
  PAYMENT_ASSET: process.env.PAYMENT_ASSET,
  PAYMENT_NETWORK: process.env.PAYMENT_NETWORK,
  PAYMENT_SCHEME: process.env.PAYMENT_SCHEME,
  PAYMENT_PRICE: process.env.PAYMENT_PRICE,
  PAYMENT_PAYEE: process.env.PAYMENT_PAYEE,
  ATTESTOR_PRIVATE_KEY: process.env.ATTESTOR_PRIVATE_KEY,
  DEV_BYPASS_PAYMENT: process.env.DEV_BYPASS_PAYMENT,
});

const app = new Hono();

const events = new Map<string, EventSpec>();
const evidences = new Map<string, Evidence>();
const attestations = new Map<string, Attestation>();

const attestorAccount = privateKeyToAccount(env.ATTESTOR_PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({
  account: attestorAccount,
  transport: http("https://testnet.hsk.xyz"),
});

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildPaymentRequirements() {
  return {
    scheme: env.PAYMENT_SCHEME,
    network: env.PAYMENT_NETWORK,
    asset: env.PAYMENT_ASSET,
    price: env.PAYMENT_PRICE,
    payee: env.PAYMENT_PAYEE ?? attestorAccount.address,
  };
}

function isBypassEnabled() {
  return env.DEV_BYPASS_PAYMENT === "true";
}

app.get("/healthcheck", (c) => c.json({ ok: true }));

app.post("/v1/events/register", async (c) => {
  const body = await c.req.json();
  const parsed = eventSpecSchema.parse(body);
  events.set(parsed.id, parsed);
  return c.json({ ok: true, event: parsed });
});

app.get("/v1/events/:id", (c) => {
  const event = events.get(c.req.param("id"));
  if (!event) {
    return c.json({ error: "event_not_found" }, 404);
  }
  return c.json(event);
});

app.post("/v1/events/:id/resolve", async (c) => {
  const eventId = c.req.param("id");
  const event = events.get(eventId);
  if (!event) {
    return c.json({ error: "event_not_found" }, 404);
  }

  const body = await c.req.json();
  const parsed = evidenceSchema.parse({ ...body, eventId });
  evidences.set(eventId, parsed);

  const evidenceHash = sha256Hex(JSON.stringify(parsed));
  const issuedAt = new Date().toISOString();
  const signer = wallet.account.address;
  const attestationPayload = {
    eventId,
    outcome: parsed.outcome,
    evidenceHash,
    issuedAt,
    signer,
  };
  const signature = await wallet.signMessage({
    message: JSON.stringify(attestationPayload),
  });

  const attestation = attestationSchema.parse({
    ...attestationPayload,
    signature,
  });
  attestations.set(eventId, attestation);

  return c.json({ ok: true, evidence: parsed, attestation });
});

app.get("/v1/events/:id/attest", async (c) => {
  const eventId = c.req.param("id");
  const attestation = attestations.get(eventId);
  const evidence = evidences.get(eventId);
  if (!attestation || !evidence) {
    return c.json({ error: "attestation_not_ready" }, 404);
  }

  if (!isBypassEnabled()) {
    const paymentSignature = c.req.header("PAYMENT-SIGNATURE");
    if (!paymentSignature) {
      return c.json(
        {
          error: "payment_required",
          payment: buildPaymentRequirements(),
        },
        402,
      );
    }

    const verifyRes = await fetch(`${env.FACILITATOR_URL}/v2/x402/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        signature: paymentSignature,
        requirements: buildPaymentRequirements(),
      }),
    });

    if (!verifyRes.ok) {
      return c.json({ error: "payment_invalid" }, 402);
    }

    const settleRes = await fetch(`${env.FACILITATOR_URL}/v2/x402/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        signature: paymentSignature,
        requirements: buildPaymentRequirements(),
      }),
    });

    if (!settleRes.ok) {
      return c.json({ error: "payment_settle_failed" }, 402);
    }

    const settlePayload = (await settleRes.json()) as { txHash?: string };
    return c.json({ attestation, evidence, txHash: settlePayload?.txHash });
  }

  return c.json({ attestation, evidence, txHash: "bypass" });
});

app.onError((err, c) => {
  return c.json({ error: "internal_error", message: err.message }, 500);
});

const port = Number(env.PORT);
serve({ fetch: app.fetch, port });
console.log(`fact-api listening on http://localhost:${port}`);

