"""Health monitoring utilities for the AI agent."""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class HealthMonitor:
    """Health monitoring system for the AI agent."""
    
    def __init__(self, config):
        """Initialize health monitor."""
        self.config = config
        self.is_monitoring = False
        self.last_health_check = None
        self.health_history = []
        
    async def start_monitoring(self, agent) -> None:
        """Start health monitoring for the agent."""
        if not self.config.enable_monitoring:
            logger.info("Health monitoring is disabled")
            return
        
        self.is_monitoring = True
        logger.info("Starting health monitoring")
        
        while self.is_monitoring:
            try:
                health_status = await agent.health_check()
                self.last_health_check = datetime.now()
                
                # Store health history (keep last 100 entries)
                self.health_history.append({
                    "timestamp": self.last_health_check.isoformat(),
                    "status": health_status
                })
                if len(self.health_history) > 100:
                    self.health_history.pop(0)
                
                # Send alerts if needed
                if health_status["overall_health"] != "healthy":
                    await self._send_alert(health_status)
                
                await asyncio.sleep(self.config.health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in health monitoring: {e}", exc_info=True)
                await asyncio.sleep(60)  # Wait longer on error
    
    async def stop(self) -> None:
        """Stop health monitoring."""
        self.is_monitoring = False
        logger.info("Stopping health monitoring")
    
    async def _send_alert(self, health_status: Dict[str, Any]) -> None:
        """Send health alert if webhook is configured."""
        if not self.config.alert_webhook_url:
            return
        
        try:
            import aiohttp
            
            alert_data = {
                "timestamp": datetime.now().isoformat(),
                "alert_type": "health_check",
                "severity": "warning" if health_status["overall_health"] == "warning" else "critical",
                "message": f"AI Agent health status: {health_status['overall_health']}",
                "details": health_status
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.config.alert_webhook_url,
                    json=alert_data,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        logger.info("Health alert sent successfully")
                    else:
                        logger.warning(f"Failed to send health alert: {response.status}")
                        
        except Exception as e:
            logger.error(f"Error sending health alert: {e}")
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get health monitoring summary."""
        return {
            "is_monitoring": self.is_monitoring,
            "last_health_check": self.last_health_check.isoformat() if self.last_health_check else None,
            "health_history_count": len(self.health_history),
            "recent_health_status": self.health_history[-1] if self.health_history else None,
        }