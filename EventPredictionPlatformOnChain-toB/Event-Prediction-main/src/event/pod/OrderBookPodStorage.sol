// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IOrderBookPod.sol";

/**
 * @title OrderBookPodStorage
 * @notice OrderBookPod 的存储层合约
 * @dev 存储订单簿、订单、持仓等数据
 */
abstract contract OrderBookPodStorage is IOrderBookPod {
    // ============ 合约地址 Contract Addresses ============

    /// @notice EventPod 合约地址
    address public eventPod;

    /// @notice FundingPod 合约地址
    address public fundingPod;

    /// @notice FeeVaultPod 合约地址
    address public feeVaultPod;

    /// @notice OrderBookManager 合约地址
    address public orderBookManager;

    // ============ 事件与结果管理 Event & Outcome Management ============

    /// @notice 支持的事件映射
    mapping(uint256 => bool) public supportedEvents;

    /// @notice 支持的结果映射: eventId => outcomeIndex => isSupported
    mapping(uint256 => mapping(uint8 => bool)) public supportedOutcomes;

    // ============ 订单管理 Order Management ============

    /// @notice 下一个订单 ID
    uint256 public nextOrderId;

    /// @notice 订单映射: orderId => Order
    mapping(uint256 => Order) public orders;

    /// @notice 用户订单列表: user => orderIds[]
    mapping(address => uint256[]) public userOrders;

    // ============ 订单簿结构 Order Book Structure ============

    /// @notice 结果订单簿(买单和卖单按价格分组)
    struct OutcomeOrderBook {
        mapping(uint256 => uint256[]) buyOrdersByPrice; // price => orderIds[]
        uint256[] buyPriceLevels; // 买单价格档位(降序)
        mapping(uint256 => uint256[]) sellOrdersByPrice; // price => orderIds[]
        uint256[] sellPriceLevels; // 卖单价格档位(升序)
    }

    /// @notice 事件订单簿(每个结果一个订单簿)
    struct EventOrderBook {
        mapping(uint8 => OutcomeOrderBook) outcomeOrderBooks;
        uint8 outcomeCount;
    }

    /// @notice 事件订单簿映射: eventId => EventOrderBook
    mapping(uint256 => EventOrderBook) internal eventOrderBooks;

    // ============ 持仓管理 Position Management ============

    /// @notice 用户持仓: eventId => outcomeIndex => user => position
    mapping(uint256 => mapping(uint8 => mapping(address => uint256))) public positions;

    /// @notice 事件的所有持仓用户: eventId => outcomeIndex => users[]
    /// @dev 用于事件结算时遍历所有获胜者
    mapping(uint256 => mapping(uint8 => address[])) internal positionHolders;

    /// @notice 用户是否已记录为持仓者: eventId => outcomeIndex => user => isRecorded
    mapping(uint256 => mapping(uint8 => mapping(address => bool))) internal isPositionHolder;

    // ============ 常量 Constants ============

    /// @notice 价格精度(最小变动单位)
    uint256 public constant TICK_SIZE = 10;

    /// @notice 最大价格(基点)
    uint256 public constant MAX_PRICE = 10000;

    // ============ 事件结算 Event Settlement ============

    /// @notice 事件结算状态: eventId => settled
    mapping(uint256 => bool) public eventSettled;

    /// @notice 事件结果: eventId => winningOutcomeIndex
    mapping(uint256 => uint8) public eventResults;
}
