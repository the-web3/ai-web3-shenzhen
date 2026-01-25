// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interfaces/oracle/IOracleManager.sol";

/**
 * @title OracleManagerStorage
 * @notice OracleManager 的存储层合约
 * @dev 存储预言机适配器和授权信息
 */
abstract contract OracleManagerStorage is IOracleManager {
    // ============ 适配器管理 Adapter Management ============

    /// @notice 适配器信息结构体
    struct AdapterInfo {
        address adapter; // 适配器地址
        string name; // 适配器名称
        bool active; // 是否激活
        uint256 addedAt; // 添加时间
    }

    /// @notice 适配器映射: adapter => AdapterInfo
    mapping(address => AdapterInfo) internal adapters;

    /// @notice 适配器列表
    address[] internal adaptersList;

    /// @notice 默认适配器
    address public defaultAdapter;

    // ============ 授权管理 Authorization ============

    /// @notice 预言机授权映射: oracle => adapter => authorized
    mapping(address => mapping(address => bool)) internal oracleAuthorizations;

    /// @notice 预言机授权列表: oracle => adapters[]
    mapping(address => address[]) internal oracleAdaptersList;

    // ============ 统计数据 Statistics ============

    /// @notice 总适配器数
    uint256 public totalAdapters;

    /// @notice 活跃适配器数
    uint256 public activeAdapters;

    // ============ 预留升级空间 Upgrade Reserve ============

    /// @notice 预留 storage slots
    uint256[40] private __gap;
}
