"""
Simulation Engine for AI Agent Demo - No External APIs Required
为黑客松演示提供智能模拟的AI功能，无需外部API密钥
"""

import random
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import hashlib

logger = logging.getLogger(__name__)


class AISimulationEngine:
    """
    AI模拟引擎 - 为演示提供智能的AI行为模拟
    
    这个引擎可以：
    1. 模拟智能的事件分析和判断生成
    2. 基于规则的趋势分析
    3. 模拟外部热点事件检测
    4. 生成合理的市场预测
    """
    
    def __init__(self, config):
        """初始化AI模拟引擎"""
        self.config = config
        
        # 预定义的气候相关关键词和模式
        self.climate_keywords = [
            "temperature", "rainfall", "drought", "flood", "hurricane", "typhoon",
            "climate change", "global warming", "carbon emissions", "renewable energy",
            "sea level", "ice melting", "extreme weather", "agriculture", "crop yield"
        ]
        
        # 预定义的判断模板
        self.judgment_templates = [
            "Will the average temperature in {region} exceed {value}°C in {timeframe}?",
            "Will {region} experience more than {value}mm of rainfall in {timeframe}?",
            "Will renewable energy adoption in {region} reach {value}% by {timeframe}?",
            "Will carbon emissions in {region} decrease by {value}% in {timeframe}?",
            "Will {region} face severe drought conditions in {timeframe}?",
            "Will the sea level rise by more than {value}cm globally by {timeframe}?",
        ]
        
        # 地区列表
        self.regions = [
            "Asia-Pacific", "Europe", "North America", "South America", 
            "Africa", "Middle East", "China", "India", "USA", "Brazil"
        ]
        
        # 时间框架
        self.timeframes = [
            "the next 6 months", "2026", "2027", "the next 2 years", 
            "by 2030", "the next decade"
        ]
        
        # 模拟的外部数据源
        self.simulated_data_sources = {
            "weather_trends": self._generate_weather_trends(),
            "news_sentiment": self._generate_news_sentiment(),
            "social_media_buzz": self._generate_social_buzz(),
            "satellite_data": self._generate_satellite_data(),
        }
        
        logger.info("AI Simulation Engine initialized for demo")
    
    def analyze_human_judgment(self, event_description: str, creator: str, 
                             yes_price: float, no_price: float) -> Dict[str, Any]:
        """
        分析人工判断事件，生成AI的竞争性判断
        
        这个方法模拟AI分析人工判断的过程，生成合理的竞争性判断
        """
        try:
            # 基于事件描述生成分析
            analysis = self._analyze_event_content(event_description)
            
            # 计算AI的信心度
            ai_confidence = self._calculate_ai_confidence(event_description, yes_price, analysis)
            
            # 生成竞争性价格
            competitive_prices = self._generate_competitive_prices(
                yes_price, no_price, ai_confidence, analysis
            )
            
            # 生成竞争性判断描述
            competitive_description = self._generate_competitive_description(
                event_description, analysis, ai_confidence
            )
            
            return {
                "competitive_judgment": {
                    "description": competitive_description,
                    "yes_price": competitive_prices["yes_price"],
                    "no_price": competitive_prices["no_price"],
                    "confidence": ai_confidence,
                    "reasoning": analysis["reasoning"],
                    "key_factors": analysis["key_factors"],
                },
                "analysis_metadata": {
                    "original_bias": "YES" if yes_price > no_price else "NO",
                    "ai_bias": "YES" if competitive_prices["yes_price"] > 0.5 else "NO",
                    "disagreement_level": abs(yes_price - competitive_prices["yes_price"]),
                    "analysis_time": datetime.now().isoformat(),
                }
            }
            
        except Exception as e:
            logger.error(f"Error in AI judgment analysis: {e}")
            return self._generate_fallback_judgment(event_description, yes_price, no_price)
    
    def detect_trending_patterns(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        检测市场趋势模式，模拟AI的趋势分析能力
        """
        try:
            # 模拟趋势检测
            trend_signals = self._detect_trend_signals(market_data)
            
            # 生成衍生预测事件
            derivative_predictions = self._generate_derivative_predictions(
                market_data, trend_signals
            )
            
            return {
                "trend_analysis": {
                    "signals_detected": trend_signals,
                    "trend_strength": self._calculate_trend_strength(trend_signals),
                    "confidence": self._calculate_trend_confidence(trend_signals),
                    "recommended_action": self._recommend_trend_action(trend_signals),
                },
                "derivative_predictions": derivative_predictions,
                "analysis_timestamp": datetime.now().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error in trend pattern detection: {e}")
            return {"error": "Trend analysis failed", "fallback": True}
    
    def generate_external_hotspot_events(self, max_events: int = 3) -> List[Dict[str, Any]]:
        """
        生成模拟的外部热点事件，无需真实API
        """
        try:
            hotspot_events = []
            
            for i in range(random.randint(1, max_events)):
                event = self._create_simulated_hotspot_event()
                if event:
                    hotspot_events.append(event)
            
            return hotspot_events
            
        except Exception as e:
            logger.error(f"Error generating hotspot events: {e}")
            return []
    
    def _analyze_event_content(self, description: str) -> Dict[str, Any]:
        """分析事件内容，提取关键信息"""
        description_lower = description.lower()
        
        # 检测关键词
        detected_keywords = [kw for kw in self.climate_keywords if kw in description_lower]
        
        # 基于关键词生成分析
        if "temperature" in description_lower:
            category = "temperature_prediction"
            complexity = 0.7
            uncertainty_factors = ["weather patterns", "climate variability", "measurement accuracy"]
        elif "rainfall" in description_lower or "drought" in description_lower:
            category = "precipitation_prediction"
            complexity = 0.8
            uncertainty_factors = ["seasonal patterns", "climate oscillations", "local geography"]
        elif "renewable" in description_lower or "energy" in description_lower:
            category = "energy_transition"
            complexity = 0.6
            uncertainty_factors = ["policy changes", "technology adoption", "economic factors"]
        else:
            category = "general_climate"
            complexity = 0.5
            uncertainty_factors = ["multiple variables", "complex interactions"]
        
        # 生成推理
        reasoning = self._generate_reasoning(category, detected_keywords, complexity)
        
        return {
            "category": category,
            "detected_keywords": detected_keywords,
            "complexity": complexity,
            "uncertainty_factors": uncertainty_factors,
            "reasoning": reasoning,
            "key_factors": self._extract_key_factors(description, category),
        }
    
    def _calculate_ai_confidence(self, description: str, human_yes_price: float, 
                               analysis: Dict[str, Any]) -> float:
        """计算AI的信心度"""
        base_confidence = 0.7
        
        # 基于复杂度调整
        complexity_adjustment = -0.2 * analysis["complexity"]
        
        # 基于关键词数量调整
        keyword_adjustment = 0.05 * len(analysis["detected_keywords"])
        
        # 基于人工判断的极端程度调整
        human_extremeness = abs(human_yes_price - 0.5) * 2  # 0-1 scale
        extremeness_adjustment = -0.1 * human_extremeness  # 更极端的判断降低AI信心
        
        # 随机因子模拟不确定性
        random_factor = random.uniform(-0.1, 0.1)
        
        confidence = base_confidence + complexity_adjustment + keyword_adjustment + extremeness_adjustment + random_factor
        
        return max(0.3, min(0.95, confidence))
    
    def _generate_competitive_prices(self, human_yes: float, human_no: float, 
                                   ai_confidence: float, analysis: Dict[str, Any]) -> Dict[str, float]:
        """生成竞争性价格"""
        # AI倾向于与人工判断有所不同，但不会完全相反
        base_disagreement = random.uniform(0.02, 0.08)  # 2-8% 基础分歧
        
        # 基于信心度调整分歧程度
        confidence_factor = (1 - ai_confidence) * 0.1  # 低信心度增加分歧
        
        # 基于复杂度调整
        complexity_factor = analysis["complexity"] * 0.05
        
        total_disagreement = base_disagreement + confidence_factor + complexity_factor
        
        # 随机决定AI是更乐观还是更悲观
        if random.random() > 0.5:
            # AI更乐观
            ai_yes_price = min(0.85, human_yes + total_disagreement)
        else:
            # AI更悲观
            ai_yes_price = max(0.15, human_yes - total_disagreement)
        
        ai_no_price = 1.0 - ai_yes_price
        
        return {
            "yes_price": round(ai_yes_price, 3),
            "no_price": round(ai_no_price, 3),
        }
    
    def _generate_competitive_description(self, original: str, analysis: Dict[str, Any], 
                                        confidence: float) -> str:
        """生成竞争性判断描述"""
        # 提取原始描述的核心要素
        if len(original) > 100:
            core_description = original[:97] + "..."
        else:
            core_description = original
        
        # 基于分析类别生成前缀
        prefixes = {
            "temperature_prediction": "AI Climate Analysis:",
            "precipitation_prediction": "AI Weather Forecast:",
            "energy_transition": "AI Energy Transition Prediction:",
            "general_climate": "AI Climate Assessment:",
        }
        
        prefix = prefixes.get(analysis["category"], "AI Alternative Prediction:")
        
        # 添加信心度指示
        if confidence > 0.8:
            confidence_indicator = " (High Confidence)"
        elif confidence > 0.6:
            confidence_indicator = " (Moderate Confidence)"
        else:
            confidence_indicator = " (Exploratory Analysis)"
        
        return f"{prefix} {core_description}{confidence_indicator}"
    
    def _generate_reasoning(self, category: str, keywords: List[str], complexity: float) -> str:
        """生成推理过程"""
        reasoning_templates = {
            "temperature_prediction": [
                "Based on historical temperature patterns and current climate trends",
                "Considering global warming trajectories and regional variations",
                "Analyzing seasonal patterns and long-term climate data",
            ],
            "precipitation_prediction": [
                "Evaluating precipitation patterns and seasonal forecasts",
                "Considering climate oscillations and regional weather systems",
                "Analyzing drought/flood historical cycles and current indicators",
            ],
            "energy_transition": [
                "Assessing renewable energy adoption rates and policy trends",
                "Considering technological advancement and economic factors",
                "Evaluating market dynamics and regulatory environment",
            ],
            "general_climate": [
                "Analyzing multiple climate indicators and trends",
                "Considering complex climate system interactions",
                "Evaluating various environmental and human factors",
            ],
        }
        
        base_reasoning = random.choice(reasoning_templates.get(category, reasoning_templates["general_climate"]))
        
        if keywords:
            keyword_context = f", with particular focus on {', '.join(keywords[:3])}"
            base_reasoning += keyword_context
        
        if complexity > 0.7:
            base_reasoning += ". High complexity requires careful analysis of multiple variables."
        
        return base_reasoning
    
    def _extract_key_factors(self, description: str, category: str) -> List[str]:
        """提取关键因素"""
        factor_mapping = {
            "temperature_prediction": ["Global warming trends", "Seasonal variations", "Regional climate patterns"],
            "precipitation_prediction": ["Seasonal patterns", "Climate oscillations", "Geographic factors"],
            "energy_transition": ["Policy support", "Technology costs", "Market adoption"],
            "general_climate": ["Climate variability", "Human activities", "Natural cycles"],
        }
        
        base_factors = factor_mapping.get(category, factor_mapping["general_climate"])
        
        # 随机选择2-3个因素
        return random.sample(base_factors, min(len(base_factors), random.randint(2, 3)))
    
    def _detect_trend_signals(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """检测趋势信号"""
        # 模拟各种趋势信号
        signals = {
            "volume_trend": random.choice(["increasing", "stable", "decreasing"]),
            "participation_trend": random.choice(["growing", "stable", "declining"]),
            "price_volatility": random.choice(["high", "moderate", "low"]),
            "momentum": random.uniform(-0.3, 0.3),
            "market_sentiment": random.choice(["bullish", "neutral", "bearish"]),
        }
        
        # 基于市场数据调整信号（如果有的话）
        if "volume" in market_data:
            if market_data["volume"] > 20:
                signals["volume_trend"] = "increasing"
            elif market_data["volume"] < 5:
                signals["volume_trend"] = "decreasing"
        
        return signals
    
    def _calculate_trend_strength(self, signals: Dict[str, Any]) -> float:
        """计算趋势强度"""
        strength = 0.5  # 基础强度
        
        if signals["volume_trend"] == "increasing":
            strength += 0.2
        elif signals["volume_trend"] == "decreasing":
            strength -= 0.1
        
        if signals["participation_trend"] == "growing":
            strength += 0.15
        elif signals["participation_trend"] == "declining":
            strength -= 0.1
        
        if signals["price_volatility"] == "high":
            strength += 0.1
        
        strength += abs(signals["momentum"]) * 0.3
        
        return max(0.1, min(1.0, strength))
    
    def _calculate_trend_confidence(self, signals: Dict[str, Any]) -> float:
        """计算趋势分析信心度"""
        confidence = 0.6  # 基础信心度
        
        # 一致性信号增加信心度
        positive_signals = 0
        if signals["volume_trend"] == "increasing":
            positive_signals += 1
        if signals["participation_trend"] == "growing":
            positive_signals += 1
        if abs(signals["momentum"]) > 0.2:
            positive_signals += 1
        
        confidence += positive_signals * 0.1
        
        # 添加随机因子
        confidence += random.uniform(-0.1, 0.1)
        
        return max(0.3, min(0.9, confidence))
    
    def _recommend_trend_action(self, signals: Dict[str, Any]) -> str:
        """推荐趋势行动"""
        positive_count = 0
        if signals["volume_trend"] == "increasing":
            positive_count += 1
        if signals["participation_trend"] == "growing":
            positive_count += 1
        if signals["momentum"] > 0.1:
            positive_count += 1
        
        if positive_count >= 2:
            return "create_derivative_market"
        elif positive_count == 1:
            return "monitor_closely"
        else:
            return "no_action"
    
    def _generate_derivative_predictions(self, market_data: Dict[str, Any], 
                                       signals: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成衍生预测"""
        predictions = []
        
        # 基于趋势信号生成不同类型的衍生预测
        if signals["volume_trend"] == "increasing":
            predictions.append({
                "type": "volume_prediction",
                "description": f"Will this market's trading volume exceed {market_data.get('volume', 10) * 1.5:.1f} HKTC?",
                "confidence": 0.7,
                "timeframe": "next_24_hours"
            })
        
        if signals["participation_trend"] == "growing":
            predictions.append({
                "type": "participation_prediction", 
                "description": f"Will this market attract more than {market_data.get('participants', 5) + 5} unique traders?",
                "confidence": 0.6,
                "timeframe": "next_48_hours"
            })
        
        if signals["price_volatility"] == "high":
            predictions.append({
                "type": "volatility_prediction",
                "description": "Will this market experience price swings greater than 20% from current levels?",
                "confidence": 0.8,
                "timeframe": "next_12_hours"
            })
        
        return predictions[:2]  # 最多返回2个预测
    
    def _create_simulated_hotspot_event(self) -> Optional[Dict[str, Any]]:
        """创建模拟的热点事件"""
        try:
            # 随机选择模板和参数
            template = random.choice(self.judgment_templates)
            region = random.choice(self.regions)
            timeframe = random.choice(self.timeframes)
            
            # 生成合理的数值
            if "temperature" in template:
                value = random.randint(25, 45)
            elif "rainfall" in template:
                value = random.randint(100, 2000)
            elif "renewable" in template or "emissions" in template:
                value = random.randint(10, 80)
            elif "sea level" in template:
                value = random.randint(5, 50)
            else:
                value = random.randint(10, 100)
            
            description = template.format(region=region, value=value, timeframe=timeframe)
            
            # 生成事件元数据
            confidence = random.uniform(0.6, 0.9)
            urgency = random.choice(["high", "medium", "low"])
            data_sources = random.sample([
                "satellite_imagery", "weather_stations", "climate_models", 
                "news_analysis", "social_media_trends"
            ], random.randint(2, 4))
            
            return {
                "description": description,
                "confidence": confidence,
                "urgency": urgency,
                "data_sources": data_sources,
                "category": self._categorize_event(description),
                "estimated_interest": random.uniform(0.5, 1.0),
                "generated_at": datetime.now().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error creating simulated hotspot event: {e}")
            return None
    
    def _categorize_event(self, description: str) -> str:
        """对事件进行分类"""
        description_lower = description.lower()
        
        if any(word in description_lower for word in ["temperature", "warming", "heat"]):
            return "temperature"
        elif any(word in description_lower for word in ["rain", "drought", "flood", "precipitation"]):
            return "precipitation"
        elif any(word in description_lower for word in ["renewable", "energy", "solar", "wind"]):
            return "energy"
        elif any(word in description_lower for word in ["sea level", "ice", "glacier"]):
            return "sea_level"
        else:
            return "general_climate"
    
    def _generate_fallback_judgment(self, description: str, yes_price: float, 
                                  no_price: float) -> Dict[str, Any]:
        """生成后备判断（当主要分析失败时）"""
        return {
            "competitive_judgment": {
                "description": f"AI Alternative View: {description[:100]}...",
                "yes_price": max(0.15, min(0.85, yes_price + random.uniform(-0.1, 0.1))),
                "no_price": max(0.15, min(0.85, no_price + random.uniform(-0.1, 0.1))),
                "confidence": 0.5,
                "reasoning": "Fallback analysis based on general climate prediction patterns",
                "key_factors": ["General uncertainty", "Limited data"],
            },
            "analysis_metadata": {
                "fallback": True,
                "analysis_time": datetime.now().isoformat(),
            }
        }
    
    def _generate_weather_trends(self) -> Dict[str, Any]:
        """生成模拟的天气趋势数据"""
        return {
            "global_temperature_anomaly": random.uniform(-1.5, 2.5),
            "precipitation_index": random.uniform(0.5, 1.8),
            "extreme_weather_events": random.randint(5, 25),
            "last_updated": datetime.now().isoformat(),
        }
    
    def _generate_news_sentiment(self) -> Dict[str, Any]:
        """生成模拟的新闻情感分析"""
        return {
            "climate_sentiment": random.choice(["positive", "neutral", "negative"]),
            "urgency_level": random.uniform(0.3, 0.9),
            "topic_frequency": random.randint(10, 100),
            "last_updated": datetime.now().isoformat(),
        }
    
    def _generate_social_buzz(self) -> Dict[str, Any]:
        """生成模拟的社交媒体热度"""
        return {
            "mention_count": random.randint(100, 10000),
            "engagement_rate": random.uniform(0.02, 0.15),
            "trending_topics": random.sample(self.climate_keywords, 3),
            "last_updated": datetime.now().isoformat(),
        }
    
    def _generate_satellite_data(self) -> Dict[str, Any]:
        """生成模拟的卫星数据"""
        return {
            "vegetation_index": random.uniform(0.2, 0.8),
            "surface_temperature": random.uniform(15, 35),
            "cloud_cover": random.uniform(0.1, 0.9),
            "last_updated": datetime.now().isoformat(),
        }
    
    def get_simulation_status(self) -> Dict[str, Any]:
        """获取模拟引擎状态"""
        return {
            "engine_status": "active",
            "simulation_mode": "demo",
            "available_templates": len(self.judgment_templates),
            "supported_categories": ["temperature", "precipitation", "energy", "sea_level", "general_climate"],
            "data_sources": list(self.simulated_data_sources.keys()),
            "last_updated": datetime.now().isoformat(),
        }