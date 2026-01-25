// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "@forge-std/Test.sol";
import {CeresRegistry} from "../src/CeresRegistry.sol";
import {CeresGreenPoints} from "../src/CeresGreenPoints.sol";

/**
 * @title CeresRegistryTest
 * @dev Comprehensive test suite for CeresRegistry contract including property-based tests
 */
contract CeresRegistryTest is Test {
    CeresRegistry public registry;
    CeresGreenPoints public greenPoints;
    
    address public admin = address(0x1);
    address public resolver = address(0x2);
    address public pauser = address(0x3);
    address public creator1 = address(0x4);
    address public creator2 = address(0x5);
    
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant GREEN_POINTS_REWARD = 100 * 10**18;

    event JudgementEventCreated(
        bytes32 indexed eventId,
        address indexed creator,
        string description,
        uint256 stakeAmount,
        uint256 initialYesShares,
        uint256 initialNoShares,
        uint256 resolutionTime
    );
    
    event JudgementEventResolved(
        bytes32 indexed eventId,
        bool outcome,
        address indexed creator,
        uint256 greenPointsAwarded
    );

    function setUp() public {
        // Deploy green points contract
        vm.prank(admin);
        greenPoints = new CeresGreenPoints(admin);
        
        // Deploy registry contract
        vm.prank(admin);
        registry = new CeresRegistry(address(greenPoints), admin);
        
        // Grant registry permission to mint green points
        vm.prank(admin);
        greenPoints.grantRole(MINTER_ROLE, address(registry));
        
        // Grant roles to test accounts
        vm.startPrank(admin);
        registry.grantRole(RESOLVER_ROLE, resolver);
        registry.grantRole(PAUSER_ROLE, pauser);
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(creator1, 10 ether);
        vm.deal(creator2, 10 ether);
    }

    // Basic functionality tests
    function testInitialState() public {
        assertEq(registry.getEventCount(), 0);
        assertEq(address(registry.greenPoints()), address(greenPoints));
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(RESOLVER_ROLE, resolver));
    }

    function testSubmitJudgementEvent() public {
        string memory description = "Will it rain tomorrow?";
        uint256 yesPrice = 0.6 ether;
        uint256 noPrice = 0.4 ether;
        uint256 resolutionTime = block.timestamp + 1 days;
        uint256 stakeAmount = 1 ether;
        
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            description,
            yesPrice,
            noPrice,
            resolutionTime
        );
        
        // Verify event was created
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        assertEq(event_.creator, creator1);
        assertEq(event_.description, description);
        assertEq(event_.stakeAmount, stakeAmount);
        assertEq(event_.resolutionTime, resolutionTime);
        assertFalse(event_.isResolved);
        
        // Verify shares calculation
        assertGt(event_.initialYesShares, 0);
        assertGt(event_.initialNoShares, 0);
        
        // Verify registry state
        assertEq(registry.getEventCount(), 1);
        assertEq(registry.getEventIdByIndex(0), eventId);
        
        // Verify creator stats
        (uint256 totalStake, uint256 totalPredictions, uint256 correctPredictions, uint256 accuracyRate) = 
            registry.getCreatorStats(creator1);
        assertEq(totalStake, stakeAmount);
        assertEq(totalPredictions, 1);
        assertEq(correctPredictions, 0);
        assertEq(accuracyRate, 0);
    }

    function testResolveEvent() public {
        // Create an event first with YES bias (low YES price = more YES shares)
        string memory description = "Test event";
        uint256 resolutionTime = block.timestamp + 1 days;
        uint256 yesPrice = 0.3 ether; // Low price = more shares
        uint256 noPrice = 0.7 ether;
        
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: 1 ether}(
            description,
            yesPrice,
            noPrice,
            resolutionTime
        );
        
        // Fast forward to resolution time
        vm.warp(resolutionTime);
        
        // Resolve the event with YES outcome (matching the creator's bias)
        vm.expectEmit(true, false, false, true);
        emit JudgementEventResolved(eventId, true, creator1, GREEN_POINTS_REWARD);
        
        vm.prank(resolver);
        registry.resolveEvent(eventId, true);
        
        // Verify event resolution
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        assertTrue(event_.isResolved);
        assertTrue(event_.outcome);
        
        // Verify green points were awarded
        assertEq(greenPoints.balanceOf(creator1), GREEN_POINTS_REWARD);
        
        // Verify creator stats updated (should be 1 correct since YES outcome matches YES bias)
        (, , uint256 correctPredictions, uint256 accuracyRate) = registry.getCreatorStats(creator1);
        assertEq(correctPredictions, 1);
        assertEq(accuracyRate, 100);
    }

    // Input validation tests
    function testSubmitJudgementEventInsufficientStake() public {
        vm.expectRevert("CeresRegistry: insufficient stake amount");
        vm.prank(creator1);
        registry.submitJudgementEvent{value: 0.05 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
    }

    function testSubmitJudgementEventEmptyDescription() public {
        vm.expectRevert("CeresRegistry: description cannot be empty");
        vm.prank(creator1);
        registry.submitJudgementEvent{value: 1 ether}(
            "",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
    }

    function testSubmitJudgementEventInvalidPrices() public {
        vm.expectRevert("CeresRegistry: prices must sum to 1 ether");
        vm.prank(creator1);
        registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.6 ether,
            0.5 ether, // Sum is 1.1 ether
            block.timestamp + 1 days
        );
    }

    function testSubmitJudgementEventZeroPrice() public {
        vm.expectRevert("CeresRegistry: prices must be positive");
        vm.prank(creator1);
        registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0 ether,
            1 ether,
            block.timestamp + 1 days
        );
    }

    function testSubmitJudgementEventEarlyResolutionTime() public {
        vm.expectRevert("CeresRegistry: resolution time too early");
        vm.prank(creator1);
        registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 30 minutes // Less than 1 hour
        );
    }

    function testResolveEventUnauthorized() public {
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        vm.warp(block.timestamp + 1 days);
        
        vm.expectRevert();
        vm.prank(creator1);
        registry.resolveEvent(eventId, true);
    }

    function testResolveEventTooEarly() public {
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        vm.expectRevert("CeresRegistry: resolution time not reached");
        vm.prank(resolver);
        registry.resolveEvent(eventId, true);
    }

    function testResolveEventAlreadyResolved() public {
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        vm.warp(block.timestamp + 1 days);
        
        vm.prank(resolver);
        registry.resolveEvent(eventId, true);
        
        vm.expectRevert("CeresRegistry: event already resolved");
        vm.prank(resolver);
        registry.resolveEvent(eventId, false);
    }

    // Pause functionality tests
    function testPause() public {
        vm.prank(pauser);
        registry.pause();
        
        assertTrue(registry.paused());
        
        vm.expectRevert();
        vm.prank(creator1);
        registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
    }

    // Property-based tests
    
    // Feature: ai-web3-prediction-market, Property 1: Judgment Event Creation and Stake Validation
    function testPropertyJudgmentEventCreationStakeValidation(
        uint256 stakeAmount,
        uint256 yesPrice
    ) public {
        // Constrain inputs to valid ranges to prevent overflow and rejection
        vm.assume(stakeAmount >= MIN_STAKE && stakeAmount <= 10 ether);
        vm.assume(yesPrice >= 0.01 ether && yesPrice <= 0.99 ether);
        
        uint256 noPrice = 1 ether - yesPrice;
        uint256 resolutionTime = block.timestamp + 1 days;
        string memory description = "Property test event";
        
        // Fund the creator
        vm.deal(creator1, stakeAmount);
        
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            description,
            yesPrice,
            noPrice,
            resolutionTime
        );
        
        // Verify event was created correctly
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        assertEq(event_.creator, creator1);
        assertEq(event_.stakeAmount, stakeAmount);
        assertGt(event_.initialYesShares, 0);
        assertGt(event_.initialNoShares, 0);
        assertFalse(event_.isResolved);
        
        // Verify unique event ID
        assertTrue(eventId != bytes32(0));
    }

    // Feature: ai-web3-prediction-market, Property 2: Event Resolution Authority and Reward Distribution
    function testPropertyEventResolutionAuthorityRewardDistribution(
        bool outcome
    ) public {
        // Create a test event with clear bias based on the outcome we'll test
        uint256 yesPrice = outcome ? 0.3 ether : 0.7 ether; // Bias towards expected outcome
        uint256 noPrice = 1 ether - yesPrice;
        
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: 1 ether}(
            "Property test event",
            yesPrice,
            noPrice,
            block.timestamp + 1 days
        );
        
        // Fast forward to resolution time
        vm.warp(block.timestamp + 1 days);
        
        // Only authorized resolver should be able to resolve
        vm.expectRevert();
        vm.prank(creator1);
        registry.resolveEvent(eventId, outcome);
        
        // Authorized resolver can resolve
        uint256 initialGreenPoints = greenPoints.balanceOf(creator1);
        
        vm.prank(resolver);
        registry.resolveEvent(eventId, outcome);
        
        // Verify event is resolved with correct outcome
        assertTrue(registry.isEventResolved(eventId));
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        assertEq(event_.outcome, outcome);
        
        // Verify green points were awarded
        assertEq(greenPoints.balanceOf(creator1), initialGreenPoints + GREEN_POINTS_REWARD);
        
        // Verify creator stats updated (should be 1 correct since we biased towards the outcome)
        (, , uint256 correctPredictions, ) = registry.getCreatorStats(creator1);
        assertEq(correctPredictions, 1);
    }

    // Test share calculation accuracy
    function testPropertyShareCalculationAccuracy(
        uint256 stakeAmount,
        uint256 yesPrice
    ) public {
        vm.assume(stakeAmount >= MIN_STAKE && stakeAmount <= 100 ether);
        vm.assume(yesPrice >= 0.01 ether && yesPrice <= 0.99 ether); // Avoid extreme values that cause rounding errors
        
        uint256 noPrice = 1 ether - yesPrice;
        
        vm.deal(creator1, stakeAmount);
        
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            "Share calculation test",
            yesPrice,
            noPrice,
            block.timestamp + 1 days
        );
        
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        
        // Verify shares are calculated correctly with new logic
        // yesShares = stakeAmount * noPrice / 1 ether (more shares when YES price is low)
        // noShares = stakeAmount * yesPrice / 1 ether (more shares when NO price is low)
        uint256 expectedYesShares = (stakeAmount * noPrice) / 1 ether;
        uint256 expectedNoShares = (stakeAmount * yesPrice) / 1 ether;
        
        assertEq(event_.initialYesShares, expectedYesShares);
        assertEq(event_.initialNoShares, expectedNoShares);
        
        // Verify total allocation equals stake amount (within rounding tolerance)
        uint256 totalShares = event_.initialYesShares + event_.initialNoShares;
        assertGe(totalShares, stakeAmount - 1); // Allow for 1 wei rounding error
        assertLe(totalShares, stakeAmount + 1);
    }

    // Test creator statistics accuracy
    function testPropertyCreatorStatisticsAccuracy() public {
        uint256 numEvents = 5;
        uint256 expectedCorrect = 0;
        
        // Create multiple events with different price biases
        bytes32[] memory eventIds = new bytes32[](numEvents);
        bool[] memory expectedOutcomes = new bool[](numEvents);
        
        for (uint256 i = 0; i < numEvents; i++) {
            // Create events with clear bias
            uint256 yesPrice;
            uint256 noPrice;
            
            if (i < 3) {
                // First 3 events: YES-biased (low YES price = more YES shares)
                yesPrice = 0.2 ether;
                noPrice = 0.8 ether;
                expectedOutcomes[i] = true; // YES outcome matches bias
                expectedCorrect++;
            } else {
                // Last 2 events: NO-biased (high YES price = fewer YES shares)
                yesPrice = 0.8 ether;
                noPrice = 0.2 ether;
                expectedOutcomes[i] = true; // YES outcome doesn't match NO bias
            }
            
            vm.prank(creator1);
            eventIds[i] = registry.submitJudgementEvent{value: 1 ether}(
                string(abi.encodePacked("Event ", i)),
                yesPrice,
                noPrice,
                block.timestamp + 1 days
            );
        }
        
        // Fast forward and resolve events
        vm.warp(block.timestamp + 1 days);
        
        for (uint256 i = 0; i < numEvents; i++) {
            vm.prank(resolver);
            registry.resolveEvent(eventIds[i], expectedOutcomes[i]);
        }
        
        // Verify creator statistics
        (uint256 totalStake, uint256 totalPredictions, uint256 correctPredictions, uint256 accuracyRate) = 
            registry.getCreatorStats(creator1);
        
        assertEq(totalStake, numEvents * 1 ether);
        assertEq(totalPredictions, numEvents);
        assertEq(correctPredictions, expectedCorrect);
        assertEq(accuracyRate, (expectedCorrect * 100) / numEvents);
        
        // Verify green points awarded (awarded for all events, not just correct ones)
        assertEq(greenPoints.balanceOf(creator1), numEvents * GREEN_POINTS_REWARD);
    }

    // Test event enumeration
    function testEventEnumeration() public {
        uint256 numEvents = 3;
        bytes32[] memory createdEventIds = new bytes32[](numEvents);
        
        // Create events
        for (uint256 i = 0; i < numEvents; i++) {
            vm.prank(creator1);
            createdEventIds[i] = registry.submitJudgementEvent{value: 1 ether}(
                string(abi.encodePacked("Event ", i)),
                0.5 ether,
                0.5 ether,
                block.timestamp + 1 days
            );
        }
        
        // Verify enumeration
        assertEq(registry.getEventCount(), numEvents);
        
        for (uint256 i = 0; i < numEvents; i++) {
            assertEq(registry.getEventIdByIndex(i), createdEventIds[i]);
        }
    }

    // Test market address setting
    function testSetMarketAddress() public {
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: 1 ether}(
            "Test event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        address mockMarket = address(0x123);
        registry.setMarketAddress(eventId, mockMarket);
        
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        assertEq(event_.marketAddress, mockMarket);
    }

    // Test emergency functions
    function testEmergencyWithdraw() public {
        // Send some funds to the contract
        vm.deal(address(registry), 5 ether);
        
        // Pause the contract
        vm.prank(pauser);
        registry.pause();
        
        // Emergency withdraw
        uint256 initialBalance = admin.balance;
        vm.prank(admin);
        registry.emergencyWithdraw(payable(admin), 2 ether);
        
        assertEq(admin.balance, initialBalance + 2 ether);
        assertEq(address(registry).balance, 3 ether);
    }

    // Test oracle upgrade interfaces (placeholders)
    function testOracleAdapterSetting() public {
        address mockOracle = address(0x456);
        
        vm.prank(admin);
        registry.setOracleAdapter(mockOracle);
        
        assertEq(registry.oracleAdapter(), mockOracle);
    }

    // Fuzz test for edge cases
    function testFuzzEventCreation(
        uint256 stakeAmount,
        uint256 yesPrice,
        uint256 resolutionDelay
    ) public {
        vm.assume(stakeAmount >= MIN_STAKE && stakeAmount <= 1000 ether);
        vm.assume(yesPrice > 0 && yesPrice < 1 ether);
        vm.assume(resolutionDelay >= 1 hours && resolutionDelay <= 365 days);
        
        uint256 noPrice = 1 ether - yesPrice;
        uint256 resolutionTime = block.timestamp + resolutionDelay;
        
        vm.deal(creator1, stakeAmount);
        
        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            "Fuzz test event",
            yesPrice,
            noPrice,
            resolutionTime
        );
        
        // Verify event was created successfully
        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        assertEq(event_.creator, creator1);
        assertEq(event_.stakeAmount, stakeAmount);
        assertEq(event_.resolutionTime, resolutionTime);
        assertFalse(event_.isResolved);
    }

    // Test new market type functionality
    function testSubmitJudgementEventWithType() public {
        uint256 stakeAmount = 1 ether;
        uint256 yesPrice = 0.6 ether;
        uint256 noPrice = 0.4 ether;
        uint256 resolutionTime = block.timestamp + 1 days;
        string memory marketType = "orderbook";
        bytes memory metadata = abi.encode("initial_orders", 5, "spread_bps", 100);

        vm.deal(creator1, stakeAmount);

        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEventWithType{value: stakeAmount}(
            "Test orderbook event",
            yesPrice,
            noPrice,
            resolutionTime,
            marketType,
            metadata
        );

        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        
        assertEq(event_.creator, creator1);
        assertEq(event_.description, "Test orderbook event");
        assertEq(event_.stakeAmount, stakeAmount);
        assertEq(event_.marketType, keccak256("orderbook"));
        assertEq(event_.metadata, metadata);
        assertFalse(event_.isResolved);
    }

    function testSubmitJudgementEventWithAMMType() public {
        uint256 stakeAmount = 1 ether;
        uint256 yesPrice = 0.3 ether;
        uint256 noPrice = 0.7 ether;
        uint256 resolutionTime = block.timestamp + 1 days;
        string memory marketType = "amm";
        bytes memory metadata = "";

        vm.deal(creator1, stakeAmount);

        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEventWithType{value: stakeAmount}(
            "Test AMM event",
            yesPrice,
            noPrice,
            resolutionTime,
            marketType,
            metadata
        );

        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        
        assertEq(event_.creator, creator1);
        assertEq(event_.description, "Test AMM event");
        assertEq(event_.marketType, keccak256("amm"));
        assertEq(event_.metadata, metadata);
    }

    function testSubmitJudgementEventWithInvalidType() public {
        uint256 stakeAmount = 1 ether;
        uint256 yesPrice = 0.6 ether;
        uint256 noPrice = 0.4 ether;
        uint256 resolutionTime = block.timestamp + 1 days;
        string memory marketType = "invalid_type";
        bytes memory metadata = "";

        vm.deal(creator1, stakeAmount);

        vm.expectRevert("CeresRegistry: invalid market type");
        vm.prank(creator1);
        registry.submitJudgementEventWithType{value: stakeAmount}(
            "Test invalid type event",
            yesPrice,
            noPrice,
            resolutionTime,
            marketType,
            metadata
        );
    }

    function testDefaultMarketTypeIsAMM() public {
        uint256 stakeAmount = 1 ether;
        uint256 yesPrice = 0.5 ether;
        uint256 noPrice = 0.5 ether;
        uint256 resolutionTime = block.timestamp + 1 days;

        vm.deal(creator1, stakeAmount);

        vm.prank(creator1);
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            "Test default type event",
            yesPrice,
            noPrice,
            resolutionTime
        );

        CeresRegistry.JudgementEvent memory event_ = registry.getJudgementEvent(eventId);
        
        // Default market type should be AMM
        assertEq(event_.marketType, keccak256("amm"));
        assertEq(event_.metadata.length, 0); // Empty metadata
    }
}