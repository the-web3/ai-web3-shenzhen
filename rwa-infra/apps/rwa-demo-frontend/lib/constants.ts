export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function envAddress(name: string): `0x${string}` | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  // Minimal shape check; viem will validate further when calling.
  return v as `0x${string}`;
}

