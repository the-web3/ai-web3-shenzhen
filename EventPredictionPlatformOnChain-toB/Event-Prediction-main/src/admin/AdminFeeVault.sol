// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./AdminFeeVaultStorage.sol";

/**
 * @title AdminFeeVault
 * @notice 平台级费用金库 - 管理整个平台的手续费收入
 * @dev 单例合约,负责收集、分配和管理平台手续费
 */
contract AdminFeeVault is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard,
    AdminFeeVaultStorage
{
    using SafeERC20 for IERC20;

    // ============ Modifiers ============

    /// @notice 仅授权的 Pod 可调用
    modifier onlyAuthorizedPod() {
        require(authorizedPods[msg.sender], "AdminFeeVault: not authorized pod");
        _;
    }

    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice 初始化合约
     * @param initialOwner 初始所有者地址
     */
    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();

        // 设置默认受益人配置
        // treasury: 50%, team: 30%, liquidity: 20%
        _setBeneficiary("treasury", initialOwner);
        _setAllocationRatio("treasury", 5000);

        _setBeneficiary("team", initialOwner);
        _setAllocationRatio("team", 3000);

        _setBeneficiary("liquidity", initialOwner);
        _setAllocationRatio("liquidity", 2000);
    }

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 从 FeeVaultPod 收集手续费
     * @param token Token 地址
     * @param amount 金额
     * @param category 类别
     */
    function collectFeeFromPod(
        address token,
        uint256 amount,
        string calldata category
    ) external whenNotPaused onlyAuthorizedPod {
        if (amount == 0) revert InvalidAmount(amount);

        // 更新余额
        feeBalances[token] += amount;
        pendingDistribution[token] += amount;
        totalCollected[token] += amount;

        // 统计
        bytes32 categoryKey = keccak256(bytes(category));
        collectedByCategory[categoryKey][token] += amount;

        emit FeeCollected(token, msg.sender, amount, category);
    }

    /**
     * @notice 分配手续费给受益人
     * @param token Token 地址
     */
    function distributeFees(address token) external whenNotPaused nonReentrant {
        uint256 pending = pendingDistribution[token];
        if (pending == 0) return;

        // 重置待分配余额
        pendingDistribution[token] = 0;

        // 按比例分配给各受益人
        for (uint256 i = 0; i < beneficiaryRoles.length; i++) {
            bytes32 role = beneficiaryRoles[i];
            address beneficiary = beneficiaries[role];
            uint256 ratio = allocationRatios[role];

            if (beneficiary == address(0) || ratio == 0) continue;

            uint256 amount = (pending * ratio) / RATIO_PRECISION;
            if (amount == 0) continue;

            beneficiaryBalances[beneficiary][token] += amount;
            totalDistributed[token] += amount;

            emit FeeDistributed(token, beneficiary, amount, string(abi.encodePacked(role)));
        }
    }

    /**
     * @notice 提取手续费
     * @param token Token 地址
     * @param recipient 接收者地址
     * @param amount 金额
     */
    function withdraw(address token, address recipient, uint256 amount) external nonReentrant {
        if (recipient == address(0)) revert InvalidAddress(recipient);
        if (amount == 0) revert InvalidAmount(amount);

        // 检查权限: 只有受益人可以提取自己的份额
        uint256 available = beneficiaryBalances[msg.sender][token];
        if (available < amount) {
            revert InsufficientBalance(token, amount, available);
        }

        // 更新余额
        beneficiaryBalances[msg.sender][token] -= amount;
        feeBalances[token] -= amount;
        totalWithdrawn[token] += amount;

        // 转账
        if (token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // ETH
            (bool sent, ) = recipient.call{value: amount}("");
            require(sent, "AdminFeeVault: failed to send ETH");
        } else {
            // ERC20
            IERC20(token).safeTransfer(recipient, amount);
        }

        emit FeeWithdrawn(token, recipient, amount);
    }

    /**
     * @notice 设置受益人地址
     * @param role 角色
     * @param beneficiary 受益人地址
     */
    function setBeneficiary(string calldata role, address beneficiary) external onlyOwner {
        _setBeneficiary(role, beneficiary);
    }

    /**
     * @notice 内部函数: 设置受益人
     */
    function _setBeneficiary(string memory role, address beneficiary) internal {
        if (beneficiary == address(0)) revert InvalidAddress(beneficiary);

        bytes32 roleKey = keccak256(bytes(role));
        address oldBeneficiary = beneficiaries[roleKey];

        beneficiaries[roleKey] = beneficiary;

        // 记录角色
        if (!roleExists[roleKey]) {
            beneficiaryRoles.push(roleKey);
            roleExists[roleKey] = true;
        }

        emit BeneficiaryUpdated(role, oldBeneficiary, beneficiary);
    }

    /**
     * @notice 设置分配比例
     * @param role 角色
     * @param ratio 比例(基点)
     */
    function setAllocationRatio(string calldata role, uint256 ratio) external onlyOwner {
        _setAllocationRatio(role, ratio);
    }

    /**
     * @notice 内部函数: 设置分配比例
     */
    function _setAllocationRatio(string memory role, uint256 ratio) internal {
        if (ratio > RATIO_PRECISION) revert InvalidRatio(ratio);

        bytes32 roleKey = keccak256(bytes(role));
        uint256 oldRatio = allocationRatios[roleKey];

        // 计算新的总比例
        uint256 totalRatio = 0;
        for (uint256 i = 0; i < beneficiaryRoles.length; i++) {
            bytes32 r = beneficiaryRoles[i];
            if (r == roleKey) {
                totalRatio += ratio;
            } else {
                totalRatio += allocationRatios[r];
            }
        }

        if (totalRatio > MAX_TOTAL_RATIO) revert TotalRatioExceedsMax(totalRatio);

        allocationRatios[roleKey] = ratio;

        // 记录角色
        if (!roleExists[roleKey]) {
            beneficiaryRoles.push(roleKey);
            roleExists[roleKey] = true;
        }

        emit AllocationRatioUpdated(role, oldRatio, ratio);
    }

    /**
     * @notice 添加授权的 Pod
     * @param pod Pod 地址
     */
    function addAuthorizedPod(address pod) external onlyOwner {
        if (pod == address(0)) revert InvalidAddress(pod);
        require(!authorizedPods[pod], "AdminFeeVault: pod already authorized");

        authorizedPods[pod] = true;
        authorizedPodsList.push(pod);
    }

    /**
     * @notice 移除授权的 Pod
     * @param pod Pod 地址
     */
    function removeAuthorizedPod(address pod) external onlyOwner {
        require(authorizedPods[pod], "AdminFeeVault: pod not authorized");

        authorizedPods[pod] = false;

        // 从数组中移除
        for (uint256 i = 0; i < authorizedPodsList.length; i++) {
            if (authorizedPodsList[i] == pod) {
                authorizedPodsList[i] = authorizedPodsList[authorizedPodsList.length - 1];
                authorizedPodsList.pop();
                break;
            }
        }
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取手续费余额
     * @param token Token 地址
     * @return balance 余额
     */
    function getFeeBalance(address token) external view returns (uint256 balance) {
        return feeBalances[token];
    }

    /**
     * @notice 获取待分配余额
     * @param token Token 地址
     * @return pending 待分配金额
     */
    function getPendingDistribution(address token) external view returns (uint256 pending) {
        return pendingDistribution[token];
    }

    /**
     * @notice 获取受益人地址
     * @param role 角色
     * @return beneficiary 受益人地址
     */
    function getBeneficiary(string calldata role) external view returns (address beneficiary) {
        bytes32 roleKey = keccak256(bytes(role));
        return beneficiaries[roleKey];
    }

    /**
     * @notice 获取分配比例
     * @param role 角色
     * @return ratio 比例(基点)
     */
    function getAllocationRatio(string calldata role) external view returns (uint256 ratio) {
        bytes32 roleKey = keccak256(bytes(role));
        return allocationRatios[roleKey];
    }

    /**
     * @notice 检查 Pod 是否授权
     * @param pod Pod 地址
     * @return isAuthorized 是否授权
     */
    function isAuthorizedPod(address pod) external view returns (bool isAuthorized) {
        return authorizedPods[pod];
    }

    /**
     * @notice 获取总收集量
     * @param token Token 地址
     * @return total 总收集量
     */
    function getTotalCollected(address token) external view returns (uint256 total) {
        return totalCollected[token];
    }

    /**
     * @notice 获取总分配量
     * @param token Token 地址
     * @return total 总分配量
     */
    function getTotalDistributed(address token) external view returns (uint256 total) {
        return totalDistributed[token];
    }

    /**
     * @notice 获取受益人余额
     * @param beneficiary 受益人地址
     * @param token Token 地址
     * @return balance 余额
     */
    function getBeneficiaryBalance(address beneficiary, address token) external view returns (uint256 balance) {
        return beneficiaryBalances[beneficiary][token];
    }

    // ============ 管理功能 Admin Functions ============

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
