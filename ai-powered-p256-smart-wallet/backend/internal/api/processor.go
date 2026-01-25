package ai

import (
	"ai-wallet-backend/internal/models"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"
)

// Processor 处理用户输入并生成AI响应
type Processor struct {
	llmClient *LLMClient
}

// NewProcessor 创建新的AI处理器
func NewProcessor() *Processor {
	return &Processor{
		llmClient: NewLLMClient(),
	}
}

// ProcessMessage 处理用户消息并生成结构化响应
func (p *Processor) ProcessMessage(message string, history []models.ChatMessage) (*models.AIResponse, error) {
	log.Println("╔════════════════════════════════════════╗")
	log.Println("║     AI PROCESSOR: New Message          ║")
	log.Println("╚════════════════════════════════════════╝")
	log.Printf("📝 User message: %s\n", message)
	log.Printf("📚 History count: %d messages\n", len(history))
	
	// 构建消息列表（包含历史）
	messages := []Message{{Role: "system", Content: SystemPrompt}}
	
	// 添加历史消息（最多保留最近10条）
	maxHistory := 10
	startIdx := 0
	if len(history) > maxHistory {
		startIdx = len(history) - maxHistory
	}
	
	for i := startIdx; i < len(history); i++ {
		messages = append(messages, Message{
			Role:    history[i].Role,
			Content: history[i].Content,
		})
	}
	log.Printf("✓ Using %d history messages (from index %d)\n", len(history)-startIdx, startIdx)
	
	// 添加当前用户消息
	messages = append(messages, Message{Role: "user", Content: message})
	log.Printf("✓ Total messages to LLM: %d (1 system + %d history + 1 current)\n", len(messages), len(history)-startIdx)

	log.Println("🚀 Calling LLM API...")
	llmResponse, err := p.llmClient.Chat(messages)
	if err != nil {
		// 如果 LLM 调用失败，回退到关键词匹配
		log.Printf("❌ LLM error: %v\n", err)
		log.Println("⚠️  Falling back to keyword matching mode")
		return p.fallbackResponse(message)
	}

	log.Printf("✓ LLM returned response (length: %d)\n", len(llmResponse))
	log.Printf("📄 LLM response preview: %s...\n", truncateString(llmResponse, 150))

	// 解析 LLM 返回的响应（支持纯文本或带 <aiui> 标签）
	log.Println("🔍 Parsing LLM response...")
	response, err := p.parseAIResponse(llmResponse)
	if err != nil {
		log.Printf("❌ Failed to parse LLM response: %v\n", err)
		log.Println("⚠️  Falling back to keyword matching mode")
		return p.fallbackResponse(message)
	}

	log.Println("✅ Successfully parsed AI response")
	if response.Message != "" {
		log.Printf("💬 Response message: %s\n", truncateString(response.Message, 80))
	}
	if response.AIResponse != nil {
		if response.AIResponse.Form != nil {
			log.Printf("📋 Response contains form: %s\n", response.AIResponse.Form.Title)
		}
		if response.AIResponse.Operation != nil {
			log.Printf("⚡ Response contains operation: %s\n", response.AIResponse.Operation.Action)
		}
	}
	log.Println("════════════════════════════════════════")

	return response, nil
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

// parseAIResponse 解析 LLM 返回的响应（支持纯文本或带 <aiui> 标签的格式）
func (p *Processor) parseAIResponse(response string) (*models.AIResponse, error) {
	response = strings.TrimSpace(response)
	
	// 检查是否包含 <aiui> 标签
	startTag := "<aiui>"
	endTag := "</aiui>"
	startIdx := strings.Index(response, startTag)
	
	// 情况1: 没有 <aiui> 标签，纯文本响应
	if startIdx == -1 {
		log.Println("📝 Response format: Plain text (no UI components)")
		return &models.AIResponse{
			Message:    response,
			AIResponse: nil,
		}, nil
	}
	
	// 情况2: 有 <aiui> 标签，需要解析
	log.Println("📝 Response format: Text + XML tags (has UI components)")
	
	endIdx := strings.Index(response, endTag)
	if endIdx == -1 {
		log.Println("⚠️  Warning: Found <aiui> start tag but no closing tag")
		return nil, fmt.Errorf("malformed response: found <aiui> but missing </aiui>")
	}
	
	// 提取各部分
	textBefore := strings.TrimSpace(response[:startIdx])
	jsonContent := strings.TrimSpace(response[startIdx+len(startTag) : endIdx])
	textAfter := strings.TrimSpace(response[endIdx+len(endTag):])
	
	log.Printf("📄 Text before tag: %s\n", truncateString(textBefore, 50))
	log.Printf("📦 JSON content length: %d bytes\n", len(jsonContent))
	log.Printf("📄 Text after tag: %s\n", truncateString(textAfter, 50))
	
	// 组合完整的消息文本
	var messageParts []string
	if textBefore != "" {
		messageParts = append(messageParts, textBefore)
	}
	if textAfter != "" {
		messageParts = append(messageParts, textAfter)
	}
	finalMessage := strings.Join(messageParts, "\n\n")
	
	// 解析 JSON 内容
	var aiStructure models.AIStructure
	if err := json.Unmarshal([]byte(jsonContent), &aiStructure); err != nil {
		log.Printf("❌ Failed to parse JSON inside <aiui> tag: %v\n", err)
		log.Printf("📄 JSON content: %s\n", jsonContent)
		return nil, fmt.Errorf("failed to parse <aiui> JSON content: %w", err)
	}
	
	log.Println("✓ Successfully parsed UI components from <aiui> tag")
	
	return &models.AIResponse{
		Message:    finalMessage,
		AIResponse: &aiStructure,
	}, nil
}

// fallbackResponse 当 LLM 不可用时的回退响应
func (p *Processor) fallbackResponse(message string) (*models.AIResponse, error) {
	message = strings.ToLower(strings.TrimSpace(message))

	aiStructure := &models.AIStructure{}

	// 检测转账意图
	if p.containsKeywords(message, []string{"transfer", "send", "转账", "发送"}) {
		aiStructure = p.generateTransferResponse(message)
	} else if p.containsKeywords(message, []string{"swap", "exchange", "交换", "兑换"}) {
		aiStructure = p.generateSwapResponse(message)
	} else if p.containsKeywords(message, []string{"price", "价格", "market", "市场"}) {
		aiStructure = p.generatePriceQueryResponse(message)
	} else {
		aiStructure = p.generateDefaultResponse(message)
	}

	response := &models.AIResponse{
		Message:    "AI has processed your request (fallback mode). Please review the details below.",
		AIResponse: aiStructure,
	}

	return response, nil
}

// containsKeywords 检查消息是否包含关键词
func (p *Processor) containsKeywords(message string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(message, keyword) {
			return true
		}
	}
	return false
}

// 以下是 fallback 函数，当 LLM 不可用时使用
// generateTransferResponse 生成转账响应
func (p *Processor) generateTransferResponse(message string) *models.AIStructure {
	riskScore := 30

	return &models.AIStructure{
		Problem: &models.ProblemAnalysis{
			Type:        "info",
			Title:       "Transfer Request Detected",
			Description: "You are about to perform a token transfer operation.",
			Suggestions: []string{
				"Verify the recipient address carefully",
				"Ensure you have sufficient balance",
				"Check current gas fees before confirming",
			},
		},
		Operation: &models.Operation{
			Action:      "transfer",
			Asset:       "USDT",
			Amount:      100,
			Recipient:   "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
			ChainID:     1,
			GasEstimate: "0.003 ETH (~$8.50)",
			Parameters: map[string]interface{}{
				"deadline":    time.Now().Add(20 * time.Minute).Unix(),
				"slippage":    "0.5%",
				"priorityFee": "2 gwei",
			},
		},
		Supplement: &models.Supplement{
			PriceData: &models.PriceData{
				Symbol:       "USDT",
				CurrentPrice: 1.00,
				Change24h:    0.02,
			},
			RiskScore: &riskScore,
			News: []models.NewsItem{
				{
					Title:     "Tether Maintains USD Peg",
					Summary:   "USDT continues to show stability in volatile market conditions.",
					Timestamp: time.Now().Format(time.RFC3339),
				},
			},
			Alternatives: []string{"Use Layer 2 for lower fees", "Batch multiple transfers", "Wait for lower gas"},
		},
	}
}

// generateSwapResponse 生成交换响应
func (p *Processor) generateSwapResponse(message string) *models.AIStructure {
	riskScore := 45

	return &models.AIStructure{
		Problem: &models.ProblemAnalysis{
			Type:        "warning",
			Title:       "Swap Operation with Price Impact",
			Description: "Market volatility detected. Price may change during transaction.",
			Suggestions: []string{
				"Set appropriate slippage tolerance",
				"Consider splitting into smaller trades",
				"Review liquidity pool depth",
			},
		},
		Operation: &models.Operation{
			Action:      "swap",
			Asset:       "ETH → USDC",
			Amount:      1.5,
			ChainID:     1,
			GasEstimate: "0.005 ETH (~$14.20)",
			Parameters: map[string]interface{}{
				"fromToken":     "ETH",
				"toToken":       "USDC",
				"amountIn":      "1.5",
				"amountOutMin":  "3450.75",
				"slippage":      "1%",
				"dex":           "Uniswap V3",
				"priceImpact":   "0.15%",
			},
		},
		Supplement: &models.Supplement{
			PriceData: &models.PriceData{
				Symbol:       "ETH",
				CurrentPrice: 2301.50,
				Change24h:    -2.3,
			},
			RiskScore: &riskScore,
			News: []models.NewsItem{
				{
					Title:     "ETH Market Update",
					Summary:   "Ethereum shows consolidation pattern after recent volatility.",
					Timestamp: time.Now().Format(time.RFC3339),
				},
			},
			Alternatives: []string{"Wait for better rate", "Use limit order", "Try alternative DEX"},
		},
	}
}

// generatePriceQueryResponse 生成价格查询响应
func (p *Processor) generatePriceQueryResponse(message string) *models.AIStructure {
	return &models.AIStructure{
		Supplement: &models.Supplement{
			PriceData: &models.PriceData{
				Symbol:       "ETH",
				CurrentPrice: 2301.50,
				Change24h:    -2.3,
			},
			News: []models.NewsItem{
				{
					Title:     "Market Analysis: ETH",
					Summary:   "Ethereum maintains support level amid broader market correction.",
					Timestamp: time.Now().Format(time.RFC3339),
				},
				{
					Title:     "DeFi Activity Update",
					Summary:   "Total value locked in Ethereum DeFi protocols reaches new milestone.",
					Timestamp: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
				},
			},
		},
	}
}

// generateDefaultResponse 生成默认响应
func (p *Processor) generateDefaultResponse(message string) *models.AIStructure {
	return &models.AIStructure{
		Problem: &models.ProblemAnalysis{
			Type:        "info",
			Title:       "How can I help you?",
			Description: fmt.Sprintf("I received your message: '%s'", message),
			Suggestions: []string{
				"Try: 'Transfer 100 USDT'",
				"Try: 'Swap 1 ETH for USDC'",
				"Try: 'Check ETH price'",
				"Try: 'Show my balance'",
			},
		},
	}
}
