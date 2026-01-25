// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./EventManagerStorage.sol";
import "../../interfaces/event/IPodFactory.sol";
import "../../interfaces/event/IPodDeployer.sol";
import "../../interfaces/event/IEventPod.sol";

/**
 * @title EventManager
 * @notice Vendor Registry - 管理 vendor 注册和平台级配置
 * @dev Vendors 直接与其 pods 交互,EventManager 仅作为注册表和配置管理器
 */
contract EventManager is Initializable, OwnableUpgradeable, PausableUpgradeable, EventManagerStorage {
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

    // ============ 配置管理 Configuration ============

    /**
     * @notice 设置 OrderBookManager 地址
     * @param _orderBookManager OrderBookManager 合约地址
     */
    function setOrderBookManager(address _orderBookManager) external onlyOwner {
        require(_orderBookManager != address(0), "EventManager: invalid orderBookManager");
        orderBookManager = _orderBookManager;
    }

    /**
     * @notice 设置 PodFactory 地址
     * @param _podFactory PodFactory 合约地址
     */
    function setPodFactory(address _podFactory) external onlyOwner {
        require(_podFactory != address(0), "EventManager: invalid podFactory");
        podFactory = _podFactory;
    }

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external onlyOwner {
        require(_podDeployer != address(0), "EventManager: invalid podDeployer");
        podDeployer = _podDeployer;
    }

    // ============ Pod 部署功能 Pod Deployment ============

    /**
     * @notice 部署 EventPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @return eventPod EventPod 地址
     */
    function deployEventPod(uint256 vendorId, address vendorAddress) external returns (address eventPod) {
        require(msg.sender == podFactory, "EventManager: only factory");
        require(vendorId > 0, "EventManager: invalid vendorId");
        require(vendorToEventPod[vendorId] == address(0), "EventManager: pod already deployed");

        // 调用 PodDeployer 创建 EventPod
        eventPod = IPodDeployer(podDeployer).deployEventPod(
            vendorId,
            vendorAddress,
            address(this), // eventManager
            orderBookManager // orderBookManager
        );

        // 记录部署
        vendorToEventPod[vendorId] = eventPod;
        eventPodIsDeployed[eventPod] = true;

        emit EventPodDeployed(vendorId, eventPod);

        return eventPod;
    }

    /**
     * @notice 获取 vendor 的 EventPod 地址
     * @param vendorId Vendor ID
     * @return eventPod EventPod 地址
     */
    function getVendorEventPod(uint256 vendorId) external view returns (address) {
        return vendorToEventPod[vendorId];
    }

    // ============ Vendor 管理功能 ============

    /**
     * @notice 注册 vendor (由 PodFactory 在部署时调用)
     * @dev 此函数用于与 PodFactory 同步 vendor 注册状态
     * @param vendorId Vendor ID
     */
    function registerVendor(uint256 vendorId) external {
        require(msg.sender == podFactory, "EventManager: only factory");
        require(vendorId > 0, "EventManager: invalid vendorId");

        emit VendorRegistered(vendorId);
    }

    /**
     * @notice 注销 vendor (由 PodFactory 在注销时调用)
     * @dev 此函数用于与 PodFactory 同步 vendor 注销状态
     * @param vendorId Vendor ID
     */
    function unregisterVendor(uint256 vendorId) external {
        require(msg.sender == podFactory, "EventManager: only factory");

        emit VendorUnregistered(vendorId);
    }

    // ============ 预言机管理功能 ============

    /**
     * @notice 注册预言机
     * @param oracle 预言机地址
     */
    function registerOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "EventManager: invalid oracle address");
        require(!authorizedOracles[oracle], "EventManager: oracle already registered");

        authorizedOracles[oracle] = true;
        emit OracleRegistered(oracle);
    }

    /**
     * @notice 移除预言机
     * @param oracle 预言机地址
     */
    function removeOracle(address oracle) external onlyOwner {
        require(authorizedOracles[oracle], "EventManager: oracle not registered");

        authorizedOracles[oracle] = false;
        emit OracleRemoved(oracle);
    }

    /**
     * @notice 检查预言机是否已授权
     * @param oracle 预言机地址
     * @return isAuthorized 是否已授权
     */
    function isOracleAuthorized(address oracle) external view returns (bool) {
        return authorizedOracles[oracle];
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取 vendor 的 pod set
     * @param vendorId Vendor ID
     * @return podSet Vendor 的 pod set 信息
     */
    function getVendorPodSet(uint256 vendorId) external view returns (IPodFactory.VendorPodSet memory) {
        require(podFactory != address(0), "EventManager: podFactory not set");
        return IPodFactory(podFactory).getVendorPodSet(vendorId);
    }

    // ============ 紧急控制 Emergency Control ============

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
