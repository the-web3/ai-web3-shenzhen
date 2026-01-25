package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/crypto/hkdf"
)

// GetMasterKey derives a 32-byte key from a secret phrase using SHA-256
func GetMasterKey(secretPhrase string) []byte {
	hash := sha256.Sum256([]byte(secretPhrase))
	return hash[:]
}

// DeriveEncryptionKey derives an encryption key from Passkey public key and user ID
// Uses HKDF (HMAC-based Key Derivation Function) for secure key derivation
func DeriveEncryptionKey(passkeyPublicKey []byte, userID string) ([]byte, error) {
	salt := []byte("ai-wallet-encryption-v1")
	info := []byte(userID)

	hkdfReader := hkdf.New(sha256.New, passkeyPublicKey, salt, info)
	key := make([]byte, 32) // AES-256
	if _, err := io.ReadFull(hkdfReader, key); err != nil {
		return nil, fmt.Errorf("failed to derive key: %w", err)
	}

	return key, nil
}

// EncryptPrivateKey encrypts a private key using AES-256-GCM
func EncryptPrivateKey(privateKeyHex string, masterKey []byte) (string, error) {
	if len(masterKey) != 32 {
		return "", errors.New("master key must be 32 bytes for AES-256")
	}

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate random nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt the private key
	plaintext := []byte(privateKeyHex)
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	// Encode to base64 for storage
	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	return encoded, nil
}

// DecryptPrivateKey decrypts a private key using AES-256-GCM
func DecryptPrivateKey(encryptedKey string, masterKey []byte) (string, error) {
	if len(masterKey) != 32 {
		return "", errors.New("master key must be 32 bytes for AES-256")
	}

	// Decode from base64
	data, err := base64.StdEncoding.DecodeString(encryptedKey)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// GenerateEOAKeyPair generates a new Ethereum EOA key pair
func GenerateEOAKeyPair() (privateKeyHex, address string, err error) {
	// Generate new private key
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return "", "", fmt.Errorf("failed to generate key: %w", err)
	}

	// Get private key hex
	privateKeyBytes := crypto.FromECDSA(privateKey)
	privateKeyHex = hexutil.Encode(privateKeyBytes)

	// Get address
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", "", errors.New("failed to cast public key to ECDSA")
	}

	address = crypto.PubkeyToAddress(*publicKeyECDSA).Hex()

	return privateKeyHex, address, nil
}

// PrivateKeyToAddress converts a private key hex to an Ethereum address
func PrivateKeyToAddress(privateKeyHex string) (string, error) {
	privateKey, err := crypto.HexToECDSA(privateKeyHex[2:]) // Remove 0x prefix
	if err != nil {
		return "", fmt.Errorf("invalid private key: %w", err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", errors.New("failed to cast public key to ECDSA")
	}

	address := crypto.PubkeyToAddress(*publicKeyECDSA)
	return address.Hex(), nil
}

// IsValidAddress checks if a string is a valid Ethereum address
func IsValidAddress(address string) bool {
	return common.IsHexAddress(address)
}

// GenerateRandomToken generates a random token for sessions
func GenerateRandomToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
