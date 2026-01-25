package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAuth creates an authentication middleware that requires a valid session
func RequireAuth(sessionService *SessionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Session-Token")

		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing session token",
			})
			c.Abort()
			return
		}

		user, err := sessionService.GetUserBySession(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired session",
			})
			c.Abort()
			return
		}

		// Store user in context
		c.Set("user", user)
		c.Set("userID", user.ID)

		c.Next()
	}
}

// Middleware is an alias for RequireAuth (for backwards compatibility)
func Middleware(sessionService *SessionService) gin.HandlerFunc {
	return RequireAuth(sessionService)
}

// OptionalAuth is like RequireAuth but doesn't abort if token is missing
func OptionalAuth(sessionService *SessionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Session-Token")

		if token != "" {
			user, err := sessionService.GetUserBySession(token)
			if err == nil {
				c.Set("user", user)
				c.Set("userID", user.ID)
			}
		}

		c.Next()
	}
}

// OptionalMiddleware is an alias for OptionalAuth (for backwards compatibility)
func OptionalMiddleware(sessionService *SessionService) gin.HandlerFunc {
	return OptionalAuth(sessionService)
}
