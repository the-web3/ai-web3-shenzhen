"""
Comprehensive tests for AI Intelligent Agent
使用pytest和hypothesis进行属性测试
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from hypothesis import given, strategies as st, settings

from ai_agent.core.intelligent_agent import AIIntelligentAgent
from ai_agent.core.config import AgentConfig, StrategyConfig, BlockchainConfig, MonitoringConfig
from ai_agent.demo.simulation_engine import AISimulationEngine


class TestAIIntelligentAgent:
    """Test suite for AI Intelligent Agent."""
    
    @pytest.fixture
    def mock_config(self):
        """Create mock configuration for testing."""
        blockchain_config = BlockchainConfig(
            rpc_url="http://localhost:8545",
            private_key="0x" + "1" * 64,
            ceres_registry_address="0x" + "1" * 40,
            ceres_market_factory_address="0x" + "2" * 40,
            ceres_green_points_address="0x" + "3" * 40,
        )
        
        strategy_config = StrategyConfig(
            trend_volume_threshold=10.0,
            trend_participant_threshold=5,
            trend_volatility_threshold=0.1,
            external_confidence_threshold=0.6,
        )
        
        monitoring_config = MonitoringConfig(
            enable_monitoring=False,  # Disable for tests
        )
        
        return AgentConfig(
            agent_mode="all",
            blockchain=blockchain_config,
            strategy=strategy_config,
            monitoring=monitoring_config,
        )
    
    @pytest.fixture
    def mock_blockchain(self):
        """Create mock blockchain client."""
        blockchain = Mock()
        blockchain.is_connected.return_value = True
        blockchain.get_balance.return_value = 10.0
        blockchain.get_green_points_balance.return_value = 100.0
        blockchain.account.address = "0x" + "a" * 40
        blockchain.listen_for_judgment_events.return_value = []
        blockchain.submit_judgment_event.return_value = "0x" + "b" * 64
        blockchain.get_network_info.return_value = {
            "chain_id": 133,
            "account_address": "0x" + "a" * 40,
            "account_balance": 10.0,
        }
        return blockchain
    
    @pytest.fixture
    def agent(self, mock_config, mock_blockchain):
        """Create AI agent instance for testing."""
        with patch('ai_agent.core.intelligent_agent.BlockchainClient', return_value=mock_blockchain):
            agent = AIIntelligentAgent(mock_config)
            return agent
    
    def test_agent_initialization(self, agent, mock_config):
        """Test agent initialization."""
        assert agent.config == mock_config
        assert not agent.is_running
        assert agent.start_time is None
        assert len(agent.modes) == 3  # All modes enabled
        assert "competitive" in agent.modes
        assert "trend_analysis" in agent.modes
        assert "external_hotspot" in agent.modes
    
    def test_get_status(self, agent):
        """Test agent status reporting."""
        status = agent.get_status()
        
        assert isinstance(status, dict)
        assert "is_running" in status
        assert "enabled_modes" in status
        assert "blockchain_connected" in status
        assert "statistics" in status
        assert status["enabled_modes"] == ["competitive", "trend_analysis", "external_hotspot"]
    
    def test_get_network_info(self, agent):
        """Test network info retrieval."""
        network_info = agent.get_network_info()
        
        assert isinstance(network_info, dict)
        assert "chain_id" in network_info
        assert "account_address" in network_info
        assert network_info["chain_id"] == 133
    
    def test_update_stats(self, agent):
        """Test statistics updating."""
        initial_events = agent.stats["events_processed"]
        
        agent.update_stats("events_processed", 5)
        assert agent.stats["events_processed"] == initial_events + 5
        
        agent.update_stats("new_stat", 10)
        assert agent.stats["new_stat"] == 10
    
    @pytest.mark.asyncio
    async def test_create_judgment_event(self, agent):
        """Test judgment event creation."""
        tx_hash = await agent.create_judgment_event(
            description="Test event",
            yes_price=0.6,
            no_price=0.4,
            resolution_time=int(datetime.now().timestamp()) + 86400,
            stake_amount=1.0,
        )
        
        assert tx_hash is not None
        assert tx_hash.startswith("0x")
        assert agent.stats["events_created"] == 1
        assert agent.stats["successful_transactions"] == 1
    
    @pytest.mark.asyncio
    async def test_health_check(self, agent):
        """Test health check functionality."""
        health_status = await agent.health_check()
        
        assert isinstance(health_status, dict)
        assert "overall_health" in health_status
        assert "timestamp" in health_status
        assert "checks" in health_status
        assert "blockchain" in health_status["checks"]
        
        # Should have checks for all enabled modes
        for mode in ["competitive", "trend_analysis", "external_hotspot"]:
            assert mode in health_status["checks"]
    
    def test_get_mode_status(self, agent):
        """Test mode status retrieval."""
        # Test existing mode
        competitive_status = agent.get_mode_status("competitive")
        assert competitive_status is not None
        assert isinstance(competitive_status, dict)
        
        # Test non-existing mode
        invalid_status = agent.get_mode_status("invalid_mode")
        assert invalid_status is None


class TestAISimulationEngine:
    """Test suite for AI Simulation Engine."""
    
    @pytest.fixture
    def simulation_engine(self):
        """Create simulation engine for testing."""
        config = StrategyConfig()
        return AISimulationEngine(config)
    
    def test_simulation_engine_initialization(self, simulation_engine):
        """Test simulation engine initialization."""
        assert simulation_engine.config is not None
        assert len(simulation_engine.climate_keywords) > 0
        assert len(simulation_engine.judgment_templates) > 0
        assert len(simulation_engine.regions) > 0
        assert "simulated_data_sources" in simulation_engine.__dict__
    
    def test_analyze_human_judgment(self, simulation_engine):
        """Test human judgment analysis."""
        result = simulation_engine.analyze_human_judgment(
            event_description="Will global temperature exceed 2°C by 2030?",
            creator="0x1234567890123456789012345678901234567890",
            yes_price=0.7,
            no_price=0.3
        )
        
        assert "competitive_judgment" in result
        assert "analysis_metadata" in result
        
        judgment = result["competitive_judgment"]
        assert "description" in judgment
        assert "yes_price" in judgment
        assert "no_price" in judgment
        assert "confidence" in judgment
        assert "reasoning" in judgment
        
        # Prices should sum to 1.0
        assert abs(judgment["yes_price"] + judgment["no_price"] - 1.0) < 0.001
        
        # Confidence should be between 0 and 1
        assert 0 <= judgment["confidence"] <= 1
    
    def test_detect_trending_patterns(self, simulation_engine):
        """Test trend pattern detection."""
        market_data = {
            "volume": 15.0,
            "participants": 8,
            "volatility": 0.12,
            "momentum": 0.25,
        }
        
        result = simulation_engine.detect_trending_patterns(market_data)
        
        assert "trend_analysis" in result
        assert "derivative_predictions" in result
        
        trend_analysis = result["trend_analysis"]
        assert "signals_detected" in trend_analysis
        assert "trend_strength" in trend_analysis
        assert "confidence" in trend_analysis
        
        # Trend strength should be between 0 and 1
        assert 0 <= trend_analysis["trend_strength"] <= 1
    
    def test_generate_external_hotspot_events(self, simulation_engine):
        """Test external hotspot event generation."""
        events = simulation_engine.generate_external_hotspot_events(max_events=3)
        
        assert isinstance(events, list)
        assert len(events) <= 3
        
        for event in events:
            assert "description" in event
            assert "confidence" in event
            assert "urgency" in event
            assert "category" in event
            assert "data_sources" in event
            
            # Confidence should be between 0 and 1
            assert 0 <= event["confidence"] <= 1
            
            # Urgency should be valid
            assert event["urgency"] in ["high", "medium", "low"]
    
    def test_get_simulation_status(self, simulation_engine):
        """Test simulation status retrieval."""
        status = simulation_engine.get_simulation_status()
        
        assert isinstance(status, dict)
        assert "engine_status" in status
        assert "simulation_mode" in status
        assert "available_templates" in status
        assert "supported_categories" in status
        assert status["engine_status"] == "active"
        assert status["simulation_mode"] == "demo"


class TestPropertyBasedTests:
    """Property-based tests using Hypothesis."""
    
    @pytest.fixture
    def simulation_engine(self):
        """Create simulation engine for property tests."""
        config = StrategyConfig()
        return AISimulationEngine(config)
    
    @given(
        yes_price=st.floats(min_value=0.1, max_value=0.9),
        description=st.text(min_size=10, max_size=200),
    )
    @settings(max_examples=50, deadline=5000)
    def test_property_competitive_judgment_consistency(self, simulation_engine, yes_price, description):
        """
        **Validates: Requirements 1.1, 1.2**
        Property: AI competitive judgments should always be valid and consistent.
        """
        no_price = 1.0 - yes_price
        creator = "0x" + "1" * 40
        
        result = simulation_engine.analyze_human_judgment(
            event_description=description,
            creator=creator,
            yes_price=yes_price,
            no_price=no_price
        )
        
        judgment = result["competitive_judgment"]
        
        # Property 1: Prices must sum to 1.0
        assert abs(judgment["yes_price"] + judgment["no_price"] - 1.0) < 0.001
        
        # Property 2: Prices must be within valid range
        assert 0.05 <= judgment["yes_price"] <= 0.95
        assert 0.05 <= judgment["no_price"] <= 0.95
        
        # Property 3: Confidence must be valid
        assert 0 <= judgment["confidence"] <= 1
        
        # Property 4: Description must be non-empty
        assert len(judgment["description"]) > 0
        
        # Property 5: Reasoning must be provided
        assert len(judgment["reasoning"]) > 0
    
    @given(
        volume=st.floats(min_value=0.1, max_value=100.0),
        participants=st.integers(min_value=1, max_value=50),
        volatility=st.floats(min_value=0.01, max_value=0.5),
    )
    @settings(max_examples=30, deadline=5000)
    def test_property_trend_analysis_bounds(self, simulation_engine, volume, participants, volatility):
        """
        **Validates: Requirements 2.1, 2.2**
        Property: Trend analysis should produce bounded and consistent results.
        """
        market_data = {
            "volume": volume,
            "participants": participants,
            "volatility": volatility,
            "momentum": 0.1,
        }
        
        result = simulation_engine.detect_trending_patterns(market_data)
        trend_analysis = result["trend_analysis"]
        
        # Property 1: Trend strength must be bounded
        assert 0 <= trend_analysis["trend_strength"] <= 1
        
        # Property 2: Confidence must be bounded
        assert 0 <= trend_analysis["confidence"] <= 1
        
        # Property 3: Recommended action must be valid
        valid_actions = ["create_derivative_market", "monitor_closely", "no_action"]
        assert trend_analysis["recommended_action"] in valid_actions
        
        # Property 4: Derivative predictions should be reasonable
        derivatives = result.get("derivative_predictions", [])
        assert len(derivatives) <= 5  # Reasonable limit
        
        for derivative in derivatives:
            assert 0 <= derivative["confidence"] <= 1
            assert len(derivative["description"]) > 0
    
    @given(
        confidence=st.floats(min_value=0.3, max_value=0.95),
        max_events=st.integers(min_value=1, max_value=10),
    )
    @settings(max_examples=20, deadline=5000)
    def test_property_hotspot_generation_limits(self, simulation_engine, confidence, max_events):
        """
        **Validates: Requirements 3.1, 3.2**
        Property: Hotspot event generation should respect limits and produce valid events.
        """
        events = simulation_engine.generate_external_hotspot_events(max_events=max_events)
        
        # Property 1: Should not exceed maximum events
        assert len(events) <= max_events
        
        # Property 2: All events should be valid
        for event in events:
            assert isinstance(event["description"], str)
            assert len(event["description"]) > 0
            assert 0 <= event["confidence"] <= 1
            assert event["urgency"] in ["high", "medium", "low"]
            assert isinstance(event["data_sources"], list)
            assert len(event["data_sources"]) > 0
        
        # Property 3: Events should have reasonable diversity
        if len(events) > 1:
            categories = [event["category"] for event in events]
            # Should not all be the same category (with high probability)
            assert len(set(categories)) >= 1


@pytest.mark.asyncio
class TestAsyncOperations:
    """Test asynchronous operations of the AI agent."""
    
    @pytest.fixture
    def mock_config(self):
        """Create mock configuration for async tests."""
        blockchain_config = BlockchainConfig(
            rpc_url="http://localhost:8545",
            private_key="0x" + "1" * 64,
            ceres_registry_address="0x" + "1" * 40,
            ceres_market_factory_address="0x" + "2" * 40,
            ceres_green_points_address="0x" + "3" * 40,
        )
        
        return AgentConfig(
            agent_mode="trend_analysis",  # Single mode for focused testing
            blockchain=blockchain_config,
            strategy=StrategyConfig(),
            monitoring=MonitoringConfig(enable_monitoring=False),
        )
    
    async def test_agent_start_stop_cycle(self, mock_config):
        """Test agent start and stop cycle."""
        with patch('ai_agent.core.intelligent_agent.BlockchainClient') as mock_blockchain_class:
            mock_blockchain = Mock()
            mock_blockchain.is_connected.return_value = True
            mock_blockchain.get_balance.return_value = 10.0
            mock_blockchain.account.address = "0x" + "a" * 40
            mock_blockchain_class.return_value = mock_blockchain
            
            agent = AIIntelligentAgent(mock_config)
            
            # Test that agent starts properly
            assert not agent.is_running
            
            # Start agent in background
            start_task = asyncio.create_task(agent.start())
            
            # Give it time to start
            await asyncio.sleep(0.1)
            
            # Should be running now
            assert agent.is_running
            assert agent.start_time is not None
            
            # Stop agent
            await agent.stop()
            
            # Should be stopped
            assert not agent.is_running
            
            # Cancel the start task
            start_task.cancel()
            try:
                await start_task
            except asyncio.CancelledError:
                pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])