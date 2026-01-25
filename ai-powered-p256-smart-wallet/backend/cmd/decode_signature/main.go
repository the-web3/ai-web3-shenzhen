package main

import (
	"encoding/hex"
	"fmt"
	"log"
)

func main() {
	// The signature that was sent (from logs)
	sigHex := "050eb3a1048e6a1dde9bd2d384478cca1eec7e5171222c52d1f25eff7e214c5f7ceeccdcee9fa28ee5f0253a1fa6bee9770cc3dbd12913eee514db79313ee983002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22626e44436f48456c75306b736d51414147592d36444d4a6c6b6a6b69734e6a5362435a74395a49564e6463222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a33303030222c2263726f73734f726967696e223a66616c73657d"

	sigBytes, err := hex.DecodeString(sigHex)
	if err != nil {
		log.Fatalf("Failed to decode signature: %v", err)
	}

	fmt.Printf("Total signature length: %d bytes\n\n", len(sigBytes))

	// Extract components according to our format:
	// r (32) || s (32) || authDataLength (2) || authenticatorData || clientDataJSON

	if len(sigBytes) < 66 {
		log.Fatal("Signature too short")
	}

	r := sigBytes[0:32]
	s := sigBytes[32:64]
	authDataLengthBytes := sigBytes[64:66]

	// Decode authData length (big-endian uint16)
	authDataLength := int(authDataLengthBytes[0])<<8 | int(authDataLengthBytes[1])

	fmt.Printf("r: %x\n", r)
	fmt.Printf("s: %x\n", s)
	fmt.Printf("authDataLength bytes: %x\n", authDataLengthBytes)
	fmt.Printf("authDataLength (decoded): %d bytes\n\n", authDataLength)

	if len(sigBytes) < 66+authDataLength {
		log.Fatalf("Signature too short for authData: have %d, need %d", len(sigBytes), 66+authDataLength)
	}

	authenticatorData := sigBytes[66 : 66+authDataLength]
	clientDataJSON := sigBytes[66+authDataLength:]

	fmt.Printf("authenticatorData (%d bytes): %x\n", len(authenticatorData), authenticatorData)
	fmt.Printf("clientDataJSON (%d bytes): %s\n\n", len(clientDataJSON), string(clientDataJSON))

	// Verify the structure matches what the contract expects
	fmt.Println("Contract will:")
	fmt.Printf("1. Extract authDataLength from offset 64-66: %d\n", authDataLength)
	fmt.Printf("2. Extract authenticatorData from offset 66 to %d\n", 66+authDataLength)
	fmt.Printf("3. Extract clientDataJSON from offset %d to end\n", 66+authDataLength)
	fmt.Printf("4. Compute: clientDataHash = SHA256(clientDataJSON)\n")
	fmt.Printf("5. Compute: signedMessage = authenticatorData || clientDataHash\n")
	fmt.Printf("6. Compute: messageHash = SHA256(signedMessage)\n")
	fmt.Printf("7. Verify: P256(messageHash, r, s, publicKey)\n")
}
