import { type JWTPayload, SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-super-secret-key-at-least-32-chars");

export interface AuthPayload extends JWTPayload {
  address: string;
}

/**
 * Generate a JWT token for authenticated user
 */
export async function generateToken(address: string): Promise<string> {
  const token = await new SignJWT({ address: address.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Get token expiration time (24 hours from now)
 */
export function getTokenExpiration(): number {
  return Math.floor(Date.now() / 1000) + 24 * 60 * 60;
}
