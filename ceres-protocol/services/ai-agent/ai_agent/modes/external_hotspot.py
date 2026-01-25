"""External Hotspot Mode - Orderbook-based markets from external data sources."""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..orderbook.market_creator import OrderbookMarketCreator

logger = logging.getLogger(__name__)


class ExternalHotspotMode:
    """
    Mode 3: External Hotspot Capture (Orderbook Mode)
    
    Monitors external data sources for climate-related hotspot events and creates
    orderbook-based prediction markets with AI-generated liquidity.
    """
    
    def __init__(self, blockchain, strategy_manager, config, external_data_config):
        """Initialize external hotspot mode."""
        self.blockchain = blockchain
        self.strategy_manager = strategy_manager
        self.config = config
        self.external_data_config = external_data_config
        
        # Initialize orderbook market creator
        self.orderbook_creator = OrderbookMarketCreator(blockchain, config)
        
        self.is_running = False
        self.daily_event_count = 0
        self.last_reset_date = datetime.now().date()
        self.created_hotspot_events = set()
        
        self.stats = {
            "hotspots_detected": 0,
            "hotspot_markets_created": 0,
            "total_hotspot_stake": 0.0,
            "successful_hotspot_creations": 0,
            "failed_hotspot_creations": 0,
            "data_source_queries": 0,
        }
        
        logger.info("External Hotspot Mode initialized")
    
    async def run(self) -> None:
        """Main run loop for external hotspot mode."""
        self.is_running = True
        logger.info("Starting External Hotspot Mode")
        
        while self.is_running:
            try:
                await self._reset_daily_counter_if_needed()
                
                if self.daily_event_count < self.config.external_max_events_per_day:
                    await self._monitor_external_hotspots()
                else:
                    logger.info("Daily event limit reached, waiting until tomorrow")
                
                await asyncio.sleep(1800)  # Check every 30 minutes
            except Exception as e:
                logger.error(f"Error in external hotspot mode: {e}", exc_info=True)
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    async def stop(self) -> None:
        """Stop the external hotspot mode."""
        self.is_running = False
        logger.info("Stopping External Hotspot Mode")
    
    async def _reset_daily_counter_if_needed(self) -> None:
        """Reset daily event counter if it's a new day."""
        current_date = datetime.now().date()
        if current_date > self.last_reset_date:
            self.daily_event_count = 0
            self.last_reset_date = current_date
            logger.info("Reset daily event counter for new day")
    
    async def _monitor_external_hotspots(self) -> None:
        """Monitor external data sources for hotspot events."""
        try:
            # Use simulation engine for demo purposes
            from ..demo.simulation_engine import AISimulationEngine
            simulation_engine = AISimulationEngine(self.config)
            
            # Generate simulated hotspot events
            hotspot_events = simulation_engine.generate_external_hotspot_events(
                max_events=min(3, self.config.external_max_events_per_day - self.daily_event_count)
            )
            
            self.stats["data_source_queries"] += 1
            
            for hotspot_event in hotspot_events:
                if hotspot_event["confidence"] >= self.config.external_confidence_threshold:
                    await self._process_hotspot_event(hotspot_event)
                    self.stats["hotspots_detected"] += 1
                    
        except Exception as e:
            logger.error(f"Error monitoring external hotspots: {e}", exc_info=True)
    
    async def _process_hotspot_event(self, hotspot_event: Dict[str, Any]) -> None:
        """Process a detected hotspot event and create prediction market."""
        try:
            # Check if we've already created a market for this type of event recently
            event_signature = self._generate_event_signature(hotspot_event)
            if event_signature in self.created_hotspot_events:
                logger.info("Similar hotspot event already processed recently, skipping")
                return
            
            logger.info(f"Processing hotspot event: {hotspot_event['description'][:50]}...")
            
            # Generate market analysis for orderbook creation
            market_analysis = await self._analyze_hotspot_for_market(hotspot_event)
            
            # Calculate market parameters
            market_params = self._calculate_hotspot_market_parameters(hotspot_event, market_analysis)
            
            # Create orderbook market
            tx_hash = await self.orderbook_creator.create_orderbook_market(
                event_description=hotspot_event["description"],
                market_analysis=market_analysis,
                derivative_params=market_params
            )
            
            if tx_hash:
                self.created_hotspot_events.add(event_signature)
                self.daily_event_count += 1
                self.stats["hotspot_markets_created"] += 1
                self.stats["total_hotspot_stake"] += market_params["stake_amount"]
                self.stats["successful_hotspot_creations"] += 1
                
                logger.info(
                    f"Created hotspot market (tx: {tx_hash}): "
                    f"{hotspot_event['description'][:50]}... "
                    f"(confidence: {hotspot_event['confidence']:.2f}, "
                    f"urgency: {hotspot_event['urgency']})"
                )
            else:
                self.stats["failed_hotspot_creations"] += 1
                
        except Exception as e:
            logger.error(f"Error processing hotspot event: {e}", exc_info=True)
            self.stats["failed_hotspot_creations"] += 1
    
    def _generate_event_signature(self, hotspot_event: Dict[str, Any]) -> str:
        """Generate a signature for the hotspot event to avoid duplicates."""
        import hashlib
        
        # Create signature based on category and key terms
        category = hotspot_event.get("category", "general")
        description = hotspot_event["description"]
        
        # Extract key terms for similarity detection
        key_terms = []
        for word in description.lower().split():
            if len(word) > 4 and word.isalpha():  # Significant words only
                key_terms.append(word)
        
        signature_text = f"{category}:{':'.join(sorted(key_terms[:5]))}"  # Top 5 key terms
        return hashlib.md5(signature_text.encode()).hexdigest()[:12]
    
    async def _analyze_hotspot_for_market(self, hotspot_event: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze hotspot event for market creation."""
        
        # Extract hotspot characteristics
        confidence = hotspot_event["confidence"]
        urgency = hotspot_event["urgency"]
        category = hotspot_event["category"]
        data_sources = hotspot_event.get("data_sources", [])
        estimated_interest = hotspot_event.get("estimated_interest", 0.5)
        
        # Calculate market analysis metrics
        market_analysis = {
            "trend_score": confidence * estimated_interest,  # Combined confidence and interest
            "volatility": self._calculate_hotspot_volatility(urgency, category),
            "momentum": self._calculate_hotspot_momentum(urgency, confidence),
            "confidence": confidence,
            "dominant_signal": f"external_{category}",
            "original_event_id": None,  # External events don't have original events
            "data_sources": data_sources,
            "urgency_level": urgency,
            "category": category,
            "estimated_interest": estimated_interest,
        }
        
        return market_analysis
    
    def _calculate_hotspot_volatility(self, urgency: str, category: str) -> float:
        """Calculate expected volatility based on hotspot characteristics."""
        base_volatility = 0.15  # 15% base volatility for external events
        
        # Adjust for urgency
        urgency_multipliers = {
            "high": 1.5,
            "medium": 1.0,
            "low": 0.7,
        }
        urgency_factor = urgency_multipliers.get(urgency, 1.0)
        
        # Adjust for category
        category_multipliers = {
            "temperature": 0.8,  # Temperature predictions are more stable
            "precipitation": 1.2,  # Weather events are more volatile
            "energy": 0.9,  # Energy transitions are moderately volatile
            "sea_level": 0.6,  # Sea level changes are gradual
            "general_climate": 1.0,  # Default volatility
        }
        category_factor = category_multipliers.get(category, 1.0)
        
        return min(0.4, base_volatility * urgency_factor * category_factor)
    
    def _calculate_hotspot_momentum(self, urgency: str, confidence: float) -> float:
        """Calculate momentum based on urgency and confidence."""
        # High urgency and confidence create positive momentum
        urgency_scores = {
            "high": 0.3,
            "medium": 0.1,
            "low": 0.0,
        }
        
        urgency_momentum = urgency_scores.get(urgency, 0.0)
        confidence_momentum = (confidence - 0.5) * 0.4  # Scale confidence to momentum
        
        return max(-0.3, min(0.5, urgency_momentum + confidence_momentum))
    
    def _calculate_hotspot_market_parameters(
        self,
        hotspot_event: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate market parameters for hotspot event."""
        
        confidence = hotspot_event["confidence"]
        urgency = hotspot_event["urgency"]
        estimated_interest = hotspot_event.get("estimated_interest", 0.5)
        
        # Calculate YES price based on AI confidence and urgency
        base_yes_price = 0.5
        confidence_adjustment = (confidence - 0.5) * 0.3  # ±15% max
        urgency_adjustment = {"high": 0.1, "medium": 0.05, "low": 0.0}.get(urgency, 0.0)
        
        yes_price = base_yes_price + confidence_adjustment + urgency_adjustment
        yes_price = max(0.15, min(0.85, yes_price))
        no_price = 1.0 - yes_price
        
        # Calculate stake amount based on confidence and estimated interest
        base_stake = self.config.orderbook_base_order_size * 3  # Larger stakes for external events
        interest_multiplier = 0.5 + estimated_interest  # 0.5 to 1.5 multiplier
        confidence_multiplier = 0.7 + confidence * 0.6  # 0.7 to 1.3 multiplier
        
        stake_amount = base_stake * interest_multiplier * confidence_multiplier
        stake_amount = max(0.3, min(8.0, stake_amount))  # 0.3 to 8 HKTC
        
        # Calculate resolution time based on urgency and event type
        current_time = int(datetime.now().timestamp())
        if urgency == "high":
            resolution_hours = 48  # 2 days for urgent events
        elif urgency == "medium":
            resolution_hours = 120  # 5 days for medium urgency
        else:
            resolution_hours = 168  # 7 days for low urgency
        
        resolution_time = current_time + resolution_hours * 3600
        
        return {
            "yes_price": yes_price,
            "no_price": no_price,
            "stake_amount": stake_amount,
            "resolution_time": resolution_time,
            "confidence": confidence,
            "urgency": urgency,
            "category": hotspot_event["category"],
        }
    
    async def monitor_hotspots(self) -> None:
        """Monitor hotspots (called by main agent)."""
        await self._monitor_external_hotspots()
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of external hotspot mode."""
        return {
            "mode": "external_hotspot",
            "is_running": self.is_running,
            "statistics": self.stats.copy(),
            "daily_event_count": self.daily_event_count,
            "daily_limit": self.config.external_max_events_per_day,
            "created_hotspot_events_count": len(self.created_hotspot_events),
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check for external hotspot mode."""
        return {
            "status": "healthy" if self.is_running else "stopped",
            "message": "External hotspot mode is operating normally",
            "daily_events": self.daily_event_count,
            "last_activity": datetime.now().isoformat(),
        }