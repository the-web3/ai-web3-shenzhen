// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CeresMarketFactory} from "../src/CeresMarketFactory.sol";
import {CeresRegistry} from "../src/CeresRegistry.sol";
import {CeresGreenPoints} from "../src/CeresGreenPoints.sol";
import {CeresPredictionMarket} from "../src/CeresPredictionMarket.sol";

contract CeresMarketFactoryTest is Test {
    CeresMarketFactory public factory;
    CeresRegistry public registry;
    CeresGreenPoints public greenPoints;
    
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    // Test constants
    uint256 public constant MIN_STAKE = 0.1 ether;
    string public constant TEST_DESCRIPTION = "Will Bitcoin reach $100k by end of 2024?";
    uint256 public constant YES_PRICE = 0.6 ether;
    uint256 public constant NO_PRICE = 0.4 ether;
    
    function getValidResolutionTime() internal view returns (uint256) {
        return block.timestamp + 30 days; // Always 30 days in the future
    }

    event MarketCreated(
        bytes32 indexed eventId,
        address indexed marketAddress,
        address indexed creator,
        uint256 initialYesShares,
        uint256 initialNoShares
    );

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy contracts
        greenPoints = new CeresGreenPoints(admin);
        registry = new CeresRegistry(address(greenPoints), admin);
        factory = new CeresMarketFactory(address(registry), address(greenPoints), admin);
        
        // Set factory in registry for automatic deployment
        registry.setMarketFactory(address(factory));
        
        // Grant necessary roles
        greenPoints.grantRole(greenPoints.MINTER_ROLE(), address(registry));
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testFactoryInitialization() public {
        assertEq(address(factory.ceresRegistry()), address(registry));
        assertEq(address(factory.greenPoints()), address(greenPoints));
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(factory.hasRole(factory.DEPLOYER_ROLE(), admin));
        assertTrue(factory.hasRole(factory.PAUSER_ROLE(), admin));
        assertTrue(factory.hasRole(factory.DEPLOYER_ROLE(), address(registry)));
    }

    function testCreateMarketForEvent() public {
        // Create a judgment event first
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Check that market was automatically created
        address marketAddress = factory.getMarketAddress(eventId);
        assertTrue(marketAddress != address(0));
        assertTrue(factory.isMarketDeployed(eventId));
        assertTrue(factory.isMarket(marketAddress));
        
        // Verify market state
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        
        assertEq(state.eventId, eventId);
        assertEq(state.creator, user1);
        assertFalse(state.isFinalized);
        assertTrue(state.totalYesShares > 0);
        assertTrue(state.totalNoShares > 0);
    }

    function testManualMarketCreation() public {
        // Create event without automatic deployment
        vm.prank(admin);
        registry.setMarketFactory(address(0)); // Disable automatic deployment
        
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Verify no market was created automatically
        assertEq(factory.getMarketAddress(eventId), address(0));
        assertFalse(factory.isMarketDeployed(eventId));
        
        // Manually create market
        vm.prank(admin);
        address marketAddress = factory.createMarketForEvent(eventId);
        
        // Verify market was created
        assertTrue(marketAddress != address(0));
        assertEq(factory.getMarketAddress(eventId), marketAddress);
        assertTrue(factory.isMarketDeployed(eventId));
    }

    function testCannotCreateDuplicateMarket() public {
        // Create event and market
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Try to create market again
        vm.prank(admin);
        vm.expectRevert("CeresMarketFactory: market already exists");
        factory.createMarketForEvent(eventId);
    }

    function testCannotCreateMarketForNonexistentEvent() public {
        bytes32 fakeEventId = keccak256("fake event");
        
        vm.prank(admin);
        vm.expectRevert("CeresRegistry: event does not exist");
        factory.createMarketForEvent(fakeEventId);
    }

    function testGetAllMarkets() public {
        // Initially no markets
        address[] memory markets = factory.getAllMarkets();
        assertEq(markets.length, 0);
        assertEq(factory.getMarketCount(), 0);
        
        // Create first event and market
        vm.prank(user1);
        bytes32 eventId1 = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 1",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Create second event and market
        vm.prank(user2);
        bytes32 eventId2 = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 2",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Check markets array
        markets = factory.getAllMarkets();
        assertEq(markets.length, 2);
        assertEq(factory.getMarketCount(), 2);
        
        // Verify market addresses
        assertEq(markets[0], factory.getMarketAddress(eventId1));
        assertEq(markets[1], factory.getMarketAddress(eventId2));
        assertEq(factory.getMarketByIndex(0), markets[0]);
        assertEq(factory.getMarketByIndex(1), markets[1]);
    }

    function testGetMarketByIndexBounds() public {
        vm.expectRevert("CeresMarketFactory: index out of bounds");
        factory.getMarketByIndex(0);
        
        // Create one market
        vm.prank(user1);
        registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Valid index
        factory.getMarketByIndex(0);
        
        // Invalid index
        vm.expectRevert("CeresMarketFactory: index out of bounds");
        factory.getMarketByIndex(1);
    }

    function testPauseUnpause() public {
        // Pause factory
        vm.prank(admin);
        factory.pause();
        
        // Cannot create market when paused
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Market should not be created automatically when factory is paused
        assertEq(factory.getMarketAddress(eventId), address(0));
        
        // Manual creation should also fail
        vm.prank(admin);
        vm.expectRevert("EnforcedPause()");
        factory.createMarketForEvent(eventId);
        
        // Unpause and try again
        vm.prank(admin);
        factory.unpause();
        
        vm.prank(admin);
        address marketAddress = factory.createMarketForEvent(eventId);
        assertTrue(marketAddress != address(0));
    }

    function testAccessControl() public {
        // Disable automatic deployment for this test
        vm.prank(admin);
        registry.setMarketFactory(address(0));
        
        // Create event first
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Non-deployer cannot create market
        vm.prank(user2);
        vm.expectRevert();
        factory.createMarketForEvent(eventId);
        
        // Non-pauser cannot pause
        vm.prank(user2);
        vm.expectRevert();
        factory.pause();
        
        // Admin can create market
        vm.prank(admin);
        factory.createMarketForEvent(eventId);
    }

    function testBatchCreateMarkets() public {
        // Disable automatic deployment
        vm.prank(admin);
        registry.setMarketFactory(address(0));
        
        // Create multiple events
        bytes32[] memory eventIds = new bytes32[](3);
        
        vm.prank(user1);
        eventIds[0] = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 1",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        vm.prank(user1);
        eventIds[1] = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 2",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        vm.prank(user1);
        eventIds[2] = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 3",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Batch create markets
        vm.prank(admin);
        address[] memory marketAddresses = factory.batchCreateMarkets(eventIds);
        
        // Verify all markets were created
        assertEq(marketAddresses.length, 3);
        for (uint256 i = 0; i < 3; i++) {
            assertTrue(marketAddresses[i] != address(0));
            assertEq(factory.getMarketAddress(eventIds[i]), marketAddresses[i]);
        }
        
        assertEq(factory.getMarketCount(), 3);
    }

    function testBatchCreateMarketsWithDuplicates() public {
        // Create one event and market
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Try batch create with existing event
        bytes32[] memory eventIds = new bytes32[](1);
        eventIds[0] = eventId;
        
        vm.prank(admin);
        address[] memory marketAddresses = factory.batchCreateMarkets(eventIds);
        
        // Should skip existing market
        assertEq(marketAddresses[0], address(0));
    }

    function testBatchCreateMarketsEmptyArray() public {
        bytes32[] memory eventIds = new bytes32[](0);
        
        vm.prank(admin);
        vm.expectRevert("CeresMarketFactory: empty event IDs array");
        factory.batchCreateMarkets(eventIds);
    }

    function testBatchCreateMarketsTooMany() public {
        bytes32[] memory eventIds = new bytes32[](51);
        
        vm.prank(admin);
        vm.expectRevert("CeresMarketFactory: too many events");
        factory.batchCreateMarkets(eventIds);
    }

    // Property-Based Tests

    /**
     * **Validates: Requirements 1.3**
     * Property 3: Market Factory Automatic Deployment
     * When a judgment event is created, a prediction market should be automatically deployed
     */
    function testPropertyMarketFactoryAutomaticDeployment(
        uint256 stakeAmount,
        uint256 yesPrice,
        uint256 resolutionTime
    ) public {
        // Constrain inputs to valid ranges
        stakeAmount = bound(stakeAmount, MIN_STAKE, 100 ether);
        yesPrice = bound(yesPrice, 0.01 ether, 0.99 ether); // Ensure both prices are positive
        uint256 noPrice = 1 ether - yesPrice;
        resolutionTime = bound(resolutionTime, block.timestamp + 2 hours, block.timestamp + 300 days);
        
        // Fund user
        vm.deal(user1, stakeAmount);
        
        // Create judgment event
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: stakeAmount}(
            TEST_DESCRIPTION,
            yesPrice,
            noPrice,
            resolutionTime
        );
        
        // Verify market was automatically deployed
        address marketAddress = factory.getMarketAddress(eventId);
        assertTrue(marketAddress != address(0), "Market should be automatically deployed");
        assertTrue(factory.isMarketDeployed(eventId), "Market deployment flag should be set");
        assertTrue(factory.isMarket(marketAddress), "Address should be recognized as market");
        
        // Verify market is properly initialized
        CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddress));
        CeresPredictionMarket.MarketState memory state = market.getMarketState();
        
        assertEq(state.eventId, eventId, "Market should be linked to correct event");
        assertEq(state.creator, user1, "Market creator should match event creator");
        assertFalse(state.isFinalized, "Market should not be finalized initially");
        assertTrue(state.totalYesShares > 0, "Market should have initial YES shares");
        assertTrue(state.totalNoShares > 0, "Market should have initial NO shares");
    }

    /**
     * **Validates: Requirements 1.3**
     * Property 4: Market Factory Deployment Consistency
     * Each event should have exactly one market, and market addresses should be deterministic
     */
    function testPropertyMarketFactoryDeploymentConsistency(
        uint256 stakeAmount1,
        uint256 stakeAmount2,
        uint256 yesPrice1,
        uint256 yesPrice2
    ) public {
        // Constrain inputs
        stakeAmount1 = bound(stakeAmount1, MIN_STAKE, 100 ether);
        stakeAmount2 = bound(stakeAmount2, MIN_STAKE, 100 ether);
        yesPrice1 = bound(yesPrice1, 0.01 ether, 0.99 ether);
        yesPrice2 = bound(yesPrice2, 0.01 ether, 0.99 ether);
        
        uint256 noPrice1 = 1 ether - yesPrice1;
        uint256 noPrice2 = 1 ether - yesPrice2;
        
        // Fund users
        vm.deal(user1, stakeAmount1);
        vm.deal(user2, stakeAmount2);
        
        // Create two different events
        vm.prank(user1);
        bytes32 eventId1 = registry.submitJudgementEvent{value: stakeAmount1}(
            "Event 1",
            yesPrice1,
            noPrice1,
            getValidResolutionTime()
        );
        
        vm.prank(user2);
        bytes32 eventId2 = registry.submitJudgementEvent{value: stakeAmount2}(
            "Event 2",
            yesPrice2,
            noPrice2,
            getValidResolutionTime()
        );
        
        // Verify each event has exactly one market
        address market1 = factory.getMarketAddress(eventId1);
        address market2 = factory.getMarketAddress(eventId2);
        
        assertTrue(market1 != address(0), "Event 1 should have a market");
        assertTrue(market2 != address(0), "Event 2 should have a market");
        assertTrue(market1 != market2, "Different events should have different markets");
        
        // Verify market count consistency
        assertEq(factory.getMarketCount(), 2, "Factory should track correct number of markets");
        
        // Verify markets are in the all markets array
        address[] memory allMarkets = factory.getAllMarkets();
        assertEq(allMarkets.length, 2, "All markets array should have correct length");
        assertTrue(
            (allMarkets[0] == market1 && allMarkets[1] == market2) ||
            (allMarkets[0] == market2 && allMarkets[1] == market1),
            "All markets array should contain both markets"
        );
        
        // Verify cannot create duplicate markets
        vm.prank(admin);
        vm.expectRevert("CeresMarketFactory: market already exists");
        factory.createMarketForEvent(eventId1);
    }

    function testPropertyMarketFactoryRoleConsistency() public {
        address randomUser = address(0x1234567890123456789012345678901234567890);
        
        // Disable automatic deployment first
        vm.prank(admin);
        registry.setMarketFactory(address(0));
        
        // Create an event first
        vm.deal(user1, MIN_STAKE);
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Random user should not be able to create markets
        vm.prank(randomUser);
        vm.expectRevert();
        factory.createMarketForEvent(eventId);
        
        // Random user should not be able to pause
        vm.prank(randomUser);
        vm.expectRevert();
        factory.pause();
        
        // Admin should be able to create markets
        vm.prank(admin);
        address marketAddress = factory.createMarketForEvent(eventId);
        assertTrue(marketAddress != address(0));
        
        // Registry should be able to create markets (has DEPLOYER_ROLE)
        vm.deal(user1, MIN_STAKE); // Fund user1 again for second transaction
        vm.prank(user1);
        bytes32 eventId2 = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 2",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        vm.prank(address(registry));
        address marketAddress2 = factory.createMarketForEvent(eventId2);
        assertTrue(marketAddress2 != address(0));
    }

    function testGasOptimization() public {
        // Test gas consumption for market creation
        vm.prank(user1);
        uint256 gasBefore = gasleft();
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for event creation with automatic market deployment:", gasUsed);
        
        // Gas should be reasonable (less than 3M gas for complex deployment)
        assertTrue(gasUsed < 3_000_000, "Gas usage should be reasonable");
        
        // Verify market was created
        assertTrue(factory.isMarketDeployed(eventId), "Market should be deployed");
    }

    function testMarketFactoryIntegrationWithRegistry() public {
        // Test that registry properly integrates with factory
        
        // Create event - should automatically deploy market
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            TEST_DESCRIPTION,
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Verify market was created and linked
        address marketAddress = factory.getMarketAddress(eventId);
        assertTrue(marketAddress != address(0));
        
        // Verify registry knows about the market
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        assertEq(eventData.marketAddress, marketAddress);
        
        // Test that factory failure doesn't break event creation
        vm.prank(admin);
        factory.pause(); // This will cause market creation to fail
        
        vm.prank(user2);
        bytes32 eventId2 = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Event 2",
            YES_PRICE,
            NO_PRICE,
            getValidResolutionTime()
        );
        
        // Event should still be created even if market deployment fails
        CeresRegistry.JudgementEvent memory eventData2 = registry.getJudgementEvent(eventId2);
        assertEq(eventData2.creator, user2);
        assertEq(eventData2.marketAddress, address(0)); // No market due to factory being paused
    }

    function testMarketTemplateManagement() public {
        address mockAMMTemplate = address(0x123);
        address mockOrderbookTemplate = address(0x456);
        
        // Set default template
        vm.prank(admin);
        factory.setDefaultMarketTemplate(mockAMMTemplate);
        assertEq(factory.defaultMarketTemplate(), mockAMMTemplate);
        
        // Set specific market type templates
        vm.prank(admin);
        factory.setMarketTemplate("amm", mockAMMTemplate);
        assertEq(factory.getMarketTemplate("amm"), mockAMMTemplate);
        
        vm.prank(admin);
        factory.setMarketTemplate("orderbook", mockOrderbookTemplate);
        assertEq(factory.getMarketTemplate("orderbook"), mockOrderbookTemplate);
        
        // Test unknown market type falls back to default
        assertEq(factory.getMarketTemplate("unknown"), mockAMMTemplate);
    }

    function testMarketTemplateAccessControl() public {
        address mockTemplate = address(0x789);
        
        // Non-admin cannot set templates
        vm.expectRevert();
        vm.prank(user1);
        factory.setDefaultMarketTemplate(mockTemplate);
        
        vm.expectRevert();
        vm.prank(user1);
        factory.setMarketTemplate("amm", mockTemplate);
    }
}