package auth

import (
	"ai-wallet-backend/internal/models"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebAuthnService handles Passkey authentication
type WebAuthnService struct {
	webAuthn *webauthn.WebAuthn
	db       *gorm.DB
}

// NewWebAuthnService creates a new WebAuthn service
func NewWebAuthnService(db *gorm.DB, rpID, rpName, rpOrigin string) (*WebAuthnService, error) {
	wconfig := &webauthn.Config{
		RPDisplayName: rpName,
		RPID:          rpID,
		RPOrigins:     []string{rpOrigin, "http://localhost:3001", "http://localhost:8080"},
		// Timeout for registration/login (60 seconds)
		Timeouts: webauthn.TimeoutsConfig{
			Login: webauthn.TimeoutConfig{
				Enforce:    true,
				Timeout:    time.Second * 60,
				TimeoutUVD: time.Second * 60,
			},
			Registration: webauthn.TimeoutConfig{
				Enforce:    true,
				Timeout:    time.Second * 60,
				TimeoutUVD: time.Second * 60,
			},
		},
	}

	wa, err := webauthn.New(wconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create webauthn: %w", err)
	}

	return &WebAuthnService{
		webAuthn: wa,
		db:       db,
	}, nil
}

// BeginRegistration starts the registration process
func (s *WebAuthnService) BeginRegistration(user *models.User) (*protocol.CredentialCreation, string, error) {
	// Wrap user to implement webauthn.User interface
	webAuthnUser := &WebAuthnUser{
		user: user,
		db:   s.db,
	}

	options, session, err := s.webAuthn.BeginRegistration(webAuthnUser)
	if err != nil {
		return nil, "", fmt.Errorf("failed to begin registration: %w", err)
	}

	// Store session temporarily
	sessionID, err := s.storeSession(user.ID, session)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store session: %w", err)
	}

	return options, sessionID, nil
}

// FinishRegistration completes the registration process
// FinishRegistration completes the registration and returns the credential to be saved
// The caller is responsible for saving the credential within their transaction
func (s *WebAuthnService) FinishRegistration(user *models.User, sessionID string, response *protocol.ParsedCredentialCreationData) (*models.PasskeyCredential, error) {
	// Retrieve session
	session, err := s.getSession(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	webAuthnUser := &WebAuthnUser{
		user: user,
		db:   s.db,
	}

	credential, err := s.webAuthn.CreateCredential(webAuthnUser, *session, response)
	if err != nil {
		return nil, fmt.Errorf("failed to create credential: %w", err)
	}

	// Create credential object (but don't save it - let caller do that in their transaction)
	passkeyCredential := &models.PasskeyCredential{
		ID:             uuid.New().String(),
		UserID:         user.ID,
		CredentialID:   credential.ID,
		PublicKey:      credential.PublicKey,
		SignCount:      credential.Authenticator.SignCount,
		AAGUID:         credential.Authenticator.AAGUID,
		BackupEligible: credential.Flags.BackupEligible,
		BackupState:    credential.Flags.BackupState,
		CreatedAt:      time.Now(),
		LastUsedAt:     time.Now(),
	}

	// Delete temporary session
	s.deleteSession(sessionID)

	return passkeyCredential, nil
}

// BeginLogin starts the login process
func (s *WebAuthnService) BeginLogin(user *models.User) (*protocol.CredentialAssertion, string, error) {
	webAuthnUser := &WebAuthnUser{
		user: user,
		db:   s.db,
	}

	options, session, err := s.webAuthn.BeginLogin(webAuthnUser)
	if err != nil {
		return nil, "", fmt.Errorf("failed to begin login: %w", err)
	}

	// Store session temporarily
	sessionID, err := s.storeSession(user.ID, session)
	if err != nil {
		return nil, "", fmt.Errorf("failed to store session: %w", err)
	}

	return options, sessionID, nil
}

// FinishLogin completes the login process
func (s *WebAuthnService) FinishLogin(user *models.User, sessionID string, response *protocol.ParsedCredentialAssertionData) error {
	// Retrieve session
	session, err := s.getSession(sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	webAuthnUser := &WebAuthnUser{
		user: user,
		db:   s.db,
	}

	_, err = s.webAuthn.ValidateLogin(webAuthnUser, *session, response)
	if err != nil {
		return fmt.Errorf("failed to validate login: %w", err)
	}

	// Update credential sign count and last used time
	var credential models.PasskeyCredential
	if err := s.db.Where("credential_id = ?", response.RawID).First(&credential).Error; err == nil {
		credential.SignCount = response.Response.AuthenticatorData.Counter
		credential.LastUsedAt = time.Now()
		s.db.Save(&credential)
	}

	// Delete temporary session
	s.deleteSession(sessionID)

	return nil
}

// storeSession stores a WebAuthn session temporarily
func (s *WebAuthnService) storeSession(userID string, session *webauthn.SessionData) (string, error) {
	sessionID := uuid.New().String()

	// Serialize session data
	sessionBytes, err := json.Marshal(session)
	if err != nil {
		return "", err
	}

	webAuthnSession := &models.WebAuthnSession{
		ID:          sessionID,
		UserID:      userID,
		Challenge:   []byte(session.Challenge),
		SessionData: sessionBytes,
		ExpiresAt:   time.Now().Add(5 * time.Minute),
		CreatedAt:   time.Now(),
	}

	if err := s.db.Create(webAuthnSession).Error; err != nil {
		return "", err
	}

	return sessionID, nil
}

// getSession retrieves a WebAuthn session
func (s *WebAuthnService) getSession(sessionID string) (*webauthn.SessionData, error) {
	var webAuthnSession models.WebAuthnSession
	if err := s.db.Where("id = ?", sessionID).First(&webAuthnSession).Error; err != nil {
		return nil, err
	}

	// Check expiration
	if webAuthnSession.IsExpired() {
		s.deleteSession(sessionID)
		return nil, fmt.Errorf("session expired")
	}

	// Deserialize session data
	var session webauthn.SessionData
	if err := json.Unmarshal(webAuthnSession.SessionData, &session); err != nil {
		return nil, err
	}

	return &session, nil
}

// deleteSession deletes a WebAuthn session
func (s *WebAuthnService) deleteSession(sessionID string) {
	s.db.Where("id = ?", sessionID).Delete(&models.WebAuthnSession{})
}

// CleanupExpiredSessions removes expired WebAuthn sessions
func (s *WebAuthnService) CleanupExpiredSessions() {
	s.db.Where("expires_at < ?", time.Now()).Delete(&models.WebAuthnSession{})
}

// WebAuthnUser implements the webauthn.User interface
type WebAuthnUser struct {
	user *models.User
	db   *gorm.DB
}

func (u *WebAuthnUser) WebAuthnID() []byte {
	return []byte(u.user.ID)
}

func (u *WebAuthnUser) WebAuthnName() string {
	if u.user.Username != "" {
		return u.user.Username
	}
	return u.user.ID
}

func (u *WebAuthnUser) WebAuthnDisplayName() string {
	if u.user.Username != "" {
		return u.user.Username
	}
	return "AI Wallet User"
}

func (u *WebAuthnUser) WebAuthnIcon() string {
	return ""
}

func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	var credentials []models.PasskeyCredential
	if err := u.db.Where("user_id = ?", u.user.ID).Find(&credentials).Error; err != nil {
		return []webauthn.Credential{}
	}

	webAuthnCreds := make([]webauthn.Credential, len(credentials))
	for i, cred := range credentials {
		webAuthnCreds[i] = webauthn.Credential{
			ID:        cred.CredentialID,
			PublicKey: cred.PublicKey,
			Authenticator: webauthn.Authenticator{
				AAGUID:    cred.AAGUID,
				SignCount: cred.SignCount,
			},
			Flags: webauthn.CredentialFlags{
				BackupEligible: cred.BackupEligible,
				BackupState:    cred.BackupState,
			},
		}
	}

	return webAuthnCreds
}
