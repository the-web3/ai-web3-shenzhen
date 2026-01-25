package exchange

import (
	"fmt"

	"github.com/cpchain-network/oracle-node/config"
	"github.com/pkg/errors"
	"github.com/tidwall/gjson"

	gresty "github.com/go-resty/resty/v2"
)

var (
	ErrHTTPRequest   = errors.New("HTTP request failed")
	ErrParseFailed   = errors.New("failed to parse price from response")
	ErrInvalidPrice  = errors.New("invalid price value")
	ErrEmptyResponse = errors.New("empty response body")
)

// PriceProvider 通用价格数据提供者接口
type PriceProvider interface {
	GetPrice() (float64, error)
	GetAssetInfo() (assetType, assetName string)
}

// DataProvider 通用数据源提供者
type DataProvider struct {
	client    *gresty.Client
	cfg       config.DataSourceConfig
	assetType string
	assetName string
}

// NewDataProvider 创建通用数据源提供者
func NewDataProvider(cfg config.DataSourceConfig) (*DataProvider, error) {
	if cfg.URL == "" {
		return nil, errors.New("data source URL is required")
	}

	client := gresty.New()

	// 设置自定义请求头
	if cfg.Headers != nil {
		for key, value := range cfg.Headers {
			client.SetHeader(key, value)
		}
	}

	// 设置错误处理
	client.OnAfterResponse(func(c *gresty.Client, r *gresty.Response) error {
		if r.StatusCode() >= 400 {
			return fmt.Errorf("%d %s: %w", r.StatusCode(), r.Request.URL, ErrHTTPRequest)
		}
		return nil
	})

	return &DataProvider{
		client:    client,
		cfg:       cfg,
		assetType: cfg.AssetType,
		assetName: cfg.AssetName,
	}, nil
}

// GetPrice 获取价格
func (p *DataProvider) GetPrice() (float64, error) {
	var resp *gresty.Response
	var err error

	// 发送请求
	switch p.cfg.Method {
	case "POST":
		resp, err = p.client.R().Post(p.cfg.URL)
	default:
		resp, err = p.client.R().Get(p.cfg.URL)
	}

	if err != nil {
		return 0, fmt.Errorf("request failed: %w", err)
	}

	body := resp.String()
	if body == "" {
		return 0, ErrEmptyResponse
	}

	// 解析价格
	var price float64

	// 优先使用 PricePath
	if p.cfg.PricePath != "" {
		result := gjson.Get(body, p.cfg.PricePath)
		if !result.Exists() {
			return 0, fmt.Errorf("price path '%s' not found in response: %w", p.cfg.PricePath, ErrParseFailed)
		}
		price = result.Float()
	} else if p.cfg.BidPath != "" && p.cfg.AskPath != "" {
		// 使用 bid/ask 平均值
		bidResult := gjson.Get(body, p.cfg.BidPath)
		askResult := gjson.Get(body, p.cfg.AskPath)

		if !bidResult.Exists() || !askResult.Exists() {
			return 0, fmt.Errorf("bid/ask path not found in response: %w", ErrParseFailed)
		}

		bid := bidResult.Float()
		ask := askResult.Float()
		price = (bid + ask) / 2
	} else {
		return 0, errors.New("no price path configured")
	}

	if price <= 0 {
		return 0, fmt.Errorf("price is %f: %w", price, ErrInvalidPrice)
	}

	return price, nil
}

// GetAssetInfo 获取资产信息
func (p *DataProvider) GetAssetInfo() (assetType, assetName string) {
	return p.assetType, p.assetName
}

// NewProviderFromConfig 从配置创建提供者（兼容旧配置）
func NewProviderFromConfig(cfg *config.Config) (PriceProvider, error) {
	// 优先使用新配置
	if cfg.Node.DataSource.URL != "" {
		return NewDataProvider(cfg.Node.DataSource)
	}

	// 兼容旧的 CoinUp 配置
	if cfg.Node.ExchangeConfig.BaseHttpUrl != "" {
		return NewCoinUpClient(cfg.Node.ExchangeConfig.BaseHttpUrl)
	}

	return nil, errors.New("no data source configured")
}
