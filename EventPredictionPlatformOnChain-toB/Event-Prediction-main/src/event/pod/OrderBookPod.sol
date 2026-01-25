// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./PodBase.sol";
import "./OrderBookPodStorage.sol";
import "../../interfaces/event/IOrderBookPod.sol";
import "../../interfaces/event/IFundingPod.sol";
import "../../interfaces/event/IFeeVaultPod.sol";

/**
 * @title OrderBookPod
 * @notice 订单簿 Pod - 负责订单撮合和持仓管理
 * @dev 集成 FundingPod 进行资金管理
 */
contract OrderBookPod is PodBase, OrderBookPodStorage {
    // ============ Modifiers ============

    modifier onlyEventPod() {
        require(msg.sender == eventPod, "OrderBookPod: only eventPod");
        _;
    }

    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address _eventPod,
        address _fundingPod,
        address _feeVaultPod,
        address _orderBookManager
    ) public initializer {
        _initializeOwner(initialOwner);
        _initializePausable();
        eventPod = _eventPod;
        fundingPod = _fundingPod;
        feeVaultPod = _feeVaultPod;
        orderBookManager = _orderBookManager;
        nextOrderId = 1; // Start from 1
    }

    // ============ 外部函数 External Functions ============

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
    ) external whenNotPaused returns (uint256 orderId) {
        address user = msg.sender; // Direct caller

        if (!supportedEvents[eventId]) revert EventNotSupported(eventId);
        EventOrderBook storage eventOrderBook = eventOrderBooks[eventId];
        if (outcomeIndex >= eventOrderBook.outcomeCount) {
            revert OutcomeNotSupported(eventId, outcomeIndex);
        }
        if (!supportedOutcomes[eventId][outcomeIndex]) revert OutcomeNotSupported(eventId, outcomeIndex);
        if (eventSettled[eventId]) revert EventAlreadySettled(eventId);
        if (price == 0 || price > MAX_PRICE) revert InvalidPrice(price);
        if (price % TICK_SIZE != 0) revert PriceNotAlignedWithTickSize(price);
        if (amount == 0) revert InvalidAmount(amount);

        // 计算手续费
        uint256 fee = 0;
        if (feeVaultPod != address(0)) {
            fee = IFeeVaultPod(feeVaultPod).calculateFee(amount, "trade");
        }

        // 集成 FundingPod: 锁定下单所需资金或 Long Token
        // 买单锁定 USDT (包含手续费): (amount + fee) * price / MAX_PRICE
        // 卖单锁定 Long Token (包含手续费): amount + fee
        uint256 requiredAmount = side == OrderSide.Buy ? ((amount + fee) * price) / MAX_PRICE : (amount + fee);

        IFundingPod(fundingPod)
            .lockForOrder(
                user, // 用户地址
                nextOrderId, // 订单 ID
                tokenAddress, // Token 地址
                side == OrderSide.Buy, // 是否为买单
                requiredAmount, // 锁定数量
                eventId, // 事件 ID
                outcomeIndex // 结果索引
            );

        // 收取手续费
        if (fee > 0 && feeVaultPod != address(0)) {
            IFeeVaultPod(feeVaultPod)
                .collectFee(
                    tokenAddress,
                    user, // 使用传入的真实用户地址
                    fee,
                    eventId,
                    "trade"
                );
        }

        orderId = nextOrderId++;
        orders[orderId] = Order({
            orderId: orderId,
            user: user, // 使用传入的真实用户地址
            eventId: eventId,
            outcomeIndex: outcomeIndex,
            side: side,
            price: price,
            amount: amount,
            filledAmount: 0,
            remainingAmount: amount,
            status: OrderStatus.Pending,
            timestamp: block.timestamp,
            tokenAddress: tokenAddress
        });
        userOrders[user].push(orderId);

        _matchOrder(orderId);

        if (orders[orderId].status == OrderStatus.Pending || orders[orderId].status == OrderStatus.Partial) {
            _addToOrderBook(orderId);
        }

        emit OrderPlaced(
            orderId,
            user, // 使用传入的真实用户地址
            eventId,
                outcomeIndex,
                side,
                price,
                amount
        );
    }

    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];

        if (eventSettled[order.eventId]) {
            revert EventAlreadySettled(order.eventId);
        }
        if (order.status != OrderStatus.Pending && order.status != OrderStatus.Partial) {
            revert CannotCancelOrder(orderId);
        }

        _removeFromOrderBook(orderId);

        order.status = OrderStatus.Cancelled;

        if (order.remainingAmount > 0) {
            // 集成 FundingPod: 解锁剩余未成交资金或 Long Token
            IFundingPod(fundingPod)
                .unlockForOrder(
                    order.user,
                    orderId,
                    order.tokenAddress,
                    order.side == OrderSide.Buy, // 是否为买单
                    order.eventId,
                    order.outcomeIndex
                );
        }

        emit OrderCancelled(orderId, order.user, order.remainingAmount);
    }

    function settleEvent(uint256 eventId, uint8 winningOutcomeIndex) external onlyEventPod {
        if (!supportedEvents[eventId]) revert EventNotSupported(eventId);
        if (eventSettled[eventId]) revert EventAlreadySettled(eventId);
        if (!supportedOutcomes[eventId][winningOutcomeIndex]) {
            revert OutcomeNotSupported(eventId, winningOutcomeIndex);
        }

        eventSettled[eventId] = true;
        eventResults[eventId] = winningOutcomeIndex;

        _cancelAllPendingOrders(eventId);
        _settlePositions(eventId, winningOutcomeIndex);

        emit EventSettled(eventId, winningOutcomeIndex);
    }

    function addEvent(uint256 eventId, uint8 outcomeCount) external {
        require(!supportedEvents[eventId], "OrderBookPod: event exists");
        require(outcomeCount > 0 && outcomeCount <= 32, "OrderBookPod: invalid outcomeCount");
        supportedEvents[eventId] = true;

        EventOrderBook storage eventOrderBook = eventOrderBooks[eventId];
        eventOrderBook.outcomeCount = outcomeCount;
        for (uint8 i = 0; i < outcomeCount; i++) {
            supportedOutcomes[eventId][i] = true;
        }

        // 集成 FundingPod: 注册事件的结果选项 (用于完整集合铸造)
        IFundingPod(fundingPod).registerEvent(eventId, outcomeCount);

        emit EventAdded(eventId, outcomeCount);
    }

    function getBestBid(
        uint256 eventId,
        uint8 outcomeIndex
    ) external view returns (uint256 price, uint256 amount) {
        EventOrderBook storage eventOrderBook = eventOrderBooks[eventId];
        OutcomeOrderBook storage outcomeOrderBook = eventOrderBook.outcomeOrderBooks[outcomeIndex];

        if (outcomeOrderBook.buyPriceLevels.length > 0) {
            price = outcomeOrderBook.buyPriceLevels[0];
            amount = _totalAtPrice(outcomeOrderBook.buyOrdersByPrice[price]);
        }
    }

    function getBestAsk(
        uint256 eventId,
        uint8 outcomeIndex
    ) external view returns (uint256 price, uint256 amount) {
        EventOrderBook storage eventOrderBook = eventOrderBooks[eventId];
        OutcomeOrderBook storage outcomeOrderBook = eventOrderBook.outcomeOrderBooks[outcomeIndex];

        if (outcomeOrderBook.sellPriceLevels.length > 0) {
            price = outcomeOrderBook.sellPriceLevels[0];
            amount = _totalAtPrice(outcomeOrderBook.sellOrdersByPrice[price]);
        }
    }

    // ------------------------------------------------------------
    // Internal: matching 撮合
    // ------------------------------------------------------------
    function _matchOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        EventOrderBook storage eventOrderBook = eventOrderBooks[order.eventId];
        OutcomeOrderBook storage outcomeOrderBook = eventOrderBook.outcomeOrderBooks[order.outcomeIndex];

        if (order.side == OrderSide.Buy) {
            _matchBuy(orderId, outcomeOrderBook);
        } else {
            _matchSell(orderId, outcomeOrderBook);
        }
    }

    function _matchBuy(uint256 buyOrderId, OutcomeOrderBook storage book) internal {
        Order storage buyOrder = orders[buyOrderId];

        for (uint256 i = 0; i < book.sellPriceLevels.length && buyOrder.remainingAmount > 0; i++) {
            uint256 sellPrice = book.sellPriceLevels[i];
            if (sellPrice > buyOrder.price) break;

            uint256[] storage sellOrders = book.sellOrdersByPrice[sellPrice];
            for (uint256 j = 0; j < sellOrders.length && buyOrder.remainingAmount > 0; j++) {
                uint256 sellOrderId = sellOrders[j];
                Order storage sellOrder = orders[sellOrderId];
                if (sellOrder.status == OrderStatus.Cancelled || sellOrder.remainingAmount == 0) continue;
                if (buyOrder.eventId != sellOrder.eventId) {
                    revert EventMismatch(buyOrder.eventId, sellOrder.eventId);
                }
                if (buyOrder.outcomeIndex != sellOrder.outcomeIndex) {
                    revert OutcomeMismatch(buyOrder.outcomeIndex, sellOrder.outcomeIndex);
                }
                _executeMatch(buyOrderId, sellOrderId);
            }
        }
    }

    function _matchSell(uint256 sellOrderId, OutcomeOrderBook storage book) internal {
        Order storage sellOrder = orders[sellOrderId];

        for (uint256 i = 0; i < book.buyPriceLevels.length && sellOrder.remainingAmount > 0; i++) {
            uint256 buyPrice = book.buyPriceLevels[i];
            if (buyPrice < sellOrder.price) break;

            uint256[] storage buyOrders = book.buyOrdersByPrice[buyPrice];
            for (uint256 j = 0; j < buyOrders.length && sellOrder.remainingAmount > 0; j++) {
                uint256 buyOrderId = buyOrders[j];
                Order storage buyOrder = orders[buyOrderId];
                if (buyOrder.status == OrderStatus.Cancelled || buyOrder.remainingAmount == 0) continue;
                if (buyOrder.eventId != sellOrder.eventId) {
                    revert EventMismatch(buyOrder.eventId, sellOrder.eventId);
                }
                if (buyOrder.outcomeIndex != sellOrder.outcomeIndex) {
                    revert OutcomeMismatch(buyOrder.outcomeIndex, sellOrder.outcomeIndex);
                }
                _executeMatch(buyOrderId, sellOrderId);
            }
        }
    }

    function _executeMatch(uint256 buyOrderId, uint256 sellOrderId) internal {
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];

        uint256 matchAmount =
            buyOrder.remainingAmount < sellOrder.remainingAmount ? buyOrder.remainingAmount : sellOrder.remainingAmount;

        uint256 matchPrice = sellOrder.price;

        buyOrder.filledAmount += matchAmount;
        buyOrder.remainingAmount -= matchAmount;
        sellOrder.filledAmount += matchAmount;
        sellOrder.remainingAmount -= matchAmount;

        // ✅ 计算撮合手续费
        uint256 matchFee = 0;
        if (feeVaultPod != address(0)) {
            matchFee = IFeeVaultPod(feeVaultPod).calculateFee(matchAmount, "trade");
        }

        // ✅ 持仓管理: 记录买家持仓增加
        positions[buyOrder.eventId][buyOrder.outcomeIndex][buyOrder.user] += matchAmount;
        _recordPositionHolder(buyOrder.eventId, buyOrder.outcomeIndex, buyOrder.user);

        // ✅ 持仓管理: 卖家持仓减少(卖出做空)
        if (positions[sellOrder.eventId][sellOrder.outcomeIndex][sellOrder.user] >= matchAmount) {
            positions[sellOrder.eventId][sellOrder.outcomeIndex][sellOrder.user] -= matchAmount;
        } else {
            positions[sellOrder.eventId][sellOrder.outcomeIndex][sellOrder.user] = 0;
        }

        // 集成 FundingPod: 资金结算 (虚拟 Long Token 模型)
        IFundingPod(fundingPod)
            .settleMatchedOrder(
                buyOrderId, // 买单 ID
                sellOrderId, // 卖单 ID
                buyOrder.user, // 买家地址
                sellOrder.user, // 卖家地址
                buyOrder.tokenAddress, // Token 地址
                matchAmount, // 成交数量
                matchPrice, // 成交价格
                buyOrder.eventId, // 事件 ID
                buyOrder.outcomeIndex // 结果索引 (买卖同一 outcome)
            );

        // ✅ 收取撮合手续费
        if (matchFee > 0 && feeVaultPod != address(0)) {
            // 买卖双方各支付一半手续费
            uint256 buyerFee = matchFee / 2;
            uint256 sellerFee = matchFee - buyerFee;

            if (buyerFee > 0) {
                IFeeVaultPod(feeVaultPod)
                    .collectFee(buyOrder.tokenAddress, buyOrder.user, buyerFee, buyOrder.eventId, "trade");
            }

            if (sellerFee > 0) {
                IFeeVaultPod(feeVaultPod)
                    .collectFee(sellOrder.tokenAddress, sellOrder.user, sellerFee, sellOrder.eventId, "trade");
            }
        }

        if (buyOrder.remainingAmount == 0) {
            buyOrder.status = OrderStatus.Filled;
            _removeFromOrderBook(buyOrderId);
        } else if (buyOrder.filledAmount > 0) {
            buyOrder.status = OrderStatus.Partial;
        }

        if (sellOrder.remainingAmount == 0) {
            sellOrder.status = OrderStatus.Filled;
            _removeFromOrderBook(sellOrderId);
        } else if (sellOrder.filledAmount > 0) {
            sellOrder.status = OrderStatus.Partial;
        }

        emit OrderMatched(buyOrderId, sellOrderId, buyOrder.eventId, buyOrder.outcomeIndex, matchPrice, matchAmount);
    }

    // ------------------------------------------------------------
    // Internal: orderbook ops 订单簿操作
    // ------------------------------------------------------------
    function _addToOrderBook(uint256 orderId) internal {
        Order storage order = orders[orderId];
        EventOrderBook storage eventOrderBook = eventOrderBooks[order.eventId];
        OutcomeOrderBook storage outcomeOrderBook = eventOrderBook.outcomeOrderBooks[order.outcomeIndex];

        if (order.side == OrderSide.Buy) {
            if (outcomeOrderBook.buyOrdersByPrice[order.price].length == 0) {
                _insertBuyPrice(outcomeOrderBook, order.price);
            }
            outcomeOrderBook.buyOrdersByPrice[order.price].push(orderId);
        } else {
            if (outcomeOrderBook.sellOrdersByPrice[order.price].length == 0) {
                _insertSellPrice(outcomeOrderBook, order.price);
            }
            outcomeOrderBook.sellOrdersByPrice[order.price].push(orderId);
        }
    }

    function _removeFromOrderBook(uint256 orderId) internal {
        Order storage order = orders[orderId];
        EventOrderBook storage eventOrderBook = eventOrderBooks[order.eventId];
        OutcomeOrderBook storage outcomeOrderBook = eventOrderBook.outcomeOrderBooks[order.outcomeIndex];

        if (order.side == OrderSide.Buy) {
            uint256[] storage priceOrders = outcomeOrderBook.buyOrdersByPrice[order.price];
            _removeFromArray(priceOrders, orderId);
            if (priceOrders.length == 0) {
                _removeBuyPrice(outcomeOrderBook, order.price);
            }
        } else {
            uint256[] storage priceOrders = outcomeOrderBook.sellOrdersByPrice[order.price];
            _removeFromArray(priceOrders, orderId);
            if (priceOrders.length == 0) {
                _removeSellPrice(outcomeOrderBook, order.price);
            }
        }
    }

    function _insertBuyPrice(OutcomeOrderBook storage orderBook, uint256 price) internal {
        uint256 i = 0;
        while (i < orderBook.buyPriceLevels.length && orderBook.buyPriceLevels[i] > price) {
            i++;
        }
        if (i < orderBook.buyPriceLevels.length && orderBook.buyPriceLevels[i] == price) return;

        orderBook.buyPriceLevels.push(0);
        for (uint256 j = orderBook.buyPriceLevels.length - 1; j > i; j--) {
            orderBook.buyPriceLevels[j] = orderBook.buyPriceLevels[j - 1];
        }
        orderBook.buyPriceLevels[i] = price;
    }

    function _insertSellPrice(OutcomeOrderBook storage orderBook, uint256 price) internal {
        uint256 i = 0;
        while (i < orderBook.sellPriceLevels.length && orderBook.sellPriceLevels[i] < price) {
            i++;
        }
        if (i < orderBook.sellPriceLevels.length && orderBook.sellPriceLevels[i] == price) return;

        orderBook.sellPriceLevels.push(0);
        for (uint256 j = orderBook.sellPriceLevels.length - 1; j > i; j--) {
            orderBook.sellPriceLevels[j] = orderBook.sellPriceLevels[j - 1];
        }
        orderBook.sellPriceLevels[i] = price;
    }

    function _removeBuyPrice(OutcomeOrderBook storage orderBook, uint256 price) internal {
        for (uint256 i = 0; i < orderBook.buyPriceLevels.length; i++) {
            if (orderBook.buyPriceLevels[i] == price) {
                for (uint256 j = i; j < orderBook.buyPriceLevels.length - 1; j++) {
                    orderBook.buyPriceLevels[j] = orderBook.buyPriceLevels[j + 1];
                }
                orderBook.buyPriceLevels.pop();
                break;
            }
        }
    }

    function _removeSellPrice(OutcomeOrderBook storage orderBook, uint256 price) internal {
        for (uint256 i = 0; i < orderBook.sellPriceLevels.length; i++) {
            if (orderBook.sellPriceLevels[i] == price) {
                for (uint256 j = i; j < orderBook.sellPriceLevels.length - 1; j++) {
                    orderBook.sellPriceLevels[j] = orderBook.sellPriceLevels[j + 1];
                }
                orderBook.sellPriceLevels.pop();
                break;
            }
        }
    }

    function _removeFromArray(uint256[] storage array, uint256 value) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    function _totalAtPrice(uint256[] storage orderIds) internal view returns (uint256 total) {
        for (uint256 i = 0; i < orderIds.length; i++) {
            Order storage order = orders[orderIds[i]];
            if (order.status == OrderStatus.Pending || order.status == OrderStatus.Partial) {
                total += order.remainingAmount;
            }
        }
    }

    // ------------------------------------------------------------
    // Internal: cancel & settle 撤单与结算
    // ------------------------------------------------------------
    function _cancelAllPendingOrders(uint256 eventId) internal {
        EventOrderBook storage eventOrderBook = eventOrderBooks[eventId];

        for (uint8 i = 0; i < eventOrderBook.outcomeCount; i++) {
            OutcomeOrderBook storage outcomeOrderBook = eventOrderBook.outcomeOrderBooks[i];
            _cancelMarketOrders(outcomeOrderBook);
        }
    }

    function _cancelMarketOrders(OutcomeOrderBook storage marketOrderBook) internal {
        for (uint256 i = 0; i < marketOrderBook.buyPriceLevels.length; i++) {
            uint256 price = marketOrderBook.buyPriceLevels[i];
            uint256[] storage ids = marketOrderBook.buyOrdersByPrice[price];
            for (uint256 j = 0; j < ids.length; j++) {
                Order storage order = orders[ids[j]];
                if (order.status == OrderStatus.Pending || order.status == OrderStatus.Partial) {
                    order.status = OrderStatus.Cancelled;

                    // 集成 FundingPod: 批量撤单解锁资金或 Long Token
                    if (order.remainingAmount > 0) {
                        IFundingPod(fundingPod)
                            .unlockForOrder(
                                order.user,
                                ids[j], // orderId
                                order.tokenAddress,
                                order.side == OrderSide.Buy, // 是否为买单
                                order.eventId,
                                order.outcomeIndex
                            );
                    }
                }
            }
        }

        for (uint256 i = 0; i < marketOrderBook.sellPriceLevels.length; i++) {
            uint256 price = marketOrderBook.sellPriceLevels[i];
            uint256[] storage ids = marketOrderBook.sellOrdersByPrice[price];
            for (uint256 j = 0; j < ids.length; j++) {
                Order storage order = orders[ids[j]];
                if (order.status == OrderStatus.Pending || order.status == OrderStatus.Partial) {
                    order.status = OrderStatus.Cancelled;

                    // 集成 FundingPod: 批量撤单解锁资金或 Long Token
                    if (order.remainingAmount > 0) {
                        IFundingPod(fundingPod)
                            .unlockForOrder(
                                order.user,
                                ids[j], // orderId
                                order.tokenAddress,
                                order.side == OrderSide.Buy, // 是否为买单
                                order.eventId,
                                order.outcomeIndex
                            );
                    }
                }
            }
        }
    }

    // ✅ 结算持仓 - 集成 FundingPod 分配奖金
    function _settlePositions(uint256 eventId, uint8 winningOutcomeIndex) internal {
        // 获取获胜结果的所有持仓者
        address[] storage winners = positionHolders[eventId][winningOutcomeIndex];
        if (winners.length == 0) return; // 没有获胜者

        // 构建获胜者和持仓数组
        uint256[] memory winningPositions = new uint256[](winners.length);
        address tokenAddress = address(0); // 需要从订单中获取 token 地址

        // 收集获胜者持仓
        for (uint256 i = 0; i < winners.length; i++) {
            winningPositions[i] = positions[eventId][winningOutcomeIndex][winners[i]];

            // 从该用户的订单中获取 token 地址
            if (tokenAddress == address(0) && userOrders[winners[i]].length > 0) {
                for (uint256 j = 0; j < userOrders[winners[i]].length; j++) {
                    uint256 orderId = userOrders[winners[i]][j];
                    if (orders[orderId].eventId == eventId) {
                        tokenAddress = orders[orderId].tokenAddress;
                        break;
                    }
                }
            }
        }

        // 如果找到了 token 地址,调用 FundingPod 结算
        if (tokenAddress != address(0)) {
            IFundingPod(fundingPod).settleEvent(eventId, winningOutcomeIndex, tokenAddress, winners, winningPositions);
        }
    }

    // ============ 持仓跟踪辅助函数 Position Tracking Helper ============

    /**
     * @notice 记录持仓者(避免重复记录)
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     * @param user 用户地址
     */
    function _recordPositionHolder(uint256 eventId, uint8 outcomeIndex, address user) internal {
        if (!isPositionHolder[eventId][outcomeIndex][user]) {
            positionHolders[eventId][outcomeIndex].push(user);
            isPositionHolder[eventId][outcomeIndex][user] = true;
        }
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取订单信息
     * @param orderId 订单 ID
     * @return order 订单详情
     */
    function getOrder(uint256 orderId) external view returns (Order memory order) {
        return orders[orderId];
    }

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
    ) external view returns (uint256 position) {
        return positions[eventId][outcomeIndex][user];
    }

    // ============ 管理功能 Admin Functions ============

    /**
     * @notice 设置 FundingPod 地址
     * @param _fundingPod FundingPod 地址
     */
    function setFundingPod(address _fundingPod) external onlyOwner {
        require(_fundingPod != address(0), "OrderBookPod: invalid address");
        fundingPod = _fundingPod;
    }

    /**
     * @notice 设置 FeeVaultPod 地址
     * @param _feeVaultPod FeeVaultPod 地址
     */
    function setFeeVaultPod(address _feeVaultPod) external onlyOwner {
        require(_feeVaultPod != address(0), "OrderBookPod: invalid address");
        feeVaultPod = _feeVaultPod;
    }

    /**
     * @notice 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
