// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EventManager
 * @notice 多链 Event 管理合约
 * @dev 支持创建、参加、查询 Event
 * @author Fishcake Team
 */
contract EventManager {
    // ============ 数据结构 ============

    struct Event {
        uint256 id;                  // Event ID
        address creator;             // 创建者地址
        string title;                // Event 标题
        string description;          // Event 描述
        uint256 entryFee;            // 参与费用 (Wei)
        uint256 maxParticipants;     // 最大参与人数 (0 = 无限制)
        uint256 currentParticipants; // 当前参与人数
        uint256 createdAt;           // 创建时间戳
        bool isActive;               // 是否激活
    }

    // ============ 状态变量 ============

    uint256 private nextEventId;

    // Event ID => Event 详情
    mapping(uint256 => Event) public events;

    // Event ID => 参与者地址 => 是否已参加
    mapping(uint256 => mapping(address => bool)) public participants;

    // 用户地址 => 创建的 Event ID 数组
    mapping(address => uint256[]) private userCreatedEvents;

    // 用户地址 => 参加的 Event ID 数组
    mapping(address => uint256[]) private userJoinedEvents;

    // ============ 事件 ============

    /**
     * @notice Event 创建事件
     * @param eventId Event ID
     * @param creator 创建者地址
     * @param title Event 标题
     * @param entryFee 参与费用
     * @param maxParticipants 最大参与人数
     */
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string title,
        uint256 entryFee,
        uint256 maxParticipants
    );

    /**
     * @notice Event 参加事件
     * @param eventId Event ID
     * @param participant 参与者地址
     * @param amountPaid 支付金额
     */
    event EventJoined(
        uint256 indexed eventId,
        address indexed participant,
        uint256 amountPaid
    );

    /**
     * @notice Event 取消事件
     * @param eventId Event ID
     * @param creator 创建者地址
     */
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
     * @param maxParticipants 最大参与人数 (0 = 无限制)
     * @return eventId 新创建的 Event ID
     */
    function createEvent(
        string memory title,
        string memory description,
        uint256 entryFee,
        uint256 maxParticipants
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(title).length <= 100, "Title too long");
        require(bytes(description).length <= 500, "Description too long");

        uint256 eventId = nextEventId++;

        events[eventId] = Event({
            id: eventId,
            creator: msg.sender,
            title: title,
            description: description,
            entryFee: entryFee,
            maxParticipants: maxParticipants,
            currentParticipants: 0,
            createdAt: block.timestamp,
            isActive: true
        });

        userCreatedEvents[msg.sender].push(eventId);

        emit EventCreated(eventId, msg.sender, title, entryFee, maxParticipants);

        return eventId;
    }

    /**
     * @notice 参加 Event
     * @param eventId Event ID
     */
    function joinEvent(uint256 eventId) external payable {
        Event storage evt = events[eventId];

        require(evt.id == eventId, "Event does not exist");
        require(evt.isActive, "Event not active");
        require(!participants[eventId][msg.sender], "Already joined");
        require(msg.value >= evt.entryFee, "Insufficient entry fee");
        require(
            evt.currentParticipants < evt.maxParticipants || evt.maxParticipants == 0,
            "Event full"
        );

        participants[eventId][msg.sender] = true;
        evt.currentParticipants++;
        userJoinedEvents[msg.sender].push(eventId);

        emit EventJoined(eventId, msg.sender, msg.value);

        // 退还多余的费用
        if (msg.value > evt.entryFee) {
            uint256 refund = msg.value - evt.entryFee;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice 取消 Event (仅创建者)
     * @param eventId Event ID
     */
    function cancelEvent(uint256 eventId) external {
        Event storage evt = events[eventId];

        require(evt.id == eventId, "Event does not exist");
        require(evt.creator == msg.sender, "Not the creator");
        require(evt.isActive, "Event already cancelled");

        evt.isActive = false;

        emit EventCancelled(eventId, msg.sender);
    }

    // ============ 查询功能 ============

    /**
     * @notice 获取 Event 详情
     * @param eventId Event ID
     * @return Event 详情
     */
    function getEvent(uint256 eventId) external view returns (Event memory) {
        require(events[eventId].id == eventId, "Event does not exist");
        return events[eventId];
    }

    /**
     * @notice 检查用户是否已参加 Event
     * @param eventId Event ID
     * @param user 用户地址
     * @return 是否已参加
     */
    function hasJoined(uint256 eventId, address user) external view returns (bool) {
        return participants[eventId][user];
    }

    /**
     * @notice 获取用户创建的所有 Event
     * @param user 用户地址
     * @return Event ID 数组
     */
    function getUserCreatedEvents(address user) external view returns (uint256[] memory) {
        return userCreatedEvents[user];
    }

    /**
     * @notice 获取用户参加的所有 Event
     * @param user 用户地址
     * @return Event ID 数组
     */
    function getUserJoinedEvents(address user) external view returns (uint256[] memory) {
        return userJoinedEvents[user];
    }

    /**
     * @notice 获取总 Event 数量
     * @return 总数量
     */
    function getTotalEvents() external view returns (uint256) {
        return nextEventId;
    }

    /**
     * @notice 获取合约余额
     * @return 余额 (Wei)
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ 紧急功能 (仅供管理) ============

    /**
     * @notice 提取合约中的资金 (紧急使用)
     * @dev 仅 Event 创建者可以提取其 Event 收取的费用
     * @param eventId Event ID
     */
    function withdrawEventFunds(uint256 eventId) external {
        Event storage evt = events[eventId];

        require(evt.id == eventId, "Event does not exist");
        require(evt.creator == msg.sender, "Not the creator");
        require(!evt.isActive, "Event still active");

        uint256 totalFunds = evt.entryFee * evt.currentParticipants;
        require(totalFunds > 0, "No funds to withdraw");

        // 标记已提取（通过设置 entryFee 为 0）
        evt.entryFee = 0;

        (bool success, ) = msg.sender.call{value: totalFunds}("");
        require(success, "Withdrawal failed");
    }
}
