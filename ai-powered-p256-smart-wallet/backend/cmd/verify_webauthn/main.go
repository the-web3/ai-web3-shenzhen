package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
)

func main() {
	// Data from the failed transaction
	sigHex := "050eb3a1048e6a1dde9bd2d384478cca1eec7e5171222c52d1f25eff7e214c5f7ceeccdcee9fa28ee5f0253a1fa6bee9770cc3dbd12913eee514db79313ee983002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22626e44436f48456c75306b736d51414147592d36444d4a6c6b6a6b69734e6a5362435a74395a49564e6463222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a33303030222c2263726f73734f726967696e223a66616c73657d"
	pubKeyX := "f81f8ea92c0cf33bc5df8b48884531f0d0f68f01e75c588c098673176034f1c5"
	pubKeyY := "cc430dcb14c1855bb9f55319bb3f7972201e72696baf00721fbb58bc51b6d8f9"

	sigBytes, _ := hex.DecodeString(sigHex)

	// Extract components
	r := new(big.Int).SetBytes(sigBytes[0:32])
	s := new(big.Int).SetBytes(sigBytes[32:64])
	authDataLength := int(sigBytes[64])<<8 | int(sigBytes[65])
	authenticatorData := sigBytes[66 : 66+authDataLength]
	clientDataJSON := sigBytes[66+authDataLength:]

	fmt.Println("=== WebAuthn Signature Verification Test ===\n")

	// Step 1: Compute what the contract computes
	fmt.Println("Step 1: Contract computation")
	clientDataHash := sha256.Sum256(clientDataJSON)
	fmt.Printf("clientDataHash: %x\n", clientDataHash)

	signedMessage := append(authenticatorData, clientDataHash[:]...)
	messageHash := sha256.Sum256(signedMessage)
	fmt.Printf("messageHash (what contract verifies): %x\n\n", messageHash)

	// Step 2: Verify with public key
	fmt.Println("Step 2: Verify signature with Go crypto")
	x, _ := new(big.Int).SetString(pubKeyX, 16)
	y, _ := new(big.Int).SetString(pubKeyY, 16)

	pubKey := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     x,
		Y:     y,
	}

	// Verify the point is on curve
	if !pubKey.Curve.IsOnCurve(pubKey.X, pubKey.Y) {
		log.Fatal("Public key not on curve!")
	}
	fmt.Println("✅ Public key is on P-256 curve")

	// Verify signature
	valid := ecdsa.Verify(pubKey, messageHash[:], r, s)

	fmt.Println()
	if valid {
		fmt.Println("✅✅✅ SIGNATURE IS VALID! ✅✅✅")
		fmt.Println()
		fmt.Println("This means the contract SHOULD accept this signature.")
		fmt.Println("If it's still failing, the issue is in the contract code itself.")
	} else {
		fmt.Println("❌❌❌ SIGNATURE IS INVALID ❌❌❌")
		fmt.Println()
		fmt.Println("The signature does not verify against the computed messageHash.")
		fmt.Println("This could mean:")
		fmt.Println("  1. The contract computes messageHash differently than we expect")
		fmt.Println("  2. WebAuthn signed something different")
		fmt.Println("  3. The public key in the contract is different")
	}

	// Additional debug info
	fmt.Println("\n=== Debug Information ===")
	fmt.Printf("r: %s\n", r.String())
	fmt.Printf("s: %s\n", s.String())
	fmt.Printf("authenticatorData length: %d bytes\n", len(authenticatorData))
	fmt.Printf("clientDataJSON length: %d bytes\n", len(clientDataJSON))
	fmt.Printf("clientDataJSON: %s\n", string(clientDataJSON))
}
