// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../../interfaces/event/IEventPod.sol";

/**
 * @title EventPodStorage
 * @notice EventPod 的存储层合约
 * @dev 存储与逻辑分离
 */
abstract contract EventPodStorage is IEventPod {
    // ============ 状态变量 State Variables ============

    /// @notice 事件存储映射: eventId => Event
    mapping(uint256 => Event) internal events;

    /// @notice 事件是否存在映射
    mapping(uint256 => bool) public eventExists;

    /// @notice 活跃事件 ID 数组
    uint256[] internal activeEventIds;

    /// @notice 事件在活跃数组中的索引映射
    mapping(uint256 => uint256) internal activeEventIndex;

    /// @notice 事件是否在活跃列表中
    mapping(uint256 => bool) internal isEventActive;

    /// @notice EventManager 合约地址
    address public eventManager;

    /// @notice OrderBookManager 合约地址(用于触发结算)
    address public orderBookManager;

    /// @notice OracleAdapter 合约地址(用于验证预言机)
    address public oracleAdapter;

    /// @notice Vendor ID (set during initialization)
    uint256 public vendorId;

    /// @notice Vendor owner address
    address public vendorAddress;

    /// @notice Per-pod event counter
    uint256 public nextEventId;

    /// @notice Event oracle request tracking: eventId => requestId
    mapping(uint256 => bytes32) public eventOracleRequests;
}
