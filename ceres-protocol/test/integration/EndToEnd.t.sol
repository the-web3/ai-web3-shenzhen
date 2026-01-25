// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CeresRegistry} from "../../src/CeresRegistry.sol";
import {CeresMarketFactory} from "../../src/CeresMarketFactory.sol";
import {CeresPredictionMarket} from "../../src/CeresPredictionMarket.sol";
import {CeresGreenPoints} from "../../src/CeresGreenPoints.sol";

/**
 * @title EndToEndTest
 * @dev Comprehensive end-to-end testing suite for Ceres Protocol
 * 
 * Tests the complete workflow:
 * 1. Event creation in CeresRegistry
 * 2. Automatic market deployment via CeresMarketFactory
 * 3. Trading operations in CeresPredictionMarket
 * 4. Event resolution and reward distribution
 * 5. Green points reward system
 * 
 * This test suite validates all contract interactions and ensures
 * the system works correctly as an integrated whole.
 */
contract EndToEndTest is Test {
    // Contract instances
    CeresRegistry public registry;
    CeresMarketFactory public factory;
    CeresGreenPoints public greenPoints;
    
    // Test accounts
    address public admin = makeAddr("admin");
    address public eventCreator = makeAddr("eventCreator");
    address public trader1 = makeAddr("trader1");
    address public trader2 = makeAddr("trader2");
    address public resolver = makeAddr("resolver");
    
    // Test constants
    uint256 public constant INITIAL_BALANCE = 100 ether;
    uint256 public constant MIN_STAKE = 0.1 ether;
    
    // Events for testing
    event JudgementEventCreated(
        bytes32 indexed eventId,
        address indexed creator,
        string description,
        uint256 stakeAmount,
        uint256 initialYesShares,
        uint256 initialNoShares,
        uint256 resolutionTime
    );
    
    event MarketCreated(
        bytes32 indexed eventId,
        address indexed marketAddress,
        address indexed creator
    );

    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        
        // Deploy CeresGreenPoints
        greenPoints = new CeresGreenPoints(admin);
        
        // Deploy CeresRegistry
        registry = new CeresRegistry(address(greenPoints), admin);
        
        // Deploy CeresMarketFactory
        factory = new CeresMarketFactory(address(registry), address(greenPoints), admin);
        
        // Set up roles
        registry.grantRole(registry.RESOLVER_ROLE(), resolver);
        registry.grantRole(registry.PAUSER_ROLE(), admin);
        factory.grantRole(factory.DEPLOYER_ROLE(), address(registry));
        factory.grantRole(factory.PAUSER_ROLE(), admin);
        
        // Grant MINTER_ROLE to registry for green points rewards
        greenPoints.grantRole(greenPoints.MINTER_ROLE(), address(registry));
        
        // Set factory address in registry
        registry.setMarketFactory(address(factory));
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(eventCreator, INITIAL_BALANCE);
        vm.deal(trader1, INITIAL_BALANCE);
        vm.deal(trader2, INITIAL_BALANCE);
        vm.deal(resolver, INITIAL_BALANCE);
    }

    /**
     * @dev Test complete workflow: Event creation → Market deployment → Trading → Resolution
     */
    function testCompleteWorkflow() public {
        // Step 1: Create judgment event
        string memory description = "Will global temperature rise by 2C by 2030?";
        uint256 stakeAmount = 1 ether;
        uint256 yesPrice = 0.6 ether; // 60% probability
        uint256 noPrice = 0.4 ether;  // 40% probability
        
        vm.startPrank(eventCreator);
        
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            description,
            yesPrice,
            noPrice,
            block.timestamp + 30 days // Resolution time
        );
        
        vm.stopPrank();
        
        // Verify event was created
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        
        assertEq(eventData.creator, eventCreator);
        assertEq(eventData.description, description);
        assertEq(eventData.stakeAmount, stakeAmount);
        assertEq(eventData.initialYesShares, stakeAmount * noPrice / 1 ether);
        assertEq(eventData.initialNoShares, stakeAmount * yesPrice / 1 ether);
        assertFalse(eventData.isResolved);
        
        // Step 2: Verify market was automatically deployed
        address marketAddress = factory.getMarketAddress(eventId);
        assertTrue(marketAddress != address(0), "Market should be deployed");
        assertTrue(factory.isMarketDeployed(eventId), "Market should be marked as deployed");
        
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        
        // Verify market initialization
        CeresPredictionMarket.MarketState memory marketStateData = market.getMarketState();
        
        assertEq(marketStateData.eventId, eventId);
        assertEq(marketStateData.creator, eventCreator);
        assertFalse(marketStateData.isFinalized);
        assertTrue(marketStateData.totalYesShares > 0, "Should have initial YES shares");
        assertTrue(marketStateData.totalNoShares > 0, "Should have initial NO shares");
        
        // Step 3: Trading operations
        uint256 tradeAmount1 = 0.5 ether;
        uint256 tradeAmount2 = 0.3 ether;
        
        // Trader1 buys YES shares
        vm.startPrank(trader1);
        uint256 trader1InitialBalance = trader1.balance;
        
        market.buyYesShares{value: tradeAmount1}(0); // No slippage protection for test
        
        // Verify trader1's position
        CeresPredictionMarket.UserPosition memory trader1Position = market.getUserPosition(trader1);
        
        assertTrue(trader1Position.yesShares > 0, "Trader1 should have YES shares");
        assertEq(trader1Position.noShares, 0, "Trader1 should have no NO shares");
        assertTrue(trader1Position.totalInvested > 0, "Trader1 should have invested amount recorded");
        assertFalse(trader1Position.rewardClaimed, "Trader1 should not have claimed rewards yet");
        
        vm.stopPrank();
        
        // Trader2 buys NO shares
        vm.startPrank(trader2);
        uint256 trader2InitialBalance = trader2.balance;
        
        market.buyNoShares{value: tradeAmount2}(0); // No slippage protection for test
        
        // Verify trader2's position
        CeresPredictionMarket.UserPosition memory trader2Position = market.getUserPosition(trader2);
        
        assertEq(trader2Position.yesShares, 0, "Trader2 should have no YES shares");
        assertTrue(trader2Position.noShares > 0, "Trader2 should have NO shares");
        assertTrue(trader2Position.totalInvested > 0, "Trader2 should have invested amount recorded");
        assertFalse(trader2Position.rewardClaimed, "Trader2 should not have claimed rewards yet");
        
        vm.stopPrank();
        
        // Verify market state after trading
        CeresPredictionMarket.MarketState memory newMarketState = market.getMarketState();
        
        assertTrue(newMarketState.totalVolume > 0, "Should have trading volume");
        assertTrue(newMarketState.accumulatedFees > 0, "Should have accumulated fees");
        assertTrue(newMarketState.totalYesShares > marketStateData.totalYesShares, "YES shares should increase");
        assertTrue(newMarketState.totalNoShares > marketStateData.totalNoShares, "NO shares should increase");
        
        // Step 4: Event resolution
        // Fast forward time to allow resolution
        vm.warp(block.timestamp + 31 days);
        
        vm.startPrank(resolver);
        
        // Resolve event with YES outcome
        bool finalOutcome = true;
        registry.resolveEvent(eventId, finalOutcome);
        
        vm.stopPrank();
        
        // Verify event resolution
        CeresRegistry.JudgementEvent memory resolvedEventData = registry.getJudgementEvent(eventId);
        
        assertTrue(resolvedEventData.isResolved, "Event should be resolved");
        assertEq(resolvedEventData.outcome, finalOutcome, "Event outcome should match");
        
        // Verify market finalization
        CeresPredictionMarket.MarketState memory finalMarketState = market.getMarketState();
        
        assertTrue(finalMarketState.isFinalized, "Market should be finalized");
        assertEq(finalMarketState.finalOutcome, finalOutcome, "Market outcome should match");
        assertTrue(finalMarketState.creatorRewardAmount > 0, "Creator should have reward available");
        
        // Step 5: Reward claiming
        // Trader1 (YES shares) should be able to claim winnings
        vm.startPrank(trader1);
        uint256 trader1BalanceBeforeClaim = trader1.balance;
        
        // Debug: Check trader1's position and market outcome
        CeresPredictionMarket.UserPosition memory trader1FinalPosition = market.getUserPosition(trader1);
        CeresPredictionMarket.MarketState memory finalMarketStateDebug = market.getMarketState();
        
        console.log("Trader1 YES shares:", trader1FinalPosition.yesShares);
        console.log("Trader1 NO shares:", trader1FinalPosition.noShares);
        console.log("Market final outcome:", finalMarketStateDebug.finalOutcome);
        console.log("Total YES shares:", finalMarketStateDebug.totalYesShares);
        console.log("Total NO shares:", finalMarketStateDebug.totalNoShares);
        console.log("Contract balance:", address(market).balance);
        console.log("Creator reward amount:", finalMarketStateDebug.creatorRewardAmount);
        
        // Calculate expected winnings manually
        uint256 prizePool = address(market).balance - finalMarketStateDebug.creatorRewardAmount;
        uint256 expectedWinnings = (trader1FinalPosition.yesShares * prizePool) / finalMarketStateDebug.totalYesShares;
        console.log("Prize pool:", prizePool);
        console.log("Expected winnings:", expectedWinnings);
        console.log("Reward already claimed:", trader1FinalPosition.rewardClaimed);
        
        market.claimWinnings();
        
        uint256 trader1BalanceAfterClaim = trader1.balance;
        assertTrue(trader1BalanceAfterClaim > trader1BalanceBeforeClaim, "Trader1 should receive winnings");
        
        vm.stopPrank();
        
        // Trader2 (NO shares) should not be able to claim winnings
        vm.startPrank(trader2);
        uint256 trader2BalanceBeforeClaim = trader2.balance;
        
        market.claimWinnings(); // Should not revert but should not pay out
        
        uint256 trader2BalanceAfterClaim = trader2.balance;
        assertEq(trader2BalanceAfterClaim, trader2BalanceBeforeClaim, "Trader2 should not receive winnings");
        
        vm.stopPrank();
        
        // Creator should be able to claim reward
        vm.startPrank(eventCreator);
        uint256 creatorBalanceBeforeClaim = eventCreator.balance;
        
        market.claimCreatorReward();
        
        uint256 creatorBalanceAfterClaim = eventCreator.balance;
        assertTrue(creatorBalanceAfterClaim > creatorBalanceBeforeClaim, "Creator should receive reward");
        
        vm.stopPrank();
        
        // Step 6: Verify green points rewards
        // Creator should receive green points for correct initial judgment
        uint256 creatorGreenPoints = greenPoints.balanceOf(eventCreator);
        assertTrue(creatorGreenPoints > 0, "Creator should receive green points");
        
        // Trader1 should receive green points for correct prediction
        uint256 trader1GreenPoints = greenPoints.balanceOf(trader1);
        assertTrue(trader1GreenPoints > 0, "Trader1 should receive green points");
        
        // Trader2 should not receive green points for incorrect prediction
        uint256 trader2GreenPoints = greenPoints.balanceOf(trader2);
        assertEq(trader2GreenPoints, 0, "Trader2 should not receive green points");
    }

    /**
     * @dev Test multiple events and markets
     */
    function testMultipleEventsAndMarkets() public {
        // Create multiple events
        string[] memory descriptions = new string[](3);
        descriptions[0] = "Will Arctic sea ice reach record low in 2024?";
        descriptions[1] = "Will renewable energy exceed 50% of global capacity by 2025?";
        descriptions[2] = "Will carbon emissions decrease by 10% in 2024?";
        
        bytes32[] memory eventIds = new bytes32[](3);
        address[] memory marketAddresses = new address[](3);
        
        vm.startPrank(eventCreator);
        
        for (uint256 i = 0; i < 3; i++) {
            eventIds[i] = registry.submitJudgementEvent{value: MIN_STAKE}(
                descriptions[i],
                0.5 ether, // 50% probability
                0.5 ether,
                block.timestamp + 30 days
            );
            
            marketAddresses[i] = factory.getMarketAddress(eventIds[i]);
            assertTrue(marketAddresses[i] != address(0), "Market should be deployed");
        }
        
        vm.stopPrank();
        
        // Verify all markets are different
        assertTrue(marketAddresses[0] != marketAddresses[1], "Markets should be different");
        assertTrue(marketAddresses[1] != marketAddresses[2], "Markets should be different");
        assertTrue(marketAddresses[0] != marketAddresses[2], "Markets should be different");
        
        // Verify factory state
        address[] memory allMarkets = factory.getAllMarkets();
        assertTrue(allMarkets.length >= 3, "Should have at least 3 markets");
        
        // Test trading in multiple markets
        vm.startPrank(trader1);
        
        for (uint256 i = 0; i < 3; i++) {
            CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddresses[i]));
            market.buyYesShares{value: 0.1 ether}(0);
            
            // Verify position
            CeresPredictionMarket.UserPosition memory position = market.getUserPosition(trader1);
            assertTrue(position.yesShares > 0, "Should have YES shares in each market");
        }
        
        vm.stopPrank();
    }

    /**
     * @dev Test error conditions and edge cases
     */
    function testErrorConditions() public {
        // Test insufficient stake
        vm.startPrank(eventCreator);
        
        vm.expectRevert("CeresRegistry: insufficient stake amount");
        registry.submitJudgementEvent{value: MIN_STAKE - 1}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 30 days
        );
        
        // Test invalid price distribution
        vm.expectRevert("CeresRegistry: prices must sum to 1 ether");
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "Test event",
            0.6 ether,
            0.5 ether, // Total > 1 ether
            block.timestamp + 30 days
        );
        
        vm.stopPrank();
        
        // Create valid event for further testing
        vm.startPrank(eventCreator);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Valid test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 30 days
        );
        vm.stopPrank();
        
        address marketAddress = factory.getMarketAddress(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        
        // Test unauthorized resolution
        vm.startPrank(eventCreator); // Not a resolver
        
        vm.expectRevert();
        registry.resolveEvent(eventId, true);
        
        vm.stopPrank();
        
        // Test claiming before resolution
        vm.startPrank(trader1);
        
        market.buyYesShares{value: 0.1 ether}(0);
        
        vm.expectRevert("CeresPredictionMarket: market not finalized");
        market.claimWinnings();
        
        vm.stopPrank();
        
        // Resolve event
        // Fast forward time to allow resolution
        vm.warp(block.timestamp + 31 days);
        
        vm.startPrank(resolver);
        registry.resolveEvent(eventId, true);
        vm.stopPrank();
        
        // Test double claiming
        vm.startPrank(trader1);
        
        market.claimWinnings(); // First claim should work
        
        vm.expectRevert("CeresPredictionMarket: reward already claimed");
        market.claimWinnings(); // Second claim should fail
        
        vm.stopPrank();
    }

    /**
     * @dev Test gas optimization and performance
     */
    function testGasOptimization() public {
        // Measure gas for event creation
        vm.startPrank(eventCreator);
        
        uint256 gasBefore = gasleft();
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Gas test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 30 days
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for event creation:", gasUsed);
        assertTrue(gasUsed < 2500000, "Event creation should use less than 2.5M gas");
        
        vm.stopPrank();
        
        // Measure gas for trading
        address marketAddress = factory.getMarketAddress(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        
        vm.startPrank(trader1);
        
        gasBefore = gasleft();
        market.buyYesShares{value: 0.1 ether}(0);
        gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for buying shares:", gasUsed);
        assertTrue(gasUsed < 200000, "Share purchase should use less than 200k gas");
        
        vm.stopPrank();
        
        // Measure gas for resolution
        // Fast forward time to allow resolution
        vm.warp(block.timestamp + 31 days);
        
        vm.startPrank(resolver);
        
        gasBefore = gasleft();
        registry.resolveEvent(eventId, true);
        gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for event resolution:", gasUsed);
        assertTrue(gasUsed < 300000, "Event resolution should use less than 300k gas");
        
        vm.stopPrank();
    }

    /**
     * @dev Test contract interactions under different network conditions
     */
    function testNetworkConditions() public {
        // Test with high gas price
        vm.txGasPrice(100 gwei);
        
        vm.startPrank(eventCreator);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "High gas test",
            0.5 ether,
            0.5 ether,
            block.timestamp + 30 days
        );
        vm.stopPrank();
        
        assertTrue(eventId != bytes32(0), "Should work with high gas price");
        
        // Test with block time manipulation
        vm.warp(block.timestamp + 1 days);
        
        address marketAddress = factory.getMarketAddress(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        
        vm.startPrank(trader1);
        market.buyYesShares{value: 0.1 ether}(0);
        vm.stopPrank();
        
        // Should still work after time manipulation
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(trader1);
        assertTrue(position.yesShares > 0, "Should work after time manipulation");
    }

    /**
     * @dev Helper function to get current prices from market
     */
    function getCurrentPrices(address marketAddress) internal view returns (uint256 yesPrice, uint256 noPrice) {
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        return market.getCurrentPrices();
    }

    /**
     * @dev Helper function to check if event exists
     */
    function eventExists(bytes32 eventId) internal view returns (bool) {
        try registry.getJudgementEvent(eventId) returns (CeresRegistry.JudgementEvent memory) {
            return true;
        } catch {
            return false;
        }
    }
}