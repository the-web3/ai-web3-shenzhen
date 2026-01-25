// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./FeeVaultManagerStorage.sol";
import "../../interfaces/event/IFeeVaultPod.sol";
import "../../interfaces/event/IPodDeployer.sol";

/**
 * @title FeeVaultManager
 * @notice 手续费管理器 - 负责 Pod 路由和手续费管理
 * @dev Manager 层负责协调,Pod 层负责执行
 */
contract FeeVaultManager is Initializable, OwnableUpgradeable, PausableUpgradeable, FeeVaultManagerStorage {
    // ============ Modifiers ============

    /// @notice 仅 Factory 可调用
    modifier onlyFactory() {
        require(msg.sender == factory, "FeeVaultManager: only factory");
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
     * @notice 部署 FeeVaultPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @param feeRecipient 手续费接收地址
     * @param orderBookPod OrderBookPod 地址
     * @return feeVaultPod FeeVaultPod 地址
     */
    function deployFeeVaultPod(
        uint256 vendorId,
        address vendorAddress,
        address feeRecipient,
        address orderBookPod
    ) external onlyFactory returns (address feeVaultPod) {
        require(vendorId > 0, "FeeVaultManager: invalid vendorId");
        require(vendorToFeeVaultPod[vendorId] == address(0), "FeeVaultManager: pod already deployed");

        // 调用 PodDeployer
        feeVaultPod = IPodDeployer(podDeployer).deployFeeVaultPod(
            vendorId,
            vendorAddress,
            address(this),  // feeVaultManager
            orderBookPod,
            feeRecipient
        );

        // 记录部署
        vendorToFeeVaultPod[vendorId] = feeVaultPod;
        feeVaultPodIsDeployed[feeVaultPod] = true;

        emit FeeVaultPodDeployed(vendorId, feeVaultPod);

        return feeVaultPod;
    }

    /**
     * @notice 获取 vendor 的 FeeVaultPod 地址
     * @param vendorId Vendor ID
     * @return feeVaultPod FeeVaultPod 地址
     */
    function getVendorFeeVaultPod(uint256 vendorId) external view returns (address) {
        return vendorToFeeVaultPod[vendorId];
    }

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external onlyOwner {
        require(_podDeployer != address(0), "FeeVaultManager: invalid podDeployer");
        podDeployer = _podDeployer;
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取 Vendor Pod 的手续费余额
     * @param vendorId Vendor ID
     * @param token Token 地址
     * @return balance 手续费余额
     */
    function getVendorPodFeeBalance(uint256 vendorId, address token) external view returns (uint256 balance) {
        address feeVaultPodAddress = vendorToFeeVaultPod[vendorId];
        require(feeVaultPodAddress != address(0), "FeeVaultManager: vendor not found");

        IFeeVaultPod pod = IFeeVaultPod(feeVaultPodAddress);
        return pod.getFeeBalance(token);
    }

    // ============ 管理功能 Admin Functions ============

    /**
     * @notice 设置 PodFactory 地址
     * @param _factory PodFactory 合约地址
     */
    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "FeeVaultManager: invalid factory");
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
}
