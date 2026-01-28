// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/**
 * @title FishCakeOraclePaymaster
 * @author Monster-Three
 * @notice 进阶版预言机计费 Paymaster
 * @dev 实现了 ERC-4337 v0.7.0 标准，允许用户使用 ERC20 代币支付 Gas，并通过 Chainlink 获取实时汇率。
 * 该合约通过收取的 PRICE_MARKUP 实现协议的自我盈利。
 */
contract FishCakeOraclePaymaster is BasePaymaster {
    using SafeERC20 for IERC20;

    /// @notice 用户支付 Gas 所使用的代币地址（如 USDC）
    IERC20 public immutable token;

    /// @notice Chainlink 价格喂价接口
    AggregatorV3Interface internal immutable priceFeed;

    /// @dev 价格安全边际：110 代表收取 110% 的费用（10% 作为服务费及价格波动对冲）
    uint256 public constant PRICE_MARKUP = 110;
    /// @dev 分母基数，用于计算百分比
    uint256 public constant PRICE_DENOMINATOR = 100;

    /**
     * @notice 初始化 Paymaster 合约
     * @param _entryPoint ERC-4337 EntryPoint 官方合约地址
     * @param _owner 合约管理员地址（拥有提现和配置权限）
     * @param _token 用户支付 Gas 用的 ERC20 代币地址
     * @param _priceFeed Chainlink 价格对地址（例如 ETH/USD）
     */
    constructor(
        IEntryPoint _entryPoint,
        address _owner,
        address _token,
        address _priceFeed
    ) BasePaymaster(_entryPoint, _owner) {
        token = IERC20(_token);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @notice 从 Chainlink 预言机获取最新的 ETH 价格
     * @dev 包含时效性检查，防止过时价格导致合约亏损
     * @return 8 位精度的 ETH 价格
     */
    function getLatestPrice() public view returns (uint256) {
        (, int price, , uint timeStamp, ) = priceFeed.latestRoundData();

        // 检查预言机数据的时效性（防止“喂价过时”攻击）
        require(timeStamp > 0, "Chainlink: stale price");
        require(price > 0, "Chainlink: invalid price");

        return uint256(price);
    }

    /**
     * @notice ERC-4337 验证函数：决定是否为用户的操作支付 Gas
     * @dev 验证阶段会预估最大的代币成本，并检查用户余额是否充足
     * @param userOp 封装的用户操作对象 (v0.7.0 PackedUserOperation)
     * @param  用户操作的唯一哈希值
     * @param maxCost 此次交易可能消耗的最大 ETH 成本
     * @return context 包含发送者地址和当前币价的上下文数据，传递给 postOp
     * @return validationData 验证结果（0 代表通过）
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    )
        internal
        view
        override
        returns (bytes memory context, uint256 validationData)
    {
        uint256 ethPrice = getLatestPrice();

        /**
         * 计算代币最大成本逻辑：
         * maxTokenCost = (ETH 成本 * ETH 价格 * 溢价系数) / 预言机精度
         */
        uint256 maxTokenCost = (maxCost * ethPrice * PRICE_MARKUP) /
            (1e8 * PRICE_DENOMINATOR);

        // 验证用户是否有足够的代币余额来支付这笔 Gas
        require(
            token.balanceOf(userOp.sender) >= maxTokenCost,
            "Paymaster: User low balance"
        );

        // 将数据编码传给 _postOp 阶段进行最终结算
        return (abi.encode(userOp.sender, ethPrice), 0);
    }

    /**
     * @notice 交易执行后的结算钩子
     * @param mode 操作模式
     * @param context 上下文数据
     * @param actualGasCost 实际消耗的 ETH 成本
     * @param  实际的 Gas 价格（v0.7 新增参数）
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */ // <--- 必须加上这个参数名和类型
    ) internal override {
        // 以下逻辑保持不变
        if (mode == PostOpMode.postOpReverted) return;

        (address sender, uint256 ethPrice) = abi.decode(
            context,
            (address, uint256)
        );

        uint256 actualTokenCost = (actualGasCost * ethPrice * PRICE_MARKUP) /
            (1e8 * PRICE_DENOMINATOR);

        token.safeTransferFrom(sender, address(this), actualTokenCost);
    }

    /**
     * @notice 管理员功能：向 EntryPoint 充值 ETH 以维持 Paymaster 运行
     * @dev 必须与父类 BasePaymaster 的可见性一致（public）
     */
    function depositFunds() public payable onlyOwner {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice 管理员功能：提取 Paymaster 合约中收取的 ERC20 代币利润
     * @param to 接收地址
     * @param amount 提取金额
     */
    function withdrawToken(address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }
}
