package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
)

func main() {
	// Values from the failed transaction
	hashToSign := "7ba5b4b553355a03ec90070bbb20b195508cb8914b0a045ee85d372aa6fb7bf9"
	signatureHex := "bf61928d8d028987587722b3779d011066f8a61311aae35e2b0c8e7efbbe1339e921bb41af551af8e2e2dc743b4bfb60881feb7d1b5629b1a450bbee6a0aca8c"
	pubKeyX := "0c5eb37395ea6da0b462730cc55d1d646ae9fd81186636eb3d81aaac2cca2c66"
	pubKeyY := "3d00c3f46d19d9e9aaae3532e60339a88816be0c87a540e981ebd0c4197d741d"

	fmt.Println("=== P-256 Signature Verification Test ===")
	fmt.Println()

	// Decode hash
	hashBytes, err := hex.DecodeString(hashToSign)
	if err != nil {
		log.Fatalf("Failed to decode hash: %v", err)
	}
	fmt.Printf("Hash to verify (32 bytes): %x\n", hashBytes)
	fmt.Printf("Hash length: %d bytes\n\n", len(hashBytes))

	// Decode signature (r||s, 32 bytes each)
	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		log.Fatalf("Failed to decode signature: %v", err)
	}
	fmt.Printf("Signature (64 bytes): %x\n", sigBytes)
	fmt.Printf("Signature length: %d bytes\n\n", len(sigBytes))

	if len(sigBytes) != 64 {
		log.Fatalf("Invalid signature length: expected 64, got %d", len(sigBytes))
	}

	r := new(big.Int).SetBytes(sigBytes[0:32])
	s := new(big.Int).SetBytes(sigBytes[32:64])

	fmt.Printf("r (decimal): %s\n", r.String())
	fmt.Printf("s (decimal): %s\n\n", s.String())

	// Decode public key
	xBytes, err := hex.DecodeString(pubKeyX)
	if err != nil {
		log.Fatalf("Failed to decode public key X: %v", err)
	}

	yBytes, err := hex.DecodeString(pubKeyY)
	if err != nil {
		log.Fatalf("Failed to decode public key Y: %v", err)
	}

	x := new(big.Int).SetBytes(xBytes)
	y := new(big.Int).SetBytes(yBytes)

	fmt.Printf("Public Key X (decimal): %s\n", x.String())
	fmt.Printf("Public Key Y (decimal): %s\n\n", y.String())

	// Create public key
	pubKey := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     x,
		Y:     y,
	}

	// Verify the point is on the curve
	if !pubKey.Curve.IsOnCurve(pubKey.X, pubKey.Y) {
		log.Fatalf("❌ Public key point is NOT on P-256 curve!")
	}
	fmt.Println("✅ Public key point is on P-256 curve")

	// Verify signature
	valid := ecdsa.Verify(pubKey, hashBytes, r, s)

	fmt.Println()
	if valid {
		fmt.Println("✅✅✅ SIGNATURE IS VALID ✅✅✅")
		fmt.Println()
		fmt.Println("This means:")
		fmt.Println("  - The signature correctly signs the hashToSign")
		fmt.Println("  - The public key matches what WebAuthn used")
		fmt.Println("  - The problem is likely in how the contract receives or processes these values")
	} else {
		fmt.Println("❌❌❌ SIGNATURE IS INVALID ❌❌❌")
		fmt.Println()
		fmt.Println("This means:")
		fmt.Println("  - The signature does NOT match the hash + public key")
		fmt.Println("  - Possible causes:")
		fmt.Println("    1. Frontend signed a different hash than what we sent")
		fmt.Println("    2. DER signature parsing is incorrect")
		fmt.Println("    3. Public key extraction from COSE is wrong")
		fmt.Println("    4. WebAuthn added extra data we're not accounting for")
	}
}
