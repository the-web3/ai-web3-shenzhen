"""AI Agent modes for different prediction market strategies."""

from .competitive_judgment import CompetitiveJudgmentMode
from .trend_analysis import TrendAnalysisMode
from .external_hotspot import ExternalHotspotMode

__all__ = [
    "CompetitiveJudgmentMode",
    "TrendAnalysisMode", 
    "ExternalHotspotMode"
]