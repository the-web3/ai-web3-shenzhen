"""Orderbook Market Creator - Advanced market creation and management for AI agents."""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import gzip

logger = logging.getLogger(__name__)


class OrderbookMarketCreator:
    """
    Advanced orderbook market creator for AI-generated prediction markets.
    
    This class handles the creation and management of sophisticated orderbook-based
    prediction markets with intelligent order placement, risk management, and
    dynamic liquidity provision.
    """
    
    def __init__(self, blockchain, config):
        """Initialize the orderbook market creator."""
        self.blockchain = blockchain
        self.config = config
        
        self.created_markets = {}  # market_id -> market_info
        self.active_orders = {}    # market_id -> list of active orders
        self.market_stats = {}     # market_id -> performance statistics
        
        self.stats = {
            "markets_created": 0,
            "total_orders_placed": 0,
            "total_volume_provided": 0.0,
            "successful_trades": 0,
            "failed_orders": 0,
        }
        
        logger.info("Orderbook Market Creator initialized")
    
    async def create_orderbook_market(
        self,
        event_description: str,
        market_analysis: Dict[str, Any],
        derivative_params: Dict[str, Any]
    ) -> Optional[str]:
        """
        Create a sophisticated orderbook-based prediction market.
        
        Args:
            event_description: Description of the prediction event
            market_analysis: Analysis data from trend analysis
            derivative_params: Calculated parameters for the market
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        try:
            logger.info(f"Creating orderbook market: {event_description[:50]}...")
            
            # Generate sophisticated initial orderbook
            initial_orders = await self._generate_sophisticated_orderbook(
                derivative_params, market_analysis
            )
            
            # Encode orderbook metadata with advanced compression
            metadata = await self._encode_advanced_metadata(initial_orders, market_analysis)
            
            # Submit the judgment event with orderbook type
            tx_hash = self.blockchain.submit_judgment_event(
                description=event_description,
                yes_price=derivative_params['yes_price'],
                no_price=derivative_params['no_price'],
                resolution_time=derivative_params['resolution_time'],
                stake_amount=derivative_params['stake_amount'],
                market_type="orderbook",
                metadata=metadata
            )
            
            if tx_hash:
                # Store market information
                market_id = f"orderbook_{tx_hash}"
                self.created_markets[market_id] = {
                    'tx_hash': tx_hash,
                    'description': event_description,
                    'created_at': datetime.now(),
                    'initial_orders': initial_orders,
                    'derivative_params': derivative_params,
                    'market_analysis': market_analysis,
                    'status': 'created'
                }
                
                self.active_orders[market_id] = initial_orders.copy()
                self.stats["markets_created"] += 1
                self.stats["total_orders_placed"] += len(initial_orders)
                self.stats["total_volume_provided"] += derivative_params['stake_amount']
                
                logger.info(f"Successfully created orderbook market: {tx_hash}")
                
                # Schedule order management
                asyncio.create_task(self._manage_market_orders(market_id))
                
                return tx_hash
            
        except Exception as e:
            logger.error(f"Error creating orderbook market: {e}", exc_info=True)
            self.stats["failed_orders"] += 1
            
        return None
    
    async def _generate_sophisticated_orderbook(
        self,
        derivative_params: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate a sophisticated initial orderbook with advanced strategies."""
        
        orders = []
        
        # Extract parameters
        center_price = derivative_params['yes_price']
        confidence = derivative_params.get('confidence', 0.7)
        trend_strength = derivative_params.get('trend_strength', 0.5)
        volatility_factor = derivative_params.get('volatility_factor', 0.1)
        
        # Calculate dynamic spread based on market conditions
        base_spread = self.config.orderbook_initial_spread_bps / 10000
        dynamic_spread = self._calculate_dynamic_spread(
            base_spread, volatility_factor, confidence, trend_strength
        )
        
        # Generate core liquidity layers
        core_orders = await self._generate_core_liquidity_layers(
            center_price, dynamic_spread, confidence, trend_strength
        )
        orders.extend(core_orders)
        
        # Add specialized order types
        specialized_orders = await self._generate_specialized_orders(
            center_price, confidence, volatility_factor, market_analysis
        )
        orders.extend(specialized_orders)
        
        # Add risk management orders
        risk_orders = await self._generate_risk_management_orders(
            center_price, derivative_params, market_analysis
        )
        orders.extend(risk_orders)
        
        # Add market making orders for both sides
        market_making_orders = await self._generate_market_making_orders(
            center_price, dynamic_spread, confidence
        )
        orders.extend(market_making_orders)
        
        logger.info(f"Generated {len(orders)} sophisticated orders for orderbook market")
        
        return orders
    
    def _calculate_dynamic_spread(
        self,
        base_spread: float,
        volatility_factor: float,
        confidence: float,
        trend_strength: float
    ) -> float:
        """Calculate dynamic spread based on market conditions."""
        
        # Wider spread for higher volatility
        volatility_adjustment = volatility_factor * 2.0
        
        # Tighter spread for higher confidence
        confidence_adjustment = (1 - confidence) * 0.5
        
        # Adjust for trend strength (stronger trends = tighter spreads)
        trend_adjustment = (1 - trend_strength) * 0.3
        
        # Calculate final spread
        dynamic_spread = base_spread * (1 + volatility_adjustment + confidence_adjustment + trend_adjustment)
        
        # Ensure spread is within reasonable bounds
        return max(0.01, min(0.1, dynamic_spread))  # 1% to 10%
    
    async def _generate_core_liquidity_layers(
        self,
        center_price: float,
        spread: float,
        confidence: float,
        trend_strength: float
    ) -> List[Dict[str, Any]]:
        """Generate core liquidity layers with intelligent sizing."""
        
        orders = []
        layers = self.config.orderbook_order_layers
        base_size = self.config.orderbook_base_order_size
        
        # Calculate size multiplier based on confidence and trend
        size_multiplier = 0.5 + confidence * 0.5 + trend_strength * 0.3
        
        for i in range(layers):
            layer_factor = (i + 1) / layers
            price_offset = spread * layer_factor
            
            # Progressive sizing - larger orders further from center
            layer_size = base_size * size_multiplier * (1.2 ** i)
            
            # Buy orders (below center)
            buy_price = center_price - price_offset
            if buy_price > 0.01:
                orders.append({
                    'side': 'buy',
                    'price': max(0.01, buy_price),
                    'size': layer_size,
                    'is_yes': True,
                    'order_type': 'limit',
                    'layer': i + 1,
                    'strategy': 'core_liquidity',
                    'priority': 'high'
                })
            
            # Sell orders (above center)
            sell_price = center_price + price_offset
            if sell_price < 0.99:
                orders.append({
                    'side': 'sell',
                    'price': min(0.99, sell_price),
                    'size': layer_size,
                    'is_yes': True,
                    'order_type': 'limit',
                    'layer': i + 1,
                    'strategy': 'core_liquidity',
                    'priority': 'high'
                })
        
        return orders
    
    async def _generate_specialized_orders(
        self,
        center_price: float,
        confidence: float,
        volatility_factor: float,
        market_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate specialized order types for advanced market making."""
        
        orders = []
        base_size = self.config.orderbook_base_order_size
        
        # Iceberg orders for large hidden liquidity
        if confidence > 0.8:
            iceberg_size = base_size * 8
            visible_size = base_size * 0.3
            
            # Large hidden buy order
            orders.append({
                'side': 'buy',
                'price': center_price * 0.85,  # 15% below center
                'size': iceberg_size,
                'visible_size': visible_size,
                'is_yes': True,
                'order_type': 'iceberg',
                'strategy': 'hidden_liquidity',
                'priority': 'medium'
            })
            
            # Large hidden sell order
            orders.append({
                'side': 'sell',
                'price': center_price * 1.15,  # 15% above center
                'size': iceberg_size,
                'visible_size': visible_size,
                'is_yes': True,
                'order_type': 'iceberg',
                'strategy': 'hidden_liquidity',
                'priority': 'medium'
            })
        
        # Momentum-based orders
        momentum = market_analysis.get('momentum', 0)
        if abs(momentum) > 0.2:  # Significant momentum
            momentum_size = base_size * 2
            
            if momentum > 0:  # Positive momentum - place buy orders
                orders.append({
                    'side': 'buy',
                    'price': center_price * 0.95,  # 5% below center
                    'size': momentum_size,
                    'is_yes': True,
                    'order_type': 'momentum',
                    'strategy': 'momentum_following',
                    'priority': 'high'
                })
            else:  # Negative momentum - place sell orders
                orders.append({
                    'side': 'sell',
                    'price': center_price * 1.05,  # 5% above center
                    'size': momentum_size,
                    'is_yes': True,
                    'order_type': 'momentum',
                    'strategy': 'momentum_following',
                    'priority': 'high'
                })
        
        # Volatility-based orders
        if volatility_factor > 0.15:  # High volatility
            vol_size = base_size * 1.5
            vol_spread = volatility_factor * 0.5
            
            # Wide spread orders to capture volatility
            orders.extend([
                {
                    'side': 'buy',
                    'price': center_price * (1 - vol_spread),
                    'size': vol_size,
                    'is_yes': True,
                    'order_type': 'volatility',
                    'strategy': 'volatility_capture',
                    'priority': 'medium'
                },
                {
                    'side': 'sell',
                    'price': center_price * (1 + vol_spread),
                    'size': vol_size,
                    'is_yes': True,
                    'order_type': 'volatility',
                    'strategy': 'volatility_capture',
                    'priority': 'medium'
                }
            ])
        
        return orders
    
    async def _generate_risk_management_orders(
        self,
        center_price: float,
        derivative_params: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate risk management orders (stop losses, take profits)."""
        
        orders = []
        base_size = self.config.orderbook_base_order_size
        confidence = derivative_params.get('confidence', 0.7)
        
        # Stop loss orders
        stop_loss_threshold = 0.3  # 30% loss threshold
        stop_loss_price = center_price * (1 - stop_loss_threshold)
        
        if stop_loss_price > 0.05:
            orders.append({
                'side': 'sell',
                'price': stop_loss_price,
                'size': base_size * 3,  # Larger size for risk management
                'is_yes': True,
                'order_type': 'stop_loss',
                'trigger_price': stop_loss_price,
                'strategy': 'risk_management',
                'priority': 'critical'
            })
        
        # Take profit orders
        take_profit_threshold = 0.4 * confidence  # Higher confidence = higher profit target
        take_profit_price = center_price * (1 + take_profit_threshold)
        
        if take_profit_price < 0.95:
            orders.append({
                'side': 'sell',
                'price': take_profit_price,
                'size': base_size * 2,
                'is_yes': True,
                'order_type': 'take_profit',
                'trigger_price': take_profit_price,
                'strategy': 'risk_management',
                'priority': 'high'
            })
        
        # Trailing stop orders for dynamic risk management
        if confidence > 0.75:
            trailing_distance = 0.1  # 10% trailing distance
            orders.append({
                'side': 'sell',
                'price': center_price * 0.9,  # Initial price
                'size': base_size * 1.5,
                'is_yes': True,
                'order_type': 'trailing_stop',
                'trailing_distance': trailing_distance,
                'strategy': 'dynamic_risk_management',
                'priority': 'high'
            })
        
        return orders
    
    async def _generate_market_making_orders(
        self,
        center_price: float,
        spread: float,
        confidence: float
    ) -> List[Dict[str, Any]]:
        """Generate market making orders for both YES and NO sides."""
        
        orders = []
        base_size = self.config.orderbook_base_order_size
        
        # NO side market making (complement to YES orders)
        no_center_price = 1.0 - center_price
        no_layers = max(2, self.config.orderbook_order_layers // 2)
        
        for i in range(no_layers):
            layer_factor = (i + 1) / no_layers
            price_offset = spread * layer_factor
            layer_size = base_size * 0.7 * (1 + confidence * 0.5)  # Smaller NO orders
            
            # NO buy orders
            no_buy_price = no_center_price - price_offset
            if no_buy_price > 0.01:
                orders.append({
                    'side': 'buy',
                    'price': max(0.01, no_buy_price),
                    'size': layer_size,
                    'is_yes': False,
                    'order_type': 'limit',
                    'layer': i + 1,
                    'strategy': 'no_side_market_making',
                    'priority': 'medium'
                })
            
            # NO sell orders
            no_sell_price = no_center_price + price_offset
            if no_sell_price < 0.99:
                orders.append({
                    'side': 'sell',
                    'price': min(0.99, no_sell_price),
                    'size': layer_size,
                    'is_yes': False,
                    'order_type': 'limit',
                    'layer': i + 1,
                    'strategy': 'no_side_market_making',
                    'priority': 'medium'
                })
        
        return orders
    
    async def _encode_advanced_metadata(
        self,
        orders: List[Dict[str, Any]],
        market_analysis: Dict[str, Any]
    ) -> bytes:
        """Encode orderbook and analysis data with advanced compression."""
        
        try:
            # Create comprehensive metadata
            metadata = {
                'version': '2.0',
                'orderbook': {
                    'orders': self._compress_orders(orders),
                    'total_orders': len(orders),
                    'total_liquidity': sum(order['size'] for order in orders),
                    'strategies': list(set(order.get('strategy', 'unknown') for order in orders)),
                },
                'market_analysis': {
                    'trend_score': market_analysis.get('trend_score', 0),
                    'volatility': market_analysis.get('volatility', 0),
                    'momentum': market_analysis.get('momentum', 0),
                    'confidence': market_analysis.get('confidence', 0.5),
                    'dominant_signal': market_analysis.get('dominant_signal', 'unknown'),
                },
                'creation_info': {
                    'created_at': datetime.now().isoformat(),
                    'creator_type': 'ai_trend_analysis',
                    'version': '2.0',
                }
            }
            
            # Serialize and compress
            json_data = json.dumps(metadata, separators=(',', ':')).encode('utf-8')
            compressed_data = gzip.compress(json_data, compresslevel=9)
            
            compression_ratio = len(json_data) / len(compressed_data)
            logger.info(
                f"Encoded advanced metadata: {len(json_data)} -> {len(compressed_data)} bytes "
                f"(compression ratio: {compression_ratio:.2f}x)"
            )
            
            return compressed_data
            
        except Exception as e:
            logger.error(f"Error encoding advanced metadata: {e}")
            # Fallback to simple encoding
            simple_metadata = {'orders': orders[:10]}  # Truncate to first 10 orders
            return json.dumps(simple_metadata).encode('utf-8')[:2000]  # Limit size
    
    def _compress_orders(self, orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Compress order data for efficient storage."""
        
        compressed_orders = []
        
        for order in orders:
            compressed_order = {
                's': order['side'][0],  # 'b' or 's'
                'p': round(order['price'], 4),
                'sz': round(order['size'], 4),
                'y': order['is_yes'],
                't': order.get('order_type', 'limit')[:1],  # First letter
                'l': order.get('layer', 0),
                'st': order.get('strategy', 'unknown')[:3],  # First 3 letters
                'pr': order.get('priority', 'medium')[:1],  # First letter
            }
            
            # Add special fields for special order types
            if 'visible_size' in order:
                compressed_order['vs'] = round(order['visible_size'], 4)
            if 'trigger_price' in order:
                compressed_order['tp'] = round(order['trigger_price'], 4)
            if 'trailing_distance' in order:
                compressed_order['td'] = round(order['trailing_distance'], 4)
            
            compressed_orders.append(compressed_order)
        
        return compressed_orders
    
    async def _manage_market_orders(self, market_id: str) -> None:
        """Manage orders for a created market (placeholder for future implementation)."""
        
        try:
            logger.info(f"Starting order management for market: {market_id}")
            
            # In a real implementation, this would:
            # 1. Monitor market activity
            # 2. Adjust orders based on market conditions
            # 3. Rebalance liquidity
            # 4. Execute risk management strategies
            # 5. Update order book based on trends
            
            # For now, just update market status
            if market_id in self.created_markets:
                self.created_markets[market_id]['status'] = 'managed'
                
        except Exception as e:
            logger.error(f"Error managing market orders for {market_id}: {e}")
    
    def get_market_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics for created markets."""
        
        return {
            'overall_stats': self.stats.copy(),
            'active_markets': len(self.created_markets),
            'total_active_orders': sum(len(orders) for orders in self.active_orders.values()),
            'market_breakdown': {
                market_id: {
                    'description': info['description'][:50] + "...",
                    'created_at': info['created_at'].isoformat(),
                    'status': info['status'],
                    'order_count': len(self.active_orders.get(market_id, [])),
                    'initial_stake': info['derivative_params']['stake_amount'],
                }
                for market_id, info in self.created_markets.items()
            }
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check for orderbook market creator."""
        
        return {
            'status': 'healthy',
            'message': 'Orderbook market creator is operating normally',
            'markets_created': self.stats['markets_created'],
            'success_rate': (
                self.stats['successful_trades'] / max(self.stats['total_orders_placed'], 1)
            ),
            'last_activity': datetime.now().isoformat(),
        }