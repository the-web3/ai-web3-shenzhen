// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./FundingManagerStorage.sol";
import "../../interfaces/event/IPodDeployer.sol";
import "../../interfaces/event/IFundingPod.sol";

/**
 * @title FundingManager
 * @notice 资金管理器 - 负责资金池管理和 Pod 路由
 * @dev Manager 层负责协调,Pod 层负责执行
 */
contract FundingManager is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    FundingManagerStorage
{
    // ============ Modifiers ============

    /// @notice 仅 Factory 可调用
    modifier onlyFactory() {
        require(msg.sender == factory, "FundingManager: only factory");
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
     * @notice 部署 FundingPod (仅 Factory 可调用)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor 地址
     * @param orderBookPod OrderBookPod 地址
     * @param eventPod EventPod 地址
     * @return fundingPod FundingPod 地址
     */
    function deployFundingPod(uint256 vendorId, address vendorAddress, address orderBookPod, address eventPod)
        external
        onlyFactory
        returns (address fundingPod)
    {
        require(vendorId > 0, "FundingManager: invalid vendorId");
        require(vendorToFundingPod[vendorId] == address(0), "FundingManager: pod already deployed");

        // 调用 PodDeployer
        fundingPod = IPodDeployer(podDeployer)
            .deployFundingPod(
                vendorId,
                vendorAddress,
                address(this), // fundingManager
                orderBookPod,
                eventPod
            );

        // 记录部署
        vendorToFundingPod[vendorId] = fundingPod;
        fundingPodIsDeployed[fundingPod] = true;

        emit FundingPodDeployed(vendorId, fundingPod);

        return fundingPod;
    }

    /**
     * @notice 获取 vendor 的 FundingPod 地址
     * @param vendorId Vendor ID
     * @return fundingPod FundingPod 地址
     */
    function getVendorFundingPod(uint256 vendorId) external view returns (address) {
        return vendorToFundingPod[vendorId];
    }

    /**
     * @notice 设置 PodDeployer 地址
     * @param _podDeployer PodDeployer 合约地址
     */
    function setPodDeployer(address _podDeployer) external onlyOwner {
        require(_podDeployer != address(0), "FundingManager: invalid podDeployer");
        podDeployer = _podDeployer;
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取 Vendor Pod 的总余额
     * @param vendorId Vendor ID
     * @param tokenAddress Token 地址
     * @return balance 总余额
     */
    function getVendorPodBalance(uint256 vendorId, address tokenAddress) external view returns (uint256) {
        address fundingPodAddress = vendorToFundingPod[vendorId];
        require(fundingPodAddress != address(0), "FundingManager: vendor not found");

        IFundingPod fundingPod = IFundingPod(fundingPodAddress);
        return fundingPod.tokenBalances(tokenAddress);
    }

    /**
     * @notice 获取用户可用余额
     * @param fundingPod Pod 地址
     * @param user 用户地址
     * @param tokenAddress Token 地址
     * @return balance 可用余额
     */
    function getUserBalance(IFundingPod fundingPod, address user, address tokenAddress)
        external
        view
        returns (uint256)
    {
        return fundingPod.getUserBalance(user, tokenAddress);
    }

    /**
     * @notice 获取用户 Long Token 持仓
     * @param fundingPod Pod 地址
     * @param user 用户地址
     * @param tokenAddress Token 地址
     * @param eventId 事件 ID
     * @param outcomeIndex 结果索引
     * @return position Long Token 数量
     */
    function getLongPosition(
        IFundingPod fundingPod,
        address user,
        address tokenAddress,
        uint256 eventId,
        uint8 outcomeIndex
    ) external view returns (uint256) {
        return fundingPod.getLongPosition(user, tokenAddress, eventId, outcomeIndex);
    }

    /**
     * @notice 获取事件奖金池
     * @param fundingPod Pod 地址
     * @param eventId 事件 ID
     * @param tokenAddress Token 地址
     * @return pool 奖金池金额
     */
    function getEventPrizePool(IFundingPod fundingPod, uint256 eventId, address tokenAddress)
        external
        view
        returns (uint256)
    {
        return fundingPod.getEventPrizePool(eventId, tokenAddress);
    }

    // ============ 管理功能 Admin Functions ============

    /**
     * @notice 设置 PodFactory 地址
     * @param _factory PodFactory 合约地址
     */
    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "FundingManager: invalid factory");
        factory = _factory;
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

    // ============ 接收 ETH ============

    receive() external payable {}
}
