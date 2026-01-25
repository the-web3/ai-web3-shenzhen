// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./OracleAdapterStorage.sol";
import "../interfaces/oracle/IOracle.sol";

/**
 * @title OracleAdapter
 * @notice 预言机适配器 - 管理事件结果请求和提交
 * @dev 连接链下预言机服务与链上合约
 */
contract OracleAdapter is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard,
    OracleAdapterStorage
{
    // ============ Modifiers ============

    /// @notice 仅授权的预言机可调用
    modifier onlyAuthorizedOracle() {
        if (!authorizedOracles[msg.sender]) {
            revert UnauthorizedOracle(msg.sender);
        }
        _;
    }

    /// @notice 仅 EventManager 或授权的 EventPod 可调用
    modifier onlyEventManagerOrAuthorizedPod() {
        require(
            msg.sender == eventManager || authorizedEventPods[msg.sender],
            "OracleAdapter: only eventManager or authorized EventPod"
        );
        _;
    }

    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice 初始化合约
     * @param initialOwner 初始所有者地址
     * @param _eventManager EventManager 地址
     * @param _oracleConsumer OracleConsumer 地址(EventPod)
     */
    function initialize(address initialOwner, address _eventManager, address _oracleConsumer) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();

        require(_eventManager != address(0), "OracleAdapter: invalid eventManager");
        require(_oracleConsumer != address(0), "OracleAdapter: invalid oracleConsumer");

        eventManager = _eventManager;
        oracleConsumer = _oracleConsumer;

        // 设置默认配置
        requestTimeout = DEFAULT_REQUEST_TIMEOUT;
        minConfirmations = DEFAULT_MIN_CONFIRMATIONS;
    }

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 请求事件结果
     * @param eventId 事件 ID
     * @param eventDescription 事件描述
     * @return requestId 请求 ID
     */
    function requestEventResult(
        uint256 eventId,
        string calldata eventDescription
    ) external whenNotPaused onlyEventManagerOrAuthorizedPod returns (bytes32 requestId) {
        if (eventId == 0) revert InvalidEventId(eventId);

        // 检查是否已存在请求
        bytes32 existingRequestId = eventIdToRequestId[eventId];
        if (existingRequestId != bytes32(0)) {
            OracleRequest storage existingRequest = requests[existingRequestId];
            require(!existingRequest.fulfilled, "OracleAdapter: result already submitted");
        }

        // 生成请求 ID
        requestId = keccak256(abi.encodePacked(eventId, msg.sender, block.timestamp, totalRequests));

        // 创建请求
        requests[requestId] = OracleRequest({
            requestId: requestId,
            eventId: eventId,
            requester: msg.sender,
            eventDescription: eventDescription,
            timestamp: block.timestamp,
            fulfilled: false,
            winningOutcomeIndex: 0,
            submitter: address(0)
        });

        eventIdToRequestId[eventId] = requestId;
        totalRequests++;

        emit ResultRequested(requestId, eventId, msg.sender, eventDescription, block.timestamp);
    }

    /**
     * @notice 提交事件结果
     * @param requestId 请求 ID
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引
     * @param proof 证明数据
     */
    function submitResult(
        bytes32 requestId,
        uint256 eventId,
        uint8 winningOutcomeIndex,
        bytes calldata proof
    ) external whenNotPaused onlyAuthorizedOracle nonReentrant {
        OracleRequest storage request = requests[requestId];

        // 验证请求
        if (request.requestId == bytes32(0)) revert RequestNotFound(requestId);
        if (request.eventId != eventId) revert InvalidEventId(eventId);
        if (request.fulfilled) revert ResultAlreadySubmitted(requestId);

        // 检查超时
        if (block.timestamp > request.timestamp + requestTimeout) {
            revert RequestExpired(requestId);
        }

        // 验证证明(可选,根据实际需求实现)
        if (proof.length > 0) {
            _verifyProof(requestId, winningOutcomeIndex, proof);
        }

        // 更新请求状态
        request.fulfilled = true;
        request.winningOutcomeIndex = winningOutcomeIndex;
        request.submitter = msg.sender;

        // 更新结果
        eventResults[eventId] = winningOutcomeIndex;
        eventResultConfirmed[eventId] = true;

        // 更新统计
        fulfilledRequests++;
        oracleSubmissions[msg.sender]++;
        oracleReputation[msg.sender]++;

        emit ResultSubmitted(requestId, eventId, winningOutcomeIndex, msg.sender, block.timestamp);
        emit ResultConfirmed(eventId, winningOutcomeIndex, 1, block.timestamp);

        // 回调 OracleConsumer
        _fulfillConsumer(eventId, winningOutcomeIndex, proof);
    }

    /**
     * @notice 取消请求
     * @param requestId 请求 ID
     */
    function cancelRequest(bytes32 requestId) external whenNotPaused {
        OracleRequest storage request = requests[requestId];

        if (request.requestId == bytes32(0)) revert RequestNotFound(requestId);
        require(msg.sender == request.requester || msg.sender == owner(), "OracleAdapter: unauthorized");
        require(!request.fulfilled, "OracleAdapter: already fulfilled");

        // 标记为已完成(避免重复请求)
        request.fulfilled = true;

        emit ResultSubmitted(requestId, request.eventId, 0, msg.sender, block.timestamp);
    }

    /**
     * @notice 内部函数: 验证证明
     * @param requestId 请求 ID
     * @param winningOutcomeIndex 获胜结果索引
     * @param proof 证明数据
     */
    function _verifyProof(bytes32 requestId, uint8 winningOutcomeIndex, bytes calldata proof) internal view {
        // 这里可以实现签名验证、Merkle Proof 验证等
        // 示例: 验证签名
        // (bytes32 r, bytes32 s, uint8 v) = abi.decode(proof, (bytes32, bytes32, uint8));
        // bytes32 message = keccak256(abi.encodePacked(requestId, winningOutcomeIndex));
        // address signer = ecrecover(message, v, r, s);
        // require(authorizedOracles[signer], "Invalid proof");

        // 暂时允许任何证明(实际应用中需要实现验证逻辑)
        if (proof.length == 0) {
            // 空证明表示直接信任授权预言机
            return;
        }
    }

    /**
     * @notice 内部函数: 回调 OracleConsumer
     * @param eventId 事件 ID
     * @param winningOutcomeIndex 获胜结果索引
     * @param proof 证明数据
     */
    function _fulfillConsumer(uint256 eventId, uint8 winningOutcomeIndex, bytes calldata proof) internal {
        if (oracleConsumer == address(0)) return;

        try IOracleConsumer(oracleConsumer).fulfillResult(eventId, winningOutcomeIndex, proof) {} catch {
            // 如果回调失败,不影响结果记录
            // 链下服务可以监听 ResultSubmitted 事件并重试
        }
    }

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
    ) external view returns (uint256 eventId, address requester, uint256 timestamp, bool fulfilled) {
        OracleRequest storage request = requests[requestId];
        return (request.eventId, request.requester, request.timestamp, request.fulfilled);
    }

    /**
     * @notice 获取事件结果
     * @param eventId 事件 ID
     * @return winningOutcomeIndex 获胜结果索引
     * @return confirmed 是否已确认
     */
    function getEventResult(uint256 eventId) external view returns (uint8 winningOutcomeIndex, bool confirmed) {
        return (eventResults[eventId], eventResultConfirmed[eventId]);
    }

    /**
     * @notice 获取请求详细信息
     * @param requestId 请求 ID
     * @return request 请求详情
     */
    function getRequestDetails(bytes32 requestId) external view returns (OracleRequest memory request) {
        return requests[requestId];
    }

    // ============ 管理功能 Admin Functions ============

    /**
     * @notice 添加授权预言机
     * @param oracle 预言机地址
     */
    function addAuthorizedOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "OracleAdapter: invalid address");
        require(!authorizedOracles[oracle], "OracleAdapter: already authorized");

        authorizedOracles[oracle] = true;
        authorizedOraclesList.push(oracle);
    }

    /**
     * @notice 移除授权预言机
     * @param oracle 预言机地址
     */
    function removeAuthorizedOracle(address oracle) external onlyOwner {
        require(authorizedOracles[oracle], "OracleAdapter: not authorized");

        authorizedOracles[oracle] = false;

        // 从数组中移除
        for (uint256 i = 0; i < authorizedOraclesList.length; i++) {
            if (authorizedOraclesList[i] == oracle) {
                authorizedOraclesList[i] = authorizedOraclesList[authorizedOraclesList.length - 1];
                authorizedOraclesList.pop();
                break;
            }
        }
    }

    /**
     * @notice 添加授权的 EventPod
     * @param eventPod EventPod 地址
     */
    function addAuthorizedEventPod(address eventPod) external onlyOwner {
        require(eventPod != address(0), "OracleAdapter: invalid address");
        require(!authorizedEventPods[eventPod], "OracleAdapter: already authorized");

        authorizedEventPods[eventPod] = true;
    }

    /**
     * @notice 移除授权的 EventPod
     * @param eventPod EventPod 地址
     */
    function removeAuthorizedEventPod(address eventPod) external onlyOwner {
        require(authorizedEventPods[eventPod], "OracleAdapter: not authorized");

        authorizedEventPods[eventPod] = false;
    }

    /**
     * @notice 设置 EventManager 地址
     * @param _eventManager EventManager 地址
     */
    function setEventManager(address _eventManager) external onlyOwner {
        require(_eventManager != address(0), "OracleAdapter: invalid address");
        eventManager = _eventManager;
    }

    /**
     * @notice 设置 OracleConsumer 地址
     * @param _oracleConsumer OracleConsumer 地址
     */
    function setOracleConsumer(address _oracleConsumer) external onlyOwner {
        require(_oracleConsumer != address(0), "OracleAdapter: invalid address");
        oracleConsumer = _oracleConsumer;
    }

    /**
     * @notice 设置请求超时时间
     * @param timeout 超时时间(秒)
     */
    function setRequestTimeout(uint256 timeout) external onlyOwner {
        require(timeout > 0, "OracleAdapter: invalid timeout");
        requestTimeout = timeout;
    }

    /**
     * @notice 设置最小确认数
     * @param confirmations 最小确认数
     */
    function setMinConfirmations(uint256 confirmations) external onlyOwner {
        require(confirmations > 0, "OracleAdapter: invalid confirmations");
        minConfirmations = confirmations;
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
