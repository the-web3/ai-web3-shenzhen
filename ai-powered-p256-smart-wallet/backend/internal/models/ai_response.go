package models

// AIResponse 是返回给前端的完整响应结构
type AIResponse struct {
	Message    string       `json:"message"`
	AIResponse *AIStructure `json:"aiResponse,omitempty"`
}

// AIStructure 包含三个可选部分：问题、操作、补充、表单
type AIStructure struct {
	Problem    *ProblemAnalysis `json:"problem,omitempty"`
	Operation  *Operation       `json:"operation,omitempty"`
	Supplement *Supplement      `json:"supplement,omitempty"`
	Form       *FormInput       `json:"form,omitempty"` // 新增：表单输入
}

// ProblemAnalysis 分析用户请求中的问题或风险
type ProblemAnalysis struct {
	Type        string   `json:"type"` // "warning" | "info" | "error"
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Suggestions []string `json:"suggestions,omitempty"`
}

// Operation 描述需要用户确认的区块链操作
type Operation struct {
	Action      string                 `json:"action"` // "transfer", "swap", "stake", etc.
	Asset       string                 `json:"asset,omitempty"`
	Amount      float64                `json:"amount,omitempty"`
	Recipient   string                 `json:"recipient,omitempty"`
	ChainID     int                    `json:"chainId,omitempty"`
	GasEstimate string                 `json:"gasEstimate,omitempty"`
	Parameters  map[string]interface{} `json:"parameters,omitempty"`
}

// Supplement 提供额外的参考信息
type Supplement struct {
	PriceData    *PriceData `json:"priceData,omitempty"`
	News         []NewsItem `json:"news,omitempty"`
	RiskScore    *int       `json:"riskScore,omitempty"` // 0-100
	Alternatives []string   `json:"alternatives,omitempty"`
}

// PriceData 市场价格信息
type PriceData struct {
	Symbol       string  `json:"symbol"`
	CurrentPrice float64 `json:"currentPrice"`
	Change24h    float64 `json:"change24h"`
}

// NewsItem 新闻条目
type NewsItem struct {
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	URL       string `json:"url,omitempty"`
	Timestamp string `json:"timestamp"`
}

// FormInput 表单输入组件
type FormInput struct {
	Title       string      `json:"title"`
	Description string      `json:"description,omitempty"`
	Fields      []FormField `json:"fields"`
	SubmitLabel string      `json:"submitLabel,omitempty"` // 默认 "提交"
}

// FormField 表单字段
type FormField struct {
	Name        string        `json:"name"`        // 字段名（如 "recipient"）
	Label       string        `json:"label"`       // 显示标签（如 "收款地址"）
	Type        string        `json:"type"`        // "text" | "number" | "select"
	Value       string        `json:"value,omitempty"` // 默认值
	Placeholder string        `json:"placeholder,omitempty"`
	Required    bool          `json:"required,omitempty"`
	Options     []interface{} `json:"options,omitempty"` // select 类型的选项（支持 string[] 或 SelectOption[]）
	Validation  string        `json:"validation,omitempty"` // 验证规则（如 "ethereum_address"）
}

// SelectOption 下拉选项（用于 select 类型字段）
type SelectOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

// ChatRequest 聊天请求结构
type ChatRequest struct {
	Message   string        `json:"message" binding:"required"`
	SessionID string        `json:"sessionId,omitempty"`
	History   []ChatMessage `json:"history,omitempty"`
}

// ChatMessage 聊天消息历史
type ChatMessage struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // 消息内容
}
