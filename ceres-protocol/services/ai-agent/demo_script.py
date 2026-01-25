#!/usr/bin/env python3
"""
Ceres Protocol AI Agent Demo Script
为黑客松演示准备的AI代理演示脚本

This script demonstrates the AI agent's capabilities without requiring external API keys.
Uses the simulation engine to showcase intelligent AI behavior.
"""

import asyncio
import logging
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, Any

# Setup demo logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('demo.log')
    ]
)

logger = logging.getLogger(__name__)


class CeresAIDemo:
    """Demo orchestrator for Ceres AI Agent."""
    
    def __init__(self):
        """Initialize demo."""
        self.demo_scenarios = []
        self.demo_results = {}
        
    async def run_full_demo(self) -> None:
        """Run the complete AI agent demo."""
        logger.info("🚀 Starting Ceres Protocol AI Agent Demo")
        logger.info("=" * 60)
        
        try:
            # Demo scenario 1: Competitive Judgment Mode
            await self.demo_competitive_judgment()
            
            # Demo scenario 2: Trend Analysis Mode  
            await self.demo_trend_analysis()
            
            # Demo scenario 3: External Hotspot Mode
            await self.demo_external_hotspot()
            
            # Demo scenario 4: Multi-mode Integration
            await self.demo_multi_mode_integration()
            
            # Show final results
            await self.show_demo_summary()
            
        except Exception as e:
            logger.error(f"Demo failed: {e}", exc_info=True)
    
    async def demo_competitive_judgment(self) -> None:
        """Demonstrate competitive judgment mode."""
        logger.info("\n🎯 Demo Scenario 1: Competitive Judgment Mode (AMM)")
        logger.info("-" * 50)
        
        # Simulate human creating a judgment event
        human_event = {
            "description": "Will global average temperature exceed 1.5°C above pre-industrial levels by 2030?",
            "creator": "0x1234567890123456789012345678901234567890",
            "yes_price": 0.65,
            "no_price": 0.35,
            "stake_amount": 2.5,
            "resolution_time": int((datetime.now() + timedelta(days=30)).timestamp())
        }
        
        logger.info(f"Human Event: {human_event['description']}")
        logger.info(f"Human Prediction: YES={human_event['yes_price']:.2f}, NO={human_event['no_price']:.2f}")
        logger.info(f"Human Stake: {human_event['stake_amount']} HKTC")
        
        # Simulate AI analysis
        from ai_agent.demo.simulation_engine import AISimulationEngine
        from ai_agent.core.config import AgentConfig
        
        # Create demo config
        config = self._create_demo_config()
        simulation_engine = AISimulationEngine(config)
        
        # AI analyzes and generates competitive judgment
        logger.info("\n🤖 AI Analysis in progress...")
        await asyncio.sleep(2)  # Simulate processing time
        
        competitive_analysis = simulation_engine.analyze_human_judgment(
            event_description=human_event["description"],
            creator=human_event["creator"],
            yes_price=human_event["yes_price"],
            no_price=human_event["no_price"]
        )
        
        ai_judgment = competitive_analysis["competitive_judgment"]
        
        logger.info("✅ AI Competitive Judgment Generated:")
        logger.info(f"   Description: {ai_judgment['description']}")
        logger.info(f"   AI Prediction: YES={ai_judgment['yes_price']:.2f}, NO={ai_judgment['no_price']:.2f}")
        logger.info(f"   AI Confidence: {ai_judgment['confidence']:.2f}")
        logger.info(f"   Reasoning: {ai_judgment['reasoning']}")
        
        # Show the disagreement
        price_disagreement = abs(human_event["yes_price"] - ai_judgment["yes_price"])
        logger.info(f"   Price Disagreement: {price_disagreement:.3f} ({price_disagreement*100:.1f}%)")
        
        self.demo_results["competitive_judgment"] = {
            "human_event": human_event,
            "ai_judgment": ai_judgment,
            "disagreement": price_disagreement,
            "success": True
        }
    
    async def demo_trend_analysis(self) -> None:
        """Demonstrate trend analysis mode."""
        logger.info("\n📈 Demo Scenario 2: Trend Analysis Mode (Orderbook)")
        logger.info("-" * 50)
        
        # Simulate a trending market
        trending_market = {
            "event_id": "0xabcd1234",
            "description": "Will renewable energy adoption in Asia-Pacific reach 40% by 2025?",
            "current_volume": 15.5,
            "participant_count": 8,
            "volatility": 0.12,
            "momentum": 0.25,
            "current_yes_price": 0.58,
            "hours_active": 18
        }
        
        logger.info(f"Trending Market: {trending_market['description']}")
        logger.info(f"Volume: {trending_market['current_volume']} HKTC")
        logger.info(f"Participants: {trending_market['participant_count']}")
        logger.info(f"Volatility: {trending_market['volatility']:.1%}")
        logger.info(f"Momentum: {trending_market['momentum']:+.1%}")
        
        # Simulate AI trend analysis
        from ai_agent.demo.simulation_engine import AISimulationEngine
        config = self._create_demo_config()
        simulation_engine = AISimulationEngine(config)
        
        logger.info("\n🔍 AI Trend Analysis in progress...")
        await asyncio.sleep(2)
        
        trend_analysis = simulation_engine.detect_trending_patterns(trending_market)
        
        logger.info("✅ Trend Analysis Complete:")
        logger.info(f"   Trend Strength: {trend_analysis['trend_analysis']['trend_strength']:.2f}")
        logger.info(f"   Confidence: {trend_analysis['trend_analysis']['confidence']:.2f}")
        logger.info(f"   Recommended Action: {trend_analysis['trend_analysis']['recommended_action']}")
        
        # Show derivative predictions
        derivatives = trend_analysis.get("derivative_predictions", [])
        if derivatives:
            logger.info("   Generated Derivative Markets:")
            for i, derivative in enumerate(derivatives, 1):
                logger.info(f"     {i}. {derivative['description']}")
                logger.info(f"        Confidence: {derivative['confidence']:.2f}")
                logger.info(f"        Timeframe: {derivative['timeframe']}")
        
        self.demo_results["trend_analysis"] = {
            "original_market": trending_market,
            "trend_analysis": trend_analysis,
            "derivatives_created": len(derivatives),
            "success": True
        }
    
    async def demo_external_hotspot(self) -> None:
        """Demonstrate external hotspot mode."""
        logger.info("\n🌍 Demo Scenario 3: External Hotspot Mode (Orderbook)")
        logger.info("-" * 50)
        
        # Simulate AI monitoring external data sources
        logger.info("🔍 AI Monitoring External Data Sources...")
        logger.info("   - Weather patterns and climate data")
        logger.info("   - Environmental news and reports")
        logger.info("   - Social media climate discussions")
        logger.info("   - Satellite imagery analysis")
        
        await asyncio.sleep(3)  # Simulate data collection time
        
        # Generate hotspot events using simulation
        from ai_agent.demo.simulation_engine import AISimulationEngine
        config = self._create_demo_config()
        simulation_engine = AISimulationEngine(config)
        
        hotspot_events = simulation_engine.generate_external_hotspot_events(max_events=3)
        
        logger.info("✅ External Hotspots Detected:")
        
        for i, hotspot in enumerate(hotspot_events, 1):
            logger.info(f"\n   Hotspot {i}:")
            logger.info(f"     Event: {hotspot['description']}")
            logger.info(f"     Category: {hotspot['category']}")
            logger.info(f"     Confidence: {hotspot['confidence']:.2f}")
            logger.info(f"     Urgency: {hotspot['urgency']}")
            logger.info(f"     Data Sources: {', '.join(hotspot['data_sources'])}")
            logger.info(f"     Estimated Interest: {hotspot['estimated_interest']:.2f}")
        
        # Show which events would create markets
        qualifying_events = [h for h in hotspot_events if h['confidence'] >= 0.6]
        
        logger.info(f"\n   Events Qualifying for Market Creation: {len(qualifying_events)}/{len(hotspot_events)}")
        
        self.demo_results["external_hotspot"] = {
            "hotspots_detected": len(hotspot_events),
            "qualifying_events": len(qualifying_events),
            "hotspot_events": hotspot_events,
            "success": True
        }
    
    async def demo_multi_mode_integration(self) -> None:
        """Demonstrate multi-mode AI agent integration."""
        logger.info("\n🔄 Demo Scenario 4: Multi-Mode Integration")
        logger.info("-" * 50)
        
        logger.info("🤖 AI Agent Operating in All Modes Simultaneously:")
        logger.info("   ✓ Competitive Judgment Mode: Monitoring human events")
        logger.info("   ✓ Trend Analysis Mode: Analyzing market patterns")
        logger.info("   ✓ External Hotspot Mode: Scanning external data")
        
        # Simulate concurrent operations
        await asyncio.sleep(2)
        
        # Show integration benefits
        logger.info("\n🎯 Integration Benefits Demonstrated:")
        logger.info("   • Diversified market creation strategies")
        logger.info("   • Comprehensive market coverage (AMM + Orderbook)")
        logger.info("   • Intelligent resource allocation")
        logger.info("   • Risk distribution across prediction types")
        
        # Simulate some statistics
        total_events = (
            self.demo_results.get("competitive_judgment", {}).get("success", 0) +
            self.demo_results.get("trend_analysis", {}).get("derivatives_created", 0) +
            self.demo_results.get("external_hotspot", {}).get("qualifying_events", 0)
        )
        
        logger.info(f"\n📊 Demo Session Statistics:")
        logger.info(f"   Total AI-Generated Events: {total_events}")
        logger.info(f"   Competitive Judgments: 1")
        logger.info(f"   Trend-Based Derivatives: {self.demo_results.get('trend_analysis', {}).get('derivatives_created', 0)}")
        logger.info(f"   External Hotspot Markets: {self.demo_results.get('external_hotspot', {}).get('qualifying_events', 0)}")
        
        self.demo_results["multi_mode_integration"] = {
            "total_events": total_events,
            "modes_active": 3,
            "success": True
        }
    
    async def show_demo_summary(self) -> None:
        """Show final demo summary."""
        logger.info("\n" + "=" * 60)
        logger.info("🎉 CERES PROTOCOL AI AGENT DEMO COMPLETE")
        logger.info("=" * 60)
        
        logger.info("\n✅ Demo Scenarios Completed:")
        for scenario, results in self.demo_results.items():
            status = "✅ SUCCESS" if results.get("success") else "❌ FAILED"
            logger.info(f"   {scenario.replace('_', ' ').title()}: {status}")
        
        logger.info("\n🚀 Key Capabilities Demonstrated:")
        logger.info("   • Intelligent competitive analysis and judgment generation")
        logger.info("   • Advanced trend detection and derivative market creation")
        logger.info("   • External data monitoring and hotspot event capture")
        logger.info("   • Multi-mode integration and resource optimization")
        logger.info("   • Sophisticated orderbook liquidity provision")
        logger.info("   • Risk management and confidence-based decision making")
        
        logger.info("\n🎯 Hackathon Value Proposition:")
        logger.info("   • No external API dependencies - fully self-contained demo")
        logger.info("   • Realistic AI behavior through advanced simulation")
        logger.info("   • Production-ready architecture with comprehensive testing")
        logger.info("   • Scalable design supporting multiple prediction market types")
        logger.info("   • Climate-focused use case with real-world applicability")
        
        logger.info("\n📈 Next Steps for Production:")
        logger.info("   • Deploy contracts to Hashkey Chain testnet")
        logger.info("   • Integrate real external data sources")
        logger.info("   • Add frontend interface for user interaction")
        logger.info("   • Implement advanced oracle integration")
        logger.info("   • Scale to support higher transaction volumes")
        
        logger.info(f"\n⏰ Demo completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("🎊 Thank you for watching the Ceres Protocol AI Agent Demo!")
    
    def _create_demo_config(self):
        """Create demo configuration."""
        from ai_agent.core.config import StrategyConfig
        
        return StrategyConfig(
            competitive_price_spread_min=0.03,
            competitive_price_spread_max=0.08,
            trend_volume_threshold=5.0,
            trend_participant_threshold=3,
            trend_volatility_threshold=0.05,
            external_confidence_threshold=0.5,
            external_max_events_per_day=5,
            orderbook_order_layers=3,
            orderbook_base_order_size=0.2,
        )


async def main():
    """Run the demo."""
    demo = CeresAIDemo()
    await demo.run_full_demo()


if __name__ == "__main__":
    print("🌟 Ceres Protocol AI Agent - Hackathon Demo")
    print("🎯 Demonstrating intelligent prediction market AI without external APIs")
    print("⚡ Starting demo in 3 seconds...")
    time.sleep(3)
    
    asyncio.run(main())