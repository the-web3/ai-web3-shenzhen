"""Tests for configuration management."""

import os
import pytest
from ai_agent.core.config import AgentConfig, BlockchainConfig, StrategyConfig


def test_strategy_config_defaults():
    """Test strategy configuration defaults."""
    config = StrategyConfig()
    
    assert config.competitive_price_spread_min == 0.02
    assert config.competitive_price_spread_max == 0.05
    assert config.trend_volume_threshold == 10.0
    assert config.external_confidence_threshold == 0.6


def test_agent_config_enabled_modes():
    """Test agent mode configuration."""
    # Test all modes
    config = AgentConfig(
        agent_mode="all",
        blockchain=BlockchainConfig(
            rpc_url="http://test",
            private_key="0x123",
            ceres_registry_address="0x456",
            ceres_market_factory_address="0x789",
            ceres_green_points_address="0xabc"
        )
    )
    
    enabled_modes = config.get_enabled_modes()
    assert "competitive" in enabled_modes
    assert "trend_analysis" in enabled_modes
    assert "external_hotspot" in enabled_modes
    
    # Test specific mode
    config.agent_mode = "competitive"
    enabled_modes = config.get_enabled_modes()
    assert enabled_modes == ["competitive"]
    
    # Test multiple modes
    config.agent_mode = "competitive,trend_analysis"
    enabled_modes = config.get_enabled_modes()
    assert "competitive" in enabled_modes
    assert "trend_analysis" in enabled_modes
    assert "external_hotspot" not in enabled_modes


def test_is_mode_enabled():
    """Test mode enabled checking."""
    config = AgentConfig(
        agent_mode="competitive,trend_analysis",
        blockchain=BlockchainConfig(
            rpc_url="http://test",
            private_key="0x123",
            ceres_registry_address="0x456",
            ceres_market_factory_address="0x789",
            ceres_green_points_address="0xabc"
        )
    )
    
    assert config.is_mode_enabled("competitive")
    assert config.is_mode_enabled("trend_analysis")
    assert not config.is_mode_enabled("external_hotspot")