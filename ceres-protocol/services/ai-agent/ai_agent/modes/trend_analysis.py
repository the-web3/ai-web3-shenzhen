"""Trend Analysis Mode - Orderbook-based derivative markets from internal trends."""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..orderbook.market_creator import OrderbookMarketCreator

logger = logging.getLogger(__name__)


class TrendAnalysisMode:
    """
    Mode 2: Internal Trend Analysis (Orderbook Mode)
    
    Monitors existing events for trading volume, user engagement, and price volatility.
    Creates derivative prediction markets using orderbook liquidity when trends are detected.
    """
    
    def __init__(self, blockchain, strategy_manager, config):
        """Initialize trend analysis mode."""
        self.blockchain = blockchain
        self.strategy_manager = strategy_manager
        self.config = config
        
        # Initialize orderbook market creator
        self.orderbook_creator = OrderbookMarketCreator(blockchain, config)
        
        self.is_running = False
        self.monitored_events = {}  # event_id -> event_data
        self.created_derivatives = set()
        self.stats = {
            "events_monitored": 0,
            "trends_detected": 0,
            "derivative_markets_created": 0,
            "total_derivative_volume": 0.0,
        }
        
        logger.info("Trend Analysis Mode initialized with advanced orderbook creator")
    
    async def run(self) -> None:
        """Main run loop for trend analysis mode."""
        self.is_running = True
        logger.info("Starting Trend Analysis Mode")
        
        while self.is_running:
            try:
                await self._update_monitored_events()
                await self._analyze_trends()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Error in trend analysis mode: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    async def stop(self) -> None:
        """Stop the trend analysis mode."""
        self.is_running = False
        logger.info("Stopping Trend Analysis Mode")
    
    async def _update_monitored_events(self) -> None:
        """Update the list of events being monitored for trends."""
        try:
            # Get recent events from the blockchain
            # In a real implementation, this would query the registry for recent events
            # For now, we'll simulate this functionality
            
            # Listen for new events
            events = self.blockchain.listen_for_judgment_events()
            
            for event in events:
                event_id = event['args']['eventId'].hex()
                
                if event_id not in self.monitored_events:
                    self.monitored_events[event_id] = {
                        'event_data': event['args'],
                        'first_seen': datetime.now(),
                        'market_address': None,
                        'volume_history': [],
                        'participant_count': 0,
                        'price_history': [],
                        'volatility': 0.0,
                        'trend_score': 0.0,
                    }
                    self.stats["events_monitored"] += 1
                    logger.info(f"Now monitoring event for trends: {event_id}")
            
            # Update market data for monitored events
            await self._update_market_data()
            
        except Exception as e:
            logger.error(f"Error updating monitored events: {e}", exc_info=True)
    
    async def _update_market_data(self) -> None:
        """Update market data for monitored events."""
        for event_id, event_info in self.monitored_events.items():
            try:
                # Get market address if not already known
                if event_info['market_address'] is None:
                    market_address = self.blockchain.get_market_address(event_id)
                    if market_address and market_address != '0x0000000000000000000000000000000000000000':
                        event_info['market_address'] = market_address
                        logger.info(f"Found market for event {event_id}: {market_address}")
                
                # Update market statistics
                if event_info['market_address']:
                    await self._update_market_statistics(event_id, event_info)
                    
            except Exception as e:
                logger.error(f"Error updating market data for {event_id}: {e}", exc_info=True)
    
    async def _update_market_statistics(self, event_id: str, event_info: Dict[str, Any]) -> None:
        """Update statistics for a specific market with enhanced monitoring."""
        try:
            market_address = event_info['market_address']
            current_time = datetime.now()
            
            # Get real market data if market exists
            if market_address:
                market_data = await self._fetch_market_data(market_address)
                if market_data:
                    # Update with real data
                    event_info['current_volume'] = market_data.get('totalVolume', 0)
                    event_info['current_yes_price'] = market_data.get('yesPrice', 0.5)
                    event_info['current_no_price'] = market_data.get('noPrice', 0.5)
                    event_info['total_yes_shares'] = market_data.get('totalYesShares', 0)
                    event_info['total_no_shares'] = market_data.get('totalNoShares', 0)
                    event_info['participant_count'] = market_data.get('uniqueTraders', 0)
                else:
                    # Fall back to simulation if real data unavailable
                    await self._simulate_market_data(event_id, event_info, current_time)
            else:
                # Simulate data for events without markets yet
                await self._simulate_market_data(event_id, event_info, current_time)
            
            # Update volume history
            event_info['volume_history'].append({
                'timestamp': current_time,
                'volume': event_info.get('current_volume', 0),
                'yes_price': event_info.get('current_yes_price', 0.5),
                'no_price': event_info.get('current_no_price', 0.5),
                'participants': event_info.get('participant_count', 0)
            })
            
            # Keep only recent history (configurable window)
            cutoff_time = current_time - timedelta(hours=self.config.trend_time_window_hours)
            event_info['volume_history'] = [
                entry for entry in event_info['volume_history']
                if entry['timestamp'] > cutoff_time
            ]
            
            # Calculate enhanced metrics
            await self._calculate_enhanced_metrics(event_info)
            
        except Exception as e:
            logger.error(f"Error updating market statistics for {event_id}: {e}", exc_info=True)
    
    async def _fetch_market_data(self, market_address: str) -> Optional[Dict[str, Any]]:
        """Fetch real market data from blockchain."""
        try:
            # In a real implementation, this would query the market contract
            # For now, return None to fall back to simulation
            return None
        except Exception as e:
            logger.error(f"Error fetching market data for {market_address}: {e}")
            return None
    
    async def _simulate_market_data(self, event_id: str, event_info: Dict[str, Any], current_time: datetime) -> None:
        """Simulate market data for testing and development."""
        time_since_creation = (current_time - event_info['first_seen']).total_seconds() / 3600  # hours
        
        # Simulate realistic market evolution
        import random
        
        # Volume grows with time but with diminishing returns
        base_volume = min(100.0, time_since_creation * 2.5)
        volume_multiplier = random.uniform(0.7, 1.8)  # Market-specific volatility
        simulated_volume = base_volume * volume_multiplier
        
        # Participants grow more slowly than volume
        base_participants = min(25, int(time_since_creation * 0.8))
        participant_variance = random.uniform(0.6, 1.4)
        simulated_participants = max(1, int(base_participants * participant_variance))
        
        # Price evolution - starts at creator's initial bias, moves toward market consensus
        initial_yes_bias = event_info['event_data'].get('yesPrice', 0.5) / 1e18 if 'event_data' in event_info else 0.5
        
        # Price drifts over time with some randomness
        time_factor = min(1.0, time_since_creation / 48)  # Normalize over 48 hours
        price_drift = random.uniform(-0.1, 0.1) * time_factor
        current_yes_price = max(0.05, min(0.95, initial_yes_bias + price_drift))
        current_no_price = 1.0 - current_yes_price
        
        # Simulate share distribution
        total_shares = simulated_volume * 2  # Rough approximation
        yes_share_ratio = current_yes_price
        simulated_yes_shares = total_shares * yes_share_ratio
        simulated_no_shares = total_shares * (1 - yes_share_ratio)
        
        # Update event info
        event_info['current_volume'] = simulated_volume
        event_info['current_yes_price'] = current_yes_price
        event_info['current_no_price'] = current_no_price
        event_info['total_yes_shares'] = simulated_yes_shares
        event_info['total_no_shares'] = simulated_no_shares
        event_info['participant_count'] = simulated_participants
    
    async def _calculate_enhanced_metrics(self, event_info: Dict[str, Any]) -> None:
        """Calculate enhanced trend analysis metrics."""
        if len(event_info['volume_history']) < 2:
            event_info['volatility'] = 0.0
            event_info['momentum'] = 0.0
            event_info['price_trend'] = 0.0
            event_info['trend_score'] = 0.0
            return
        
        # Calculate price volatility
        prices = [entry['yes_price'] for entry in event_info['volume_history']]
        if len(prices) > 1:
            price_changes = [abs(prices[i] - prices[i-1]) for i in range(1, len(prices))]
            event_info['volatility'] = sum(price_changes) / len(price_changes)
        else:
            event_info['volatility'] = 0.0
        
        # Calculate volume momentum (recent vs older volume)
        recent_entries = event_info['volume_history'][-3:]  # Last 3 entries
        older_entries = event_info['volume_history'][:-3] if len(event_info['volume_history']) > 3 else []
        
        if recent_entries and older_entries:
            recent_avg_volume = sum(entry['volume'] for entry in recent_entries) / len(recent_entries)
            older_avg_volume = sum(entry['volume'] for entry in older_entries) / len(older_entries)
            event_info['momentum'] = (recent_avg_volume - older_avg_volume) / max(older_avg_volume, 1.0)
        else:
            event_info['momentum'] = 0.0
        
        # Calculate price trend direction
        if len(prices) >= 5:
            early_prices = prices[:len(prices)//2]
            late_prices = prices[len(prices)//2:]
            early_avg = sum(early_prices) / len(early_prices)
            late_avg = sum(late_prices) / len(late_prices)
            event_info['price_trend'] = late_avg - early_avg
        else:
            event_info['price_trend'] = 0.0
        
        # Calculate comprehensive trend score
        event_info['trend_score'] = self._calculate_comprehensive_trend_score(event_info)
    
    def _calculate_comprehensive_trend_score(self, event_info: Dict[str, Any]) -> float:
        """Calculate a comprehensive trend score using multiple metrics."""
        score = 0.0
        
        # Volume component (30% weight)
        recent_volume = event_info.get('current_volume', 0)
        if recent_volume >= self.config.trend_volume_threshold:
            volume_score = min(1.0, recent_volume / (self.config.trend_volume_threshold * 2))
            score += 0.3 * volume_score
        
        # Participant component (25% weight)
        participant_count = event_info.get('participant_count', 0)
        if participant_count >= self.config.trend_participant_threshold:
            participant_score = min(1.0, participant_count / (self.config.trend_participant_threshold * 2))
            score += 0.25 * participant_score
        
        # Volatility component (20% weight) - higher volatility = more interesting
        volatility = event_info.get('volatility', 0)
        if volatility >= self.config.trend_volatility_threshold:
            volatility_score = min(1.0, volatility / (self.config.trend_volatility_threshold * 2))
            score += 0.2 * volatility_score
        
        # Momentum component (15% weight) - positive momentum is good
        momentum = event_info.get('momentum', 0)
        if momentum > 0:
            momentum_score = min(1.0, momentum / 0.5)  # Cap at 50% growth
            score += 0.15 * momentum_score
        
        # Time remaining component (10% weight) - more time = better for derivatives
        time_since_creation = (datetime.now() - event_info['first_seen']).total_seconds() / 3600
        resolution_hours = 72  # Assume 72 hour resolution window
        time_remaining = max(0, resolution_hours - time_since_creation)
        if time_remaining > 24:  # At least 24 hours remaining
            time_score = min(1.0, time_remaining / 48)  # Optimal at 48+ hours remaining
            score += 0.1 * time_score
        
        return min(1.0, score)  # Cap at 1.0
    
    def _calculate_trend_score(self, event_info: Dict[str, Any]) -> float:
        """Legacy trend score calculation for backward compatibility."""
        return self._calculate_comprehensive_trend_score(event_info)
    
    async def _analyze_trends(self) -> None:
        """Analyze monitored events for trending patterns."""
        try:
            trending_events = []
            
            for event_id, event_info in self.monitored_events.items():
                if event_info['trend_score'] >= 0.7:  # High trend score threshold
                    trending_events.append((event_id, event_info))
            
            logger.info(f"Found {len(trending_events)} trending events")
            
            for event_id, event_info in trending_events:
                if await self._should_create_derivative_market(event_id, event_info):
                    await self._create_derivative_market(event_id, event_info)
                    
        except Exception as e:
            logger.error(f"Error analyzing trends: {e}", exc_info=True)
    
    async def _should_create_derivative_market(self, event_id: str, event_info: Dict[str, Any]) -> bool:
        """Enhanced logic to determine if a derivative market should be created."""
        
        # Don't create duplicate derivatives
        if event_id in self.created_derivatives:
            return False
        
        # Check if event is still active (not resolved)
        time_since_creation = (datetime.now() - event_info['first_seen']).total_seconds() / 3600
        if time_since_creation > 48:  # Don't create derivatives for events older than 48 hours
            return False
        
        # Enhanced trend criteria with weighted scoring
        recent_volume = event_info.get('current_volume', 0)
        participant_count = event_info.get('participant_count', 0)
        volatility = event_info.get('volatility', 0)
        momentum = event_info.get('momentum', 0)
        trend_score = event_info.get('trend_score', 0)
        
        # Primary criteria (must meet at least 2 of 3)
        primary_criteria = {
            'volume': recent_volume > self.config.trend_volume_threshold,
            'participants': participant_count > self.config.trend_participant_threshold,
            'volatility': volatility > self.config.trend_volatility_threshold,
        }
        
        # Secondary criteria (bonus factors)
        secondary_criteria = {
            'high_momentum': momentum > 0.2,  # 20% volume growth
            'high_trend_score': trend_score > 0.7,
            'sufficient_time': time_since_creation < 24,  # Created within last 24 hours
            'price_movement': abs(event_info.get('price_trend', 0)) > 0.1,  # Significant price movement
        }
        
        # Must meet at least 2 primary criteria
        primary_score = sum(primary_criteria.values())
        if primary_score < 2:
            return False
        
        # Bonus from secondary criteria
        secondary_score = sum(secondary_criteria.values())
        
        # Final decision: high primary score OR good primary + secondary combination
        if primary_score >= 3:  # All primary criteria met
            return True
        elif primary_score >= 2 and secondary_score >= 2:  # Good combination
            return True
        
        return False
    
    async def _create_derivative_market(self, event_id: str, event_info: Dict[str, Any]) -> None:
        """Create a sophisticated derivative market using the advanced orderbook creator."""
        try:
            original_description = event_info['event_data']['description']
            recent_volume = event_info.get('current_volume', 0)
            participant_count = event_info.get('participant_count', 0)
            
            # Generate derivative event description with enhanced analysis
            derivative_description = self._generate_derivative_description(
                original_description, recent_volume, participant_count, event_info
            )
            
            # Calculate derivative market parameters with advanced analysis
            derivative_params = self._calculate_derivative_parameters(event_info)
            
            # Prepare market analysis data for orderbook creator
            market_analysis = {
                'trend_score': event_info.get('trend_score', 0.5),
                'volatility': event_info.get('volatility', 0),
                'momentum': event_info.get('momentum', 0),
                'price_trend': event_info.get('price_trend', 0),
                'confidence': derivative_params.get('confidence', 0.7),
                'dominant_signal': self._identify_dominant_signal(event_info),
                'original_event_id': event_id,
                'participant_count': participant_count,
                'volume_history': event_info.get('volume_history', []),
            }
            
            # Create sophisticated orderbook market
            tx_hash = await self.orderbook_creator.create_orderbook_market(
                event_description=derivative_description,
                market_analysis=market_analysis,
                derivative_params=derivative_params
            )
            
            if tx_hash:
                self.created_derivatives.add(event_id)
                self.stats["derivative_markets_created"] += 1
                self.stats["trends_detected"] += 1
                self.stats["total_derivative_volume"] += derivative_params['stake_amount']
                
                logger.info(
                    f"Created sophisticated derivative market for trending event {event_id}: "
                    f"{derivative_description[:50]}... (tx: {tx_hash})"
                )
                
                # Store additional tracking information
                event_info['derivative_tx_hash'] = tx_hash
                event_info['derivative_created_at'] = datetime.now()
                event_info['derivative_description'] = derivative_description
            
        except Exception as e:
            logger.error(f"Error creating derivative market: {e}", exc_info=True)
    
    def _generate_derivative_description(
        self, original_description: str, volume: float, participants: int, event_info: Dict[str, Any]
    ) -> str:
        """Generate sophisticated description for derivative market based on trend analysis."""
        
        # Extract key metrics for description generation
        volatility = event_info.get('volatility', 0)
        momentum = event_info.get('momentum', 0)
        price_trend = event_info.get('price_trend', 0)
        current_yes_price = event_info.get('current_yes_price', 0.5)
        
        # Truncate original description for readability
        short_desc = original_description[:80] + "..." if len(original_description) > 80 else original_description
        
        # Generate different types of derivative predictions based on dominant trend signals
        derivative_types = []
        
        # Volume-based derivatives
        if volume > self.config.trend_volume_threshold * 1.5:
            target_volume = volume * 1.8
            derivative_types.append(
                f"High-volume prediction: Will '{short_desc}' exceed {target_volume:.1f} HKTC total volume?"
            )
        
        # Participation-based derivatives
        if participants > self.config.trend_participant_threshold:
            target_participants = participants + 8
            derivative_types.append(
                f"Community engagement: Will '{short_desc}' attract more than {target_participants} unique traders?"
            )
        
        # Volatility-based derivatives
        if volatility > self.config.trend_volatility_threshold:
            derivative_types.append(
                f"Price volatility prediction: Will '{short_desc}' experience >25% price swings from current levels?"
            )
        
        # Momentum-based derivatives
        if momentum > 0.2:
            derivative_types.append(
                f"Growth momentum: Will '{short_desc}' maintain >30% volume growth in the next 12 hours?"
            )
        
        # Price trend derivatives
        if abs(price_trend) > 0.1:
            direction = "upward" if price_trend > 0 else "downward"
            target_price = current_yes_price + (0.15 if price_trend > 0 else -0.15)
            target_price = max(0.05, min(0.95, target_price))
            derivative_types.append(
                f"Price direction: Will '{short_desc}' continue its {direction} trend to reach {target_price:.2f} YES price?"
            )
        
        # Time-based derivatives
        derivative_types.append(
            f"Resolution timing: Will '{short_desc}' be resolved within the next 24 hours?"
        )
        
        # Market efficiency derivatives
        if participants > 10 and volatility < 0.05:
            derivative_types.append(
                f"Market efficiency: Will '{short_desc}' maintain price stability (< 5% volatility) for 6+ hours?"
            )
        
        # Select the most appropriate derivative type based on strongest signal
        if not derivative_types:
            # Fallback generic derivative
            return f"Meta-prediction: Will '{short_desc}' outperform average market metrics?"
        
        # Choose derivative type based on strongest trend signal
        if momentum > 0.3:
            # High momentum - focus on growth predictions
            growth_derivatives = [d for d in derivative_types if "growth" in d.lower() or "exceed" in d.lower()]
            if growth_derivatives:
                return growth_derivatives[0]
        
        if volatility > self.config.trend_volatility_threshold * 2:
            # High volatility - focus on price movement predictions
            volatility_derivatives = [d for d in derivative_types if "volatility" in d.lower() or "swing" in d.lower()]
            if volatility_derivatives:
                return volatility_derivatives[0]
        
        # Default to first available derivative type
        return derivative_types[0]
    
    def _calculate_derivative_parameters(self, event_info: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate sophisticated parameters for derivative market based on trend analysis."""
        
        # Extract trend metrics
        trend_score = event_info.get('trend_score', 0.5)
        volatility = event_info.get('volatility', 0)
        momentum = event_info.get('momentum', 0)
        price_trend = event_info.get('price_trend', 0)
        current_yes_price = event_info.get('current_yes_price', 0.5)
        current_volume = event_info.get('current_volume', 0)
        
        # Calculate confidence based on multiple factors
        confidence = self._calculate_prediction_confidence(event_info)
        
        # Determine YES price based on trend analysis
        yes_price = self._calculate_derivative_yes_price(
            trend_score, volatility, momentum, price_trend, current_yes_price, confidence
        )
        no_price = 1.0 - yes_price
        
        # Calculate stake amount based on original event activity
        stake_amount = self._calculate_derivative_stake_amount(current_volume, trend_score, confidence)
        
        # Calculate resolution time based on derivative type and trend urgency
        resolution_time = self._calculate_derivative_resolution_time(event_info, trend_score)
        
        return {
            'yes_price': yes_price,
            'no_price': no_price,
            'stake_amount': stake_amount,
            'resolution_time': resolution_time,
            'confidence': confidence,
            'trend_strength': trend_score,
            'volatility_factor': volatility,
            'momentum_factor': momentum,
        }
    
    def _calculate_prediction_confidence(self, event_info: Dict[str, Any]) -> float:
        """Calculate AI confidence in the derivative prediction."""
        confidence_factors = []
        
        # Trend score factor (higher trend = higher confidence)
        trend_score = event_info.get('trend_score', 0.5)
        confidence_factors.append(trend_score)
        
        # Data quality factor (more data points = higher confidence)
        data_points = len(event_info.get('volume_history', []))
        data_quality = min(1.0, data_points / 10)  # Optimal at 10+ data points
        confidence_factors.append(data_quality)
        
        # Consistency factor (consistent trends = higher confidence)
        momentum = event_info.get('momentum', 0)
        volatility = event_info.get('volatility', 0)
        if volatility > 0:
            consistency = max(0, 1 - (volatility / 0.3))  # Lower volatility = more consistent
        else:
            consistency = 0.8  # Default consistency
        confidence_factors.append(consistency)
        
        # Time factor (recent events = higher confidence)
        time_since_creation = (datetime.now() - event_info['first_seen']).total_seconds() / 3600
        time_factor = max(0.3, 1 - (time_since_creation / 48))  # Decay over 48 hours
        confidence_factors.append(time_factor)
        
        # Calculate weighted average confidence
        weights = [0.4, 0.2, 0.2, 0.2]  # Trend score has highest weight
        confidence = sum(f * w for f, w in zip(confidence_factors, weights))
        
        return max(0.3, min(0.95, confidence))  # Clamp between 30% and 95%
    
    def _calculate_derivative_yes_price(self, trend_score: float, volatility: float, 
                                       momentum: float, price_trend: float, 
                                       current_yes_price: float, confidence: float) -> float:
        """Calculate YES price for derivative market based on trend analysis."""
        
        # Start with neutral price
        base_price = 0.5
        
        # Adjust based on trend strength
        trend_adjustment = (trend_score - 0.5) * 0.3  # ±15% max adjustment
        
        # Adjust based on momentum (positive momentum = higher YES price)
        momentum_adjustment = momentum * 0.2  # Up to 20% adjustment
        
        # Adjust based on price trend direction
        price_trend_adjustment = price_trend * 0.15  # Up to 15% adjustment
        
        # Adjust based on confidence (higher confidence = more extreme prices)
        confidence_multiplier = 0.5 + confidence * 0.5  # 0.5 to 1.0 multiplier
        
        # Calculate final price
        total_adjustment = (trend_adjustment + momentum_adjustment + price_trend_adjustment) * confidence_multiplier
        yes_price = base_price + total_adjustment
        
        # Ensure price is within reasonable bounds
        return max(0.15, min(0.85, yes_price))
    
    def _calculate_derivative_stake_amount(self, current_volume: float, trend_score: float, confidence: float) -> float:
        """Calculate stake amount for derivative market."""
        
        # Base stake amount
        base_stake = self.config.orderbook_base_order_size
        
        # Scale based on original market volume (but cap it)
        volume_factor = min(3.0, max(0.5, current_volume / 10))  # Scale based on volume
        
        # Scale based on trend strength
        trend_factor = 0.5 + trend_score  # 0.5 to 1.5 multiplier
        
        # Scale based on confidence
        confidence_factor = 0.7 + confidence * 0.6  # 0.7 to 1.3 multiplier
        
        # Calculate final stake
        stake_amount = base_stake * volume_factor * trend_factor * confidence_factor
        
        # Ensure stake is within reasonable bounds
        return max(0.2, min(10.0, stake_amount))  # 0.2 to 10 HKTC
    
    def _calculate_derivative_resolution_time(self, event_info: Dict[str, Any], trend_score: float) -> int:
        """Calculate resolution time for derivative market."""
        
        # Get original event resolution time
        original_resolution = event_info['event_data'].get('resolutionTime', 0)
        current_time = int(datetime.now().timestamp())
        
        # Derivative should resolve before or at the same time as original
        max_resolution = min(
            original_resolution,
            current_time + 7 * 24 * 3600  # Max 7 days from now
        )
        
        # Adjust based on trend urgency (higher trend = shorter resolution)
        if trend_score > 0.8:
            # High trend - resolve quickly to capture momentum
            resolution_hours = 24  # 1 day
        elif trend_score > 0.6:
            # Medium trend - moderate resolution time
            resolution_hours = 48  # 2 days
        else:
            # Low trend - longer resolution time
            resolution_hours = 72  # 3 days
        
        derivative_resolution = current_time + resolution_hours * 3600
        
        return min(derivative_resolution, max_resolution)
    
    async def get_detailed_status(self) -> Dict[str, Any]:
        """Get detailed status including trend analysis metrics."""
        basic_status = self.get_status()
        
        # Add detailed trend analysis
        trending_events = []
        for event_id, event_info in self.monitored_events.items():
            if event_info['trend_score'] > 0.5:  # Only include trending events
                trending_events.append({
                    'event_id': event_id,
                    'description': event_info['event_data']['description'][:100] + "...",
                    'trend_score': round(event_info['trend_score'], 3),
                    'current_volume': round(event_info.get('current_volume', 0), 2),
                    'participant_count': event_info.get('participant_count', 0),
                    'volatility': round(event_info.get('volatility', 0), 4),
                    'momentum': round(event_info.get('momentum', 0), 3),
                    'hours_since_creation': round(
                        (datetime.now() - event_info['first_seen']).total_seconds() / 3600, 1
                    ),
                    'derivative_created': event_id in self.created_derivatives,
                })
        
        # Sort by trend score
        trending_events.sort(key=lambda x: x['trend_score'], reverse=True)
        
        # Add configuration info
        config_info = {
            'volume_threshold': self.config.trend_volume_threshold,
            'participant_threshold': self.config.trend_participant_threshold,
            'volatility_threshold': self.config.trend_volatility_threshold,
            'time_window_hours': self.config.trend_time_window_hours,
            'orderbook_layers': self.config.orderbook_order_layers,
            'base_order_size': self.config.orderbook_base_order_size,
        }
        
        # Add orderbook creator statistics
        orderbook_stats = self.orderbook_creator.get_market_stats()
        
        return {
            **basic_status,
            'trending_events': trending_events[:10],  # Top 10 trending events
            'configuration': config_info,
            'performance_metrics': {
                'avg_trend_score': self._calculate_average_trend_score(),
                'derivative_success_rate': self._calculate_derivative_success_rate(),
                'total_derivative_volume': self.stats["total_derivative_volume"],
            },
            'orderbook_creator': orderbook_stats,
        }
    
    def _calculate_average_trend_score(self) -> float:
        """Calculate average trend score across all monitored events."""
        if not self.monitored_events:
            return 0.0
        
        total_score = sum(event_info.get('trend_score', 0) for event_info in self.monitored_events.values())
        return total_score / len(self.monitored_events)
    
    def _calculate_derivative_success_rate(self) -> float:
        """Calculate success rate of derivative market creation."""
        if self.stats["trends_detected"] == 0:
            return 0.0
        
        return self.stats["derivative_markets_created"] / self.stats["trends_detected"]
    
    async def get_market_insights(self, event_id: str) -> Dict[str, Any]:
        """Get detailed insights for a specific market."""
        if event_id not in self.monitored_events:
            return {"error": "Event not monitored"}
        
        event_info = self.monitored_events[event_id]
        
        # Calculate trend analysis insights
        insights = {
            'event_id': event_id,
            'basic_info': {
                'description': event_info['event_data']['description'],
                'creator': event_info['event_data']['creator'],
                'created_at': event_info['first_seen'].isoformat(),
                'market_address': event_info.get('market_address'),
            },
            'current_metrics': {
                'trend_score': event_info.get('trend_score', 0),
                'volume': event_info.get('current_volume', 0),
                'participants': event_info.get('participant_count', 0),
                'volatility': event_info.get('volatility', 0),
                'momentum': event_info.get('momentum', 0),
                'price_trend': event_info.get('price_trend', 0),
                'current_yes_price': event_info.get('current_yes_price', 0.5),
            },
            'trend_analysis': {
                'is_trending': event_info.get('trend_score', 0) > 0.7,
                'derivative_eligible': await self._should_create_derivative_market(event_id, event_info),
                'derivative_created': event_id in self.created_derivatives,
                'trend_strength': self._categorize_trend_strength(event_info.get('trend_score', 0)),
                'dominant_signal': self._identify_dominant_signal(event_info),
            },
            'historical_data': {
                'volume_history': event_info.get('volume_history', [])[-10:],  # Last 10 data points
                'data_points': len(event_info.get('volume_history', [])),
            }
        }
        
        return insights
    
    def _categorize_trend_strength(self, trend_score: float) -> str:
        """Categorize trend strength based on score."""
        if trend_score >= 0.8:
            return "Very Strong"
        elif trend_score >= 0.6:
            return "Strong"
        elif trend_score >= 0.4:
            return "Moderate"
        elif trend_score >= 0.2:
            return "Weak"
        else:
            return "Very Weak"
    
    def _identify_dominant_signal(self, event_info: Dict[str, Any]) -> str:
        """Identify the dominant trend signal for an event."""
        signals = {
            'volume': event_info.get('current_volume', 0) / max(self.config.trend_volume_threshold, 1),
            'participants': event_info.get('participant_count', 0) / max(self.config.trend_participant_threshold, 1),
            'volatility': event_info.get('volatility', 0) / max(self.config.trend_volatility_threshold, 0.01),
            'momentum': abs(event_info.get('momentum', 0)) / 0.3,  # Normalize to 30% momentum
        }
        
        # Find the strongest signal
        dominant_signal = max(signals.items(), key=lambda x: x[1])
        
        if dominant_signal[1] > 1.5:
            return f"Strong {dominant_signal[0].title()}"
        elif dominant_signal[1] > 1.0:
            return f"Moderate {dominant_signal[0].title()}"
        else:
            return "No Dominant Signal"
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of trend analysis mode."""
        return {
            "mode": "trend_analysis",
            "is_running": self.is_running,
            "statistics": self.stats.copy(),
            "monitored_events_count": len(self.monitored_events),
            "derivative_markets_count": len(self.created_derivatives),
        }
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check for trend analysis mode."""
        return {
            "status": "healthy" if self.is_running else "stopped",
            "message": "Trend analysis mode is operating normally",
            "monitored_events": len(self.monitored_events),
            "last_activity": datetime.now().isoformat(),
        }