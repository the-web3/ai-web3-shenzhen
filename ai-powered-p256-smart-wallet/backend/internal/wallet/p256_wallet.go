package wallet

import (
	"crypto/elliptic"
	"fmt"
	"math/big"
)

// P256PublicKey represents a P-256 (secp256r1) public key
type P256PublicKey struct {
	X *big.Int
	Y *big.Int
}

// ExtractP256PublicKeyFromCOSE extracts P-256 public key from WebAuthn COSE format
// COSE Key format (RFC 8152): https://www.rfc-editor.org/rfc/rfc8152#section-7
//
// For P-256 (ES256), the public key is encoded as CBOR map:
// - kty (1): 2 (EC2 - Elliptic Curve Keys)
// - alg (3): -7 (ES256)
// - crv (-1): 1 (P-256)
// - x (-2): 32 bytes (X coordinate)
// - y (-3): 32 bytes (Y coordinate)
func ExtractP256PublicKeyFromCOSE(cosePublicKey []byte) (*P256PublicKey, error) {
	if len(cosePublicKey) < 70 {
		return nil, fmt.Errorf("COSE public key too short: %d bytes", len(cosePublicKey))
	}

	// Find x coordinate (CBOR label -2 = 0x21)
	// Format: 0x21 0x58 0x20 [32 bytes of x]
	var xStart, yStart int = -1, -1

	for i := 0; i < len(cosePublicKey)-33; i++ {
		// Look for x coordinate: 0x21 (label -2), 0x58 0x20 (byte string, 32 bytes)
		if cosePublicKey[i] == 0x21 && cosePublicKey[i+1] == 0x58 && cosePublicKey[i+2] == 0x20 {
			xStart = i + 3
		}
		// Look for y coordinate: 0x22 (label -3), 0x58 0x20 (byte string, 32 bytes)
		if cosePublicKey[i] == 0x22 && cosePublicKey[i+1] == 0x58 && cosePublicKey[i+2] == 0x20 {
			yStart = i + 3
		}
	}

	if xStart == -1 || yStart == -1 {
		return nil, fmt.Errorf("failed to find P-256 coordinates in COSE key (xStart=%d, yStart=%d)", xStart, yStart)
	}

	// Extract 32 bytes for x and y
	xBytes := cosePublicKey[xStart : xStart+32]
	yBytes := cosePublicKey[yStart : yStart+32]

	x := new(big.Int).SetBytes(xBytes)
	y := new(big.Int).SetBytes(yBytes)

	// Validate the point is on the P-256 curve
	curve := elliptic.P256()
	if !curve.IsOnCurve(x, y) {
		return nil, fmt.Errorf("public key point not on P-256 curve")
	}

	return &P256PublicKey{
		X: x,
		Y: y,
	}, nil
}

// ComputeP256WalletAddress computes the smart contract wallet address
// from P-256 public key coordinates using CREATE2
//
// Address = getAddress(publicKeyX, publicKeyY, salt) from P256AccountFactory
func ComputeP256WalletAddress(publicKey *P256PublicKey, salt uint64, factoryAddress string) (string, error) {
	// This is a placeholder implementation that uses CREATE2 logic
	// but doesn't actually call the contract. For production, we need the eth client.
	// The address will be computed by the Manager which has access to ethClient.

	// For now, return a placeholder that will be replaced by proper contract call
	return "", fmt.Errorf("use Manager.ComputeWalletAddress instead")
}

// P256PublicKeyToHex converts P256PublicKey to hex strings for storage
func P256PublicKeyToHex(pk *P256PublicKey) (xHex, yHex string) {
	xHex = fmt.Sprintf("0x%064x", pk.X)
	yHex = fmt.Sprintf("0x%064x", pk.Y)
	return
}

// P256PublicKeyFromHex converts hex strings to P256PublicKey
func P256PublicKeyFromHex(xHex, yHex string) (*P256PublicKey, error) {
	x := new(big.Int)
	y := new(big.Int)

	// Remove 0x prefix if present
	if len(xHex) > 2 && xHex[:2] == "0x" {
		xHex = xHex[2:]
	}
	if len(yHex) > 2 && yHex[:2] == "0x" {
		yHex = yHex[2:]
	}

	_, okX := x.SetString(xHex, 16)
	_, okY := y.SetString(yHex, 16)

	if !okX || !okY {
		return nil, fmt.Errorf("invalid hex format for public key coordinates")
	}

	// Validate the point is on the curve
	curve := elliptic.P256()
	if !curve.IsOnCurve(x, y) {
		return nil, fmt.Errorf("public key point not on P-256 curve")
	}

	return &P256PublicKey{X: x, Y: y}, nil
}
