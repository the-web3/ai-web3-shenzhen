package mcp

import (
	"ai-wallet-backend/internal/models"
	"fmt"
)

// Skill 定义MCP技能接口
type Skill interface {
	Name() string
	Execute(params map[string]interface{}) (interface{}, error)
}

// SkillManager 管理所有MCP技能
type SkillManager struct {
	skills map[string]Skill
}

// NewSkillManager 创建技能管理器
func NewSkillManager() *SkillManager {
	manager := &SkillManager{
		skills: make(map[string]Skill),
	}

	// 注册内置技能
	manager.RegisterSkill(&PriceCheckSkill{})
	manager.RegisterSkill(&GasEstimatorSkill{})
	manager.RegisterSkill(&AddressValidatorSkill{})
	manager.RegisterSkill(&NewsAggregatorSkill{})

	return manager
}

// RegisterSkill 注册新技能
func (m *SkillManager) RegisterSkill(skill Skill) {
	m.skills[skill.Name()] = skill
}

// ExecuteSkill 执行指定技能
func (m *SkillManager) ExecuteSkill(name string, params map[string]interface{}) (interface{}, error) {
	skill, exists := m.skills[name]
	if !exists {
		return nil, fmt.Errorf("skill not found: %s", name)
	}
	return skill.Execute(params)
}

// GetAvailableSkills 获取所有可用技能
func (m *SkillManager) GetAvailableSkills() []string {
	skills := make([]string, 0, len(m.skills))
	for name := range m.skills {
		skills = append(skills, name)
	}
	return skills
}

// PriceCheckSkill 价格查询技能
type PriceCheckSkill struct{}

func (s *PriceCheckSkill) Name() string {
	return "price_check"
}

func (s *PriceCheckSkill) Execute(params map[string]interface{}) (interface{}, error) {
	symbol, ok := params["symbol"].(string)
	if !ok {
		return nil, fmt.Errorf("symbol parameter is required")
	}

	// 模拟价格数据（实际应该调用CoinGecko等API）
	priceData := &models.PriceData{
		Symbol:       symbol,
		CurrentPrice: 2301.50, // 示例数据
		Change24h:    -2.3,
	}

	return priceData, nil
}

// GasEstimatorSkill Gas费估算技能
type GasEstimatorSkill struct{}

func (s *GasEstimatorSkill) Name() string {
	return "gas_estimator"
}

func (s *GasEstimatorSkill) Execute(params map[string]interface{}) (interface{}, error) {
	// 模拟Gas估算（实际应该调用区块链节点）
	return map[string]interface{}{
		"gasPrice":     "25 gwei",
		"estimatedGas": "21000",
		"totalCost":    "0.000525 ETH",
		"costUSD":      "$1.21",
	}, nil
}

// AddressValidatorSkill 地址验证技能
type AddressValidatorSkill struct{}

func (s *AddressValidatorSkill) Name() string {
	return "address_validator"
}

func (s *AddressValidatorSkill) Execute(params map[string]interface{}) (interface{}, error) {
	address, ok := params["address"].(string)
	if !ok {
		return nil, fmt.Errorf("address parameter is required")
	}

	// 简单的格式验证（实际应该更严格）
	isValid := len(address) == 42 && address[:2] == "0x"

	return map[string]interface{}{
		"isValid":    isValid,
		"address":    address,
		"isContract": false, // 实际应该查询链上数据
		"hasHistory": true,
		"riskScore":  25,
	}, nil
}

// NewsAggregatorSkill 新闻聚合技能
type NewsAggregatorSkill struct{}

func (s *NewsAggregatorSkill) Name() string {
	return "news_aggregator"
}

func (s *NewsAggregatorSkill) Execute(params map[string]interface{}) (interface{}, error) {
	topic, _ := params["topic"].(string)

	// 模拟新闻数据（实际应该调用新闻API）
	news := []models.NewsItem{
		{
			Title:     fmt.Sprintf("Latest news about %s", topic),
			Summary:   "Market analysis and recent developments in the crypto space.",
			URL:       "https://example.com/news/1",
			Timestamp: "2026-01-24T12:00:00Z",
		},
		{
			Title:     "DeFi Protocol Update",
			Summary:   "New features released for popular DeFi platform.",
			URL:       "https://example.com/news/2",
			Timestamp: "2026-01-24T10:30:00Z",
		},
	}

	return news, nil
}
