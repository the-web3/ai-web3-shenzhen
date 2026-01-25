import { z } from "zod";

export const eventSpecSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    deadline: z.string().datetime(),
    sourceUrls: z.array(z.string().url()).default([]),
});

export type EventSpec = z.infer<typeof eventSpecSchema>;

export const evidenceItemSchema = z.object({
    source: z.string().min(1),
    url: z.string().url(),
    excerpt: z.string().min(1),
    observedAt: z.string().datetime(),
});

export const evidenceSchema = z.object({
    eventId: z.string().min(1),
    outcome: z.enum(["YES", "NO", "UNKNOWN"]),
    items: z.array(evidenceItemSchema).min(1),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const attestationSchema = z.object({
    eventId: z.string().min(1),
    outcome: z.enum(["YES", "NO", "UNKNOWN"]),
    evidenceHash: z.string().min(1),
    issuedAt: z.string().datetime(),
    signer: z.string().min(1),
    signature: z.string().min(1),
});

export type Attestation = z.infer<typeof attestationSchema>;

