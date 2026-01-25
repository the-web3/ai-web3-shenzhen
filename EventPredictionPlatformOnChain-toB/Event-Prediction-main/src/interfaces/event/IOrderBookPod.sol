// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IOrderBookPod {
    enum OrderSide {
        Buy,
        Sell
    }

    enum OrderStatus {
        Pending,
        Partial,
        Filled,
        Cancelled
    }

    struct Order {
        uint256 orderId;
        address user;
        uint256 eventId;
        uint8 outcomeIndex;
        OrderSide side;
        uint256 price;
        uint256 amount;
        uint256 filledAmount;
        uint256 remainingAmount;
        OrderStatus status;
        uint256 timestamp;
        address tokenAddress;
    }

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed user,
        uint256 indexed eventId,
        uint8 outcomeIndex,
        OrderSide side,
        uint256 price,
        uint256 amount
    );

    event OrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        uint256 indexed eventId,
        uint8 outcomeIndex,
        uint256 price,
        uint256 amount
    );

    event OrderCancelled(uint256 indexed orderId, address indexed user, uint256 cancelledAmount);

    event EventSettled(uint256 indexed eventId, uint8 winningOutcomeIndex);

    event EventAdded(uint256 indexed eventId, uint8 outcomeCount);

    error EventNotSupported(uint256 eventId);
    error OutcomeNotSupported(uint256 eventId, uint8 outcomeIndex);
    error EventAlreadySettled(uint256 eventId);
    error InvalidPrice(uint256 price);
    error InvalidAmount(uint256 amount);
    error PriceNotAlignedWithTickSize(uint256 price);
    error NotOrderOwner(uint256 orderId);
    error CannotCancelOrder(uint256 orderId);
    error EventMismatch(uint256 eventId1, uint256 eventId2);
    error OutcomeMismatch(uint8 outcomeIndex1, uint8 outcomeIndex2);

    /**
     * @notice 下单 (Public - users can call directly)
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     * @param side 买卖方向
     * @param price 价格
     * @param amount 数量
     * @param tokenAddress Token 地址
     * @return orderId 订单 ID
     */
    function placeOrder(
        uint256 eventId,
        uint8 outcomeIndex,
        OrderSide side,
        uint256 price,
        uint256 amount,
        address tokenAddress
    ) external returns (uint256 orderId);

    function cancelOrder(uint256 orderId) external;

    function settleEvent(uint256 eventId, uint8 winningOutcomeIndex) external;

    function addEvent(uint256 eventId, uint8 outcomeCount) external;

    function getBestBid(
        uint256 eventId,
        uint8 outcomeIndex
    ) external view returns (uint256 price, uint256 amount);

    function getBestAsk(
        uint256 eventId,
        uint8 outcomeIndex
    ) external view returns (uint256 price, uint256 amount);

    /**
     * @notice 获取订单信息
     * @param orderId 订单 ID
     * @return order 订单详情
     */
    function getOrder(uint256 orderId) external view returns (Order memory order);

    /**
     * @notice 获取用户持仓
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     * @param user 用户地址
     * @return position 持仓数量
     */
    function getPosition(
        uint256 eventId,
        uint8 outcomeIndex,
        address user
    ) external view returns (uint256 position);

    /**
     * @notice 设置 FundingPod 地址
     * @param _fundingPod FundingPod 地址
     */
    function setFundingPod(address _fundingPod) external;
}
