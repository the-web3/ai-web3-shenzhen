"""Tests for enhanced trend analysis mode with orderbook market creation."""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

from ai_agent.modes.trend_analysis import TrendAnalysisMode
from ai_agent.orderbook.market_creator import OrderbookMarketCreator


class TestTrendAnalysisMode:
    """Test suite for enhanced trend analysis mode."""
    
    @pytest.fixture
    def mock_blockchain(self):
        """Mock blockchain client."""
        blockchain = Mock()
        blockchain.listen_for_judgment_events = Mock(return_value=[])
        blockchain.get_market_address = Mock(return_value=None)
        blockchain.submit_judgment_event = Mock(return_value="0x123...")
        return blockchain
    
    @pytest.fixture
    def mock_config(self):
        """Mock configuration."""
        config = Mock()
        config.trend_volume_threshold = 10.0
        config.trend_participant_threshold = 5
        config.trend_volatility_threshold = 0.1
        config.trend_time_window_hours = 24
        config.orderbook_order_layers = 5
        config.orderbook_base_order_size = 0.5
        config.orderbook_initial_spread_bps = 500
        config.orderbook_size_increment_factor = 1.2
        return config
    
    @pytest.fixture
    def trend_analysis_mode(self, mock_blockchain, mock_config):
        """Create trend analysis mode instance."""
        strategy_manager = Mock()
        return TrendAnalysisMode(mock_blockchain, strategy_manager, mock_config)
    
    def test_initialization(self, trend_analysis_mode):
        """Test proper initialization of trend analysis mode."""
        assert not trend_analysis_mode.is_running
        assert len(trend_analysis_mode.monitored_events) == 0
        assert len(trend_analysis_mode.created_derivatives) == 0
        assert isinstance(trend_analysis_mode.orderbook_creator, OrderbookMarketCreator)
        assert trend_analysis_mode.stats["events_monitored"] == 0
    
    @pytest.mark.asyncio
    async def test_update_monitored_events(self, trend_analysis_mode, mock_blockchain):
        """Test updating monitored events."""
        # Mock event data
        mock_event = {
            'args': {
                'eventId': b'test_event_id_123',
                'creator': '0x123...',
                'description': 'Test climate prediction event',
                'stakeAmount': 1000000000000000000,  # 1 HKTC in wei
            }
        }
        mock_blockchain.listen_for_judgment_events.return_value = [mock_event]
        
        await trend_analysis_mode._update_monitored_events()
        
        event_id = mock_event['args']['eventId'].hex()
        assert event_id in trend_analysis_mode.monitored_events
        assert trend_analysis_mode.stats["events_monitored"] == 1
    
    @pytest.mark.asyncio
    async def test_calculate_enhanced_metrics(self, trend_analysis_mode):
        """Test enhanced metrics calculation."""
        # Create test event info with volume history
        event_info = {
            'first_seen': datetime.now() - timedelta(hours=2),
            'volume_history': [
                {'timestamp': datetime.now() - timedelta(hours=2), 'yes_price': 0.5, 'volume': 5.0, 'participants': 3},
                {'timestamp': datetime.now() - timedelta(hours=1), 'yes_price': 0.6, 'volume': 8.0, 'participants': 5},
                {'timestamp': datetime.now(), 'yes_price': 0.65, 'volume': 12.0, 'participants': 7},
            ],
            'current_volume': 12.0,
            'participant_count': 7,
        }
        
        await trend_analysis_mode._calculate_enhanced_metrics(event_info)
        
        # Check that metrics were calculated
        assert 'volatility' in event_info
        assert 'momentum' in event_info
        assert 'price_trend' in event_info
        assert 'trend_score' in event_info
        
        # Volatility should be positive (price changed from 0.5 to 0.65)
        assert event_info['volatility'] > 0
        
        # Momentum should be positive (volume increased)
        assert event_info['momentum'] > 0
        
        # Price trend should be positive (price increased)
        assert event_info['price_trend'] > 0
    
    def test_comprehensive_trend_score_calculation(self, trend_analysis_mode):
        """Test comprehensive trend score calculation."""
        event_info = {
            'first_seen': datetime.now() - timedelta(hours=1),  # Recent event
            'current_volume': 15.0,  # Above threshold (10.0)
            'participant_count': 8,   # Above threshold (5)
            'volatility': 0.15,      # Above threshold (0.1)
            'momentum': 0.3,         # Positive momentum
        }
        
        score = trend_analysis_mode._calculate_comprehensive_trend_score(event_info)
        
        # Should be high score since all metrics are above thresholds
        assert score > 0.7
        assert score <= 1.0
    
    @pytest.mark.asyncio
    async def test_should_create_derivative_market(self, trend_analysis_mode):
        """Test derivative market creation decision logic."""
        # High-quality trending event
        event_info = {
            'first_seen': datetime.now() - timedelta(hours=2),  # Recent
            'current_volume': 20.0,     # High volume
            'participant_count': 10,    # High participation
            'volatility': 0.2,          # High volatility
            'momentum': 0.4,            # Strong momentum
            'trend_score': 0.85,        # High trend score
            'price_trend': 0.15,        # Significant price movement
        }
        
        should_create = await trend_analysis_mode._should_create_derivative_market("test_event", event_info)
        assert should_create
        
        # Low-quality event
        low_quality_event = {
            'first_seen': datetime.now() - timedelta(hours=50),  # Too old
            'current_volume': 2.0,      # Low volume
            'participant_count': 2,     # Low participation
            'volatility': 0.05,         # Low volatility
            'momentum': 0.0,            # No momentum
            'trend_score': 0.3,         # Low trend score
            'price_trend': 0.02,        # Minimal price movement
        }
        
        should_not_create = await trend_analysis_mode._should_create_derivative_market("test_event_2", low_quality_event)
        assert not should_not_create
    
    def test_generate_derivative_description(self, trend_analysis_mode):
        """Test derivative description generation."""
        original_desc = "Will the global temperature increase by 2°C by 2030?"
        volume = 25.0
        participants = 12
        
        event_info = {
            'volatility': 0.2,
            'momentum': 0.3,
            'price_trend': 0.1,
            'current_yes_price': 0.7,
        }
        
        description = trend_analysis_mode._generate_derivative_description(
            original_desc, volume, participants, event_info
        )
        
        assert isinstance(description, str)
        assert len(description) > 0
        assert "Will" in description  # Should be a prediction question
        
        # Should contain some reference to the analysis
        assert any(keyword in description.lower() for keyword in [
            'volume', 'participant', 'volatility', 'momentum', 'growth', 'trend'
        ])
    
    def test_calculate_derivative_parameters(self, trend_analysis_mode):
        """Test derivative parameter calculation."""
        event_info = {
            'trend_score': 0.8,
            'volatility': 0.15,
            'momentum': 0.25,
            'price_trend': 0.1,
            'current_yes_price': 0.6,
            'current_volume': 20.0,
            'first_seen': datetime.now() - timedelta(hours=2),
            'volume_history': [
                {'timestamp': datetime.now() - timedelta(hours=2), 'volume': 10.0},
                {'timestamp': datetime.now() - timedelta(hours=1), 'volume': 15.0},
                {'timestamp': datetime.now(), 'volume': 20.0},
            ],
            'event_data': {
                'resolutionTime': int((datetime.now() + timedelta(days=5)).timestamp())
            }
        }
        
        params = trend_analysis_mode._calculate_derivative_parameters(event_info)
        
        # Check required parameters
        assert 'yes_price' in params
        assert 'no_price' in params
        assert 'stake_amount' in params
        assert 'resolution_time' in params
        assert 'confidence' in params
        
        # Check parameter validity
        assert 0.15 <= params['yes_price'] <= 0.85
        assert abs(params['yes_price'] + params['no_price'] - 1.0) < 0.001
        assert 0.2 <= params['stake_amount'] <= 10.0
        assert 0.3 <= params['confidence'] <= 0.95
        assert params['resolution_time'] > int(datetime.now().timestamp())
    
    def test_calculate_prediction_confidence(self, trend_analysis_mode):
        """Test prediction confidence calculation."""
        # High confidence scenario
        high_confidence_event = {
            'trend_score': 0.9,
            'volume_history': [{'volume': i} for i in range(15)],  # 15 data points
            'volatility': 0.05,  # Low volatility = high consistency
            'momentum': 0.2,
            'first_seen': datetime.now() - timedelta(hours=1),  # Recent
        }
        
        confidence = trend_analysis_mode._calculate_prediction_confidence(high_confidence_event)
        assert confidence > 0.7
        
        # Low confidence scenario
        low_confidence_event = {
            'trend_score': 0.4,
            'volume_history': [{'volume': i} for i in range(3)],  # Only 3 data points
            'volatility': 0.3,   # High volatility = low consistency
            'momentum': 0.0,
            'first_seen': datetime.now() - timedelta(hours=40),  # Old
        }
        
        low_confidence = trend_analysis_mode._calculate_prediction_confidence(low_confidence_event)
        assert low_confidence < 0.6
    
    @pytest.mark.asyncio
    async def test_create_derivative_market_integration(self, trend_analysis_mode, mock_blockchain):
        """Test integration with orderbook market creator."""
        event_id = "test_event_123"
        event_info = {
            'event_data': {
                'description': 'Test climate prediction for derivative creation',
                'creator': '0x123...',
            },
            'first_seen': datetime.now() - timedelta(hours=1),
            'current_volume': 25.0,
            'participant_count': 12,
            'trend_score': 0.85,
            'volatility': 0.15,
            'momentum': 0.3,
            'price_trend': 0.1,
            'current_yes_price': 0.7,
            'volume_history': [
                {'timestamp': datetime.now() - timedelta(hours=1), 'volume': 20.0},
                {'timestamp': datetime.now(), 'volume': 25.0},
            ]
        }
        
        # Mock the orderbook creator
        with patch.object(trend_analysis_mode.orderbook_creator, 'create_orderbook_market', 
                         new_callable=AsyncMock) as mock_create:
            mock_create.return_value = "0xderivative_tx_hash"
            
            await trend_analysis_mode._create_derivative_market(event_id, event_info)
            
            # Verify orderbook creator was called
            mock_create.assert_called_once()
            call_args = mock_create.call_args
            
            # Check that proper parameters were passed
            assert 'event_description' in call_args.kwargs
            assert 'market_analysis' in call_args.kwargs
            assert 'derivative_params' in call_args.kwargs
            
            # Verify derivative was tracked
            assert event_id in trend_analysis_mode.created_derivatives
            assert trend_analysis_mode.stats["derivative_markets_created"] == 1
    
    @pytest.mark.asyncio
    async def test_get_detailed_status(self, trend_analysis_mode):
        """Test detailed status reporting."""
        # Add some mock events
        trend_analysis_mode.monitored_events = {
            'event1': {
                'event_data': {'description': 'Test event 1 for detailed status'},
                'trend_score': 0.8,
                'current_volume': 15.0,
                'participant_count': 8,
                'volatility': 0.12,
                'momentum': 0.25,
                'first_seen': datetime.now() - timedelta(hours=2),
            },
            'event2': {
                'event_data': {'description': 'Test event 2 for detailed status'},
                'trend_score': 0.6,
                'current_volume': 8.0,
                'participant_count': 4,
                'volatility': 0.08,
                'momentum': 0.1,
                'first_seen': datetime.now() - timedelta(hours=4),
            }
        }
        
        status = await trend_analysis_mode.get_detailed_status()
        
        # Check status structure
        assert 'mode' in status
        assert 'trending_events' in status
        assert 'configuration' in status
        assert 'performance_metrics' in status
        assert 'orderbook_creator' in status
        
        # Check trending events (should be sorted by trend score)
        trending_events = status['trending_events']
        assert len(trending_events) == 2
        assert trending_events[0]['trend_score'] >= trending_events[1]['trend_score']
    
    @pytest.mark.asyncio
    async def test_get_market_insights(self, trend_analysis_mode):
        """Test market insights generation."""
        event_id = "test_event_insights"
        event_info = {
            'event_data': {
                'description': 'Test event for market insights',
                'creator': '0x123...',
            },
            'first_seen': datetime.now() - timedelta(hours=3),
            'market_address': '0xmarket123...',
            'trend_score': 0.75,
            'current_volume': 18.0,
            'participant_count': 9,
            'volatility': 0.14,
            'momentum': 0.22,
            'price_trend': 0.08,
            'current_yes_price': 0.65,
            'volume_history': [
                {'timestamp': datetime.now() - timedelta(hours=3), 'volume': 10.0},
                {'timestamp': datetime.now() - timedelta(hours=2), 'volume': 14.0},
                {'timestamp': datetime.now() - timedelta(hours=1), 'volume': 16.0},
                {'timestamp': datetime.now(), 'volume': 18.0},
            ]
        }
        
        trend_analysis_mode.monitored_events[event_id] = event_info
        
        insights = await trend_analysis_mode.get_market_insights(event_id)
        
        # Check insights structure
        assert 'event_id' in insights
        assert 'basic_info' in insights
        assert 'current_metrics' in insights
        assert 'trend_analysis' in insights
        assert 'historical_data' in insights
        
        # Check trend analysis
        trend_analysis = insights['trend_analysis']
        assert 'is_trending' in trend_analysis
        assert 'derivative_eligible' in trend_analysis
        assert 'trend_strength' in trend_analysis
        assert 'dominant_signal' in trend_analysis
        
        # Should be trending with score 0.75
        assert trend_analysis['is_trending']
        assert trend_analysis['trend_strength'] in ['Strong', 'Very Strong']
    
    def test_categorize_trend_strength(self, trend_analysis_mode):
        """Test trend strength categorization."""
        assert trend_analysis_mode._categorize_trend_strength(0.9) == "Very Strong"
        assert trend_analysis_mode._categorize_trend_strength(0.7) == "Strong"
        assert trend_analysis_mode._categorize_trend_strength(0.5) == "Moderate"
        assert trend_analysis_mode._categorize_trend_strength(0.3) == "Weak"
        assert trend_analysis_mode._categorize_trend_strength(0.1) == "Very Weak"
    
    def test_identify_dominant_signal(self, trend_analysis_mode):
        """Test dominant signal identification."""
        # Volume-dominated event
        volume_event = {
            'current_volume': 50.0,      # 5x threshold
            'participant_count': 6,      # 1.2x threshold
            'volatility': 0.08,          # 0.8x threshold
            'momentum': 0.1,             # Low momentum
        }
        
        signal = trend_analysis_mode._identify_dominant_signal(volume_event)
        assert "Volume" in signal
        
        # Volatility-dominated event
        volatility_event = {
            'current_volume': 8.0,       # 0.8x threshold
            'participant_count': 4,      # 0.8x threshold
            'volatility': 0.25,          # 25x threshold
            'momentum': 0.05,            # Low momentum
        }
        
        signal = trend_analysis_mode._identify_dominant_signal(volatility_event)
        assert "Volatility" in signal


class TestOrderbookMarketCreator:
    """Test suite for orderbook market creator."""
    
    @pytest.fixture
    def mock_blockchain(self):
        """Mock blockchain client."""
        blockchain = Mock()
        blockchain.submit_judgment_event = Mock(return_value="0x456...")
        return blockchain
    
    @pytest.fixture
    def mock_config(self):
        """Mock configuration."""
        config = Mock()
        config.orderbook_order_layers = 5
        config.orderbook_base_order_size = 0.5
        config.orderbook_initial_spread_bps = 500
        config.orderbook_size_increment_factor = 1.2
        return config
    
    @pytest.fixture
    def orderbook_creator(self, mock_blockchain, mock_config):
        """Create orderbook market creator instance."""
        return OrderbookMarketCreator(mock_blockchain, mock_config)
    
    def test_initialization(self, orderbook_creator):
        """Test proper initialization."""
        assert len(orderbook_creator.created_markets) == 0
        assert len(orderbook_creator.active_orders) == 0
        assert orderbook_creator.stats["markets_created"] == 0
    
    @pytest.mark.asyncio
    async def test_create_orderbook_market(self, orderbook_creator, mock_blockchain):
        """Test orderbook market creation."""
        event_description = "Test derivative: Will climate event exceed predictions?"
        
        market_analysis = {
            'trend_score': 0.8,
            'volatility': 0.15,
            'momentum': 0.25,
            'confidence': 0.75,
            'dominant_signal': 'Strong Volume',
        }
        
        derivative_params = {
            'yes_price': 0.7,
            'no_price': 0.3,
            'stake_amount': 2.5,
            'resolution_time': int((datetime.now() + timedelta(days=2)).timestamp()),
            'confidence': 0.75,
        }
        
        tx_hash = await orderbook_creator.create_orderbook_market(
            event_description, market_analysis, derivative_params
        )
        
        assert tx_hash == "0x456..."
        assert orderbook_creator.stats["markets_created"] == 1
        assert len(orderbook_creator.created_markets) == 1
    
    def test_calculate_dynamic_spread(self, orderbook_creator):
        """Test dynamic spread calculation."""
        base_spread = 0.05  # 5%
        
        # Low volatility, high confidence scenario
        spread1 = orderbook_creator._calculate_dynamic_spread(
            base_spread, volatility_factor=0.05, confidence=0.9, trend_strength=0.8
        )
        assert spread1 < base_spread  # Should be tighter
        
        # High volatility, low confidence scenario
        spread2 = orderbook_creator._calculate_dynamic_spread(
            base_spread, volatility_factor=0.3, confidence=0.4, trend_strength=0.3
        )
        assert spread2 > base_spread  # Should be wider
        
        # Ensure spreads are within bounds
        assert 0.01 <= spread1 <= 0.1
        assert 0.01 <= spread2 <= 0.1
    
    @pytest.mark.asyncio
    async def test_generate_sophisticated_orderbook(self, orderbook_creator):
        """Test sophisticated orderbook generation."""
        derivative_params = {
            'yes_price': 0.65,
            'confidence': 0.8,
            'trend_strength': 0.75,
            'volatility_factor': 0.12,
        }
        
        market_analysis = {
            'momentum': 0.2,
            'volatility': 0.12,
        }
        
        orders = await orderbook_creator._generate_sophisticated_orderbook(
            derivative_params, market_analysis
        )
        
        assert len(orders) > 0
        
        # Check order structure
        for order in orders:
            assert 'side' in order
            assert 'price' in order
            assert 'size' in order
            assert 'is_yes' in order
            assert 'order_type' in order
            assert 'strategy' in order
            
            # Check price bounds
            assert 0.01 <= order['price'] <= 0.99
            assert order['size'] > 0
    
    def test_get_market_stats(self, orderbook_creator):
        """Test market statistics retrieval."""
        # Add some mock data
        orderbook_creator.stats["markets_created"] = 3
        orderbook_creator.stats["total_orders_placed"] = 45
        orderbook_creator.stats["successful_trades"] = 40
        
        orderbook_creator.created_markets["market1"] = {
            'description': 'Test market 1',
            'created_at': datetime.now(),
            'status': 'created',
            'derivative_params': {'stake_amount': 1.5}
        }
        
        orderbook_creator.active_orders["market1"] = [{'order': 'data'}] * 8
        
        stats = orderbook_creator.get_market_stats()
        
        assert stats['overall_stats']['markets_created'] == 3
        assert stats['active_markets'] == 1
        assert stats['total_active_orders'] == 8
        assert 'market_breakdown' in stats
    
    @pytest.mark.asyncio
    async def test_health_check(self, orderbook_creator):
        """Test health check functionality."""
        health = await orderbook_creator.health_check()
        
        assert health['status'] == 'healthy'
        assert 'message' in health
        assert 'markets_created' in health
        assert 'success_rate' in health
        assert 'last_activity' in health


if __name__ == "__main__":
    pytest.main([__file__, "-v"])