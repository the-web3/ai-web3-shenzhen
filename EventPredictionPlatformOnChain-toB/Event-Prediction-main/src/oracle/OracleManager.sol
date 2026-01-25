// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./OracleManagerStorage.sol";
import "../interfaces/oracle/IOracle.sol";
import "./OracleAdapter.sol";

/**
 * @title OracleManager
 * @notice 预言机管理器 - 管理预言机适配器的生命周期
 * @dev 支持多预言机适配器和统一管理
 */
contract OracleManager is Initializable, OwnableUpgradeable, PausableUpgradeable, OracleManagerStorage {
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
    }

    // ============ 核心功能 Core Functions ============

    /**
     * @notice 添加预言机适配器
     * @param adapter 适配器地址
     * @param name 适配器名称
     */
    function addOracleAdapter(address adapter, string calldata name) external onlyOwner whenNotPaused {
        if (adapter == address(0)) revert InvalidAdapter(adapter);
        if (adapters[adapter].adapter != address(0)) {
            revert AdapterAlreadyExists(adapter);
        }

        adapters[adapter] = AdapterInfo({adapter: adapter, name: name, active: true, addedAt: block.timestamp});

        adaptersList.push(adapter);
        totalAdapters++;
        activeAdapters++;

        // 如果是第一个适配器,设置为默认
        if (defaultAdapter == address(0)) {
            defaultAdapter = adapter;
        }

        emit OracleAdapterAdded(adapter, name);
    }

    /**
     * @notice 移除预言机适配器
     * @param adapter 适配器地址
     */
    function removeOracleAdapter(address adapter) external onlyOwner {
        if (adapters[adapter].adapter == address(0)) {
            revert AdapterNotFound(adapter);
        }

        AdapterInfo storage adapterInfo = adapters[adapter];
        string memory name = adapterInfo.name;

        // 标记为不活跃
        if (adapterInfo.active) {
            adapterInfo.active = false;
            activeAdapters--;
        }

        // 如果是默认适配器,清除默认
        if (defaultAdapter == adapter) {
            defaultAdapter = address(0);
        }

        emit OracleAdapterRemoved(adapter, name);
    }

    /**
     * @notice 设置默认适配器
     * @param adapter 适配器地址
     */
    function setDefaultAdapter(address adapter) external onlyOwner {
        if (adapters[adapter].adapter == address(0)) {
            revert AdapterNotFound(adapter);
        }
        require(adapters[adapter].active, "OracleManager: adapter not active");

        address oldAdapter = defaultAdapter;
        defaultAdapter = adapter;

        emit DefaultAdapterUpdated(oldAdapter, adapter);
    }

    /**
     * @notice 授权预言机
     * @param oracle 预言机地址
     * @param adapter 适配器地址
     */
    function authorizeOracle(address oracle, address adapter) external onlyOwner {
        require(oracle != address(0), "OracleManager: invalid oracle");
        if (adapters[adapter].adapter == address(0)) {
            revert AdapterNotFound(adapter);
        }

        // 授权到指定适配器
        if (!oracleAuthorizations[oracle][adapter]) {
            oracleAuthorizations[oracle][adapter] = true;
            oracleAdaptersList[oracle].push(adapter);

            // 调用适配器的授权函数
            OracleAdapter(adapter).addAuthorizedOracle(oracle);

            emit OracleAuthorized(oracle, adapter);
        }
    }

    /**
     * @notice 撤销预言机授权
     * @param oracle 预言机地址
     * @param adapter 适配器地址
     */
    function unauthorizeOracle(address oracle, address adapter) external onlyOwner {
        if (adapters[adapter].adapter == address(0)) {
            revert AdapterNotFound(adapter);
        }

        if (oracleAuthorizations[oracle][adapter]) {
            oracleAuthorizations[oracle][adapter] = false;

            // 从列表中移除
            address[] storage oracleAdapters = oracleAdaptersList[oracle];
            for (uint256 i = 0; i < oracleAdapters.length; i++) {
                if (oracleAdapters[i] == adapter) {
                    oracleAdapters[i] = oracleAdapters[oracleAdapters.length - 1];
                    oracleAdapters.pop();
                    break;
                }
            }

            // 调用适配器的撤销授权函数
            OracleAdapter(adapter).removeAuthorizedOracle(oracle);

            emit OracleUnauthorized(oracle, adapter);
        }
    }

    // ============ 查询功能 View Functions ============

    /**
     * @notice 获取默认适配器
     * @return adapter 默认适配器地址
     */
    function getDefaultAdapter() external view returns (address adapter) {
        return defaultAdapter;
    }

    /**
     * @notice 检查适配器是否存在
     * @param adapter 适配器地址
     * @return exists 是否存在
     */
    function isAdapterRegistered(address adapter) external view returns (bool exists) {
        return adapters[adapter].adapter != address(0);
    }

    /**
     * @notice 获取所有适配器
     * @return _adapters 适配器地址列表
     */
    function getAllAdapters() external view returns (address[] memory _adapters) {
        return adaptersList;
    }

    /**
     * @notice 获取适配器信息
     * @param adapter 适配器地址
     * @return info 适配器信息
     */
    function getAdapterInfo(address adapter) external view returns (AdapterInfo memory info) {
        return adapters[adapter];
    }

    /**
     * @notice 获取预言机授权的适配器列表
     * @param oracle 预言机地址
     * @return _adapters 适配器地址列表
     */
    function getOracleAdapters(address oracle) external view returns (address[] memory _adapters) {
        return oracleAdaptersList[oracle];
    }

    /**
     * @notice 检查预言机是否授权到指定适配器
     * @param oracle 预言机地址
     * @param adapter 适配器地址
     * @return authorized 是否授权
     */
    function isOracleAuthorized(address oracle, address adapter) external view returns (bool authorized) {
        return oracleAuthorizations[oracle][adapter];
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
}
