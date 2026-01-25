# Ceres Protocol AI Intelligent Agent

🤖 **Multi-mode AI agent for climate prediction markets** - No external APIs required for demo!

## Overview

The Ceres AI Intelligent Agent is a sophisticated multi-mode system that creates and manages prediction markets on the Ceres Protocol. It operates in three distinct modes:

1. **Competitive Judgment Mode (AMM)** - Analyzes human-created events and generates competitive alternative predictions
2. **Trend Analysis Mode (Orderbook)** - Monitors existing markets for trends and creates derivative prediction markets
3. **External Hotspot Mode (Orderbook)** - Captures external climate events and creates prediction markets

## 🎯 Hackathon Demo Features

- **Zero External Dependencies**: Uses advanced simulation engine instead of real APIs
- **Realistic AI Behavior**: Intelligent decision-making through rule-based simulation
- **Complete Functionality**: All three modes working with sophisticated market creation
- **Production-Ready Architecture**: Comprehensive testing and monitoring
- **Climate Focus**: Specialized for environmental and climate-related predictions

## 🚀 Quick Start (Demo Mode)

### Prerequisites

- Python 3.11+
- Poetry (for dependency management)
- Access to Hashkey Chain testnet (for full demo)

### Installation

```bash
# Clone the repository (if not already done)
cd ceres-protocol/services/ai-agent

# Install dependencies
poetry install

# Copy demo configuration
cp .env.demo .env

# Update .env with your demo settings (see Configuration section)
```

### Run Demo Script

```bash
# Run the interactive demo
poetry run python demo_script.py
```

This will demonstrate all AI agent capabilities without requiring external API keys!

### Run Full AI Agent

```bash
# Run the complete AI agent
poetry run python -m ai_agent
```

## 📋 Configuration

### Demo Configuration (.env.demo)

The demo configuration is designed to work without external APIs:

```bash
# Blockchain Configuration
RPC_URL=https://hashkey-chain-testnet.rpc.url
CHAIN_ID=133
PRIVATE_KEY=your_demo_private_key_here

# Contract Addresses (update after deployment)
CERES_REGISTRY_ADDRESS=0x...
CERES_MARKET_FACTORY_ADDRESS=0x...
CERES_GREEN_POINTS_ADDRESS=0x...

# AI Agent Configuration - Demo Mode
AGENT_MODE=all  # Run all three modes
LOG_LEVEL=INFO
MAX_EVENTS_PER_DAY=5

# External Data Sources - DEMO MODE
WEATHER_API_KEY=demo_simulation_mode
NEWS_API_KEY=demo_simulation_mode
SOCIAL_MEDIA_API_KEY=demo_simulation_mode
SATELLITE_DATA_API_KEY=demo_simulation_mode
```

### Production Configuration

For production deployment, replace the demo API keys with real ones:

```bash
# Real External Data Sources
WEATHER_API_KEY=your_real_weather_api_key
NEWS_API_KEY=your_real_news_api_key
SOCIAL_MEDIA_API_KEY=your_real_social_media_api_key
SATELLITE_DATA_API_KEY=your_real_satellite_api_key
```

## 🏗️ Architecture

### Core Components

- **AIIntelligentAgent**: Main orchestrator managing all modes
- **BlockchainClient**: Handles all blockchain interactions
- **AISimulationEngine**: Provides realistic AI behavior for demos
- **StrategyManager**: Manages decision-making strategies
- **HealthMonitor**: Monitors system health and performance

### Mode-Specific Components

- **CompetitiveJudgmentMode**: Responds to human events with AMM markets
- **TrendAnalysisMode**: Analyzes trends and creates orderbook derivatives
- **ExternalHotspotMode**: Monitors external data and creates orderbook markets
- **OrderbookMarketCreator**: Creates sophisticated orderbook-based markets

## 🎮 Demo Scenarios

### Scenario 1: Competitive Judgment

```
Human Event: "Will global temperature exceed 1.5°C by 2030?"
Human Prediction: YES=0.65, NO=0.35

AI Analysis: Generates competitive judgment with different price assessment
AI Prediction: YES=0.58, NO=0.42 (7% disagreement)
AI Reasoning: "Based on climate model analysis and current trends..."
```

### Scenario 2: Trend Analysis

```
Trending Market: "Renewable energy adoption in Asia-Pacific"
Volume: 15.5 HKTC, Participants: 8, Volatility: 12%

AI Creates Derivative: "Will this market exceed 25 HKTC volume?"
Orderbook Strategy: 3-layer liquidity with momentum-based pricing
```

### Scenario 3: External Hotspot

```
AI Detects: Satellite data showing unusual weather patterns
Confidence: 0.78, Urgency: High, Category: Precipitation

AI Creates Market: "Will Region X experience >200mm rainfall in 48h?"
Advanced Orderbook: Risk-managed liquidity with iceberg orders
```

## 🧪 Testing

### Run All Tests

```bash
# Run comprehensive test suite
poetry run pytest tests/ -v

# Run with coverage
poetry run pytest tests/ --cov=ai_agent --cov-report=html

# Run property-based tests only
poetry run pytest tests/test_ai_intelligent_agent.py::TestPropertyBasedTests -v
```

### Property-Based Tests

The system includes sophisticated property-based tests using Hypothesis:

- **Competitive Judgment Consistency**: Validates price bounds and reasoning
- **Trend Analysis Bounds**: Ensures trend metrics stay within valid ranges
- **Hotspot Generation Limits**: Verifies event generation respects constraints

## 📊 Monitoring and Health Checks

### Health Check Endpoint

```python
# Get agent health status
health_status = await agent.health_check()
print(health_status["overall_health"])  # "healthy", "warning", or "unhealthy"
```

### Performance Metrics

```python
# Get performance statistics
status = agent.get_status()
print(f"Events processed: {status['statistics']['events_processed']}")
print(f"Success rate: {status['statistics']['successful_transactions']}")
```

## 🔧 Advanced Features

### Simulation Engine Capabilities

- **Intelligent Event Analysis**: Context-aware reasoning about climate events
- **Realistic Market Behavior**: Simulated volume, volatility, and participant patterns
- **Dynamic Confidence Scoring**: Multi-factor confidence assessment
- **Trend Pattern Recognition**: Sophisticated trend detection algorithms

### Orderbook Market Creation

- **Multi-Layer Liquidity**: 3-5 layer orderbook with progressive sizing
- **Advanced Order Types**: Iceberg, momentum, volatility, and risk management orders
- **Dynamic Spread Calculation**: Market condition-based spread adjustment
- **Compressed Metadata**: Efficient storage of complex market data

### Risk Management

- **Stop Loss Orders**: Automatic risk protection
- **Position Sizing**: Confidence-based stake calculation
- **Diversification**: Multi-mode risk distribution
- **Health Monitoring**: Continuous system health assessment

## 🚀 Production Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t ceres-ai-agent .

# Run with environment file
docker run --env-file .env ceres-ai-agent
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ceres-ai-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ceres-ai-agent
  template:
    metadata:
      labels:
        app: ceres-ai-agent
    spec:
      containers:
        - name: ai-agent
          image: ceres-ai-agent:latest
          envFrom:
            - secretRef:
                name: ceres-ai-config
```

## 📈 Performance Optimization

### Recommended Settings

- **Competitive Mode**: 30-300s response delay for natural behavior
- **Trend Analysis**: 5-minute monitoring intervals
- **External Hotspot**: 30-minute data collection cycles
- **Health Checks**: 60-second intervals

### Scaling Considerations

- **Multi-Instance**: Run separate instances for each mode
- **Load Balancing**: Distribute across multiple blockchain nodes
- **Caching**: Cache external data to reduce API calls
- **Monitoring**: Use comprehensive logging and alerting

## 🤝 Contributing

### Development Setup

```bash
# Install development dependencies
poetry install --with dev

# Run linting
poetry run flake8 ai_agent/
poetry run black ai_agent/

# Run type checking
poetry run mypy ai_agent/
```

### Adding New Features

1. Create feature branch
2. Add comprehensive tests
3. Update documentation
4. Submit pull request

## 📄 License

This project is part of the Ceres Protocol and follows the same licensing terms.

## 🆘 Support

For hackathon support or questions:

- Check the demo script output for troubleshooting
- Review the comprehensive test suite for usage examples
- All functionality works without external APIs in demo mode

## 🎉 Hackathon Highlights

- **Complete AI System**: Three distinct AI modes working together
- **Zero Setup Friction**: No API keys needed for full demo
- **Production Quality**: Comprehensive testing and monitoring
- **Climate Focus**: Real-world applicability for environmental predictions
- **Scalable Architecture**: Ready for production deployment

**Ready to demonstrate intelligent prediction market AI! 🚀**
