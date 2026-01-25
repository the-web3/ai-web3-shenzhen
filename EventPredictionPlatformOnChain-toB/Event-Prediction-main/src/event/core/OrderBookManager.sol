// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./OrderBookManagerStorage.sol";
import "../../interfaces/event/IPodDeployer.sol";

/**
 * @title OrderBookManager
 * @notice 订单簿管理器 - 负责 Pod 路由和订单管理
 * @dev Manager 层负责协调,Pod 层负责执行
 */
contract OrderBookManager is Initializable, OwnableUpgradeable, PausableUpgradeable, OrderBookManagerStorage {
    // ============ Modifiers ============

    /// @notice 仅授权调用者 (owner 或授权的合约如 EventManager/EventPod)
    modifier onlyAuthorizedCaller() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "OrderBookManager: caller not authorized");
        _;
    }

    /// @notice 仅 Factory 可调用
    modifier onlyFactory() {
        require(msg.sender == factory, "OrderBookManager: only factory");
        _;
    }

    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice 初始化合约
     * @param _initialOwner 初始所有者地址
     */
    function initialize(address _initialOwner) external initializer {
        __Ownable_init(_initialOwner);
        __Pausable_init();
    }

    // ============ Pod 部署功能 Pod Deployment ============

    /**
     * @notice 部署 OrderBookPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @param eventPod EventPod 地址
     * @param fundingPod FundingPod 地址
     * @param feeVaultPod FeeVaultPod 地址
     * @return orderBookPod OrderBookPod 地址
     */
    function deployOrderBookPod(
        uint256 vendorId,
        address vendorAddress,
        address eventPod,
        address fundingPod,
        address feeVaultPod
    ) external onlyFactory returns (address orderBookPod) {
        require(vendorId > 0, "OrderBookManager: invalid vendorId");
        require(vendorToOrderBookPod[vendorId] == address(0), "OrderBookManager: pod already deployed");

        // 调用 PodDeployer
        orderBookPod = IPodDeployer(podDeployer).deployOrderBookPod(
            vendorId,
            vendorAddress,
            eventPod,
            fundingPod,
            feeVaultPod,
            address(this)  // orderBookManager
        );

        // 记录部署
        vendorToOrderBookPod[vendorId] = orderBookPod;
        orderBookPodIsDeployed[orderBookPod] = true;

        emit OrderBookPodDeployed(vendorId, orderBookPod);

        return orderBookPod;
    }

    /**
     * @notice 获取 vendor 的 OrderBookPod 地址
     * @param vendorId Vendor ID
     * @return orderBookPod OrderBookPod 地址
     */
    function getVendorOrderBookPod(uint256 vendorId) external view returns (address) {
        return vendorToOrderBookPod[vendorId];
    }

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external onlyOwner {
        require(_podDeployer != address(0), "OrderBookManager: invalid podDeployer");
        podDeployer = _podDeployer;
    }

    // ============ 查询功能 View Functions ============

    // (查询功能通过 getVendorOrderBookPod 提供)

    // ============ 管理功能 Admin Functions ============

    /**
     * @notice 添加授权调用者 (如 EventManager/EventPod)
     * @param caller 调用者地址
     */
    function addAuthorizedCaller(address caller) external onlyOwner {
        require(caller != address(0), "OrderBookManager: invalid caller address");
        require(!authorizedCallers[caller], "OrderBookManager: already authorized");

        authorizedCallers[caller] = true;
        emit AuthorizedCallerAdded(caller);
    }

    /**
     * @notice 移除授权调用者
     * @param caller 调用者地址
     */
    function removeAuthorizedCaller(address caller) external onlyOwner {
        require(authorizedCallers[caller], "OrderBookManager: not authorized");

        authorizedCallers[caller] = false;
        emit AuthorizedCallerRemoved(caller);
    }

    /**
     * @notice 检查地址是否为授权调用者
     * @param caller 调用者地址
     * @return isAuthorized 是否授权
     */
    function isAuthorizedCaller(address caller) external view returns (bool) {
        return authorizedCallers[caller];
    }

    /**
     * @notice 设置 PodFactory 地址
     * @param _factory PodFactory 合约地址
     */
    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "OrderBookManager: invalid factory");
        factory = _factory;
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

    // ============ 事件 Events ============

    /// @notice 授权调用者添加事件
    event AuthorizedCallerAdded(address indexed caller);

    /// @notice 授权调用者移除事件
    event AuthorizedCallerRemoved(address indexed caller);
}
