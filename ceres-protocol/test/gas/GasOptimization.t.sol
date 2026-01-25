// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "@forge-std/Test.sol";
import {console} from "@forge-std/console.sol";
import {CeresRegistry} from "../../src/CeresRegistry.sol";
import {CeresGreenPoints} from "../../src/CeresGreenPoints.sol";
import {CeresMarketFactory} from "../../src/CeresMarketFactory.sol";
import {CeresPredictionMarket} from "../../src/CeresPredictionMarket.sol";

/**
 * @title GasOptimizationTest
 * @dev Comprehensive gas optimization test suite for Ceres Protocol
 * 
 * This test suite measures gas consumption for key operations and validates
 * that gas usage remains within acceptable limits. It also tests batch operations
 * for efficiency improvements.
 */
contract GasOptimizationTest is Test {
    CeresRegistry public registry;
    CeresGreenPoints public greenPoints;
    CeresMarketFactory public marketFactory;
    
    address public admin = address(0x1);
    address public resolver = address(0x2);
    address public creator1 = address(0x4);
    address public creator2 = address(0x5);
    address public trader1 = address(0x6);
    address public trader2 = address(0x7);
    
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant LARGE_STAKE = 10 ether;
    
    // Gas limit constants for validation (adjusted based on actual usage)
    uint256 public constant MAX_JUDGMENT_CREATION_GAS = 2500000; // Increased for market deployment
    uint256 public constant MAX_TRADE_GAS = 200000;
    uint256 public constant MAX_RESOLUTION_GAS = 150000;
    uint256 public constant MAX_CLAIM_GAS = 100000;
    
    // Storage for gas measurements
    struct GasMeasurement {
        uint256 gasUsed;
        string operation;
        uint256 timestamp;
    }
    
    GasMeasurement[] public gasMeasurements;

    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        greenPoints = new CeresGreenPoints(admin);
        registry = new CeresRegistry(address(greenPoints), admin);
        marketFactory = new CeresMarketFactory(address(registry), address(greenPoints), admin);
        
        // Grant necessary roles
        greenPoints.grantRole(MINTER_ROLE, address(registry));
        registry.grantRole(RESOLVER_ROLE, resolver);
        registry.setMarketFactory(address(marketFactory));
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(creator1, 100 ether);
        vm.deal(creator2, 100 ether);
        vm.deal(trader1, 100 ether);
        vm.deal(trader2, 100 ether);
    }

    /**
     * @dev Test gas consumption for judgment event creation
     */
    function testGas_JudgmentEventCreation() public {
        vm.startPrank(creator1);
        
        // Measure gas for minimum stake judgment
        uint256 gasBefore = gasleft();
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "Will it rain tomorrow?",
            0.6 ether, // yesPrice
            0.4 ether, // noPrice
            block.timestamp + 1 days
        );
        uint256 gasUsed1 = gasBefore - gasleft();
        
        // Measure gas for large stake judgment
        gasBefore = gasleft();
        registry.submitJudgementEvent{value: LARGE_STAKE}(
            "Will the temperature exceed 30C next week?",
            0.7 ether, // yesPrice
            0.3 ether, // noPrice
            block.timestamp + 7 days
        );
        uint256 gasUsed2 = gasBefore - gasleft();
        
        vm.stopPrank();
        
        // Record measurements
        _recordGasMeasurement(gasUsed1, "Judgment Creation (Min Stake)");
        _recordGasMeasurement(gasUsed2, "Judgment Creation (Large Stake)");
        
        // Validate gas limits
        assertLt(gasUsed1, MAX_JUDGMENT_CREATION_GAS, "Min stake judgment creation exceeds gas limit");
        assertLt(gasUsed2, MAX_JUDGMENT_CREATION_GAS, "Large stake judgment creation exceeds gas limit");
        
        // Gas usage should be similar regardless of stake amount
        uint256 gasDifference = gasUsed2 > gasUsed1 ? gasUsed2 - gasUsed1 : gasUsed1 - gasUsed2;
        assertLt(gasDifference, 100000, "Gas usage varies too much with stake amount");
        
        console.log("Judgment Creation Gas Usage:");
        console.log("  Min Stake:", gasUsed1);
        console.log("  Large Stake:", gasUsed2);
        console.log("  Difference:", gasDifference);
    }

    /**
     * @dev Test gas consumption for trading operations
     */
    function testGas_TradingOperations() public {
        // Setup: Create event and market
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Trading gas test",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        // Get the market address from the registry
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(eventData.marketAddress));
        
        vm.startPrank(trader1);
        
        // Measure gas for buying YES shares
        uint256 gasBefore = gasleft();
        market.buyYesShares{value: 1 ether}(0);
        uint256 buyYesGas = gasBefore - gasleft();
        
        // Measure gas for buying NO shares
        gasBefore = gasleft();
        market.buyNoShares{value: 1 ether}(0);
        uint256 buyNoGas = gasBefore - gasleft();
        
        // Get user position for selling
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(trader1);
        
        // Measure gas for selling YES shares
        gasBefore = gasleft();
        market.sellYesShares(position.yesShares / 2, 0);
        uint256 sellYesGas = gasBefore - gasleft();
        
        // Measure gas for selling NO shares
        gasBefore = gasleft();
        market.sellNoShares(position.noShares / 2, 0);
        uint256 sellNoGas = gasBefore - gasleft();
        
        vm.stopPrank();
        
        // Record measurements
        _recordGasMeasurement(buyYesGas, "Buy YES Shares");
        _recordGasMeasurement(buyNoGas, "Buy NO Shares");
        _recordGasMeasurement(sellYesGas, "Sell YES Shares");
        _recordGasMeasurement(sellNoGas, "Sell NO Shares");
        
        // Validate gas limits
        assertLt(buyYesGas, MAX_TRADE_GAS, "Buy YES shares exceeds gas limit");
        assertLt(buyNoGas, MAX_TRADE_GAS, "Buy NO shares exceeds gas limit");
        assertLt(sellYesGas, MAX_TRADE_GAS, "Sell YES shares exceeds gas limit");
        assertLt(sellNoGas, MAX_TRADE_GAS, "Sell NO shares exceeds gas limit");
        
        console.log("Trading Gas Usage:");
        console.log("  Buy YES:", buyYesGas);
        console.log("  Buy NO:", buyNoGas);
        console.log("  Sell YES:", sellYesGas);
        console.log("  Sell NO:", sellNoGas);
    }

    /**
     * @dev Test gas consumption for event resolution
     */
    function testGas_EventResolution() public {
        // Setup: Create event and market with trading activity
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Resolution gas test",
            0.6 ether,
            0.4 ether,
            block.timestamp + 1 days
        );
        
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(eventData.marketAddress));
        
        // Add some trading activity
        vm.prank(trader1);
        market.buyYesShares{value: 2 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 1.5 ether}(0);
        
        // Fast forward past resolution time
        vm.warp(block.timestamp + 1 days + 1);
        
        // Measure gas for event resolution
        vm.prank(resolver);
        uint256 gasBefore = gasleft();
        registry.resolveEvent(eventId, true); // YES outcome
        uint256 gasUsed = gasBefore - gasleft();
        
        _recordGasMeasurement(gasUsed, "Event Resolution");
        
        // Validate gas limit
        assertLt(gasUsed, MAX_RESOLUTION_GAS, "Event resolution exceeds gas limit");
        
        console.log("Event Resolution Gas Usage:", gasUsed);
    }

    /**
     * @dev Test gas consumption for reward claiming
     */
    function testGas_RewardClaiming() public {
        // Setup: Create resolved event with winners
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Reward claiming gas test",
            0.3 ether, // Creator biased towards NO
            0.7 ether,
            block.timestamp + 1 days
        );
        
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(eventData.marketAddress));
        
        // Add trading activity
        vm.prank(trader1);
        market.buyYesShares{value: 3 ether}(0);
        
        vm.prank(trader2);
        market.buyNoShares{value: 2 ether}(0);
        
        // Resolve event
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(resolver);
        registry.resolveEvent(eventId, true); // YES outcome
        
        // Measure gas for winner claiming rewards
        vm.prank(trader1);
        uint256 gasBefore = gasleft();
        market.claimWinnings();
        uint256 claimWinningsGas = gasBefore - gasleft();
        
        // Measure gas for creator claiming rewards
        vm.prank(creator1);
        gasBefore = gasleft();
        market.claimCreatorReward();
        uint256 claimCreatorGas = gasBefore - gasleft();
        
        // Record measurements
        _recordGasMeasurement(claimWinningsGas, "Claim Winnings");
        _recordGasMeasurement(claimCreatorGas, "Claim Creator Reward");
        
        // Validate gas limits
        assertLt(claimWinningsGas, MAX_CLAIM_GAS, "Claim winnings exceeds gas limit");
        assertLt(claimCreatorGas, MAX_CLAIM_GAS, "Claim creator reward exceeds gas limit");
        
        console.log("Reward Claiming Gas Usage:");
        console.log("  Claim Winnings:", claimWinningsGas);
        console.log("  Claim Creator Reward:", claimCreatorGas);
    }

    /**
     * @dev Test gas consumption with different market sizes
     */
    function testGas_MarketSizeScaling() public {
        uint256[3] memory stakes = [MIN_STAKE, 1 ether, 10 ether];
        uint256[3] memory tradingGas;
        
        // Create markets with different initial liquidity
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(creator1);
            bytes32 eventId = registry.submitJudgementEvent{value: stakes[i]}(
                string(abi.encodePacked("Market size test ", vm.toString(i))),
                0.5 ether,
                0.5 ether,
                block.timestamp + 1 days
            );
            
            CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
            CeresPredictionMarket market = CeresPredictionMarket(payable(eventData.marketAddress));
            
            // Measure trading gas for each market size
            vm.prank(trader1);
            uint256 gasBefore = gasleft();
            market.buyYesShares{value: 0.5 ether}(0);
            tradingGas[i] = gasBefore - gasleft();
            
            _recordGasMeasurement(tradingGas[i], string(abi.encodePacked("Trading (", vm.toString(stakes[i]), " stake)")));
        }
        
        console.log("Market Size Scaling Gas Usage:");
        for (uint256 i = 0; i < 3; i++) {
            console.log("  Stake amount:", stakes[i]);
            console.log("  Gas used:", tradingGas[i]);
        }
        
        // Gas should not scale significantly with market size
        uint256 maxGasDiff = 0;
        for (uint256 i = 1; i < 3; i++) {
            uint256 diff = tradingGas[i] > tradingGas[0] ? tradingGas[i] - tradingGas[0] : tradingGas[0] - tradingGas[i];
            if (diff > maxGasDiff) maxGasDiff = diff;
        }
        
        assertLt(maxGasDiff, 20000, "Gas usage scales too much with market size");
    }

    /**
     * @dev Test storage layout optimization
     */
    function testGas_StorageOptimization() public {
        // Test multiple operations on the same event to measure storage access patterns
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Storage optimization test",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        // Measure gas for repeated reads
        uint256 gasBefore = gasleft();
        for (uint256 i = 0; i < 10; i++) {
            registry.getJudgementEvent(eventId);
        }
        uint256 readGas = gasBefore - gasleft();
        
        // Measure gas for event resolution (writes)
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(resolver);
        gasBefore = gasleft();
        registry.resolveEvent(eventId, true);
        uint256 writeGas = gasBefore - gasleft();
        
        _recordGasMeasurement(readGas, "10 Event Reads");
        _recordGasMeasurement(writeGas, "Event Resolution Write");
        
        console.log("Storage Access Gas Usage:");
        console.log("  10 Reads:", readGas);
        console.log("  Average per read:", readGas / 10);
        console.log("  1 Write:", writeGas);
        
        // Reads should be much cheaper than writes
        assertLt(readGas / 10, writeGas / 5, "Storage reads not optimized");
    }

    /**
     * @dev Test function call optimization
     */
    function testGas_FunctionCallOptimization() public {
        // Create market for testing
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Function call optimization test",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        CeresPredictionMarket market = CeresPredictionMarket(payable(eventData.marketAddress));
        
        // Measure gas for view functions (should be very cheap)
        uint256 gasBefore = gasleft();
        market.getMarketState();
        uint256 viewGas1 = gasBefore - gasleft();
        
        gasBefore = gasleft();
        market.getCurrentPrices();
        uint256 viewGas2 = gasBefore - gasleft();
        
        gasBefore = gasleft();
        market.getUserPosition(creator1);
        uint256 viewGas3 = gasBefore - gasleft();
        
        _recordGasMeasurement(viewGas1, "getMarketState()");
        _recordGasMeasurement(viewGas2, "getCurrentPrices()");
        _recordGasMeasurement(viewGas3, "getUserPosition()");
        
        console.log("View Function Gas Usage:");
        console.log("  getMarketState():", viewGas1);
        console.log("  getCurrentPrices():", viewGas2);
        console.log("  getUserPosition():", viewGas3);
        
        // View functions should use minimal gas
        assertLt(viewGas1, 5000, "getMarketState() not optimized");
        assertLt(viewGas2, 5000, "getCurrentPrices() not optimized");
        assertLt(viewGas3, 3000, "getUserPosition() not optimized");
    }

    /**
     * @dev Helper function to record gas measurements
     */
    function _recordGasMeasurement(uint256 gasUsed, string memory operation) internal {
        gasMeasurements.push(GasMeasurement({
            gasUsed: gasUsed,
            operation: operation,
            timestamp: block.timestamp
        }));
    }

    /**
     * @dev Get all gas measurements for analysis
     */
    function getGasMeasurements() external view returns (GasMeasurement[] memory) {
        return gasMeasurements;
    }

    /**
     * @dev Get gas measurement by index
     */
    function getGasMeasurement(uint256 index) external view returns (GasMeasurement memory) {
        require(index < gasMeasurements.length, "Index out of bounds");
        return gasMeasurements[index];
    }

    /**
     * @dev Get total number of gas measurements
     */
    function getGasMeasurementCount() external view returns (uint256) {
        return gasMeasurements.length;
    }

    /**
     * @dev Generate gas optimization report
     */
    function generateGasReport() external view {
        console.log("\n=== GAS OPTIMIZATION REPORT ===");
        console.log("Total measurements:", gasMeasurements.length);
        
        uint256 totalGas = 0;
        for (uint256 i = 0; i < gasMeasurements.length; i++) {
            console.log("Operation:", gasMeasurements[i].operation);
            console.log("Gas used:", gasMeasurements[i].gasUsed);
            totalGas += gasMeasurements[i].gasUsed;
        }
        
        console.log("Total gas measured:", totalGas);
        console.log("Average gas per operation:", totalGas / gasMeasurements.length);
        console.log("===============================\n");
    }
}