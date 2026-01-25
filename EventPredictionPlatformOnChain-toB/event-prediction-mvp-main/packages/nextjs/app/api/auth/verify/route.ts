import { NextRequest, NextResponse } from "next/server";
import { generateToken, getTokenExpiration, isSignatureRecent, verifyWalletSignature } from "~~/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, message, signature } = body;

    // Validate required fields
    if (!address || !message || !signature) {
      return NextResponse.json({ error: "Missing required fields: address, message, signature" }, { status: 400 });
    }

    // Check if signature is recent (within 5 minutes)
    if (!isSignatureRecent(message)) {
      return NextResponse.json(
        { error: "SIGNATURE_EXPIRED", message: "Signature has expired. Please sign again." },
        { status: 401 },
      );
    }

    // Verify the signature
    const isValid = await verifyWalletSignature(address, message, signature as `0x${string}`);

    if (!isValid) {
      return NextResponse.json({ error: "INVALID_SIGNATURE", message: "Invalid signature." }, { status: 401 });
    }

    // Generate JWT token
    const token = await generateToken(address);
    const expiresAt = getTokenExpiration();

    return NextResponse.json({
      token,
      expiresAt,
      address: address.toLowerCase(),
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An error occurred during authentication." },
      { status: 500 },
    );
  }
}
