// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DepositManager
 * @notice 管理市场创建者的ETH押金和利息（部署在Ethereum Sepolia）
 * @dev 押金用ETH支付，生成5% APR利息
 */
contract DepositManager {
    
    // 押金信息结构
    struct Deposit {
        address creator;           // 创建者地址
        uint256 amount;           // 押金金额（ETH）
        uint256 depositTime;      // 押金时间
        uint256 withdrawTime;     // 提取时间（0表示未提取）
        bool isActive;            // 是否活跃
        string marketId;          // 关联的市场ID（HashKey 链上的市场ID）
    }
    
    // 押金记录
    mapping(uint256 => Deposit) public deposits;
    mapping(address => uint256[]) public userDeposits;
    
    uint256 public depositCount;
    uint256 public constant ANNUAL_RATE = 5; // 5% APR
    uint256 public constant RATE_DENOMINATOR = 100;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // 事件
    event DepositCreated(uint256 indexed depositId, address indexed creator, uint256 amount, string marketId);
    event DepositWithdrawn(uint256 indexed depositId, address indexed creator, uint256 amount, uint256 interest);
    event DepositForfeited(uint256 indexed depositId, address indexed creator, uint256 amount);
    
    /**
     * @notice 创建押金
     * @param marketId 关联的市场ID
     */
    function createDeposit(string memory marketId) external payable returns (uint256) {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        depositCount++;
        uint256 depositId = depositCount;
        
        deposits[depositId] = Deposit({
            creator: msg.sender,
            amount: msg.value,
            depositTime: block.timestamp,
            withdrawTime: 0,
            isActive: true,
            marketId: marketId
        });
        
        userDeposits[msg.sender].push(depositId);
        
        emit DepositCreated(depositId, msg.sender, msg.value, marketId);
        
        return depositId;
    }
    
    /**
     * @notice 计算累计利息
     * @param depositId 押金ID
     */
    function calculateInterest(uint256 depositId) public view returns (uint256) {
        Deposit memory deposit = deposits[depositId];
        
        if (!deposit.isActive || deposit.amount == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - deposit.depositTime;
        
        // 利息 = 本金 * 年利率 * 时间 / (秒数/年)
        uint256 interest = (deposit.amount * ANNUAL_RATE * timeElapsed) / (RATE_DENOMINATOR * SECONDS_PER_YEAR);
        
        return interest;
    }
    
    /**
     * @notice 提取押金和利息（市场正常结束）
     * @param depositId 押金ID
     */
    function withdrawDeposit(uint256 depositId) external {
        Deposit storage deposit = deposits[depositId];
        
        require(deposit.isActive, "Deposit is not active");
        require(deposit.creator == msg.sender, "Only creator can withdraw");
        
        uint256 interest = calculateInterest(depositId);
        uint256 totalAmount = deposit.amount + interest;
        
        deposit.isActive = false;
        deposit.withdrawTime = block.timestamp;
        
        (bool success, ) = payable(msg.sender).call{value: totalAmount}("");
        require(success, "Transfer failed");
        
        emit DepositWithdrawn(depositId, msg.sender, deposit.amount, interest);
    }
    
    /**
     * @notice 没收押金（市场被删除或违规）
     * @param depositId 押金ID
     */
    function forfeitDeposit(uint256 depositId) external {
        Deposit storage deposit = deposits[depositId];
        
        require(deposit.isActive, "Deposit is not active");
        require(deposit.creator == msg.sender, "Only creator can forfeit");
        
        uint256 amount = deposit.amount;
        
        deposit.isActive = false;
        deposit.withdrawTime = block.timestamp;
        deposit.amount = 0; // 押金归零，不退还
        
        emit DepositForfeited(depositId, msg.sender, amount);
    }
    
    /**
     * @notice 获取押金详情
     * @param depositId 押金ID
     */
    function getDeposit(uint256 depositId) external view returns (
        address creator,
        uint256 amount,
        uint256 depositTime,
        uint256 withdrawTime,
        bool isActive,
        string memory marketId,
        uint256 currentInterest
    ) {
        Deposit memory deposit = deposits[depositId];
        uint256 interest = calculateInterest(depositId);
        
        return (
            deposit.creator,
            deposit.amount,
            deposit.depositTime,
            deposit.withdrawTime,
            deposit.isActive,
            deposit.marketId,
            interest
        );
    }
    
    /**
     * @notice 获取用户的所有押金
     * @param user 用户地址
     */
    function getUserDeposits(address user) external view returns (uint256[] memory) {
        return userDeposits[user];
    }
    
    /**
     * @notice 检查押金是否启用利息（金额 > 1 ETH）
     * @param depositId 押金ID
     */
    function isYieldEnabled(uint256 depositId) external view returns (bool) {
        return deposits[depositId].amount > 1 ether;
    }
    
    /**
     * @notice 获取合约余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
