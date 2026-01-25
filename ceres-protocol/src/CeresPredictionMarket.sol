// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {CeresGreenPoints} from "./CeresGreenPoints.sol";

/**
 * @title CeresPredictionMarket
 * @dev Prediction market contract for Ceres Protocol judgment events
 * 
 * This contract implements a standard prediction market with YES/NO shares trading.
 * It receives initial liquidity from the judgment event creator and allows other users
 * to trade shares based on their predictions of the event outcome.
 * 
 * Key features:
 * - Automated market maker (AMM) pricing using constant product formula
 * - Trading fee collection (2% per trade)
 * - Creator reward distribution (20% of trading fees)
 * - Final settlement and reward claiming
 * - Reentrancy protection and security measures
 */
contract CeresPredictionMarket is ReentrancyGuard, Pausable {
    // Economic model constants
    uint256 public constant TRADING_FEE_BPS = 200; // 2% trading fee
    uint256 public constant CREATOR_REWARD_BPS = 2000; // 20% of trading fees to creator
    uint256 public constant BASIS_POINTS = 10000; // 100% in basis points
    uint256 public constant MIN_LIQUIDITY = 1000; // Minimum liquidity to prevent division by zero
    uint256 public constant PRICE_PRECISION = 1e18; // Price calculation precision

    /**
     * @dev Structure representing the overall market state
     */
    struct MarketState {
        bytes32 eventId;                // Associated judgment event ID
        uint256 totalYesShares;         // Total YES shares in circulation
        uint256 totalNoShares;          // Total NO shares in circulation
        uint256 totalVolume;            // Total trading volume in HKTC
        uint256 accumulatedFees;        // Total fees collected from trading
        bool isFinalized;               // Whether the market has been finalized
        bool finalOutcome;              // Final outcome (true = YES, false = NO)
        address creator;                // Initial judgment event creator
        uint256 creatorRewardAmount;    // Amount available for creator to claim
        uint256 createdAt;              // Market creation timestamp
    }

    /**
     * @dev Structure representing a user's position in the market
     */
    struct UserPosition {
        uint256 yesShares;              // User's YES shares
        uint256 noShares;               // User's NO shares
        uint256 totalInvested;          // Total amount invested by user
        bool rewardClaimed;             // Whether user has claimed their winnings
    }

    /// @dev Current market state
    MarketState public marketState;
    
    /// @dev Mapping from user address to their position
    mapping(address => UserPosition) public userPositions;
    
    /// @dev Array of all users who have positions (for enumeration)
    address[] public users;
    
    /// @dev Mapping to check if user is already in users array
    mapping(address => bool) public isUser;
    
    /// @dev Reference to the CeresRegistry contract
    address public immutable ceresRegistry;
    
    /// @dev Reference to the green points contract
    CeresGreenPoints public immutable greenPoints;

    // Events
    event SharesPurchased(
        address indexed buyer,
        bool indexed isYes,
        uint256 amount,
        uint256 shares,
        uint256 price,
        uint256 fee
    );
    
    event SharesSold(
        address indexed seller,
        bool indexed isYes,
        uint256 shares,
        uint256 amount,
        uint256 price,
        uint256 fee
    );
    
    event MarketFinalized(
        bytes32 indexed eventId,
        bool outcome,
        uint256 totalVolume,
        uint256 creatorReward
    );
    
    event WinningsClaimed(
        address indexed user,
        uint256 amount,
        uint256 yesShares,
        uint256 noShares
    );
    
    event CreatorRewardClaimed(
        address indexed creator,
        uint256 amount
    );

    /**
     * @dev Constructor initializes the market with judgment event data
     * @param _eventId The judgment event ID this market is associated with
     * @param _creator Address of the judgment event creator
     * @param _initialYesShares Initial YES shares from creator's stake
     * @param _initialNoShares Initial NO shares from creator's stake
     * @param _ceresRegistry Address of the CeresRegistry contract
     * @param _greenPoints Address of the CeresGreenPoints contract
     */
    constructor(
        bytes32 _eventId,
        address _creator,
        uint256 _initialYesShares,
        uint256 _initialNoShares,
        address _ceresRegistry,
        address _greenPoints
    ) {
        require(_eventId != bytes32(0), "CeresPredictionMarket: invalid event ID");
        require(_creator != address(0), "CeresPredictionMarket: invalid creator address");
        require(_initialYesShares > 0, "CeresPredictionMarket: initial YES shares must be positive");
        require(_initialNoShares > 0, "CeresPredictionMarket: initial NO shares must be positive");
        require(_ceresRegistry != address(0), "CeresPredictionMarket: invalid registry address");
        require(_greenPoints != address(0), "CeresPredictionMarket: invalid green points address");

        ceresRegistry = _ceresRegistry;
        greenPoints = CeresGreenPoints(_greenPoints);

        // Initialize market state
        marketState = MarketState({
            eventId: _eventId,
            totalYesShares: _initialYesShares,
            totalNoShares: _initialNoShares,
            totalVolume: 0,
            accumulatedFees: 0,
            isFinalized: false,
            finalOutcome: false,
            creator: _creator,
            creatorRewardAmount: 0,
            createdAt: block.timestamp
        });

        // Give initial shares to creator
        userPositions[_creator] = UserPosition({
            yesShares: _initialYesShares,
            noShares: _initialNoShares,
            totalInvested: 0, // Creator doesn't count as "invested" since they provided initial liquidity
            rewardClaimed: false
        });

        // Add creator to users array
        users.push(_creator);
        isUser[_creator] = true;
    }

    /**
     * @dev Modifier to ensure only CeresRegistry can call certain functions
     */
    modifier onlyRegistry() {
        require(msg.sender == ceresRegistry, "CeresPredictionMarket: only registry can call");
        _;
    }

    /**
     * @dev Modifier to ensure market is not finalized
     */
    modifier notFinalized() {
        require(!marketState.isFinalized, "CeresPredictionMarket: market is finalized");
        _;
    }

    /**
     * @dev Modifier to ensure market is finalized
     */
    modifier onlyFinalized() {
        require(marketState.isFinalized, "CeresPredictionMarket: market not finalized");
        _;
    }

    /**
     * @dev Buys YES shares with HKTC
     * @param minShares Minimum shares to receive (slippage protection)
     */
    function buyYesShares(uint256 minShares) external payable whenNotPaused notFinalized nonReentrant {
        require(msg.value > 0, "CeresPredictionMarket: must send HKTC to buy shares");
        
        // Calculate trading fee
        uint256 fee = _calculateTradingFee(msg.value);
        uint256 amountAfterFee = msg.value - fee;
        
        // Calculate shares to receive using AMM formula
        uint256 shares = _calculateSharesForPurchase(amountAfterFee, true);
        require(shares >= minShares, "CeresPredictionMarket: insufficient shares received");
        require(shares > 0, "CeresPredictionMarket: no shares to purchase");
        
        // Update market state
        marketState.totalYesShares += shares;
        marketState.totalVolume += msg.value;
        marketState.accumulatedFees += fee;
        
        // Update creator reward
        _updateCreatorReward(fee);
        
        // Update user position
        _updateUserPosition(msg.sender, shares, 0, msg.value);
        
        // Calculate current price for event emission
        uint256 currentPrice = _calculateCurrentPrice(true);
        
        emit SharesPurchased(msg.sender, true, msg.value, shares, currentPrice, fee);
    }

    /**
     * @dev Buys NO shares with HKTC
     * @param minShares Minimum shares to receive (slippage protection)
     */
    function buyNoShares(uint256 minShares) external payable whenNotPaused notFinalized nonReentrant {
        require(msg.value > 0, "CeresPredictionMarket: must send HKTC to buy shares");
        
        // Calculate trading fee
        uint256 fee = _calculateTradingFee(msg.value);
        uint256 amountAfterFee = msg.value - fee;
        
        // Calculate shares to receive using AMM formula
        uint256 shares = _calculateSharesForPurchase(amountAfterFee, false);
        require(shares >= minShares, "CeresPredictionMarket: insufficient shares received");
        require(shares > 0, "CeresPredictionMarket: no shares to purchase");
        
        // Update market state
        marketState.totalNoShares += shares;
        marketState.totalVolume += msg.value;
        marketState.accumulatedFees += fee;
        
        // Update creator reward
        _updateCreatorReward(fee);
        
        // Update user position
        _updateUserPosition(msg.sender, 0, shares, msg.value);
        
        // Calculate current price for event emission
        uint256 currentPrice = _calculateCurrentPrice(false);
        
        emit SharesPurchased(msg.sender, false, msg.value, shares, currentPrice, fee);
    }

    /**
     * @dev Sells YES shares for HKTC
     * @param shares Number of YES shares to sell
     * @param minAmount Minimum HKTC to receive (slippage protection)
     */
    function sellYesShares(uint256 shares, uint256 minAmount) external whenNotPaused notFinalized nonReentrant {
        require(shares > 0, "CeresPredictionMarket: must sell positive shares");
        require(userPositions[msg.sender].yesShares >= shares, "CeresPredictionMarket: insufficient YES shares");
        
        // Calculate HKTC to receive using AMM formula
        uint256 amountBeforeFee = _calculateAmountForSale(shares, true);
        uint256 fee = _calculateTradingFee(amountBeforeFee);
        uint256 amountAfterFee = amountBeforeFee - fee;
        
        require(amountAfterFee >= minAmount, "CeresPredictionMarket: insufficient amount received");
        require(amountAfterFee > 0, "CeresPredictionMarket: no amount to receive");
        require(address(this).balance >= amountAfterFee, "CeresPredictionMarket: insufficient contract balance");
        
        // Update market state
        marketState.totalYesShares -= shares;
        marketState.totalVolume += amountBeforeFee;
        marketState.accumulatedFees += fee;
        
        // Update creator reward
        _updateCreatorReward(fee);
        
        // Update user position
        userPositions[msg.sender].yesShares -= shares;
        
        // Transfer HKTC to user
        (bool success, ) = msg.sender.call{value: amountAfterFee}("");
        require(success, "CeresPredictionMarket: transfer failed");
        
        // Calculate current price for event emission
        uint256 currentPrice = _calculateCurrentPrice(true);
        
        emit SharesSold(msg.sender, true, shares, amountAfterFee, currentPrice, fee);
    }

    /**
     * @dev Sells NO shares for HKTC
     * @param shares Number of NO shares to sell
     * @param minAmount Minimum HKTC to receive (slippage protection)
     */
    function sellNoShares(uint256 shares, uint256 minAmount) external whenNotPaused notFinalized nonReentrant {
        require(shares > 0, "CeresPredictionMarket: must sell positive shares");
        require(userPositions[msg.sender].noShares >= shares, "CeresPredictionMarket: insufficient NO shares");
        
        // Calculate HKTC to receive using AMM formula
        uint256 amountBeforeFee = _calculateAmountForSale(shares, false);
        uint256 fee = _calculateTradingFee(amountBeforeFee);
        uint256 amountAfterFee = amountBeforeFee - fee;
        
        require(amountAfterFee >= minAmount, "CeresPredictionMarket: insufficient amount received");
        require(amountAfterFee > 0, "CeresPredictionMarket: no amount to receive");
        require(address(this).balance >= amountAfterFee, "CeresPredictionMarket: insufficient contract balance");
        
        // Update market state
        marketState.totalNoShares -= shares;
        marketState.totalVolume += amountBeforeFee;
        marketState.accumulatedFees += fee;
        
        // Update creator reward
        _updateCreatorReward(fee);
        
        // Update user position
        userPositions[msg.sender].noShares -= shares;
        
        // Transfer HKTC to user
        (bool success, ) = msg.sender.call{value: amountAfterFee}("");
        require(success, "CeresPredictionMarket: transfer failed");
        
        // Calculate current price for event emission
        uint256 currentPrice = _calculateCurrentPrice(false);
        
        emit SharesSold(msg.sender, false, shares, amountAfterFee, currentPrice, fee);
    }

    /**
     * @dev Gets current market state
     * @return MarketState struct containing all market data
     */
    function getMarketState() external view returns (MarketState memory) {
        return marketState;
    }

    /**
     * @dev Gets user position data
     * @param user Address of the user
     * @return UserPosition struct containing user's position data
     */
    function getUserPosition(address user) external view returns (UserPosition memory) {
        return userPositions[user];
    }

    /**
     * @dev Gets current YES and NO prices
     * @return yesPrice Current price of YES shares (in wei per share)
     * @return noPrice Current price of NO shares (in wei per share)
     */
    function getCurrentPrices() external view returns (uint256 yesPrice, uint256 noPrice) {
        yesPrice = _calculateCurrentPrice(true);
        noPrice = _calculateCurrentPrice(false);
    }

    /**
     * @dev Gets the number of users with positions
     * @return Number of users
     */
    function getUserCount() external view returns (uint256) {
        return users.length;
    }

    /**
     * @dev Gets user address by index
     * @param index Index in the users array
     * @return User address
     */
    function getUserByIndex(uint256 index) external view returns (address) {
        require(index < users.length, "CeresPredictionMarket: index out of bounds");
        return users[index];
    }

    /**
     * @dev Calculates trading fee for a given amount
     * @param amount Amount to calculate fee for
     * @return fee Trading fee amount
     */
    function _calculateTradingFee(uint256 amount) internal pure returns (uint256 fee) {
        fee = (amount * TRADING_FEE_BPS) / BASIS_POINTS;
    }

    /**
     * @dev Updates creator reward amount
     * @param feeAmount Total fee collected
     */
    function _updateCreatorReward(uint256 feeAmount) internal {
        uint256 creatorReward = (feeAmount * CREATOR_REWARD_BPS) / BASIS_POINTS;
        marketState.creatorRewardAmount += creatorReward;
    }

    /**
     * @dev Updates user position and adds to users array if new user
     * @param user User address
     * @param yesSharesChange Change in YES shares (can be 0)
     * @param noSharesChange Change in NO shares (can be 0)
     * @param investmentAmount Amount invested in this transaction
     */
    function _updateUserPosition(
        address user,
        uint256 yesSharesChange,
        uint256 noSharesChange,
        uint256 investmentAmount
    ) internal {
        // Add to users array if new user
        if (!isUser[user]) {
            users.push(user);
            isUser[user] = true;
        }

        // Update position
        userPositions[user].yesShares += yesSharesChange;
        userPositions[user].noShares += noSharesChange;
        userPositions[user].totalInvested += investmentAmount;
    }

    /**
     * @dev Calculates shares to receive for a purchase using simplified constant product formula
     * @param amount Amount of HKTC to spend (after fees)
     * @param isYes Whether buying YES shares
     * @return shares Number of shares to receive
     */
    function _calculateSharesForPurchase(uint256 amount, bool isYes) internal view returns (uint256 shares) {
        if (isYes) {
            // For YES shares: shares = amount * totalNoShares / (totalYesShares + amount)
            // Simplified AMM formula that increases price as more shares are bought
            uint256 denominator = marketState.totalYesShares + amount;
            shares = (amount * marketState.totalNoShares) / denominator;
        } else {
            // For NO shares: shares = amount * totalYesShares / (totalNoShares + amount)
            uint256 denominator = marketState.totalNoShares + amount;
            shares = (amount * marketState.totalYesShares) / denominator;
        }
    }

    /**
     * @dev Calculates HKTC amount to receive for a sale using simplified constant product formula
     * @param shares Number of shares to sell
     * @param isYes Whether selling YES shares
     * @return amount Amount of HKTC to receive (before fees)
     */
    function _calculateAmountForSale(uint256 shares, bool isYes) internal view returns (uint256 amount) {
        if (isYes) {
            // For YES shares: amount = shares * totalYesShares / (totalNoShares + shares)
            require(marketState.totalYesShares >= shares, "CeresPredictionMarket: insufficient market YES shares");
            uint256 denominator = marketState.totalNoShares + shares;
            amount = (shares * marketState.totalYesShares) / denominator;
        } else {
            // For NO shares: amount = shares * totalNoShares / (totalYesShares + shares)
            require(marketState.totalNoShares >= shares, "CeresPredictionMarket: insufficient market NO shares");
            uint256 denominator = marketState.totalYesShares + shares;
            amount = (shares * marketState.totalNoShares) / denominator;
        }
    }

    /**
     * @dev Calculates current price for YES or NO shares
     * @param isYes Whether to calculate YES price
     * @return price Current price per share (in wei)
     */
    function _calculateCurrentPrice(bool isYes) internal view returns (uint256 price) {
        uint256 totalShares = marketState.totalYesShares + marketState.totalNoShares;
        
        if (totalShares == 0) {
            // If no shares exist, return equal prices
            return PRICE_PRECISION / 2; // 0.5 HKTC per share
        }

        if (isYes) {
            // YES price = totalYesShares / totalShares
            price = (marketState.totalYesShares * PRICE_PRECISION) / totalShares;
        } else {
            // NO price = totalNoShares / totalShares
            price = (marketState.totalNoShares * PRICE_PRECISION) / totalShares;
        }
    }
    /**
     * @dev Finalizes the market with the outcome (called by CeresRegistry)
     * @param outcome Final outcome of the judgment event (true = YES, false = NO)
     */
    function finalize(bool outcome) external onlyRegistry notFinalized {
        marketState.isFinalized = true;
        marketState.finalOutcome = outcome;

        emit MarketFinalized(
            marketState.eventId,
            outcome,
            marketState.totalVolume,
            marketState.creatorRewardAmount
        );
    }

    /**
     * @dev Allows users to claim their winnings after market finalization
     */
    function claimWinnings() external onlyFinalized nonReentrant {
        UserPosition storage position = userPositions[msg.sender];
        require(!position.rewardClaimed, "CeresPredictionMarket: reward already claimed");
        
        uint256 winningShares;
        uint256 totalWinningShares;
        
        if (marketState.finalOutcome) {
            // YES outcome - YES holders win
            winningShares = position.yesShares;
            totalWinningShares = marketState.totalYesShares;
        } else {
            // NO outcome - NO holders win
            winningShares = position.noShares;
            totalWinningShares = marketState.totalNoShares;
        }
        
        require(winningShares > 0, "CeresPredictionMarket: no winning shares");
        
        // Calculate user's share of the prize pool
        // Prize pool = contract balance - creator reward amount
        uint256 prizePool = address(this).balance - marketState.creatorRewardAmount;
        uint256 winnings = (winningShares * prizePool) / totalWinningShares;
        
        require(winnings > 0, "CeresPredictionMarket: no winnings to claim");
        require(address(this).balance >= winnings, "CeresPredictionMarket: insufficient contract balance");
        
        // Mark as claimed
        position.rewardClaimed = true;
        
        // Transfer winnings
        (bool success, ) = msg.sender.call{value: winnings}("");
        require(success, "CeresPredictionMarket: transfer failed");
        
        emit WinningsClaimed(msg.sender, winnings, position.yesShares, position.noShares);
    }

    /**
     * @dev Allows the creator to claim their reward from trading fees
     */
    function claimCreatorReward() external onlyFinalized nonReentrant {
        require(msg.sender == marketState.creator, "CeresPredictionMarket: only creator can claim");
        require(marketState.creatorRewardAmount > 0, "CeresPredictionMarket: no reward to claim");
        require(address(this).balance >= marketState.creatorRewardAmount, "CeresPredictionMarket: insufficient balance");
        
        uint256 rewardAmount = marketState.creatorRewardAmount;
        marketState.creatorRewardAmount = 0; // Prevent reentrancy
        
        // Transfer creator reward
        (bool success, ) = msg.sender.call{value: rewardAmount}("");
        require(success, "CeresPredictionMarket: transfer failed");
        
        emit CreatorRewardClaimed(msg.sender, rewardAmount);
    }

    /**
     * @dev Emergency pause function (only for extreme circumstances)
     * Can only be called by CeresRegistry in emergency situations
     */
    function emergencyPause() external onlyRegistry {
        _pause();
    }

    /**
     * @dev Emergency unpause function
     * Can only be called by CeresRegistry
     */
    function emergencyUnpause() external onlyRegistry {
        _unpause();
    }

    /**
     * @dev Calculates potential winnings for a user if the market were to resolve with given outcome
     * @param user Address of the user
     * @param outcome Hypothetical outcome (true = YES, false = NO)
     * @return winnings Potential winnings amount
     */
    function calculatePotentialWinnings(address user, bool outcome) external view returns (uint256 winnings) {
        UserPosition memory position = userPositions[user];
        
        if (position.rewardClaimed) {
            return 0;
        }
        
        uint256 winningShares;
        uint256 totalWinningShares;
        
        if (outcome) {
            winningShares = position.yesShares;
            totalWinningShares = marketState.totalYesShares;
        } else {
            winningShares = position.noShares;
            totalWinningShares = marketState.totalNoShares;
        }
        
        if (winningShares == 0 || totalWinningShares == 0) {
            return 0;
        }
        
        // Calculate potential prize pool
        uint256 prizePool = address(this).balance - marketState.creatorRewardAmount;
        winnings = (winningShares * prizePool) / totalWinningShares;
    }

    /**
     * @dev Gets market statistics for display
     * @return totalUsers Number of users with positions
     * @return avgYesPrice Average YES price based on current liquidity
     * @return avgNoPrice Average NO price based on current liquidity
     * @return liquidityRatio Ratio of YES to NO liquidity
     */
    function getMarketStats() external view returns (
        uint256 totalUsers,
        uint256 avgYesPrice,
        uint256 avgNoPrice,
        uint256 liquidityRatio
    ) {
        totalUsers = users.length;
        avgYesPrice = _calculateCurrentPrice(true);
        avgNoPrice = _calculateCurrentPrice(false);
        
        if (marketState.totalNoShares > 0) {
            liquidityRatio = (marketState.totalYesShares * PRICE_PRECISION) / marketState.totalNoShares;
        } else {
            liquidityRatio = type(uint256).max; // Infinite ratio if no NO shares
        }
    }

    /**
     * @dev Receive function to accept HKTC deposits
     */
    receive() external payable {
        // Allow contract to receive HKTC
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("CeresPredictionMarket: function not found");
    }
}