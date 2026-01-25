"""Main AI Intelligent Agent orchestrator."""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

from .config import AgentConfig
from .blockchain import BlockchainClient
from ..modes.competitive_judgment import CompetitiveJudgmentMode
from ..modes.trend_analysis import TrendAnalysisMode
from ..modes.external_hotspot import ExternalHotspotMode
from ..utils.monitoring import HealthMonitor
from ..utils.strategy import StrategyManager

logger = logging.getLogger(__name__)


class AIIntelligentAgent:
    """
    Multi-mode AI agent for Ceres Protocol prediction markets.
    
    Supports three operating modes:
    1. Competitive Judgment (AMM) - responds to human events
    2. Internal Trend Analysis (orderbook) - monitors hot events
    3. External Hotspot Capture (orderbook) - monitors external data
    """
    
    def __init__(self, config: AgentConfig):
        """Initialize the AI agent with configuration."""
        self.config = config
        self.blockchain = BlockchainClient(config.blockchain)
        self.strategy_manager = StrategyManager(config.strategy)
        self.health_monitor = HealthMonitor(config.monitoring)
        
        # Initialize modes based on configuration
        self.modes: Dict[str, Any] = {}
        self._initialize_modes()
        
        # Agent state
        self.is_running = False
        self.start_time: Optional[datetime] = None
        self.stats = {
            "events_processed": 0,
            "events_created": 0,
            "successful_transactions": 0,
            "failed_transactions": 0,
            "total_stake_deployed": 0.0,
        }
        
        logger.info(f"AI Agent initialized with modes: {list(self.modes.keys())}")
    
    def _initialize_modes(self) -> None:
        """Initialize enabled agent modes."""
        enabled_modes = self.config.get_enabled_modes()
        
        if "competitive" in enabled_modes:
            self.modes["competitive"] = CompetitiveJudgmentMode(
                blockchain=self.blockchain,
                strategy_manager=self.strategy_manager,
                config=self.config.strategy
            )
            logger.info("Initialized Competitive Judgment Mode")
        
        if "trend_analysis" in enabled_modes:
            self.modes["trend_analysis"] = TrendAnalysisMode(
                blockchain=self.blockchain,
                strategy_manager=self.strategy_manager,
                config=self.config.strategy
            )
            logger.info("Initialized Trend Analysis Mode")
        
        if "external_hotspot" in enabled_modes:
            self.modes["external_hotspot"] = ExternalHotspotMode(
                blockchain=self.blockchain,
                strategy_manager=self.strategy_manager,
                config=self.config.strategy,
                external_data_config=self.config.external_data
            )
            logger.info("Initialized External Hotspot Mode")
    
    async def start(self) -> None:
        """Start the AI agent."""
        if self.is_running:
            logger.warning("Agent is already running")
            return
        
        self.is_running = True
        self.start_time = datetime.now()
        
        logger.info("Starting AI Intelligent Agent...")
        
        # Start health monitoring
        if self.config.monitoring.enable_monitoring:
            asyncio.create_task(self.health_monitor.start_monitoring(self))
        
        # Start all enabled modes
        tasks = []
        for mode_name, mode in self.modes.items():
            task = asyncio.create_task(self._run_mode(mode_name, mode))
            tasks.append(task)
        
        # Wait for all modes to complete (they should run indefinitely)
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
        finally:
            await self.stop()
    
    async def stop(self) -> None:
        """Stop the AI agent."""
        if not self.is_running:
            return
        
        logger.info("Stopping AI Intelligent Agent...")
        self.is_running = False
        
        # Stop all modes
        for mode_name, mode in self.modes.items():
            if hasattr(mode, 'stop'):
                await mode.stop()
                logger.info(f"Stopped {mode_name} mode")
        
        # Stop health monitoring
        if hasattr(self.health_monitor, 'stop'):
            await self.health_monitor.stop()
        
        # Log final statistics
        self._log_final_stats()
    
    async def _run_mode(self, mode_name: str, mode: Any) -> None:
        """Run a specific agent mode."""
        logger.info(f"Starting {mode_name} mode")
        
        try:
            await mode.run()
        except Exception as e:
            logger.error(f"Error in {mode_name} mode: {e}", exc_info=True)
            # Don't stop the entire agent if one mode fails
            await asyncio.sleep(60)  # Wait before potential restart
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        uptime = None
        if self.start_time:
            uptime = (datetime.now() - self.start_time).total_seconds()
        
        return {
            "is_running": self.is_running,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "uptime_seconds": uptime,
            "enabled_modes": list(self.modes.keys()),
            "blockchain_connected": self.blockchain.is_connected(),
            "account_address": self.blockchain.account.address,
            "account_balance": self.blockchain.get_balance(),
            "green_points_balance": self.blockchain.get_green_points_balance(),
            "statistics": self.stats.copy(),
        }
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get blockchain network information."""
        return self.blockchain.get_network_info()
    
    def update_stats(self, stat_name: str, value: Any) -> None:
        """Update agent statistics."""
        if stat_name in self.stats:
            if isinstance(self.stats[stat_name], (int, float)) and isinstance(value, (int, float)):
                self.stats[stat_name] += value
            else:
                self.stats[stat_name] = value
        else:
            self.stats[stat_name] = value
    
    def _log_final_stats(self) -> None:
        """Log final statistics when stopping."""
        if not self.start_time:
            return
        
        uptime = datetime.now() - self.start_time
        
        logger.info("=== AI Agent Final Statistics ===")
        logger.info(f"Total uptime: {uptime}")
        logger.info(f"Events processed: {self.stats['events_processed']}")
        logger.info(f"Events created: {self.stats['events_created']}")
        logger.info(f"Successful transactions: {self.stats['successful_transactions']}")
        logger.info(f"Failed transactions: {self.stats['failed_transactions']}")
        logger.info(f"Total stake deployed: {self.stats['total_stake_deployed']} HKTC")
        
        if self.stats['successful_transactions'] + self.stats['failed_transactions'] > 0:
            success_rate = (self.stats['successful_transactions'] / 
                          (self.stats['successful_transactions'] + self.stats['failed_transactions'])) * 100
            logger.info(f"Transaction success rate: {success_rate:.2f}%")
    
    async def process_human_event(self, event_data: Dict[str, Any]) -> None:
        """Process a human-created judgment event (for competitive mode)."""
        if "competitive" not in self.modes:
            return
        
        try:
            await self.modes["competitive"].process_human_event(event_data)
            self.update_stats("events_processed", 1)
        except Exception as e:
            logger.error(f"Error processing human event: {e}", exc_info=True)
    
    async def analyze_trends(self) -> None:
        """Analyze internal trends (for trend analysis mode)."""
        if "trend_analysis" not in self.modes:
            return
        
        try:
            await self.modes["trend_analysis"].analyze_trends()
        except Exception as e:
            logger.error(f"Error analyzing trends: {e}", exc_info=True)
    
    async def monitor_external_hotspots(self) -> None:
        """Monitor external hotspots (for external hotspot mode)."""
        if "external_hotspot" not in self.modes:
            return
        
        try:
            await self.modes["external_hotspot"].monitor_hotspots()
        except Exception as e:
            logger.error(f"Error monitoring external hotspots: {e}", exc_info=True)
    
    async def create_judgment_event(
        self,
        description: str,
        yes_price: float,
        no_price: float,
        resolution_time: int,
        stake_amount: float,
        market_type: str = "amm",
        metadata: bytes = b""
    ) -> Optional[str]:
        """Create a judgment event on the blockchain."""
        try:
            tx_hash = self.blockchain.submit_judgment_event(
                description=description,
                yes_price=yes_price,
                no_price=no_price,
                resolution_time=resolution_time,
                stake_amount=stake_amount,
                market_type=market_type,
                metadata=metadata
            )
            
            self.update_stats("events_created", 1)
            self.update_stats("successful_transactions", 1)
            self.update_stats("total_stake_deployed", stake_amount)
            
            logger.info(f"Created judgment event: {description[:50]}... (tx: {tx_hash})")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Failed to create judgment event: {e}", exc_info=True)
            self.update_stats("failed_transactions", 1)
            return None
    
    def get_mode_status(self, mode_name: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific mode."""
        if mode_name not in self.modes:
            return None
        
        mode = self.modes[mode_name]
        if hasattr(mode, 'get_status'):
            return mode.get_status()
        
        return {"enabled": True, "status": "running"}
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check."""
        health_status = {
            "overall_health": "healthy",
            "timestamp": datetime.now().isoformat(),
            "checks": {}
        }
        
        # Check blockchain connection
        try:
            is_connected = self.blockchain.is_connected()
            balance = self.blockchain.get_balance()
            
            health_status["checks"]["blockchain"] = {
                "status": "healthy" if is_connected and balance > 0.01 else "warning",
                "connected": is_connected,
                "balance": balance,
                "message": "OK" if is_connected and balance > 0.01 else "Low balance or connection issue"
            }
        except Exception as e:
            health_status["checks"]["blockchain"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            health_status["overall_health"] = "unhealthy"
        
        # Check each mode
        for mode_name, mode in self.modes.items():
            try:
                if hasattr(mode, 'health_check'):
                    mode_health = await mode.health_check()
                else:
                    mode_health = {"status": "healthy", "message": "No health check implemented"}
                
                health_status["checks"][mode_name] = mode_health
                
                if mode_health.get("status") != "healthy":
                    health_status["overall_health"] = "warning"
                    
            except Exception as e:
                health_status["checks"][mode_name] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                health_status["overall_health"] = "unhealthy"
        
        return health_status