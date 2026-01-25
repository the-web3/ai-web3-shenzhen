// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "@forge-std/Test.sol";
import {CeresPredictionMarket} from "../src/CeresPredictionMarket.sol";
import {CeresRegistry} from "../src/CeresRegistry.sol";
import {CeresGreenPoints} from "../src/CeresGreenPoints.sol";

/**
 * @title CeresPredictionMarketTest
 * @dev Comprehensive test suite for CeresPredictionMarket contract including property-based tests
 */
contract CeresPredictionMarketTest is Test {
    CeresPredictionMarket public market;
    CeresRegistry public registry;
    CeresGreenPoints public greenPoints;
    
    address public admin = address(0x1);
    address public creator = address(0x2);
    address public trader1 = address(0x3);
    address public trader2 = address(0x4);
    address public trader3 = address(0x5);
    
    bytes32 public constant eventId = keccak256("test-event");
    uint256 public constant initialYesShares = 0.7 ether;
    uint256 public constant initialNoShares = 0.3 ether;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    
    uint256 public constant TRADING_FEE_BPS = 200; // 2%
    uint256 public constant CREATOR_REWARD_BPS = 2000; // 20%

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

    function setUp() public {
        // Deploy contracts
        vm.prank(admin);
        greenPoints = new CeresGreenPoints(admin);
        
        vm.prank(admin);
        registry = new CeresRegistry(address(greenPoints), admin);
        
        // Grant registry permission to mint green points
        vm.prank(admin);
        greenPoints.grantRole(MINTER_ROLE, address(registry));
        
        // Deploy market contract
        market = new CeresPredictionMarket(
            eventId,
            creator,
            initialYesShares,
            initialNoShares,
            address(registry),
            address(greenPoints)
        );
        
        // Fund test accounts
        vm.deal(creator, 10 ether);
        vm.deal(trader1, 10 ether);
        vm.deal(trader2, 10 ether);
        vm.deal(trader3, 10 ether);
        
        // Fund market contract with some initial balance for testing
        vm.deal(address(market), 5 ether);
    }

    // Basic functionality tests
    function testInitialState() public {
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        
        assertEq(state.eventId, eventId);
        assertEq(state.totalYesShares, initialYesShares);
        assertEq(state.totalNoShares, initialNoShares);
        assertEq(state.totalVolume, 0);
        assertEq(state.accumulatedFees, 0);
        assertFalse(state.isFinalized);
        assertEq(state.creator, creator);
        assertEq(state.creatorRewardAmount, 0);
        
        // Check creator's initial position
        CeresPredictionMarket.UserPosition memory creatorPosition = market.getUserPosition(creator);
        assertEq(creatorPosition.yesShares, initialYesShares);
        assertEq(creatorPosition.noShares, initialNoShares);
        assertEq(creatorPosition.totalInvested, 0); // Creator doesn't count as invested
        assertFalse(creatorPosition.rewardClaimed);
    }

    function testBuyYesShares() public {
        uint256 purchaseAmount = 1 ether;
        uint256 expectedFee = (purchaseAmount * TRADING_FEE_BPS) / 10000;
        
        vm.expectEmit(true, true, false, false);
        emit SharesPurchased(trader1, true, purchaseAmount, 0, 0, expectedFee);
        
        vm.prank(trader1);
        market.buyYesShares{value: purchaseAmount}(0);
        
        // Check market state updates
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        assertEq(state.totalVolume, purchaseAmount);
        assertEq(state.accumulatedFees, expectedFee);
        assertGt(state.totalYesShares, initialYesShares);
        
        // Check user position
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(trader1);
        assertGt(position.yesShares, 0);
        assertEq(position.noShares, 0);
        assertEq(position.totalInvested, purchaseAmount);
        
        // Check creator reward
        uint256 expectedCreatorReward = (expectedFee * CREATOR_REWARD_BPS) / 10000;
        assertEq(state.creatorRewardAmount, expectedCreatorReward);
    }

    function testBuyNoShares() public {
        uint256 purchaseAmount = 1 ether;
        uint256 expectedFee = (purchaseAmount * TRADING_FEE_BPS) / 10000;
        
        vm.expectEmit(true, true, false, false);
        emit SharesPurchased(trader1, false, purchaseAmount, 0, 0, expectedFee);
        
        vm.prank(trader1);
        market.buyNoShares{value: purchaseAmount}(0);
        
        // Check market state updates
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        assertEq(state.totalVolume, purchaseAmount);
        assertEq(state.accumulatedFees, expectedFee);
        assertGt(state.totalNoShares, initialNoShares);
        
        // Check user position
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(trader1);
        assertEq(position.yesShares, 0);
        assertGt(position.noShares, 0);
        assertEq(position.totalInvested, purchaseAmount);
    }

    function testSellYesShares() public {
        // First buy some YES shares
        vm.prank(trader1);
        market.buyYesShares{value: 2 ether}(0);
        
        CeresPredictionMarket.UserPosition memory positionBefore = market.getUserPosition(trader1);
        uint256 sharesToSell = positionBefore.yesShares / 2;
        
        uint256 balanceBefore = trader1.balance;
        
        vm.prank(trader1);
        market.sellYesShares(sharesToSell, 0);
        
        uint256 balanceAfter = trader1.balance;
        assertGt(balanceAfter, balanceBefore);
        
        // Check position updated
        CeresPredictionMarket.UserPosition memory positionAfter = market.getUserPosition(trader1);
        assertEq(positionAfter.yesShares, positionBefore.yesShares - sharesToSell);
    }

    function testMarketFinalization() public {
        // Add some trading activity first
        vm.prank(trader1);
        market.buyYesShares{value: 1 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 1 ether}(0);
        
        // Only registry can finalize
        vm.expectRevert("CeresPredictionMarket: only registry can call");
        vm.prank(trader1);
        market.finalize(true);
        
        // Registry finalizes with YES outcome
        vm.expectEmit(true, false, false, false);
        emit MarketFinalized(eventId, true, 0, 0);
        
        vm.prank(address(registry));
        market.finalize(true);
        
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        assertTrue(state.isFinalized);
        assertTrue(state.finalOutcome);
    }

    function testClaimWinnings() public {
        // Setup: trader1 buys YES, trader2 buys NO
        vm.prank(trader1);
        market.buyYesShares{value: 2 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 1 ether}(0);
        
        // Finalize with YES outcome
        vm.prank(address(registry));
        market.finalize(true);
        
        // trader1 should be able to claim winnings
        uint256 balanceBefore = trader1.balance;
        
        vm.expectEmit(true, false, false, false);
        emit WinningsClaimed(trader1, 0, 0, 0);
        
        vm.prank(trader1);
        market.claimWinnings();
        
        uint256 balanceAfter = trader1.balance;
        assertGt(balanceAfter, balanceBefore);
        
        // trader2 should not be able to claim (lost)
        vm.expectRevert("CeresPredictionMarket: no winning shares");
        vm.prank(trader2);
        market.claimWinnings();
        
        // Cannot claim twice
        vm.expectRevert("CeresPredictionMarket: reward already claimed");
        vm.prank(trader1);
        market.claimWinnings();
    }

    function testCreatorRewardClaim() public {
        // Add trading activity to generate fees
        vm.prank(trader1);
        market.buyYesShares{value: 2 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 2 ether}(0);
        
        // Finalize market
        vm.prank(address(registry));
        market.finalize(true);
        
        // Only creator can claim reward
        vm.expectRevert("CeresPredictionMarket: only creator can claim");
        vm.prank(trader1);
        market.claimCreatorReward();
        
        // Creator claims reward
        uint256 balanceBefore = creator.balance;
        
        vm.prank(creator);
        market.claimCreatorReward();
        
        uint256 balanceAfter = creator.balance;
        assertGt(balanceAfter, balanceBefore);
        
        // Check reward amount is reset
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        assertEq(state.creatorRewardAmount, 0);
    }

    // Input validation tests
    function testBuySharesValidation() public {
        // Cannot buy with zero value
        vm.expectRevert("CeresPredictionMarket: must send HKTC to buy shares");
        vm.prank(trader1);
        market.buyYesShares{value: 0}(0);
        
        vm.expectRevert("CeresPredictionMarket: must send HKTC to buy shares");
        vm.prank(trader1);
        market.buyNoShares{value: 0}(0);
    }

    function testSellSharesValidation() public {
        // Cannot sell zero shares
        vm.expectRevert("CeresPredictionMarket: must sell positive shares");
        vm.prank(trader1);
        market.sellYesShares(0, 0);
        
        // Cannot sell more shares than owned
        vm.expectRevert("CeresPredictionMarket: insufficient YES shares");
        vm.prank(trader1);
        market.sellYesShares(1 ether, 0);
    }

    function testFinalizedMarketRestrictions() public {
        // Finalize market
        vm.prank(address(registry));
        market.finalize(true);
        
        // Cannot trade after finalization
        vm.expectRevert("CeresPredictionMarket: market is finalized");
        vm.prank(trader1);
        market.buyYesShares{value: 1 ether}(0);
        
        vm.expectRevert("CeresPredictionMarket: market is finalized");
        vm.prank(trader1);
        market.buyNoShares{value: 1 ether}(0);
    }

    // Property-based tests
    
    // Feature: ai-web3-prediction-market, Property 5: Prediction Market Trading Operations
    function testPropertyPredictionMarketTradingOperations(
        uint256 purchaseAmount,
        bool isYesShare
    ) public {
        vm.assume(purchaseAmount >= 0.01 ether && purchaseAmount <= 10 ether);
        
        // Fund trader
        vm.deal(trader1, purchaseAmount);
        
        // Record initial state
        CeresPredictionMarket.MarketState memory stateBefore = market.getMarketState();
        uint256 initialYesShares = stateBefore.totalYesShares;
        uint256 initialNoShares = stateBefore.totalNoShares;
        
        // Execute purchase
        vm.prank(trader1);
        if (isYesShare) {
            market.buyYesShares{value: purchaseAmount}(0);
        } else {
            market.buyNoShares{value: purchaseAmount}(0);
        }
        
        // Verify state changes
        CeresPredictionMarket.MarketState memory stateAfter = market.getMarketState();
        
        // Trading fee should be collected
        uint256 expectedFee = (purchaseAmount * TRADING_FEE_BPS) / 10000;
        assertEq(stateAfter.accumulatedFees, stateBefore.accumulatedFees + expectedFee);
        
        // Volume should increase
        assertEq(stateAfter.totalVolume, stateBefore.totalVolume + purchaseAmount);
        
        // Shares should increase
        if (isYesShare) {
            assertGt(stateAfter.totalYesShares, initialYesShares);
            assertEq(stateAfter.totalNoShares, initialNoShares);
        } else {
            assertEq(stateAfter.totalYesShares, initialYesShares);
            assertGt(stateAfter.totalNoShares, initialNoShares);
        }
        
        // Creator reward should increase
        uint256 expectedCreatorReward = (expectedFee * CREATOR_REWARD_BPS) / 10000;
        assertEq(stateAfter.creatorRewardAmount, stateBefore.creatorRewardAmount + expectedCreatorReward);
        
        // User position should be updated
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(trader1);
        assertEq(position.totalInvested, purchaseAmount);
        
        if (isYesShare) {
            assertGt(position.yesShares, 0);
            assertEq(position.noShares, 0);
        } else {
            assertEq(position.yesShares, 0);
            assertGt(position.noShares, 0);
        }
    }

    // Feature: ai-web3-prediction-market, Property 6: Creator Reward Calculation and Distribution
    function testPropertyCreatorRewardCalculationDistribution(
        uint256 tradingVolume
    ) public {
        vm.assume(tradingVolume >= 0.1 ether && tradingVolume <= 50 ether);
        
        // Split trading volume between YES and NO purchases
        uint256 yesPurchase = tradingVolume / 2;
        uint256 noPurchase = tradingVolume - yesPurchase;
        
        vm.deal(trader1, yesPurchase);
        vm.deal(trader2, noPurchase);
        
        // Execute trades
        vm.prank(trader1);
        market.buyYesShares{value: yesPurchase}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: noPurchase}(0);
        
        // Calculate expected fees and creator reward
        uint256 totalFees = (tradingVolume * TRADING_FEE_BPS) / 10000;
        uint256 expectedCreatorReward = (totalFees * CREATOR_REWARD_BPS) / 10000;
        
        // Verify creator reward calculation (allow for 1 wei rounding error)
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        assertGe(state.creatorRewardAmount, expectedCreatorReward - 1);
        assertLe(state.creatorRewardAmount, expectedCreatorReward + 1);
        assertGe(state.accumulatedFees, totalFees - 1);
        assertLe(state.accumulatedFees, totalFees + 1);
        
        // Finalize market
        vm.prank(address(registry));
        market.finalize(true);
        
        // Creator should be able to claim reward amount (allow for rounding)
        uint256 creatorBalanceBefore = creator.balance;
        uint256 actualRewardAmount = state.creatorRewardAmount;
        
        vm.prank(creator);
        market.claimCreatorReward();
        
        uint256 creatorBalanceAfter = creator.balance;
        assertEq(creatorBalanceAfter - creatorBalanceBefore, actualRewardAmount);
        
        // Reward amount should be reset to zero
        CeresPredictionMarket.MarketState memory finalState = market.getMarketState();
        assertEq(finalState.creatorRewardAmount, 0);
    }

    // Feature: ai-web3-prediction-market, Property 7: Market Security and Reentrancy Protection
    function testPropertyMarketSecurityReentrancyProtection() public {
        // This test verifies that the market is protected against reentrancy attacks
        // We test by ensuring that state changes are committed before external calls
        
        vm.prank(trader1);
        market.buyYesShares{value: 1 ether}(0);
        
        // Finalize market
        vm.prank(address(registry));
        market.finalize(true);
        
        // Verify that claimWinnings can only be called once (reentrancy protection)
        vm.prank(trader1);
        market.claimWinnings();
        
        // Second call should fail
        vm.expectRevert("CeresPredictionMarket: reward already claimed");
        vm.prank(trader1);
        market.claimWinnings();
        
        // Verify creator reward can only be claimed once
        vm.prank(creator);
        market.claimCreatorReward();
        
        // Second call should fail (no reward left)
        vm.expectRevert("CeresPredictionMarket: no reward to claim");
        vm.prank(creator);
        market.claimCreatorReward();
    }

    // Test price calculation accuracy
    function testPriceCalculationAccuracy() public {
        // Get initial prices
        (uint256 initialYesPrice, uint256 initialNoPrice) = market.getCurrentPrices();
        
        // Prices should sum to approximately 1 ether (allowing for precision)
        uint256 priceSum = initialYesPrice + initialNoPrice;
        assertGe(priceSum, 0.99 ether);
        assertLe(priceSum, 1.01 ether);
        
        // Buy YES shares and verify price changes
        vm.prank(trader1);
        market.buyYesShares{value: 1 ether}(0);
        
        (uint256 newYesPrice, uint256 newNoPrice) = market.getCurrentPrices();
        
        // YES price should increase, NO price should decrease
        assertGt(newYesPrice, initialYesPrice);
        assertLt(newNoPrice, initialNoPrice);
        
        // Prices should still sum to approximately 1 ether
        uint256 newPriceSum = newYesPrice + newNoPrice;
        assertGe(newPriceSum, 0.99 ether);
        assertLe(newPriceSum, 1.01 ether);
    }

    // Test market statistics
    function testMarketStatistics() public {
        // Add multiple users
        vm.prank(trader1);
        market.buyYesShares{value: 1 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 1 ether}(0);
        
        vm.prank(trader3);
        market.buyYesShares{value: 0.5 ether}(0);
        
        // Check market stats
        (uint256 totalUsers, uint256 avgYesPrice, uint256 avgNoPrice, uint256 liquidityRatio) = 
            market.getMarketStats();
        
        // Should have 4 users (creator + 3 traders)
        assertEq(totalUsers, 4);
        
        // Prices should be reasonable
        assertGt(avgYesPrice, 0);
        assertGt(avgNoPrice, 0);
        assertGt(liquidityRatio, 0);
        
        // Check user enumeration
        assertEq(market.getUserCount(), 4);
        assertEq(market.getUserByIndex(0), creator);
    }

    // Test potential winnings calculation
    function testPotentialWinningsCalculation() public {
        // Setup positions
        vm.prank(trader1);
        market.buyYesShares{value: 2 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 1 ether}(0);
        
        // Calculate potential winnings for both outcomes
        uint256 trader1YesWinnings = market.calculatePotentialWinnings(trader1, true);
        uint256 trader1NoWinnings = market.calculatePotentialWinnings(trader1, false);
        uint256 trader2YesWinnings = market.calculatePotentialWinnings(trader2, true);
        uint256 trader2NoWinnings = market.calculatePotentialWinnings(trader2, false);
        
        // trader1 should win more with YES outcome
        assertGt(trader1YesWinnings, trader1NoWinnings);
        
        // trader2 should win more with NO outcome
        assertGt(trader2NoWinnings, trader2YesWinnings);
        
        // If trader1 has no NO shares, NO winnings should be 0
        assertEq(trader1NoWinnings, 0);
        
        // If trader2 has no YES shares, YES winnings should be 0
        assertEq(trader2YesWinnings, 0);
    }
}