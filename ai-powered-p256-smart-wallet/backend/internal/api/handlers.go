package api

import (
	"ai-wallet-backend/internal/ai"
	"ai-wallet-backend/internal/auth"
	"ai-wallet-backend/internal/mcp"
	"ai-wallet-backend/internal/models"
	"ai-wallet-backend/internal/wallet"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler handles HTTP requests
type Handler struct {
	aiProcessor     *ai.Processor
	skillManager    *mcp.SkillManager
	webAuthnService *auth.WebAuthnService
	sessionService  *auth.SessionService
	walletManager   *wallet.Manager
	db              *gorm.DB
}

// NewHandler creates a new handler with all required services
func NewHandler(
	db *gorm.DB,
	webAuthnService *auth.WebAuthnService,
	sessionService *auth.SessionService,
	walletManager *wallet.Manager,
) *Handler {
	return &Handler{
		aiProcessor:     ai.NewProcessor(),
		skillManager:    mcp.NewSkillManager(),
		db:              db,
		webAuthnService: webAuthnService,
		sessionService:  sessionService,
		walletManager:   walletManager,
	}
}

// ChatHandler 处理聊天请求
func (h *Handler) ChatHandler(c *gin.Context) {
	log.Println("\n" + strings.Repeat("=", 60))
	log.Printf("🌐 Incoming Request: %s %s\n", c.Request.Method, c.Request.URL.Path)
	log.Printf("📍 From: %s\n", c.ClientIP())
	
	var req models.ChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ Failed to parse request body: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}
	
	log.Printf("✓ Request parsed successfully\n")
	log.Printf("📨 Message: %s\n", req.Message)
	log.Printf("📚 History items: %d\n", len(req.History))

	// 使用AI处理器生成响应（传入历史消息）
	response, err := h.aiProcessor.ProcessMessage(req.Message, req.History)
	if err != nil {
		log.Printf("❌ Failed to process message: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process message",
		})
		return
	}

	log.Println("✅ Response generated successfully")
	log.Printf("📤 Sending response (message length: %d)\n", len(response.Message))
	log.Println(strings.Repeat("=", 60))
	
	c.JSON(http.StatusOK, response)
}

// SkillsListHandler 列出所有可用技能
func (h *Handler) SkillsListHandler(c *gin.Context) {
	skills := h.skillManager.GetAvailableSkills()
	c.JSON(http.StatusOK, gin.H{
		"skills": skills,
	})
}

// SkillExecuteHandler 执行指定技能
func (h *Handler) SkillExecuteHandler(c *gin.Context) {
	skillName := c.Param("name")
	
	var params map[string]interface{}
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid parameters",
		})
		return
	}

	result, err := h.skillManager.ExecuteSkill(skillName, params)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": result,
	})
}

// HealthCheckHandler 健康检查
func (h *Handler) HealthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "ai-wallet-backend",
		"version": "1.0.0",
	})
}
