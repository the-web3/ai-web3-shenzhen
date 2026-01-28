// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FishCakeSmartAccount} from "./FishCakeSmartAccount.sol";

/**
 * @title FishCakeFactory
 * @author Monster-Three
 * @notice 这是一个用于部署 FishCake 智能钱包的工厂合约。
 * @dev 利用以太坊的 CREATE2 操作码实现“确定性部署”，确保用户在多链环境下拥有相同的钱包地址。
 * 核心原理：地址 = f(0xff, factoryAddress, salt, keccak256(bytecode))
 */
contract FishCakeFactory {
    /// @notice 当一个新的账户被成功部署时触发
    /// @param account 部署后的智能钱包地址
    /// @param owner 钱包的所有者地址
    /// @param salt 用户提供的原始随机盐值
    event AccountDeployed(
        address indexed account,
        address indexed owner,
        uint256 salt
    );

    /**
     * @notice 部署 FishCake 智能钱包
     * @dev 如果该地址已被部署，交易将回滚。该函数会先部署合约，随后立即初始化所有权。
     * @param _owner 钱包的管理员（通常是用户的 EOA 地址）
     * @param _salt 随机盐值。只要此盐值和 Factory 地址不变，部署出的地址在任何链都一致。
     * @return 部署成功的智能钱包地址
     */
    function deployAccount(
        address _owner,
        uint256 _salt
    ) external returns (address) {
        // 1. 获取智能钱包合约的初始化代码（Creation Code）
        bytes memory bytecode = type(FishCakeSmartAccount).creationCode;

        // 2. 生成最终盐值
        // 安全亮点：将 _owner 混入 salt。这样即便黑客知道了你的 salt，
        // 只要他不是 _owner，就无法在其他链上抢先部署你的钱包地址（防止 Front-running）。
        bytes32 finalSalt = keccak256(abi.encodePacked(_owner, _salt));

        address addr;
        // 3. 使用内联汇编调用指令级的 create2
        // 0: 部署时发送的以太币数量 (msg.value)
        // add(bytecode, 0x20): 实际代码在内存中的起始位置（跳过 32 字节的长度前缀）
        // mload(bytecode): 代码的长度
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), finalSalt)
            // 如果地址长度为 0，说明部署失败（可能是地址冲突）
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        // 4. 初始化账户：将合约内部的 owner 变量设为传入的 _owner
        // 注意：在 AA 中，initialize 必须紧跟 deploy 以防止被他人抢先初始化
        FishCakeSmartAccount(payable(addr)).initialize(_owner);

        emit AccountDeployed(addr, _owner, _salt);
        return addr;
    }

    /**
     * @notice 离线预计算钱包地址
     * @dev 前端通过此函数向用户展示“即将生成”的地址，用户可以先向该地址转账 Gas 费，然后再触发部署。
     * @dev Manually implements EIP-1014 to predict CREATE2 address without deployment.
     * @param _owner 预期的所有者
     * @param _salt 部署时拟使用的盐值
     * @return 预计算出的合约地址
     */
    function getAddress(
        address _owner,
        uint256 _salt
    ) public view returns (address) {
        // 必须与 deployAccount 中的混合逻辑完全一致
        bytes32 finalSalt = keccak256(abi.encodePacked(_owner, _salt));

        // 按照以太坊 EIP-1014 标准计算哈希
        // 0xff 是前缀，防止与普通 create 部署的地址冲突
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                finalSalt,
                keccak256(type(FishCakeSmartAccount).creationCode)
            )
        );

        // 取哈希的后 160 位（20 字节）作为地址
        return address(uint160(uint256(hash)));
    }
}
