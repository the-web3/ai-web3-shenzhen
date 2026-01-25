"""Configuration management for the AI agent."""

import os
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class StrategyConfig(BaseModel):
    """Strategy configuration for different agent modes."""
    
    # Competitive judgment strategy
    competitive_price_spread_min: float = Field(default=0.02, description="Minimum price spread (2%)")
    competitive_price_spread_max: float = Field(default=0.05, description="Maximum price spread (5%)")
    competitive_stake_multiplier_min: float = Field(default=0.8, description="Minimum stake multiplier")
    competitive_stake_multiplier_max: float = Field(default=1.2, description="Maximum stake multiplier")
    competitive_response_delay_min: int = Field(default=30, description="Minimum response delay (seconds)")
    competitive_response_delay_max: int = Field(default=300, description="Maximum response delay (seconds)")
    
    # Trend analysis strategy
    trend_volume_threshold: float = Field(default=10.0, description="Volume threshold in HKTC")
    trend_participant_threshold: int = Field(default=5, description="Minimum participants")
    trend_volatility_threshold: float = Field(default=0.1, description="Volatility threshold (10%)")
    trend_time_window_hours: int = Field(default=24, description="Time window for trend analysis")
    
    # External hotspot strategy
    external_confidence_threshold: float = Field(default=0.6, description="Confidence threshold (60%)")
    external_max_events_per_day: int = Field(default=10, description="Maximum events per day")
    
    # Orderbook strategy
    orderbook_initial_spread_bps: int = Field(default=500, description="Initial spread in basis points")
    orderbook_order_layers: int = Field(default=5, description="Number of order layers")
    orderbook_base_order_size: float = Field(default=0.1, description="Base order size in HKTC")
    orderbook_size_increment_factor: float = Field(default=1.2, description="Size increment factor")
    orderbook_price_adjustment_factor: float = Field(default=0.1, description="Price adjustment factor")


class BlockchainConfig(BaseModel):
    """Blockchain connection configuration."""
    
    rpc_url: str = Field(..., description="RPC URL for Hashkey Chain")
    chain_id: int = Field(default=133, description="Chain ID for Hashkey Chain testnet")
    private_key: str = Field(..., description="Private key for agent transactions")
    
    # Contract addresses
    ceres_registry_address: str = Field(..., description="CeresRegistry contract address")
    ceres_market_factory_address: str = Field(..., description="CeresMarketFactory contract address")
    ceres_green_points_address: str = Field(..., description="CeresGreenPoints contract address")
    
    # Transaction settings
    gas_limit: int = Field(default=3000000, description="Default gas limit")
    gas_price_gwei: Optional[float] = Field(default=None, description="Gas price in Gwei (None for auto)")
    max_fee_per_gas_gwei: Optional[float] = Field(default=None, description="Max fee per gas in Gwei")
    max_priority_fee_per_gas_gwei: Optional[float] = Field(default=None, description="Max priority fee per gas in Gwei")


class ExternalDataConfig(BaseModel):
    """External data source configuration."""
    
    weather_api_key: Optional[str] = Field(default=None, description="Weather API key")
    news_api_key: Optional[str] = Field(default=None, description="News API key")
    social_media_api_key: Optional[str] = Field(default=None, description="Social media API key")
    satellite_data_api_key: Optional[str] = Field(default=None, description="Satellite data API key")
    
    # API settings
    request_timeout: int = Field(default=30, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum number of retries")
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")


class MonitoringConfig(BaseModel):
    """Monitoring and alerting configuration."""
    
    enable_monitoring: bool = Field(default=True, description="Enable monitoring")
    health_check_interval: int = Field(default=60, description="Health check interval in seconds")
    alert_webhook_url: Optional[str] = Field(default=None, description="Webhook URL for alerts")
    log_level: str = Field(default="INFO", description="Logging level")


class AgentConfig(BaseModel):
    """Main configuration for the AI agent."""
    
    # Agent mode configuration
    agent_mode: str = Field(default="all", description="Agent mode: competitive, trend_analysis, external_hotspot, or all")
    
    # Sub-configurations
    strategy: StrategyConfig = Field(default_factory=StrategyConfig)
    blockchain: BlockchainConfig
    external_data: ExternalDataConfig = Field(default_factory=ExternalDataConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)
    
    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Create configuration from environment variables."""
        
        # Blockchain configuration (required)
        blockchain_config = BlockchainConfig(
            rpc_url=os.getenv("RPC_URL", ""),
            chain_id=int(os.getenv("CHAIN_ID", "133")),
            private_key=os.getenv("PRIVATE_KEY", ""),
            ceres_registry_address=os.getenv("CERES_REGISTRY_ADDRESS", ""),
            ceres_market_factory_address=os.getenv("CERES_MARKET_FACTORY_ADDRESS", ""),
            ceres_green_points_address=os.getenv("CERES_GREEN_POINTS_ADDRESS", ""),
            gas_limit=int(os.getenv("GAS_LIMIT", "3000000")),
            gas_price_gwei=float(os.getenv("GAS_PRICE_GWEI")) if os.getenv("GAS_PRICE_GWEI") else None,
            max_fee_per_gas_gwei=float(os.getenv("MAX_FEE_PER_GAS_GWEI")) if os.getenv("MAX_FEE_PER_GAS_GWEI") else None,
            max_priority_fee_per_gas_gwei=float(os.getenv("MAX_PRIORITY_FEE_PER_GAS_GWEI")) if os.getenv("MAX_PRIORITY_FEE_PER_GAS_GWEI") else None,
        )
        
        # Strategy configuration
        strategy_config = StrategyConfig(
            competitive_price_spread_min=float(os.getenv("COMPETITIVE_PRICE_SPREAD_MIN", "0.02")),
            competitive_price_spread_max=float(os.getenv("COMPETITIVE_PRICE_SPREAD_MAX", "0.05")),
            competitive_stake_multiplier_min=float(os.getenv("COMPETITIVE_STAKE_MULTIPLIER_MIN", "0.8")),
            competitive_stake_multiplier_max=float(os.getenv("COMPETITIVE_STAKE_MULTIPLIER_MAX", "1.2")),
            competitive_response_delay_min=int(os.getenv("COMPETITIVE_RESPONSE_DELAY_MIN", "30")),
            competitive_response_delay_max=int(os.getenv("COMPETITIVE_RESPONSE_DELAY_MAX", "300")),
            trend_volume_threshold=float(os.getenv("TREND_VOLUME_THRESHOLD", "10.0")),
            trend_participant_threshold=int(os.getenv("TREND_PARTICIPANT_THRESHOLD", "5")),
            trend_volatility_threshold=float(os.getenv("TREND_VOLATILITY_THRESHOLD", "0.1")),
            trend_time_window_hours=int(os.getenv("TREND_TIME_WINDOW_HOURS", "24")),
            external_confidence_threshold=float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.6")),
            external_max_events_per_day=int(os.getenv("MAX_EVENTS_PER_DAY", "10")),
            orderbook_initial_spread_bps=int(os.getenv("ORDERBOOK_INITIAL_SPREAD_BPS", "500")),
            orderbook_order_layers=int(os.getenv("ORDERBOOK_ORDER_LAYERS", "5")),
            orderbook_base_order_size=float(os.getenv("ORDERBOOK_BASE_ORDER_SIZE", "0.1")),
            orderbook_size_increment_factor=float(os.getenv("ORDERBOOK_SIZE_INCREMENT_FACTOR", "1.2")),
            orderbook_price_adjustment_factor=float(os.getenv("ORDERBOOK_PRICE_ADJUSTMENT_FACTOR", "0.1")),
        )
        
        # External data configuration
        external_data_config = ExternalDataConfig(
            weather_api_key=os.getenv("WEATHER_API_KEY"),
            news_api_key=os.getenv("NEWS_API_KEY"),
            social_media_api_key=os.getenv("SOCIAL_MEDIA_API_KEY"),
            satellite_data_api_key=os.getenv("SATELLITE_DATA_API_KEY"),
            request_timeout=int(os.getenv("REQUEST_TIMEOUT", "30")),
            max_retries=int(os.getenv("MAX_RETRIES", "3")),
            rate_limit_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
        )
        
        # Monitoring configuration
        monitoring_config = MonitoringConfig(
            enable_monitoring=os.getenv("ENABLE_MONITORING", "true").lower() == "true",
            health_check_interval=int(os.getenv("HEALTH_CHECK_INTERVAL", "60")),
            alert_webhook_url=os.getenv("ALERT_WEBHOOK_URL"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )
        
        return cls(
            agent_mode=os.getenv("AGENT_MODE", "all"),
            strategy=strategy_config,
            blockchain=blockchain_config,
            external_data=external_data_config,
            monitoring=monitoring_config,
        )
    
    def get_enabled_modes(self) -> List[str]:
        """Get list of enabled agent modes."""
        if self.agent_mode == "all":
            return ["competitive", "trend_analysis", "external_hotspot"]
        else:
            return [mode.strip() for mode in self.agent_mode.split(",")]
    
    def is_mode_enabled(self, mode: str) -> bool:
        """Check if a specific mode is enabled."""
        return mode in self.get_enabled_modes()