package models

import "time"

// Wallet represents a P256-based smart contract wallet (Non-custodial)
// Private keys are stored in user's device Secure Enclave/TPM, not in backend
type Wallet struct {
	ID                    string     `json:"id" gorm:"primaryKey"`
	UserID                string     `json:"userId" gorm:"index"`
	Address               string     `json:"address" gorm:"uniqueIndex"`
	PublicKeyX            string     `json:"publicKeyX"` // P-256 public key X coordinate (hex)
	PublicKeyY            string     `json:"publicKeyY"` // P-256 public key Y coordinate (hex)
	ChainID               int        `json:"chainId"`
	FactoryAddress        string     `json:"factoryAddress"`
	ImplementationAddress string     `json:"implementationAddress"`
	IsDeployed            bool       `json:"isDeployed"`
	DeployedAt            *time.Time `json:"deployedAt,omitempty"`
	CreatedAt             time.Time  `json:"createdAt"`
}

// TableName specifies the table name for Wallet
func (Wallet) TableName() string {
	return "wallets"
}

// WalletBalance represents wallet balance information
type WalletBalance struct {
	Address      string            `json:"address"`
	ETH          string            `json:"eth"`
	ETHFormatted string            `json:"ethFormatted"`
	Tokens       map[string]string `json:"tokens,omitempty"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}
