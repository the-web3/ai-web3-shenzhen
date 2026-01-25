// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IOracleManager
 * @notice 预言机管理器接口 - 管理预言机适配器的生命周期
 * @dev 支持多预言机适配器管理和路由
 */
interface IOracleManager {
    // ============ 事件 Events ============

    /// @notice 预言机适配器添加事件
    event OracleAdapterAdded(address indexed adapter, string name);

    /// @notice 预言机适配器移除事件
    event OracleAdapterRemoved(address indexed adapter, string name);

    /// @notice 默认适配器更新事件
    event DefaultAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);

    /// @notice 预言机授权事件
    event OracleAuthorized(address indexed oracle, address indexed adapter);

    /// @notice 预言机撤销授权事件
    event OracleUnauthorized(address indexed oracle, address indexed adapter);

    // ============ 错误 Errors ============

    error InvalidAdapter(address adapter);
    error AdapterAlreadyExists(address adapter);
    error AdapterNotFound(address adapter);

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 添加预言机适配器
     * @param adapter 适配器地址
     * @param name 适配器名称
     */
    function addOracleAdapter(address adapter, string calldata name) external;

    /**
     * @notice 移除预言机适配器
     * @param adapter 适配器地址
     */
    function removeOracleAdapter(address adapter) external;

    /**
     * @notice 设置默认适配器
     * @param adapter 适配器地址
     */
    function setDefaultAdapter(address adapter) external;

    /**
     * @notice 授权预言机
     * @param oracle 预言机地址
     * @param adapter 适配器地址
     */
    function authorizeOracle(address oracle, address adapter) external;

    /**
     * @notice 撤销预言机授权
     * @param oracle 预言机地址
     * @param adapter 适配器地址
     */
    function unauthorizeOracle(address oracle, address adapter) external;

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取默认适配器
     * @return adapter 默认适配器地址
     */
    function getDefaultAdapter() external view returns (address adapter);

    /**
     * @notice 检查适配器是否存在
     * @param adapter 适配器地址
     * @return exists 是否存在
     */
    function isAdapterRegistered(address adapter) external view returns (bool exists);

    /**
     * @notice 获取所有适配器
     * @return adapters 适配器地址列表
     */
    function getAllAdapters() external view returns (address[] memory adapters);
}
