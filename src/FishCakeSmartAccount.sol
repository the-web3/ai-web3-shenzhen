// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title FishCakeSmartAccount
 * @author Monster-Three
 * @notice 符合 ERC-4337 标准的智能合约钱包核心
 * @dev 实现了验证 UserOperation 的接口，并支持通过 EntryPoint 进行授权调用
 */

/**
 * @dev ERC-4337 用户操作结构体
 * 包含了一个交易所需的所有元数据：从 Gas 限制到支付逻辑
 */
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

contract FishCakeSmartAccount is Initializable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // --- 状态变量 ---
    address public owner;

    /// @notice ERC-4337 官方 EntryPoint 地址 (v0.6)
    /// @dev 这是整个 AA 流程的唯一可信入口
    address public constant ENTRY_POINT =
        0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    // --- 修饰符 ---
    modifier onlyEntryPoint() {
        require(
            msg.sender == ENTRY_POINT,
            "FishCake: Caller is not EntryPoint"
        );
        _;
    }

    /// @notice 构造逻辑：初始化钱包所有者
    /// @dev 由于是工厂部署，使用 initializer 确保只能初始化一次
    function initialize(address _owner) external initializer {
        owner = _owner;
    }

    /**
     * @notice ERC-4337 核心函数：验证用户操作
     * @dev 被 EntryPoint 在验证阶段（Verification Loop）调用
     * @param userOp 待执行的操作
     * @param userOpHash 协议预先计算好的待签名哈希
     * @param missingAccountFunds 钱包需要预支付给 EntryPoint 的 Gas 费用
     * @return validationData 0 表示验证成功；1 表示签名无效
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external onlyEntryPoint returns (uint256 validationData) {
        // 1. 签名验证
        // 将 userOpHash 转换为以太坊标准签名哈希 (EthSignedMessageHash)
        // 使用 ECDSA 库从签名中恢复出签名者地址
        address signer = userOpHash.toEthSignedMessageHash().recover(
            userOp.signature
        );

        if (owner != signer) {
            // 返回 SIG_VALIDATION_FAILED (1)
            return 1;
        }

        // 2. 预支付 Gas 补偿 (Missing Funds)
        // 如果没有 Paymaster，钱包必须自己支付执行所需的最高 Gas 费用
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }(""); // 允许使用剩余所有 Gas
            require(success, "FishCake: Failed to pay missing funds");
        }

        // 验证成功返回 0
        return 0;
    }

    /**
     * @notice 执行业务交易
     * @dev 增加权限检查：允许 EntryPoint (AA 路径) 或 Owner (直接调用路径) 执行
     * @param dest 目标合约地址
     * @param value 附带的 ETH 金额
     * @param func 编码后的函数调用数据 (calldata)
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        // 安全检查：只有本人或 EntryPoint 能触发此钱包的行为
        require(
            msg.sender == ENTRY_POINT || msg.sender == owner,
            "FishCake: Unauthorized execution"
        );

        (bool success, ) = dest.call{value: value}(func);
        require(success, "FishCake: Execution reverted");
    }

    // 允许接收 ETH
    receive() external payable {}
}
