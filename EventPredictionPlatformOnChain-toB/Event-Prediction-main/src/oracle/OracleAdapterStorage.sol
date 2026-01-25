// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interfaces/oracle/IOracle.sol";

/**
 * @title OracleAdapterStorage
 * @notice OracleAdapter 的存储层合约
 * @dev 存储预言机请求、结果等数据
 */
abstract contract OracleAdapterStorage is IOracle {
    // ============ 请求管理 Request Management ============

    /// @notice 请求信息结构体
    struct OracleRequest {
        bytes32 requestId; // 请求 ID
        uint256 eventId; // 事件 ID
        address requester; // 请求者地址
        string eventDescription; // 事件描述
        uint256 timestamp; // 请求时间
        bool fulfilled; // 是否已完成
        uint8 winningOutcomeIndex; // 获胜结果索引 (0-based)
        address submitter; // 提交者地址
    }

    /// @notice 请求映射: requestId => OracleRequest
    mapping(bytes32 => OracleRequest) internal requests;

    /// @notice 事件到请求的映射: eventId => requestId
    mapping(uint256 => bytes32) public eventIdToRequestId;

    /// @notice 事件结果映射: eventId => winningOutcomeIndex
    mapping(uint256 => uint8) public eventResults;

    /// @notice 事件结果确认状态: eventId => confirmed
    mapping(uint256 => bool) public eventResultConfirmed;

    // ============ 授权管理 Authorization Management ============

    /// @notice 授权的预言机映射
    mapping(address => bool) public authorizedOracles;

    /// @notice 授权的预言机列表
    address[] internal authorizedOraclesList;

    /// @notice 授权的 EventPods 映射 (for direct pod interaction)
    mapping(address => bool) public authorizedEventPods;

    /// @notice 预言机信誉分数: oracle => score
    mapping(address => uint256) public oracleReputation;

    // ============ 配置参数 Configuration ============

    /// @notice 请求超时时间(秒)
    uint256 public requestTimeout;

    /// @notice 最小确认数(多预言机共识)
    uint256 public minConfirmations;

    /// @notice EventManager 地址
    address public eventManager;

    /// @notice OracleConsumer 地址(EventPod)
    address public oracleConsumer;

    // ============ 统计数据 Statistics ============

    /// @notice 总请求数
    uint256 public totalRequests;

    /// @notice 已完成请求数
    uint256 public fulfilledRequests;

    /// @notice 预言机提交次数: oracle => count
    mapping(address => uint256) public oracleSubmissions;

    // ============ 常量 Constants ============

    /// @notice 默认请求超时时间: 7 天
    uint256 public constant DEFAULT_REQUEST_TIMEOUT = 7 days;

    /// @notice 默认最小确认数: 1 (单预言机模式)
    uint256 public constant DEFAULT_MIN_CONFIRMATIONS = 1;

    // ============ 预留升级空间 Upgrade Reserve ============

    /// @notice 预留 storage slots (减去1个mapping = 34 slots)
    uint256[34] private __gap;
}
