"""
Health check and monitoring module for Ceres AI Agent
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from web3 import Web3
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

logger = logging.getLogger(__name__)

@dataclass
class HealthStatus:
    """Health status data structure"""
    status: str  # "healthy", "degraded", "unhealthy"
    timestamp: str
    uptime_seconds: int
    version: str
    
    # Component health
    blockchain_connected: bool
    contracts_accessible: bool
    ai_agent_running: bool
    
    # Performance metrics
    events_processed_24h: int
    judgments_created_24h: int
    success_rate_24h: float
    avg_response_time_ms: float
    
    # Resource usage
    memory_usage_mb: float
    cpu_usage_percent: float
    
    # Last activity
    last_event_processed: Optional[str]
    last_judgment_created: Optional[str]
    
    # Errors and warnings
    recent_errors: list
    warnings: list

class HealthChecker:
    """Health monitoring and reporting service"""
    
    def __init__(self, web3: Web3, contracts: Dict[str, Any]):
        self.web3 = web3
        self.contracts = contracts
        self.start_time = time.time()
        self.app = FastAPI(title="Ceres AI Agent Health Check")
        self.setup_routes()
        
        # Metrics storage
        self.metrics = {
            'events_processed': 0,
            'judgments_created': 0,
            'response_times': [],
            'errors': [],
            'last_event_time': None,
            'last_judgment_time': None
        }
        
    def setup_routes(self):
        """Setup FastAPI routes for health checks"""
        
        @self.app.get("/health")
        async def health_check():
            """Main health check endpoint"""
            try:
                status = await self.get_health_status()
                return JSONResponse(
                    content=asdict(status),
                    status_code=200 if status.status == "healthy" else 503
                )
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                return JSONResponse(
                    content={"status": "unhealthy", "error": str(e)},
                    status_code=503
                )
        
        @self.app.get("/metrics")
        async def get_metrics():
            """Prometheus-style metrics endpoint"""
            try:
                metrics = await self.get_prometheus_metrics()
                return JSONResponse(content=metrics)
            except Exception as e:
                logger.error(f"Metrics collection failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/status")
        async def get_status():
            """Detailed status information"""
            try:
                status = await self.get_detailed_status()
                return JSONResponse(content=status)
            except Exception as e:
                logger.error(f"Status check failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
    
    async def get_health_status(self) -> HealthStatus:
        """Get current health status"""
        
        # Check blockchain connectivity
        blockchain_connected = await self.check_blockchain_connection()
        
        # Check contract accessibility
        contracts_accessible = await self.check_contracts_accessible()
        
        # Calculate uptime
        uptime_seconds = int(time.time() - self.start_time)
        
        # Calculate 24h metrics
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        
        events_24h = self.count_events_since(yesterday)
        judgments_24h = self.count_judgments_since(yesterday)
        success_rate = self.calculate_success_rate_24h()
        avg_response_time = self.calculate_avg_response_time()
        
        # Get resource usage
        memory_usage, cpu_usage = self.get_resource_usage()
        
        # Determine overall status
        if not blockchain_connected or not contracts_accessible:
            overall_status = "unhealthy"
        elif success_rate < 0.8 or avg_response_time > 10000:  # 10s threshold
            overall_status = "degraded"
        else:
            overall_status = "healthy"
        
        # Get recent errors and warnings
        recent_errors = self.get_recent_errors()
        warnings = self.get_warnings()
        
        return HealthStatus(
            status=overall_status,
            timestamp=datetime.now().isoformat(),
            uptime_seconds=uptime_seconds,
            version="1.0.0",
            blockchain_connected=blockchain_connected,
            contracts_accessible=contracts_accessible,
            ai_agent_running=True,  # If we're here, agent is running
            events_processed_24h=events_24h,
            judgments_created_24h=judgments_24h,
            success_rate_24h=success_rate,
            avg_response_time_ms=avg_response_time,
            memory_usage_mb=memory_usage,
            cpu_usage_percent=cpu_usage,
            last_event_processed=self.metrics.get('last_event_time'),
            last_judgment_created=self.metrics.get('last_judgment_time'),
            recent_errors=recent_errors,
            warnings=warnings
        )
    
    async def check_blockchain_connection(self) -> bool:
        """Check if blockchain connection is working"""
        try:
            latest_block = self.web3.eth.block_number
            return latest_block > 0
        except Exception as e:
            logger.error(f"Blockchain connection check failed: {e}")
            return False
    
    async def check_contracts_accessible(self) -> bool:
        """Check if all contracts are accessible"""
        try:
            for name, contract in self.contracts.items():
                # Try to call a simple view function
                if hasattr(contract.functions, 'getEventCount'):
                    contract.functions.getEventCount().call()
                elif hasattr(contract.functions, 'totalSupply'):
                    contract.functions.totalSupply().call()
            return True
        except Exception as e:
            logger.error(f"Contract accessibility check failed: {e}")
            return False
    
    def count_events_since(self, since: datetime) -> int:
        """Count events processed since given time"""
        # This would be implemented based on your metrics storage
        return self.metrics.get('events_processed', 0)
    
    def count_judgments_since(self, since: datetime) -> int:
        """Count judgments created since given time"""
        return self.metrics.get('judgments_created', 0)
    
    def calculate_success_rate_24h(self) -> float:
        """Calculate success rate over last 24 hours"""
        total_attempts = self.metrics.get('events_processed', 0)
        if total_attempts == 0:
            return 1.0
        
        errors = len(self.metrics.get('errors', []))
        return max(0.0, (total_attempts - errors) / total_attempts)
    
    def calculate_avg_response_time(self) -> float:
        """Calculate average response time in milliseconds"""
        response_times = self.metrics.get('response_times', [])
        if not response_times:
            return 0.0
        return sum(response_times) / len(response_times)
    
    def get_resource_usage(self) -> tuple[float, float]:
        """Get current resource usage"""
        try:
            import psutil
            process = psutil.Process()
            memory_mb = process.memory_info().rss / 1024 / 1024
            cpu_percent = process.cpu_percent()
            return memory_mb, cpu_percent
        except ImportError:
            logger.warning("psutil not available, resource monitoring disabled")
            return 0.0, 0.0
        except Exception as e:
            logger.error(f"Resource usage check failed: {e}")
            return 0.0, 0.0
    
    def get_recent_errors(self) -> list:
        """Get recent errors (last 10)"""
        errors = self.metrics.get('errors', [])
        return errors[-10:] if len(errors) > 10 else errors
    
    def get_warnings(self) -> list:
        """Get current warnings"""
        warnings = []
        
        # Check for low balance
        try:
            # This would check the AI agent's wallet balance
            # balance = self.web3.eth.get_balance(self.agent_address)
            # if balance < Web3.to_wei(0.1, 'ether'):
            #     warnings.append("Low wallet balance")
            pass
        except Exception:
            pass
        
        # Check for old last activity
        last_event = self.metrics.get('last_event_time')
        if last_event:
            try:
                last_time = datetime.fromisoformat(last_event)
                if datetime.now() - last_time > timedelta(hours=1):
                    warnings.append("No recent activity detected")
            except Exception:
                pass
        
        return warnings
    
    async def get_prometheus_metrics(self) -> Dict[str, Any]:
        """Get metrics in Prometheus format"""
        status = await self.get_health_status()
        
        return {
            "ceres_ai_agent_uptime_seconds": status.uptime_seconds,
            "ceres_ai_agent_events_processed_24h": status.events_processed_24h,
            "ceres_ai_agent_judgments_created_24h": status.judgments_created_24h,
            "ceres_ai_agent_success_rate": status.success_rate_24h,
            "ceres_ai_agent_response_time_ms": status.avg_response_time_ms,
            "ceres_ai_agent_memory_usage_mb": status.memory_usage_mb,
            "ceres_ai_agent_cpu_usage_percent": status.cpu_usage_percent,
            "ceres_ai_agent_blockchain_connected": 1 if status.blockchain_connected else 0,
            "ceres_ai_agent_contracts_accessible": 1 if status.contracts_accessible else 0,
            "ceres_ai_agent_healthy": 1 if status.status == "healthy" else 0,
        }
    
    async def get_detailed_status(self) -> Dict[str, Any]:
        """Get detailed status information"""
        status = await self.get_health_status()
        
        return {
            "health": asdict(status),
            "configuration": {
                "rpc_url": self.web3.provider.endpoint_uri if hasattr(self.web3.provider, 'endpoint_uri') else "unknown",
                "chain_id": self.web3.eth.chain_id,
                "contracts": {name: contract.address for name, contract in self.contracts.items()},
            },
            "metrics_history": {
                "events_processed": self.metrics.get('events_processed', 0),
                "judgments_created": self.metrics.get('judgments_created', 0),
                "recent_response_times": self.metrics.get('response_times', [])[-10:],
            }
        }
    
    def record_event_processed(self):
        """Record that an event was processed"""
        self.metrics['events_processed'] += 1
        self.metrics['last_event_time'] = datetime.now().isoformat()
    
    def record_judgment_created(self, response_time_ms: float):
        """Record that a judgment was created"""
        self.metrics['judgments_created'] += 1
        self.metrics['last_judgment_time'] = datetime.now().isoformat()
        self.metrics['response_times'].append(response_time_ms)
        
        # Keep only last 100 response times
        if len(self.metrics['response_times']) > 100:
            self.metrics['response_times'] = self.metrics['response_times'][-100:]
    
    def record_error(self, error: str):
        """Record an error"""
        self.metrics['errors'].append({
            'timestamp': datetime.now().isoformat(),
            'error': error
        })
        
        # Keep only last 50 errors
        if len(self.metrics['errors']) > 50:
            self.metrics['errors'] = self.metrics['errors'][-50:]
    
    async def start_server(self, host: str = "0.0.0.0", port: int = 8000):
        """Start the health check server"""
        config = uvicorn.Config(
            app=self.app,
            host=host,
            port=port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()

# Global health checker instance
health_checker: Optional[HealthChecker] = None

def initialize_health_checker(web3: Web3, contracts: Dict[str, Any]) -> HealthChecker:
    """Initialize the global health checker"""
    global health_checker
    health_checker = HealthChecker(web3, contracts)
    return health_checker

def get_health_checker() -> Optional[HealthChecker]:
    """Get the global health checker instance"""
    return health_checker