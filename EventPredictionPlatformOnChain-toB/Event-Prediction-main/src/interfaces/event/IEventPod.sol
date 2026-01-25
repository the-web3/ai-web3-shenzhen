// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IEventPod
 * @notice 事件 Pod 接口 - 负责独立处理一组事件的执行单元
 * @dev 每个 EventPod 独立管理一组事件,实现事件隔离和横向扩展
 */
interface IEventPod {
    /// @notice 事件状态枚举
    enum EventStatus {
        Created, // 已创建
        Active, // 进行中(可下注)
        Settled, // 已结算
        Cancelled // 已取消
    }

    /// @notice 事件结果选项结构体
    struct Outcome {
        string name; // 结果名称
        string description; // 结果描述
    }

    /// @notice 事件信息结构体
    struct Event {
        uint256 eventId; // 事件 ID
        string title; // 事件标题
        string description; // 事件描述
        uint256 deadline; // 下注截止时间戳
        uint256 settlementTime; // 预计结算时间戳
        EventStatus status; // 事件状态
        address creator; // 创建者地址
        Outcome[] outcomes; // 所有结果选项列表 (0-indexed)
        uint8 winningOutcomeIndex; // 获胜结果索引 (结算后设置)
    }

    // ============ 事件 Events ============

    /// @notice 事件创建事件
    event EventCreated(uint256 indexed eventId, string title, uint256 deadline, uint256 outcomeCount);

    /// @notice 事件状态变更事件
    event EventStatusChanged(uint256 indexed eventId, EventStatus oldStatus, EventStatus newStatus);

    /// @notice 事件结算事件
    event EventSettled(uint256 indexed eventId, uint8 winningOutcomeIndex, uint256 settlementTime);

    /// @notice 事件取消事件
    event EventCancelled(uint256 indexed eventId, string reason);

    /// @notice 预言机结果接收事件
    event OracleResultReceived(uint256 indexed eventId, uint8 winningOutcomeIndex, address indexed oracle);

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
    ) external returns (uint256 eventId);

    /**
     * @notice 请求预言机结果 (Vendor direct call)
     * @param eventId 事件 ID
     * @return requestId 预言机请求 ID
     */
    function requestOracleResult(uint256 eventId) external returns (bytes32 requestId);

    /**
     * @notice 更新事件状态
     * @param eventId 事件 ID
     * @param newStatus 新状态
     */
    function updateEventStatus(uint256 eventId, EventStatus newStatus) external;

    /**
     * @notice 接收预言机结果并结算事件
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof 预言机证明数据
     */
    function settleEvent(uint256 eventId, uint8 winningOutcomeIndex, bytes calldata proof) external;

    /**
     * @notice 取消事件
     * @param eventId 事件 ID
     * @param reason 取消原因
     */
    function cancelEvent(uint256 eventId, string calldata reason) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取事件详情
     * @param eventId 事件 ID
     * @return event 事件信息
     */
    function getEvent(uint256 eventId) external view returns (Event memory);

    /**
     * @notice 获取事件状态
     * @param eventId 事件 ID
     * @return status 事件状态
     */
    function getEventStatus(uint256 eventId) external view returns (EventStatus);

    /**
     * @notice 获取事件结果选项
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引 (0-based)
     * @return outcome 结果选项信息
     */
    function getOutcome(uint256 eventId, uint8 outcomeIndex) external view returns (Outcome memory);

    /**
     * @notice 列出所有活跃事件 ID
     * @return eventIds 活跃事件 ID 数组
     */
    function listActiveEvents() external view returns (uint256[] memory);
}
