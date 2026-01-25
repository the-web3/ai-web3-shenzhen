package models

import "time"

// User represents a user account
type User struct {
	ID                 string              `json:"id" gorm:"primaryKey"`
	Username           string              `json:"username,omitempty" gorm:"index"`
	CreatedAt          time.Time           `json:"createdAt"`
	LastActiveAt       time.Time           `json:"lastActiveAt"`
	PasskeyCredentials []PasskeyCredential `json:"passkeyCredentials" gorm:"foreignKey:UserID;references:ID"`
}

// TableName specifies the table name for User
func (User) TableName() string {
	return "users"
}
