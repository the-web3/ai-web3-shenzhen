// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title TruthArenaProxy
 * @dev 这是一个标准的 ERC1967 代理合约，用于配合 UUPS 逻辑合约使用
 * @notice 这个合约就是"躯壳"，它负责存储所有数据（Storage）和转发请求（DelegateCall）
 */
contract TruthArenaProxy is ERC1967Proxy {
    /**
     * @dev 构造函数
     * @param implementation 逻辑合约（Logic/Implementation）的地址
     * @param _data 初始化数据（Encoded call to initialize function）
     * 
     * @notice 这里会发生两件事：
     * 1. 把逻辑合约地址存到那个"偏僻的 Slot"里 (IMPLEMENTATION_SLOT)
     * 2. 调用逻辑合约的 initialize() 函数，完成初始设置（如设置 owner）
     */
    constructor(address implementation, bytes memory _data) 
        ERC1967Proxy(implementation, _data) 
    {}
}
