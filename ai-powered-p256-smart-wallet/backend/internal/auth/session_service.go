package auth

import (
	"ai-wallet-backend/internal/models"
	"ai-wallet-backend/pkg/crypto"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SessionService manages user sessions
type SessionService struct {
	db *gorm.DB
}

// NewSessionService creates a new session service
func NewSessionService(db *gorm.DB) *SessionService {
	return &SessionService{db: db}
}

// CreateSession creates a new session for a user
func (s *SessionService) CreateSession(userID string) (*models.Session, error) {
	token, err := crypto.GenerateRandomToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	session := &models.Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// ValidateSession validates a session token
func (s *SessionService) ValidateSession(token string) (*models.Session, error) {
	var session models.Session
	if err := s.db.Where("token = ?", token).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("session not found")
		}
		return nil, err
	}

	if session.IsExpired() {
		s.DeleteSession(session.ID)
		return nil, fmt.Errorf("session expired")
	}

	return &session, nil
}

// GetUserBySession gets user by session token
func (s *SessionService) GetUserBySession(token string) (*models.User, error) {
	session, err := s.ValidateSession(token)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := s.db.Where("id = ?", session.UserID).First(&user).Error; err != nil {
		return nil, err
	}

	// Update last active time
	user.LastActiveAt = time.Now()
	s.db.Save(&user)

	return &user, nil
}

// DeleteSession deletes a session
func (s *SessionService) DeleteSession(sessionID string) error {
	return s.db.Where("id = ?", sessionID).Delete(&models.Session{}).Error
}

// DeleteSessionByToken deletes a session by token
func (s *SessionService) DeleteSessionByToken(token string) error {
	return s.db.Where("token = ?", token).Delete(&models.Session{}).Error
}

// CleanupExpiredSessions removes expired sessions
func (s *SessionService) CleanupExpiredSessions() {
	s.db.Where("expires_at < ?", time.Now()).Delete(&models.Session{})
}
