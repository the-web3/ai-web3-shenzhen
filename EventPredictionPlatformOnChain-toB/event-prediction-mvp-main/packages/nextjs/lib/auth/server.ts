import { NextRequest } from "next/server";

/**
 * Extract token from request (cookie or Authorization header)
 * Server-only utility - do not import in client components
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Check cookie first
  const cookieToken = request.cookies.get("auth_token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}
