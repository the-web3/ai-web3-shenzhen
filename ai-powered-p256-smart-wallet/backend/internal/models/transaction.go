package models

import "time"

// Transaction statuses
const (
	TxStatusPending   = "pending"
	TxStatusConfirmed = "confirmed"
	TxStatusFailed    = "failed"
)

// Transaction represents a blockchain transaction
type Transaction struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	WalletID     string     `json:"walletId" gorm:"index"`
	TxHash       string     `json:"txHash,omitempty" gorm:"index"`
	UserOpHash   string     `json:"userOpHash,omitempty" gorm:"index"`
	Action       string     `json:"action"`
	Asset        string     `json:"asset,omitempty"`
	Amount       string     `json:"amount,omitempty"`
	Recipient    string     `json:"recipient,omitempty"`
	Status       string     `json:"status" gorm:"index"`
	GasUsed      string     `json:"gasUsed,omitempty"`
	ErrorMessage string     `json:"errorMessage,omitempty"`
	CreatedAt    time.Time  `json:"createdAt" gorm:"index"`
	ConfirmedAt  *time.Time `json:"confirmedAt,omitempty"`
}

// TableName specifies the table name for Transaction
func (Transaction) TableName() string {
	return "transactions"
}
