package config

import (
	"os"
	"time"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Node                  NodeConfig    `yaml:"node"`
	Manager               ManagerConfig `yaml:"manager"`
	CpChainRpc            string        `yaml:"cp_chain_rpc"`
	CpChainID             uint64        `yaml:"cp_chain_id"`
	CpChainStartingHeight uint64        `yaml:"cp_chain_starting_height"`
	BlockStep             uint64        `yaml:"block_step"`
	OracleManagerAddress  string        `yaml:"oracle_manager_address"`
	BlsRegistryAddress    string        `yaml:"bls_registry_address"`
	CPUSDTPodAddress      string        `yaml:"cpusdt_pod_address"`
	Caller                string        `yaml:"caller"`
	PrivateKey            string        `yaml:"private_key"`
}

type NodeConfig struct {
	LevelDbFolder    string           `yaml:"level_db_folder"`
	DataSource       DataSourceConfig `yaml:"data_source"` // 新增：通用数据源配置
	KeyPath          string           `yaml:"key_path"`
	WsAddr           string           `yaml:"ws_addr"`
	SignTimeout      time.Duration    `yaml:"sign_timeout"`
	WaitScanInterval time.Duration    `yaml:"wait_scan_interval"`

	// 保留旧配置兼容性（deprecated）
	ExchangeConfig ExchangeConfig `yaml:"exchange_config"`
}

type ManagerConfig struct {
	LevelDbFolder   string        `yaml:"level_db_folder"`
	NodeMembers     string        `yaml:"node_members"`
	SubmitPriceTime time.Duration `yaml:"submit_price_time"`
	SignTimeout     time.Duration `yaml:"sign_timeout"`
	WsAddr          string        `yaml:"ws_addr"`
}

// DataSourceConfig 通用数据源配置
type DataSourceConfig struct {
	// 资产信息
	AssetType string `yaml:"asset_type"` // 资产类型: stock, gold, oil, house, wine 等
	AssetName string `yaml:"asset_name"` // 资产名称: 贵州茅台, 黄金现货 等

	// HTTP 请求配置
	URL     string            `yaml:"url"`     // 完整的 API URL
	Method  string            `yaml:"method"`  // HTTP 方法，默认 GET
	Headers map[string]string `yaml:"headers"` // 自定义请求头

	// 响应解析配置（使用 JSONPath）
	PricePath string `yaml:"price_path"` // 价格字段路径，如 "data.price"
	BidPath   string `yaml:"bid_path"`   // 买价字段路径，如 "data.bid"（可选）
	AskPath   string `yaml:"ask_path"`   // 卖价字段路径，如 "data.ask"（可选）

	// 价格精度
	Decimals int `yaml:"decimals"` // 小数位数，默认 6
}

// ExchangeConfig 旧配置（保留兼容性）
type ExchangeConfig struct {
	BaseHttpUrl string `yaml:"base_http_url"`
	BaseWsUrl   string `yaml:"base_ws_url"`
}

func NewConfig(path string) (*Config, error) {
	var config = new(Config)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(data, config)
	if err != nil {
		return nil, err
	}

	// 设置默认值
	if config.Node.DataSource.Method == "" {
		config.Node.DataSource.Method = "GET"
	}
	if config.Node.DataSource.Decimals == 0 {
		config.Node.DataSource.Decimals = 6
	}
	if config.Node.DataSource.PricePath == "" {
		config.Node.DataSource.PricePath = "data.price"
	}

	return config, nil
}
