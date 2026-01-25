"""Strategy management utilities for the AI agent."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class StrategyManager:
    """Strategy management system for AI agent decision making."""
    
    def __init__(self, config):
        """Initialize strategy manager."""
        self.config = config
        self.strategy_history = []
        self.performance_metrics = {
            "total_decisions": 0,
            "successful_decisions": 0,
            "failed_decisions": 0,
            "total_profit_loss": 0.0,
        }
        
    def evaluate_competitive_strategy(
        self,
        human_event: Dict[str, Any],
        market_conditions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate strategy for competitive judgment mode."""
        
        # Extract human event characteristics
        human_yes_price = human_event.get("yes_price", 0.5)
        human_stake = human_event.get("stake_amount", 1.0)
        event_description = human_event.get("description", "")
        
        # Calculate strategic response
        strategy = {
            "should_respond": True,
            "confidence": 0.7,  # Default confidence
            "price_strategy": "contrarian",  # Default to contrarian approach
            "stake_strategy": "proportional",
            "timing_strategy": "delayed",
        }
        
        # Adjust confidence based on event characteristics
        if "temperature" in event_description.lower():
            strategy["confidence"] = 0.8  # Higher confidence in temperature predictions
        elif "extreme" in event_description.lower():
            strategy["confidence"] = 0.6  # Lower confidence in extreme events
        
        # Determine price strategy
        if human_yes_price > 0.7:
            strategy["price_strategy"] = "contrarian"  # Counter high confidence
        elif human_yes_price < 0.3:
            strategy["price_strategy"] = "contrarian"  # Counter low confidence
        else:
            strategy["price_strategy"] = "slight_contrarian"  # Slight disagreement
        
        # Determine stake strategy
        if human_stake > 2.0:
            strategy["stake_strategy"] = "conservative"  # Lower stakes for high-stake events
        else:
            strategy["stake_strategy"] = "proportional"
        
        self._record_strategy_decision("competitive", strategy)
        return strategy
    
    def evaluate_trend_strategy(
        self,
        trend_data: Dict[str, Any],
        market_conditions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate strategy for trend analysis mode."""
        
        trend_score = trend_data.get("trend_score", 0.0)
        volume = trend_data.get("volume", 0.0)
        volatility = trend_data.get("volatility", 0.0)
        
        strategy = {
            "should_create_derivative": trend_score > 0.7,
            "derivative_type": "volume_prediction",
            "confidence": min(0.9, trend_score + 0.1),
            "urgency": "medium",
        }
        
        # Adjust strategy based on trend characteristics
        if volume > self.config.trend_volume_threshold * 2:
            strategy["derivative_type"] = "high_volume_prediction"
            strategy["urgency"] = "high"
        
        if volatility > self.config.trend_volatility_threshold * 1.5:
            strategy["derivative_type"] = "volatility_prediction"
            strategy["confidence"] *= 0.9  # Slightly lower confidence for volatile markets
        
        self._record_strategy_decision("trend_analysis", strategy)
        return strategy
    
    def evaluate_hotspot_strategy(
        self,
        hotspot_data: Dict[str, Any],
        external_conditions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate strategy for external hotspot mode."""
        
        confidence = hotspot_data.get("confidence", 0.5)
        urgency = hotspot_data.get("urgency", "medium")
        category = hotspot_data.get("category", "general")
        
        strategy = {
            "should_create_market": confidence >= self.config.external_confidence_threshold,
            "market_type": "orderbook",
            "liquidity_strategy": "layered",
            "confidence": confidence,
            "priority": urgency,
        }
        
        # Adjust strategy based on category
        category_adjustments = {
            "temperature": {"confidence_multiplier": 1.1, "liquidity_strategy": "concentrated"},
            "precipitation": {"confidence_multiplier": 0.9, "liquidity_strategy": "wide_spread"},
            "energy": {"confidence_multiplier": 1.0, "liquidity_strategy": "balanced"},
            "sea_level": {"confidence_multiplier": 1.2, "liquidity_strategy": "conservative"},
        }
        
        if category in category_adjustments:
            adjustments = category_adjustments[category]
            strategy["confidence"] *= adjustments.get("confidence_multiplier", 1.0)
            strategy["liquidity_strategy"] = adjustments.get("liquidity_strategy", "layered")
        
        self._record_strategy_decision("external_hotspot", strategy)
        return strategy
    
    def _record_strategy_decision(self, mode: str, strategy: Dict[str, Any]) -> None:
        """Record a strategy decision for analysis."""
        decision_record = {
            "timestamp": datetime.now().isoformat(),
            "mode": mode,
            "strategy": strategy.copy(),
            "decision_id": len(self.strategy_history),
        }
        
        self.strategy_history.append(decision_record)
        self.performance_metrics["total_decisions"] += 1
        
        # Keep only recent history (last 1000 decisions)
        if len(self.strategy_history) > 1000:
            self.strategy_history.pop(0)
    
    def record_strategy_outcome(
        self,
        decision_id: int,
        success: bool,
        profit_loss: float = 0.0
    ) -> None:
        """Record the outcome of a strategy decision."""
        if success:
            self.performance_metrics["successful_decisions"] += 1
        else:
            self.performance_metrics["failed_decisions"] += 1
        
        self.performance_metrics["total_profit_loss"] += profit_loss
        
        # Update the specific decision record if found
        for decision in self.strategy_history:
            if decision.get("decision_id") == decision_id:
                decision["outcome"] = {
                    "success": success,
                    "profit_loss": profit_loss,
                    "recorded_at": datetime.now().isoformat(),
                }
                break
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get strategy performance summary."""
        total_decisions = self.performance_metrics["total_decisions"]
        success_rate = 0.0
        if total_decisions > 0:
            success_rate = self.performance_metrics["successful_decisions"] / total_decisions
        
        return {
            "total_decisions": total_decisions,
            "success_rate": success_rate,
            "total_profit_loss": self.performance_metrics["total_profit_loss"],
            "recent_decisions": len([
                d for d in self.strategy_history
                if datetime.fromisoformat(d["timestamp"]) > datetime.now() - timedelta(hours=24)
            ]),
            "mode_breakdown": self._get_mode_breakdown(),
        }
    
    def _get_mode_breakdown(self) -> Dict[str, Dict[str, Any]]:
        """Get performance breakdown by mode."""
        mode_stats = {}
        
        for decision in self.strategy_history:
            mode = decision["mode"]
            if mode not in mode_stats:
                mode_stats[mode] = {
                    "total": 0,
                    "successful": 0,
                    "failed": 0,
                    "profit_loss": 0.0,
                }
            
            mode_stats[mode]["total"] += 1
            
            outcome = decision.get("outcome")
            if outcome:
                if outcome["success"]:
                    mode_stats[mode]["successful"] += 1
                else:
                    mode_stats[mode]["failed"] += 1
                mode_stats[mode]["profit_loss"] += outcome.get("profit_loss", 0.0)
        
        # Calculate success rates
        for mode, stats in mode_stats.items():
            if stats["total"] > 0:
                stats["success_rate"] = stats["successful"] / stats["total"]
            else:
                stats["success_rate"] = 0.0
        
        return mode_stats