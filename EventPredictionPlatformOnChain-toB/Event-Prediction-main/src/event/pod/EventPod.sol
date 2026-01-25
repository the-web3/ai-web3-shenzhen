// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./PodBase.sol";
import "./EventPodStorage.sol";
import "../../interfaces/event/IEventPod.sol";
import "../../interfaces/event/IOrderBookManager.sol";
import "../../interfaces/event/IOrderBookPod.sol";
import "../../interfaces/oracle/IOracle.sol";

/**
 * @title EventPod
 * @notice 事件 Pod - 负责独立处理一组事件的执行单元
 * @dev 每个 EventPod 独立管理一组事件,实现事件隔离和横向扩展
 */
contract EventPod is PodBase, EventPodStorage, IOracleConsumer {
    // ============ Modifiers ============

    /// @notice 仅 Vendor 可调用
    modifier onlyVendor() {
        require(msg.sender == vendorAddress, "EventPod: only vendor");
        _;
    }

    /// @notice 仅授权的预言机可调用
    modifier onlyAuthorizedOracle() {
        require(msg.sender == oracleAdapter, "EventPod: only authorized oracle adapter");
        _;
    }

    /// @notice 事件必须存在
    modifier eventMustExist(uint256 eventId) {
        require(eventExists[eventId], "EventPod: event does not exist");
        _;
    }

    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice 初始化合约
     * @param initialOwner 初始所有者地址
     * @param _vendorId Vendor ID
     * @param _eventManager EventManager 合约地址
     * @param _orderBookManager OrderBookManager 合约地址
     */
    function initialize(
        address initialOwner,
        uint256 _vendorId,
        address _eventManager,
        address _orderBookManager
    ) external initializer {
        _initializeOwner(initialOwner);
        require(_eventManager != address(0), "EventPod: invalid eventManager");
        require(_orderBookManager != address(0), "EventPod: invalid orderBookManager");
        require(_vendorId > 0, "EventPod: invalid vendorId");

        vendorId = _vendorId;
        vendorAddress = initialOwner;
        eventManager = _eventManager;
        orderBookManager = _orderBookManager;
        nextEventId = 1; // Start from 1
    }

    // ============ 核心功能 Functions ============

    /**
     * @notice 创建事件 (Vendor direct call)
     * @param title 事件标题
     * @param description 事件描述
     * @param deadline 下注截止时间
     * @param settlementTime 预计结算时间
     * @param outcomes 结果选项数组
     * @return eventId 生成的事件 ID
     */
    function createEvent(
        string calldata title,
        string calldata description,
        uint256 deadline,
        uint256 settlementTime,
        Outcome[] calldata outcomes
    ) external onlyVendor returns (uint256 eventId) {
        // Validate parameters
        require(bytes(title).length > 0, "EventPod: empty title");
        require(deadline > block.timestamp, "EventPod: deadline must be in future");
        require(settlementTime > deadline, "EventPod: settlementTime must be after deadline");
        require(outcomes.length >= 2, "EventPod: at least 2 outcomes required");
        require(outcomes.length <= 32, "EventPod: max 32 outcomes");

        // Generate event ID
        eventId = nextEventId++;

        // Create event
        Event storage newEvent = events[eventId];
        newEvent.eventId = eventId;
        newEvent.title = title;
        newEvent.description = description;
        newEvent.deadline = deadline;
        newEvent.settlementTime = settlementTime;
        newEvent.status = EventStatus.Created;
        newEvent.creator = vendorAddress;
        newEvent.winningOutcomeIndex = 0;
        newEvent.outcomes = outcomes;

        // Mark event exists
        eventExists[eventId] = true;

        // Add to active list
        _addToActiveList(eventId);

        emit EventCreated(eventId, title, deadline, outcomes.length);
    }

    /**
     * @notice 请求预言机结果 (Vendor direct call)
     * @param eventId 事件 ID
     * @return requestId 预言机请求 ID
     * @dev TODO: Implement oracle submission logic
     */
    function requestOracleResult(
        uint256 eventId
    ) external onlyVendor eventMustExist(eventId) returns (bytes32 requestId) {
        Event storage evt = events[eventId];
        require(evt.status == EventStatus.Active, "EventPod: event not active");
        require(block.timestamp >= evt.settlementTime, "EventPod: settlement time not reached");

        // TODO: Implement oracle submission logic
        // Structure ready: Pod submits event data to oracle
        // Oracle resolves externally and calls fulfillResult()

        // For now, just return empty bytes32
        requestId = bytes32(0);

        // Store request mapping
        eventOracleRequests[eventId] = requestId;
    }

    /**
     * @notice 更新事件状态
     * @param eventId 事件 ID
     * @param newStatus 新状态
     */
    function updateEventStatus(uint256 eventId, EventStatus newStatus) external onlyVendor eventMustExist(eventId) {
        Event storage evt = events[eventId];
        EventStatus oldStatus = evt.status;

        // 状态机验证
        require(_isValidStatusTransition(oldStatus, newStatus), "EventPod: invalid status transition");

        evt.status = newStatus;

        // 如果变为非活跃状态,从活跃列表移除
        if (newStatus == EventStatus.Settled || newStatus == EventStatus.Cancelled) {
            _removeFromActiveList(eventId);
        }

        emit EventStatusChanged(eventId, oldStatus, newStatus);
    }

    /**
     * @notice 接收预言机结果并结算事件 (实现 IOracleConsumer 接口)
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof 预言机证明数据
     */
    function fulfillResult(
        uint256 eventId,
        uint8 winningOutcomeIndex,
        bytes calldata proof
    ) external override onlyAuthorizedOracle eventMustExist(eventId) {
        _settleEvent(eventId, winningOutcomeIndex, proof);
    }

    /**
     * @notice 结算事件 (实现 IEventPod 接口,兼容层)
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof 预言机证明数据
     */
    function settleEvent(
        uint256 eventId,
        uint8 winningOutcomeIndex,
        bytes calldata proof
    ) external override onlyAuthorizedOracle eventMustExist(eventId) {
        _settleEvent(eventId, winningOutcomeIndex, proof);
    }

    /**
     * @notice 内部函数: 结算事件逻辑
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof 预言机证明数据 (Merkle Proof)
     */
    function _settleEvent(uint256 eventId, uint8 winningOutcomeIndex, bytes calldata proof) internal {
        Event storage evt = events[eventId];

        require(evt.status == EventStatus.Active, "EventPod: event not active");
        require(block.timestamp >= evt.settlementTime, "EventPod: settlement time not reached");

        // 验证 winningOutcomeIndex 是否有效
        require(
            winningOutcomeIndex < uint8(evt.outcomes.length),
            "EventPod: invalid winning outcome index"
        );

        // 验证 Merkle Proof
        _verifyMerkleProof(eventId, winningOutcomeIndex, proof);

        // 更新事件状态
        evt.status = EventStatus.Settled;
        evt.winningOutcomeIndex = winningOutcomeIndex;

        // 从活跃列表移除
        _removeFromActiveList(eventId);

        // 通过 OrderBookManager 获取 vendor 的 OrderBookPod 并触发结算
        address orderBookPodAddress = IOrderBookManager(orderBookManager).getVendorOrderBookPod(vendorId);
        require(orderBookPodAddress != address(0), "EventPod: orderBookPod not found");

        IOrderBookPod orderBookPod = IOrderBookPod(orderBookPodAddress);
        orderBookPod.settleEvent(eventId, winningOutcomeIndex);

        emit EventSettled(eventId, winningOutcomeIndex, block.timestamp);
        emit OracleResultReceived(eventId, winningOutcomeIndex, msg.sender);
    }

    /**
     * @notice 取消事件
     * @param eventId 事件 ID
     * @param reason 取消原因
     */
    function cancelEvent(uint256 eventId, string calldata reason) external onlyVendor eventMustExist(eventId) {
        Event storage evt = events[eventId];

        require(
            evt.status == EventStatus.Created || evt.status == EventStatus.Active,
            "EventPod: cannot cancel settled event"
        );

        evt.status = EventStatus.Cancelled;

        // 从活跃列表移除
        _removeFromActiveList(eventId);

        emit EventCancelled(eventId, reason);
    }

    // ============ 内部函数 Internal Functions ============

    /**
     * @notice 添加事件到活跃列表
     * @param eventId 事件 ID
     */
    function _addToActiveList(uint256 eventId) internal {
        if (!isEventActive[eventId]) {
            activeEventIndex[eventId] = activeEventIds.length;
            activeEventIds.push(eventId);
            isEventActive[eventId] = true;
        }
    }

    /**
     * @notice 从活跃列表移除事件
     * @param eventId 事件 ID
     */
    function _removeFromActiveList(uint256 eventId) internal {
        if (isEventActive[eventId]) {
            uint256 index = activeEventIndex[eventId];
            uint256 lastIndex = activeEventIds.length - 1;

            if (index != lastIndex) {
                uint256 lastEventId = activeEventIds[lastIndex];
                activeEventIds[index] = lastEventId;
                activeEventIndex[lastEventId] = index;
            }

            activeEventIds.pop();
            delete activeEventIndex[eventId];
            isEventActive[eventId] = false;
        }
    }

    /**
     * @notice 验证状态转换是否合法
     * @param oldStatus 旧状态
     * @param newStatus 新状态
     * @return valid 是否合法
     */
    function _isValidStatusTransition(EventStatus oldStatus, EventStatus newStatus) internal pure returns (bool) {
        // 状态机规则:
        // Created -> Active
        // Active -> Settled/Cancelled
        // Settled/Cancelled -> (终态,不可转换)

        if (oldStatus == EventStatus.Created) {
            return newStatus == EventStatus.Active;
        } else if (oldStatus == EventStatus.Active) {
            return newStatus == EventStatus.Settled || newStatus == EventStatus.Cancelled;
        }

        return false; // Settled 和 Cancelled 是终态
    }

    /**
     * @notice 验证 Merkle Proof
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof Merkle Proof 证明数据
     * @dev proof 格式: abi.encode(bytes32[] merkleProof, bytes32 root)
     */
    function _verifyMerkleProof(uint256 eventId, uint8 winningOutcomeIndex, bytes calldata proof) internal view {
        // 如果 proof 为空,跳过验证 (向后兼容,但不推荐)
        if (proof.length == 0) {
            return;
        }

        // 解析 Merkle Proof
        (bytes32[] memory merkleProof, bytes32 expectedRoot) = abi.decode(proof, (bytes32[], bytes32));

        // 构造叶子节点: hash(eventId, winningOutcomeIndex, chainId)
        bytes32 leaf = keccak256(abi.encodePacked(eventId, winningOutcomeIndex, block.chainid));

        // 验证 Merkle Proof
        bool isValid = _verifyProof(merkleProof, expectedRoot, leaf);
        require(isValid, "EventPod: invalid merkle proof");

        // 注意: 这里假设 OracleAdapter 已经验证了 root 的有效性
        // 在生产环境中,可以添加对 OracleAdapter.verifyRoot(expectedRoot) 的调用
    }

    /**
     * @notice 验证 Merkle Proof 是否有效
     * @param proof Merkle 证明路径
     * @param root Merkle 树根
     * @param leaf 叶子节点
     * @return valid 是否有效
     */
    function _verifyProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash < proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // 检查计算出的根是否匹配预期根
        return computedHash == root;
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取事件详情
     * @param eventId 事件 ID
     * @return event 事件信息
     */
    function getEvent(uint256 eventId) external view eventMustExist(eventId) returns (Event memory) {
        return events[eventId];
    }

    /**
     * @notice 获取事件状态
     * @param eventId 事件 ID
     * @return status 事件状态
     */
    function getEventStatus(uint256 eventId) external view eventMustExist(eventId) returns (EventStatus) {
        return events[eventId].status;
    }

    /**
     * @notice 获取事件结果选项
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引 (0-based)
     * @return outcome 结果选项信息
     */
    function getOutcome(
        uint256 eventId,
        uint8 outcomeIndex
    ) external view eventMustExist(eventId) returns (Outcome memory) {
        Event storage evt = events[eventId];
        require(outcomeIndex < uint8(evt.outcomes.length), "EventPod: outcome index out of bounds");
        return evt.outcomes[outcomeIndex];
    }

    /**
     * @notice 列出所有活跃事件 ID
     * @return eventIds 活跃事件 ID 数组
     */
    function listActiveEvents() external view returns (uint256[] memory) {
        return activeEventIds;
    }

    // ============ 管理功能 Admin Functions ============

    /**
     * @notice 更新 OrderBookManager 地址
     * @param _orderBookManager 新地址
     */
    function setOrderBookManager(address _orderBookManager) external onlyOwner {
        require(_orderBookManager != address(0), "EventPod: invalid address");
        orderBookManager = _orderBookManager;
    }

    /**
     * @notice 更新 EventManager 地址
     * @param _eventManager 新地址
     */
    function setEventManager(address _eventManager) external onlyOwner {
        require(_eventManager != address(0), "EventPod: invalid address");
        eventManager = _eventManager;
    }

    /**
     * @notice 设置 OracleAdapter 地址
     * @param _oracleAdapter OracleAdapter 地址
     */
    function setOracleAdapter(address _oracleAdapter) external onlyOwner {
        require(_oracleAdapter != address(0), "EventPod: invalid address");
        oracleAdapter = _oracleAdapter;
    }
}
