package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// LLMClient handles communication with OpenRouter API
type LLMClient struct {
	apiKey    string
	model     string
	baseURL   string
	client    *http.Client
}

// NewLLMClient creates a new OpenRouter client
func NewLLMClient() *LLMClient {
	return &LLMClient{
		apiKey:  os.Getenv("OPENROUTER_API_KEY"),
		model:   getModel(),
		baseURL: "https://openrouter.ai/api/v1/chat/completions",
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func getModel() string {
	model := os.Getenv("OPENROUTER_MODEL")
	if model == "" {
		return "anthropic/claude-3.5-sonnet" // Default model
	}
	return model
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest represents OpenRouter API request
type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
}

// ChatResponse represents OpenRouter API response
type ChatResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// Chat sends a message to the LLM and returns the response
func (c *LLMClient) Chat(messages []Message) (string, error) {
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("📤 LLM Client: Starting chat request")
	
	if c.apiKey == "" {
		log.Println("❌ LLM Client: API key is not set!")
		return "", fmt.Errorf("OPENROUTER_API_KEY not set")
	}
	log.Printf("✓ API Key: %s...%s (length: %d)\n", c.apiKey[:10], c.apiKey[len(c.apiKey)-10:], len(c.apiKey))
	log.Printf("✓ Model: %s\n", c.model)
	log.Printf("✓ Message count: %d\n", len(messages))

	reqBody := ChatRequest{
		Model:       c.model,
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   2000,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		log.Printf("❌ Failed to marshal request: %v\n", err)
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}
	log.Printf("✓ Request body size: %d bytes\n", len(jsonData))

	req, err := http.NewRequest("POST", c.baseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("❌ Failed to create request: %v\n", err)
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("HTTP-Referer", "https://ai-wallet.app")
	req.Header.Set("X-Title", "AI Wallet")
	
	log.Printf("✓ Sending request to: %s\n", c.baseURL)
	startTime := time.Now()

	resp, err := c.client.Do(req)
	if err != nil {
		log.Printf("❌ Failed to send request: %v\n", err)
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	elapsed := time.Since(startTime)
	log.Printf("✓ Response received in %.2f seconds\n", elapsed.Seconds())
	log.Printf("✓ Response status: %d %s\n", resp.StatusCode, resp.Status)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ Failed to read response: %v\n", err)
		return "", fmt.Errorf("failed to read response: %w", err)
	}
	log.Printf("✓ Response body size: %d bytes\n", len(body))

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ API error (status %d): %s\n", resp.StatusCode, string(body))
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		log.Printf("❌ Failed to parse response: %v\n", err)
		log.Printf("Response body: %s\n", string(body))
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		log.Println("❌ No response choices from API")
		return "", fmt.Errorf("no response from API")
	}
	
	content := chatResp.Choices[0].Message.Content
	log.Printf("✓ LLM response length: %d characters\n", len(content))
	log.Printf("✓ Tokens used - Prompt: %d, Completion: %d, Total: %d\n", 
		chatResp.Usage.PromptTokens, 
		chatResp.Usage.CompletionTokens, 
		chatResp.Usage.TotalTokens)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	return content, nil
}
