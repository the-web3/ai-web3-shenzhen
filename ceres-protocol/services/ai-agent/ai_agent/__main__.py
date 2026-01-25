"""Main entry point for the AI agent."""

import asyncio
import logging
import sys
from ai_agent.core.config import AgentConfig
from ai_agent.core.intelligent_agent import AIIntelligentAgent


def setup_logging(log_level: str) -> None:
    """Setup logging configuration."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('ai_agent.log')
        ]
    )


async def main() -> None:
    """Main function to run the AI agent."""
    try:
        # Load configuration
        config = AgentConfig.from_env()
        
        # Setup logging
        setup_logging(config.monitoring.log_level)
        
        logger = logging.getLogger(__name__)
        logger.info("Starting Ceres AI Intelligent Agent")
        logger.info(f"Enabled modes: {config.get_enabled_modes()}")
        
        # Create and start agent
        agent = AIIntelligentAgent(config)
        
        # Print startup information
        network_info = agent.get_network_info()
        logger.info(f"Connected to network: Chain ID {network_info['chain_id']}")
        logger.info(f"Agent account: {network_info['account_address']}")
        logger.info(f"Account balance: {network_info['account_balance']:.4f} HKTC")
        
        # Start agent
        await agent.start()
        
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())