package models

import "time"

// PasskeyCredential represents a WebAuthn credential
type PasskeyCredential struct {
	ID           string `json:"id" gorm:"primaryKey"`
	UserID       string `json:"userId" gorm:"index"`
	CredentialID []byte `json:"credentialId" gorm:"uniqueIndex"`
	PublicKey    []byte `json:"publicKey"`
	SignCount    uint32 `json:"signCount"`
	AAGUID       []byte `json:"aaguid"`
	// Flags stores authenticator flags (backup eligible, backup state, etc.)
	BackupEligible bool      `json:"backupEligible"`
	BackupState    bool      `json:"backupState"`
	CreatedAt      time.Time `json:"createdAt"`
	LastUsedAt     time.Time `json:"lastUsedAt"`
}

// TableName specifies the table name for PasskeyCredential
func (PasskeyCredential) TableName() string {
	return "passkey_credentials"
}

// Session represents an active user session
type Session struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"userId" gorm:"index"`
	Token     string    `json:"token" gorm:"uniqueIndex"`
	ExpiresAt time.Time `json:"expiresAt" gorm:"index"`
	CreatedAt time.Time `json:"createdAt"`
}

// TableName specifies the table name for Session
func (Session) TableName() string {
	return "sessions"
}

// IsExpired checks if the session has expired
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// WebAuthnSession represents temporary WebAuthn challenge storage
type WebAuthnSession struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"userId,omitempty" gorm:"index"`
	Challenge   []byte    `json:"challenge"`
	SessionData []byte    `json:"sessionData"` // JSONB stored as bytes
	ExpiresAt   time.Time `json:"expiresAt" gorm:"index"`
	CreatedAt   time.Time `json:"createdAt"`
}

// TableName specifies the table name for WebAuthnSession
func (WebAuthnSession) TableName() string {
	return "webauthn_sessions"
}

// IsExpired checks if the WebAuthn session has expired
func (w *WebAuthnSession) IsExpired() bool {
	return time.Now().After(w.ExpiresAt)
}
