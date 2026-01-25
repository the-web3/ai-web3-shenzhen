#!/usr/bin/env python3
"""
Simple API server to connect frontend with AI demo
简单的API服务器，连接前端和AI演示
"""

import asyncio
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

# Add the AI agent path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-agent'))

try:
    from ai_agent.demo.simulation_engine import AISimulationEngine
    from ai_agent.core.config import StrategyConfig
except ImportError:
    print("Warning: AI agent modules not found. Using mock simulation.")
    AISimulationEngine = None
    StrategyConfig = None


class DemoAPIHandler(BaseHTTPRequestHandler):
    """HTTP request handler for demo API"""
    
    def __init__(self, *args, **kwargs):
        self.simulation_engine = None
        if AISimulationEngine and StrategyConfig:
            config = StrategyConfig(
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
            self.simulation_engine = AISimulationEngine(config)
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/status':
            self.handle_status()
        elif path == '/api/demo/competitive':
            self.handle_competitive_demo()
        elif path == '/api/demo/trend':
            self.handle_trend_demo()
        elif path == '/api/demo/hotspot':
            self.handle_hotspot_demo()
        else:
            self.send_404()
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/demo/start':
            self.handle_start_demo()
        elif path == '/api/demo/competitive':
            self.handle_competitive_analysis()
        else:
            self.send_404()
    
    def handle_status(self):
        """Return API status"""
        status = {
            "status": "active",
            "timestamp": datetime.now().isoformat(),
            "simulation_engine": self.simulation_engine is not None,
            "version": "1.0.0"
        }
        self.send_json_response(status)
    
    def handle_competitive_demo(self):
        """Handle competitive judgment demo request"""
        # Mock human event
        human_event = {
            "description": "Will global average temperature exceed 1.5°C above pre-industrial levels by 2030?",
            "creator": "0x1234567890123456789012345678901234567890",
            "yes_price": 0.65,
            "no_price": 0.35,
            "stake_amount": 2.5
        }
        
        if self.simulation_engine:
            try:
                analysis = self.simulation_engine.analyze_human_judgment(
                    event_description=human_event["description"],
                    creator=human_event["creator"],
                    yes_price=human_event["yes_price"],
                    no_price=human_event["no_price"]
                )
                response = {
                    "success": True,
                    "human_event": human_event,
                    "ai_analysis": analysis
                }
            except Exception as e:
                response = {
                    "success": False,
                    "error": str(e),
                    "human_event": human_event
                }
        else:
            # Mock response
            response = {
                "success": True,
                "human_event": human_event,
                "ai_analysis": {
                    "competitive_judgment": {
                        "description": "AI Climate Analysis: Will global temperature exceed 1.5°C by 2030? (Exploratory Analysis)",
                        "yes_price": 0.58,
                        "no_price": 0.42,
                        "confidence": 0.72,
                        "reasoning": "Based on climate model analysis and current trends",
                        "key_factors": ["Global warming trends", "Climate variability", "Policy impacts"]
                    }
                }
            }
        
        self.send_json_response(response)
    
    def handle_trend_demo(self):
        """Handle trend analysis demo request"""
        # Mock trending market
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
        
        if self.simulation_engine:
            try:
                analysis = self.simulation_engine.detect_trending_patterns(trending_market)
                response = {
                    "success": True,
                    "trending_market": trending_market,
                    "trend_analysis": analysis
                }
            except Exception as e:
                response = {
                    "success": False,
                    "error": str(e),
                    "trending_market": trending_market
                }
        else:
            # Mock response
            response = {
                "success": True,
                "trending_market": trending_market,
                "trend_analysis": {
                    "trend_analysis": {
                        "trend_strength": 0.82,
                        "confidence": 0.79,
                        "recommended_action": "create_derivative_market"
                    },
                    "derivative_predictions": [
                        {
                            "description": "Will this market's trading volume exceed 23.3 HKTC?",
                            "confidence": 0.7,
                            "timeframe": "next_24_hours"
                        },
                        {
                            "description": "Will this market experience price swings greater than 20%?",
                            "confidence": 0.8,
                            "timeframe": "next_12_hours"
                        }
                    ]
                }
            }
        
        self.send_json_response(response)
    
    def handle_hotspot_demo(self):
        """Handle external hotspot demo request"""
        if self.simulation_engine:
            try:
                hotspots = self.simulation_engine.generate_external_hotspot_events(max_events=3)
                response = {
                    "success": True,
                    "hotspot_events": hotspots,
                    "qualifying_events": len([h for h in hotspots if h.get('confidence', 0) >= 0.6])
                }
            except Exception as e:
                response = {
                    "success": False,
                    "error": str(e),
                    "hotspot_events": []
                }
        else:
            # Mock response
            hotspots = [
                {
                    "description": "Will global sea level rise by more than 18cm by 2025?",
                    "confidence": 0.64,
                    "urgency": "high",
                    "category": "sea_level",
                    "data_sources": ["satellite_imagery", "climate_models"],
                    "estimated_interest": 0.8
                },
                {
                    "description": "Will renewable energy adoption in India reach 79% in the next 6 months?",
                    "confidence": 0.73,
                    "urgency": "medium",
                    "category": "energy",
                    "data_sources": ["news_analysis", "social_media_trends"],
                    "estimated_interest": 0.9
                },
                {
                    "description": "Will global sea level rise by more than 36cm by 2030?",
                    "confidence": 0.68,
                    "urgency": "medium",
                    "category": "sea_level",
                    "data_sources": ["satellite_imagery", "weather_stations"],
                    "estimated_interest": 0.7
                }
            ]
            response = {
                "success": True,
                "hotspot_events": hotspots,
                "qualifying_events": len([h for h in hotspots if h.get('confidence', 0) >= 0.6])
            }
        
        self.send_json_response(response)
    
    def handle_start_demo(self):
        """Handle demo start request"""
        response = {
            "success": True,
            "message": "Demo started successfully",
            "timestamp": datetime.now().isoformat(),
            "estimated_duration": "3-4 minutes"
        }
        self.send_json_response(response)
    
    def handle_competitive_analysis(self):
        """Handle competitive analysis POST request"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            human_event = data.get('human_event', {})
            
            if self.simulation_engine:
                analysis = self.simulation_engine.analyze_human_judgment(
                    event_description=human_event.get("description", ""),
                    creator=human_event.get("creator", ""),
                    yes_price=human_event.get("yes_price", 0.5),
                    no_price=human_event.get("no_price", 0.5)
                )
                response = {
                    "success": True,
                    "ai_analysis": analysis
                }
            else:
                # Mock response
                response = {
                    "success": True,
                    "ai_analysis": {
                        "competitive_judgment": {
                            "description": f"AI Analysis: {human_event.get('description', 'Unknown event')}",
                            "yes_price": max(0.15, min(0.85, human_event.get('yes_price', 0.5) + 0.05)),
                            "no_price": max(0.15, min(0.85, human_event.get('no_price', 0.5) - 0.05)),
                            "confidence": 0.75,
                            "reasoning": "Based on advanced simulation analysis",
                            "key_factors": ["Market dynamics", "Historical patterns", "Risk assessment"]
                        }
                    }
                }
            
            self.send_json_response(response)
            
        except Exception as e:
            self.send_json_response({
                "success": False,
                "error": str(e)
            }, status_code=400)
    
    def send_json_response(self, data: Dict[str, Any], status_code: int = 200):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response_json = json.dumps(data, indent=2, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
    
    def send_cors_headers(self):
        """Send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def send_404(self):
        """Send 404 response"""
        self.send_response(404)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {
            "error": "Not Found",
            "message": f"Path {self.path} not found"
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to customize logging"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")


def run_api_server(port: int = 8000):
    """Run the API server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DemoAPIHandler)
    
    print(f"🚀 Ceres AI Demo API Server starting on port {port}")
    print(f"📡 API endpoints available at http://localhost:{port}/api/")
    print(f"🌐 Frontend should connect to http://localhost:{port}")
    print(f"⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        httpd.server_close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Ceres AI Demo API Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on (default: 8000)')
    args = parser.parse_args()
    
    run_api_server(args.port)