// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IOracle
 * @notice 预言机接口 - 用于请求和提交事件结果
 * @dev 定义预言机的核心功能接口
 */
interface IOracle {
    // ============ 事件 Events ============

    /// @notice 事件结果请求事件
    event ResultRequested(
        bytes32 indexed requestId,
        uint256 indexed eventId,
        address indexed requester,
        string eventDescription,
        uint256 timestamp
    );

    /// @notice 事件结果提交事件
    event ResultSubmitted(
        bytes32 indexed requestId,
        uint256 indexed eventId,
        uint8 winningOutcomeIndex,
        address indexed oracle,
        uint256 timestamp
    );

    /// @notice 结果确认事件
    event ResultConfirmed(uint256 indexed eventId, uint8 winningOutcomeIndex, uint256 confirmations, uint256 timestamp);

    // ============ 错误 Errors ============

    error InvalidEventId(uint256 eventId);
    error InvalidOutcomeIndex(uint8 outcomeIndex);
    error RequestNotFound(bytes32 requestId);
    error ResultAlreadySubmitted(bytes32 requestId);
    error UnauthorizedOracle(address oracle);
    error InvalidProof();
    error RequestExpired(bytes32 requestId);

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 请求事件结果
     * @param eventId 事件 ID
     * @param eventDescription 事件描述
     * @return requestId 请求 ID
     */
    function requestEventResult(uint256 eventId, string calldata eventDescription) external returns (bytes32 requestId);

    /**
     * @notice 提交事件结果
     * @param requestId 请求 ID
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof 证明数据(签名、Merkle Proof 等)
     */
    function submitResult(bytes32 requestId, uint256 eventId, uint8 winningOutcomeIndex, bytes calldata proof) external;

    /**
     * @notice 取消请求
     * @param requestId 请求 ID
     */
    function cancelRequest(bytes32 requestId) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取请求信息
     * @param requestId 请求 ID
     * @return eventId 事件 ID
     * @return requester 请求者地址
     * @return timestamp 请求时间戳
     * @return fulfilled 是否已完成
     */
    function getRequest(
        bytes32 requestId
    ) external view returns (uint256 eventId, address requester, uint256 timestamp, bool fulfilled);

    /**
     * @notice 获取事件结果
     * @param eventId 事件 ID
     * @return winningOutcomeIndex 获胜结果索引 (0-based)
     * @return confirmed 是否已确认
     */
    function getEventResult(uint256 eventId) external view returns (uint8 winningOutcomeIndex, bool confirmed);
}

/**
 * @title IOracleConsumer
 * @notice 预言机消费者接口 - EventPod 需要实现此接口
 * @dev 用于接收预言机结果回调
 */
interface IOracleConsumer {
    /**
     * @notice 接收预言机结果
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引 (0-based)
     * @param proof 证明数据
     */
    function fulfillResult(uint256 eventId, uint8 winningOutcomeIndex, bytes calldata proof) external;
}
