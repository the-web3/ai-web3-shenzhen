"""Competitive Judgment Mode - AMM-based competitive responses to human events."""

import asyncio
import logging
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CompetitiveJudgmentMode:
    """
    Mode 1: Competitive Judgment Generation (AMM Mode)
    
    Monitors human-created judgment events and generates competitive AMM-based
    alternative predictions with strategic price differences and stake amounts.
    """
    
    def __init__(self, blockchain, strategy_manager, config):
        """Initialize competitive judgment mode."""
        self.blockchain = blockchain
        self.strategy_manager = strategy_manager
        self.config = config
        
        self.is_running = False
        self.processed_events = set()
        self.stats = {
            "human_events_detected": 0,
            "competitive_judgments_created": 0,
            "total_competitive_stake": 0.0,
            "successful_responses": 0,
            "failed_responses": 0,
        }
        
        logger.info("Competitive Judgment Mode initialized")
    
    async def run(self) -> None:
        """Main run loop for competitive judgment mode."""
        self.is_running = True
        logger.info("Starting Competitive Judgment Mode")
        
        while self.is_running:
            try:
                await self._monitor_human_events()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Error in competitive judgment mode: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    async def stop(self) -> None:
        """Stop the competitive judgment mode."""
        self.is_running = False
        logger.info("Stopping Competitive Judgment Mode")
    
    async def _monitor_human_events(self) -> None:
        """Monitor blockchain for new human-created judgment events."""
        try:
            # Get recent events from the blockchain
            events = self.blockchain.listen_for_judgment_events()
            
            for event in events:
                event_id = event['args']['eventId'].hex()
                
                # Skip if already processed
                if event_id in self.processed_events:
                    continue
                
                # Check if this is a human event (not AI-created)
                if await self._is_human_event(event):
                    await self._process_human_event(event)
                    self.processed_events.add(event_id)
                    self.stats["human_events_detected"] += 1
                    
        except Exception as e:
            logger.error(f"Error monitoring human events: {e}", exc_info=True)
    
    async def _is_human_event(self, event: Dict[str, Any]) -> bool:
        """Determine if an event was created by a human (not AI)."""
        try:
            # Check if the creator is our AI agent
            creator = event['args']['creator']
            if creator.lower() == self.blockchain.account.address.lower():
                return False
            
            # Check metadata for AI markers
            metadata = event['args'].get('metadata', b'')
            if b'ai_' in metadata.lower() or b'simulation' in metadata.lower():
                return False
            
            # Check market type - humans typically create AMM markets
            market_type = event['args'].get('marketType', 'amm')
            if market_type != 'amm':
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking if event is human: {e}")
            return False
    
    async def _process_human_event(self, event: Dict[str, Any]) -> None:
        """Process a human-created event and generate competitive judgment."""
        try:
            event_args = event['args']
            event_id = event_args['eventId'].hex()
            
            logger.info(f"Processing human event: {event_id}")
            
            # Extract event details
            description = event_args['description']
            creator = event_args['creator']
            yes_price = event_args['yesPrice'] / 1e18  # Convert from wei
            no_price = event_args['noPrice'] / 1e18
            stake_amount = event_args['stakeAmount'] / 1e18
            resolution_time = event_args['resolutionTime']
            
            # Generate competitive judgment using simulation engine
            from ..demo.simulation_engine import AISimulationEngine
            simulation_engine = AISimulationEngine(self.config)
            
            competitive_analysis = simulation_engine.analyze_human_judgment(
                event_description=description,
                creator=creator,
                yes_price=yes_price,
                no_price=no_price
            )
            
            # Add strategic delay to appear more human-like
            delay = random.randint(
                self.config.competitive_response_delay_min,
                self.config.competitive_response_delay_max
            )
            logger.info(f"Waiting {delay} seconds before responding to appear natural")
            await asyncio.sleep(delay)
            
            # Create competitive judgment
            await self._create_competitive_judgment(
                original_event_id=event_id,
                competitive_analysis=competitive_analysis,
                original_stake=stake_amount,
                original_resolution=resolution_time
            )
            
        except Exception as e:
            logger.error(f"Error processing human event: {e}", exc_info=True)
            self.stats["failed_responses"] += 1
    
    async def _create_competitive_judgment(
        self,
        original_event_id: str,
        competitive_analysis: Dict[str, Any],
        original_stake: float,
        original_resolution: int
    ) -> None:
        """Create a competitive judgment event."""
        try:
            judgment_data = competitive_analysis["competitive_judgment"]
            
            # Calculate competitive stake amount
            stake_multiplier = random.uniform(
                self.config.competitive_stake_multiplier_min,
                self.config.competitive_stake_multiplier_max
            )
            competitive_stake = original_stake * stake_multiplier
            competitive_stake = max(0.1, min(5.0, competitive_stake))  # Clamp between 0.1 and 5 HKTC
            
            # Use same resolution time as original (competitive timing)
            competitive_resolution = original_resolution
            
            # Create the competitive judgment event
            tx_hash = self.blockchain.submit_judgment_event(
                description=judgment_data["description"],
                yes_price=judgment_data["yes_price"],
                no_price=judgment_data["no_price"],
                resolution_time=competitive_resolution,
                stake_amount=competitive_stake,
                market_type="amm",  # Competitive judgments use AMM
                metadata=self._create_competitive_metadata(competitive_analysis, original_event_id)
            )
            
            if tx_hash:
                self.stats["competitive_judgments_created"] += 1
                self.stats["total_competitive_stake"] += competitive_stake
                self.stats["successful_responses"] += 1
                
                logger.info(
                    f"Created competitive judgment (tx: {tx_hash}): "
                    f"{judgment_data['description'][:50]}... "
                    f"(confidence: {judgment_data['confidence']:.2f}, "
                    f"stake: {competitive_stake:.2f} HKTC)"
                )
            else:
                self.stats["failed_responses"] += 1
                
        except Exception as e:
            logger.error(f"Error creating competitive judgment: {e}", exc_info=True)
            self.stats["failed_responses"] += 1
    
    def _create_competitive_metadata(
        self,
        competitive_analysis: Dict[str, Any],
        original_event_id: str
    ) -> bytes:
        """Create metadata for competitive judgment."""
        import json
        
        metadata = {
            "type": "ai_competitive_judgment",
            "version": "1.0",
            "original_event_id": original_event_id,
            "ai_confidence": competitive_analysis["competitive_judgment"]["confidence"],
            "reasoning": competitive_analysis["competitive_judgment"]["reasoning"],
            "key_factors": competitive_analysis["competitive_judgment"]["key_factors"],
            "analysis_metadata": competitive_analysis["analysis_metadata"],
            "created_at": datetime.now().isoformat(),
        }
        
        return json.dumps(metadata).encode('utf-8')[:2000]  # Limit metadata size
    
    async def process_human_event(self, event_data: Dict[str, Any]) -> None:
        """Process a human event (called by main agent)."""
        await self._process_human_event(event_data)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of competitive judgment mode."""
        return {
            "mode": "competitive_judgment",
            "is_running": self.is_running,
            "statistics": self.stats.copy(),
            "processed_events_count": len(self.processed_events),
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check for competitive judgment mode."""
        return {
            "status": "healthy" if self.is_running else "stopped",
            "message": "Competitive judgment mode is operating normally",
            "processed_events": len(self.processed_events),
            "last_activity": datetime.now().isoformat(),
        }