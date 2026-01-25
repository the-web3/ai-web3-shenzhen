// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev 必须定义 UserOperation 结构体，确保与 EntryPoint 交互的数据结构一致
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

/**
 * @title FishCakePaymaster
 * @author Monster-Three
 * @notice 为白名单用户代付 Gas 费用的中继合约
 * @dev 实现了 ERC-4337 的 IPaymaster 接口
 */
contract FishCakePaymaster is Ownable {
    /// @notice 官方 EntryPoint 地址
    address public constant ENTRY_POINT =
        0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    /// @notice 用户白名单映射
    /// @dev 只有映射为 true 的智能账户，其交易才会被本 Paymaster 资助
    mapping(address => bool) public isWhitelisted;

    /// @notice 初始化时设置合约管理员
    constructor() Ownable(msg.sender) {}

    /**
     * @notice 修改用户白名单状态
     * @param _user 目标智能账户地址
     * @param _status 是否允许其免费发送交易
     */
    function setWhitelist(address _user, bool _status) external onlyOwner {
        isWhitelisted[_user] = _status;
    }

    /**
     * @notice ERC-4337 核心函数：验证 Paymaster 是否愿意为该操作付款
     * @dev 被 EntryPoint 在验证循环（Verification Loop）中调用
     * @param userOp 用户操作对象
     * @param  用户操作的哈希值（本合约暂未使用）
     * @param  该笔交易预估的最大 Gas 成本（本合约暂未使用）
     * @return context 传递给 postOp 的上下文数据（本合约为空）
     * @return validationData 验证结果。0 代表接受支付，1 代表拒绝
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */, // 去掉变量名，保留类型
        uint256 /* maxCost */ // 也可以用注释标记原名，方便阅读
    ) external view returns (bytes memory context, uint256 validationData) {
        // 安全检查：只有官方 EntryPoint 有权询问 Paymaster
        require(
            msg.sender == ENTRY_POINT,
            "FishCakePaymaster: Only EntryPoint"
        );

        // 业务逻辑：检查 UserOp 的发送者（即智能账户）是否在白名单中
        if (isWhitelisted[userOp.sender]) {
            // 返回 0 表示愿意支付
            // 在生产环境中，这里通常还会验证 paymasterAndData 中的签名
            return ("", 0);
        }

        // 返回 1 表示拒绝支付，交易将在验证阶段失败
        return ("", 1);
    }

    /**
     * @notice 向 EntryPoint 充值 ETH
     * @dev Paymaster 的资金必须预存在 EntryPoint 中，交易发生时由 EntryPoint 直接扣除
     */
    function deposit() external payable onlyOwner {
        // 调用 EntryPoint 的 depositTo 函数，将资金记录在 FishCakePaymaster 名下
        (bool success, ) = ENTRY_POINT.call{value: msg.value}(
            abi.encodeWithSignature("depositTo(address)", address(this))
        );
        require(success, "FishCakePaymaster: Deposit to EntryPoint failed");
    }

    /**
     * @notice 允许管理员从 Paymaster 合约中提取余额（非 EntryPoint 中的余额）
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        require(success, "FishCakePaymaster: Withdraw failed");
    }
}
