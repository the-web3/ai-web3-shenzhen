"""
Ceres AI Intelligent Agent

Multi-mode AI agent for the Ceres Protocol prediction market system.
Supports competitive judgment, trend analysis, and external hotspot capture modes.
"""

__version__ = "0.1.0"
__author__ = "Ceres Protocol Team"

from .core.intelligent_agent import AIIntelligentAgent
from .core.config import AgentConfig

__all__ = ["AIIntelligentAgent", "AgentConfig"]