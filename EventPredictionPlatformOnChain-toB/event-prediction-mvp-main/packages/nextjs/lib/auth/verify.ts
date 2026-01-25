import { type Address, verifyMessage } from "viem";

/**
 * Generate a sign-in message for wallet signature
 */
export function generateSignInMessage(nonce: string): string {
  const timestamp = new Date().toISOString();
  return `Welcome to Event Prediction!

Sign this message to verify your wallet ownership.

Nonce: ${nonce}
Timestamp: ${timestamp}

This signature does not trigger any blockchain transaction or cost any gas fees.`;
}

/**
 * Generate a random nonce
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Verify a wallet signature
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: `0x${string}`,
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: address as Address,
      message,
      signature,
    });
    return isValid;
  } catch {
    return false;
  }
}

/**
 * Extract timestamp from sign-in message and check if it's recent (within 5 minutes)
 */
export function isSignatureRecent(message: string, maxAgeMinutes = 5): boolean {
  const timestampMatch = message.match(/Timestamp: (.+)/);
  if (!timestampMatch) return false;

  const signatureTime = new Date(timestampMatch[1]).getTime();
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;

  return now - signatureTime < maxAge;
}
