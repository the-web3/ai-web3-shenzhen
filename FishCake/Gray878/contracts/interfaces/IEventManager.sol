// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEventManager
 * @notice EventManager 合约接口
 * @dev 定义 EventManager 的所有外部函数
 */
interface IEventManager {
    // ============ 数据结构 ============

    struct Event {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 entryFee;
        uint256 maxParticipants;
        uint256 currentParticipants;
        uint256 createdAt;
        bool isActive;
    }

    // ============ 事件 ============

    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string title,
        uint256 entryFee,
        uint256 maxParticipants
    );

    event EventJoined(
        uint256 indexed eventId,
        address indexed participant,
        uint256 amountPaid
    );

    event EventCancelled(
        uint256 indexed eventId,
        address indexed creator
    );

    // ============ 核心功能 ============

    /**
     * @notice 创建新的 Event
     * @param title Event 标题
     * @param description Event 描述
     * @param entryFee 参与费用 (Wei)
     * @param maxParticipants 最大参与人数
     * @return eventId 新创建的 Event ID
     */
    function createEvent(
        string memory title,
        string memory description,
        uint256 entryFee,
        uint256 maxParticipants
    ) external returns (uint256);

    /**
     * @notice 参加 Event
     * @param eventId Event ID
     */
    function joinEvent(uint256 eventId) external payable;

    /**
     * @notice 取消 Event (仅创建者)
     * @param eventId Event ID
     */
    function cancelEvent(uint256 eventId) external;

    // ============ 查询功能 ============

    /**
     * @notice 获取 Event 详情
     * @param eventId Event ID
     * @return Event 详情
     */
    function getEvent(uint256 eventId) external view returns (Event memory);

    /**
     * @notice 检查用户是否已参加 Event
     * @param eventId Event ID
     * @param user 用户地址
     * @return 是否已参加
     */
    function hasJoined(uint256 eventId, address user) external view returns (bool);

    /**
     * @notice 获取用户创建的所有 Event
     * @param user 用户地址
     * @return Event ID 数组
     */
    function getUserCreatedEvents(address user) external view returns (uint256[] memory);

    /**
     * @notice 获取用户参加的所有 Event
     * @param user 用户地址
     * @return Event ID 数组
     */
    function getUserJoinedEvents(address user) external view returns (uint256[] memory);

    /**
     * @notice 获取总 Event 数量
     * @return 总数量
     */
    function getTotalEvents() external view returns (uint256);

    /**
     * @notice 获取合约余额
     * @return 余额 (Wei)
     */
    function getBalance() external view returns (uint256);

    /**
     * @notice 提取合约中的资金 (紧急使用)
     * @param eventId Event ID
     */
    function withdrawEventFunds(uint256 eventId) external;
}
