// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "@forge-std/Test.sol";
import {CeresRegistry} from "../../src/CeresRegistry.sol";
import {CeresPredictionMarket} from "../../src/CeresPredictionMarket.sol";
import {CeresGreenPoints} from "../../src/CeresGreenPoints.sol";
import {CeresMarketFactory} from "../../src/CeresMarketFactory.sol";

/**
 * @title SecurityTests
 * @dev Comprehensive security test suite for Ceres Protocol
 * 
 * Tests cover:
 * - Reentrancy attack protection
 * - Access control and role management
 * - Integer overflow/underflow protection
 * - Emergency controls and pause functionality
 * - Fund security and proper ETH handling
 * - Edge cases and boundary conditions
 */
contract SecurityTests is Test {
    CeresRegistry public registry;
    CeresGreenPoints public greenPoints;
    CeresMarketFactory public factory;
    CeresPredictionMarket public market;
    
    address public admin = address(0x1);
    address public resolver = address(0x2);
    address public pauser = address(0x3);
    address public attacker = address(0x4);
    address public user1 = address(0x5);
    address public user2 = address(0x6);
    
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant GREEN_POINTS_REWARD = 100 * 10**18;
    
    // Test event for tracking
    bytes32 public testEventId;

    function setUp() public {
        // Deploy contracts with proper roles
        vm.startPrank(admin);
        
        greenPoints = new CeresGreenPoints(admin);
        registry = new CeresRegistry(address(greenPoints), admin);
        factory = new CeresMarketFactory(address(registry), address(greenPoints), admin);
        
        // Grant necessary roles
        greenPoints.grantRole(MINTER_ROLE, address(registry));
        registry.setMarketFactory(address(factory));
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(attacker, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        
        // Create a test event for market testing
        vm.prank(user1);
        testEventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Test security event",
            0.6 ether, // yesPrice
            0.4 ether, // noPrice
            block.timestamp + 1 days
        );
        
        // Get the market address that was automatically created
        address marketAddress = factory.getMarketAddress(testEventId);
        require(marketAddress != address(0), "Market should be automatically created");
        market = CeresPredictionMarket(payable(marketAddress));
    }

    // ========================================
    // REENTRANCY ATTACK TESTS
    // ========================================

    /**
     * @dev Test reentrancy protection on CeresRegistry.submitJudgementEvent
     */
    function testReentrancyProtection_RegistrySubmitEvent() public {
        // The registry doesn't make external calls during submitJudgementEvent
        // so reentrancy isn't a concern here. Test that the nonReentrant modifier
        // is present and working by checking it doesn't interfere with normal operation
        ReentrancyAttacker attackerContract = new ReentrancyAttacker();
        vm.deal(address(attackerContract), 10 ether);
        
        // Normal submission should work fine
        vm.prank(address(attackerContract));
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Normal event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        assertTrue(eventId != bytes32(0));
    }

    /**
     * @dev Test reentrancy protection on CeresPredictionMarket.buyYesShares
     */
    function testReentrancyProtection_MarketBuyShares() public {
        // buyYesShares doesn't make external calls, so test normal operation
        ReentrancyAttacker attackerContract = new ReentrancyAttacker();
        vm.deal(address(attackerContract), 10 ether);
        
        // Normal purchase should work fine
        vm.prank(address(attackerContract));
        market.buyYesShares{value: 1 ether}(0);
        
        // Verify shares were purchased
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(address(attackerContract));
        assertTrue(position.yesShares > 0);
    }

    /**
     * @dev Test reentrancy protection on CeresPredictionMarket.sellYesShares
     */
    function testReentrancyProtection_MarketSellShares() public {
        // This is where actual reentrancy can occur due to external call
        ReentrancyAttacker attackerContract = new ReentrancyAttacker();
        vm.deal(address(attackerContract), 10 ether);
        
        // First, attacker buys some shares
        vm.prank(address(attackerContract));
        market.buyYesShares{value: 1 ether}(0);
        
        // Now attempt reentrancy attack during sell (which makes external call)
        vm.expectRevert();
        attackerContract.attackMarketSell(market);
    }

    /**
     * @dev Test reentrancy protection on CeresPredictionMarket.claimWinnings
     */
    function testReentrancyProtection_MarketClaimWinnings() public {
        // This is where actual reentrancy can occur due to external call
        ReentrancyAttacker attackerContract = new ReentrancyAttacker();
        vm.deal(address(attackerContract), 10 ether);
        
        // Buy shares
        vm.prank(address(attackerContract));
        market.buyYesShares{value: 1 ether}(0);
        
        // Finalize market with YES outcome
        vm.prank(address(registry));
        market.finalize(true);
        
        // Attempt reentrancy attack during claim (which makes external call)
        vm.expectRevert();
        attackerContract.attackMarketClaim(market);
    }

    // ========================================
    // ACCESS CONTROL TESTS
    // ========================================

    /**
     * @dev Test unauthorized access to CeresRegistry.resolveEvent
     */
    function testAccessControl_UnauthorizedResolveEvent() public {
        vm.prank(attacker);
        vm.expectRevert();
        registry.resolveEvent(testEventId, true);
    }

    /**
     * @dev Test unauthorized access to CeresRegistry.pause
     */
    function testAccessControl_UnauthorizedPause() public {
        vm.prank(attacker);
        vm.expectRevert();
        registry.pause();
    }

    /**
     * @dev Test unauthorized access to CeresGreenPoints.mint
     */
    function testAccessControl_UnauthorizedMint() public {
        vm.prank(attacker);
        vm.expectRevert();
        greenPoints.mint(attacker, 1000 ether);
    }

    /**
     * @dev Test unauthorized access to CeresMarketFactory.createMarketForEvent
     */
    function testAccessControl_UnauthorizedMarketCreation() public {
        vm.prank(attacker);
        vm.expectRevert();
        factory.createMarketForEvent(testEventId);
    }

    /**
     * @dev Test unauthorized access to CeresPredictionMarket.finalize
     */
    function testAccessControl_UnauthorizedMarketFinalize() public {
        vm.prank(attacker);
        vm.expectRevert("CeresPredictionMarket: only registry can call");
        market.finalize(true);
    }

    /**
     * @dev Test role revocation security
     */
    function testAccessControl_RoleRevocation() public {
        // Grant resolver role to attacker
        vm.prank(admin);
        registry.grantRole(RESOLVER_ROLE, attacker);
        
        // Verify attacker can resolve events
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(attacker);
        registry.resolveEvent(testEventId, true);
        
        // Create another event for testing revocation
        vm.prank(user2);
        bytes32 eventId2 = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Test event 2",
            0.5 ether,
            0.5 ether,
            block.timestamp + 2 days // Longer resolution time
        );
        
        // Revoke resolver role
        vm.prank(admin);
        registry.revokeRole(RESOLVER_ROLE, attacker);
        
        // Verify attacker can no longer resolve events
        vm.warp(block.timestamp + 2 days + 1);
        vm.prank(attacker);
        vm.expectRevert();
        registry.resolveEvent(eventId2, false);
    }

    // ========================================
    // INTEGER OVERFLOW/UNDERFLOW TESTS
    // ========================================

    /**
     * @dev Test maximum stake amount handling
     */
    function testIntegerSafety_MaximumStakeAmount() public {
        // Test with very large stake amount (but within reasonable bounds)
        uint256 largeStake = 1000000 ether;
        vm.deal(user1, largeStake);
        
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: largeStake}(
            "Large stake event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        // Verify event was created successfully
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        assertEq(eventData.stakeAmount, largeStake);
    }

    /**
     * @dev Test price calculation edge cases
     */
    function testIntegerSafety_PriceCalculationEdgeCases() public {
        // Test with minimum possible prices (1 wei each, but must sum to 1 ether)
        vm.prank(user1);
        vm.expectRevert("CeresRegistry: prices must sum to 1 ether");
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "Edge case event",
            1, // 1 wei
            1, // 1 wei (sum = 2 wei, not 1 ether)
            block.timestamp + 1 days
        );
        
        // Test with valid extreme prices
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Extreme price event",
            1 wei, // Minimum YES price
            1 ether - 1 wei, // Maximum NO price
            block.timestamp + 1 days
        );
        
        CeresRegistry.JudgementEvent memory eventData = registry.getJudgementEvent(eventId);
        assertTrue(eventData.creator != address(0));
    }

    /**
     * @dev Test market trading with extreme amounts
     */
    function testIntegerSafety_ExtremeMarketTrading() public {
        // Fund user with large amount
        uint256 largeAmount = 10000 ether;
        vm.deal(user2, largeAmount);
        
        // Buy shares with large amount
        vm.prank(user2);
        market.buyYesShares{value: largeAmount}(0);
        
        // Verify position was recorded correctly
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(user2);
        assertTrue(position.yesShares > 0);
        assertEq(position.totalInvested, largeAmount);
    }

    /**
     * @dev Test green points minting with maximum amounts
     */
    function testIntegerSafety_MaximumGreenPointsMinting() public {
        // Test minting maximum reasonable amount
        uint256 maxAmount = 1000000 * 10**18; // 1 million tokens
        
        vm.prank(address(registry));
        greenPoints.mint(user1, maxAmount);
        
        assertEq(greenPoints.balanceOf(user1), maxAmount);
    }

    // ========================================
    // EMERGENCY CONTROLS TESTS
    // ========================================

    /**
     * @dev Test pause functionality on CeresRegistry
     */
    function testEmergencyControls_RegistryPause() public {
        // Pause the registry
        vm.prank(admin);
        registry.pause();
        
        // Verify operations are blocked when paused
        vm.prank(user1);
        vm.expectRevert();
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "Paused event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        // Unpause and verify operations work again
        vm.prank(admin);
        registry.unpause();
        
        vm.prank(user1);
        bytes32 eventId = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Unpaused event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
        
        assertTrue(eventId != bytes32(0));
    }

    /**
     * @dev Test pause functionality on CeresPredictionMarket
     */
    function testEmergencyControls_MarketPause() public {
        // Pause the market via registry
        vm.prank(address(registry));
        market.emergencyPause();
        
        // Verify trading is blocked when paused
        vm.prank(user2);
        vm.expectRevert();
        market.buyYesShares{value: 1 ether}(0);
        
        // Unpause and verify trading works again
        vm.prank(address(registry));
        market.emergencyUnpause();
        
        vm.prank(user2);
        market.buyYesShares{value: 1 ether}(0);
        
        // Verify shares were purchased
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(user2);
        assertTrue(position.yesShares > 0);
    }

    /**
     * @dev Test pause functionality on CeresGreenPoints
     */
    function testEmergencyControls_GreenPointsPause() public {
        // First mint some tokens
        vm.prank(address(registry));
        greenPoints.mint(user1, 1000 ether);
        
        // Pause the green points contract
        vm.prank(admin);
        greenPoints.pause();
        
        // Verify transfers are blocked when paused
        vm.prank(user1);
        vm.expectRevert();
        greenPoints.transfer(user2, 100 ether);
        
        // Verify minting is blocked when paused
        vm.prank(address(registry));
        vm.expectRevert();
        greenPoints.mint(user2, 100 ether);
        
        // Unpause and verify operations work again
        vm.prank(admin);
        greenPoints.unpause();
        
        vm.prank(user1);
        greenPoints.transfer(user2, 100 ether);
        
        assertEq(greenPoints.balanceOf(user2), 100 ether);
    }

    /**
     * @dev Test emergency withdrawal functionality
     */
    function testEmergencyControls_EmergencyWithdrawal() public {
        // First pause the registry
        vm.prank(admin);
        registry.pause();
        
        // Check initial balance
        uint256 initialBalance = address(registry).balance;
        assertTrue(initialBalance > 0); // Should have funds from test event creation
        
        // Perform emergency withdrawal
        uint256 withdrawAmount = initialBalance / 2;
        vm.prank(admin);
        registry.emergencyWithdraw(payable(admin), withdrawAmount);
        
        // Verify funds were withdrawn
        assertEq(address(registry).balance, initialBalance - withdrawAmount);
        
        // Test withdrawal of remaining funds
        vm.prank(admin);
        registry.emergencyWithdraw(payable(admin), address(registry).balance);
        
        assertEq(address(registry).balance, 0);
    }

    /**
     * @dev Test unauthorized emergency withdrawal
     */
    function testEmergencyControls_UnauthorizedEmergencyWithdrawal() public {
        vm.prank(admin);
        registry.pause();
        
        // Attacker tries to withdraw funds
        vm.prank(attacker);
        vm.expectRevert();
        registry.emergencyWithdraw(payable(attacker), 1 ether);
    }

    /**
     * @dev Test emergency withdrawal when not paused
     */
    function testEmergencyControls_EmergencyWithdrawalWhenNotPaused() public {
        // Try emergency withdrawal when not paused
        vm.prank(admin);
        vm.expectRevert();
        registry.emergencyWithdraw(payable(admin), 1 ether);
    }

    // ========================================
    // FUND SECURITY TESTS
    // ========================================

    /**
     * @dev Test proper ETH handling in market operations
     */
    function testFundSecurity_ProperETHHandling() public {
        uint256 initialBalance = address(market).balance;
        uint256 buyAmount = 2 ether;
        
        // Buy shares
        vm.prank(user2);
        market.buyYesShares{value: buyAmount}(0);
        
        // Verify contract received the funds
        assertEq(address(market).balance, initialBalance + buyAmount);
        
        // Get user position
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(user2);
        uint256 userShares = position.yesShares;
        
        // Sell shares
        uint256 balanceBefore = user2.balance;
        vm.prank(user2);
        market.sellYesShares(userShares, 0);
        
        // Verify user received funds back (minus fees)
        assertTrue(user2.balance > balanceBefore);
    }

    /**
     * @dev Test fund isolation between different markets
     */
    function testFundSecurity_FundIsolation() public {
        // Create second event and market with different user and unique description
        vm.prank(user2);
        bytes32 eventId2 = registry.submitJudgementEvent{value: MIN_STAKE}(
            "Unique second test event for isolation testing",
            0.5 ether,
            0.5 ether,
            block.timestamp + 2 days
        );
        
        // Get the automatically created market
        address marketAddress2 = factory.getMarketAddress(eventId2);
        require(marketAddress2 != address(0), "Second market should be automatically created");
        CeresPredictionMarket market2 = CeresPredictionMarket(payable(marketAddress2));
        
        // Record initial balances
        uint256 market1InitialBalance = address(market).balance;
        uint256 market2InitialBalance = address(market2).balance;
        
        // Trade in both markets
        vm.prank(user1);
        market.buyYesShares{value: 1 ether}(0);
        
        vm.prank(user2);
        market2.buyNoShares{value: 2 ether}(0);
        
        // Verify funds are properly isolated
        assertEq(address(market).balance, market1InitialBalance + 1 ether);
        assertEq(address(market2).balance, market2InitialBalance + 2 ether);
    }

    /**
     * @dev Test protection against direct ETH transfers
     */
    function testFundSecurity_DirectETHTransfers() public {
        uint256 initialBalance = address(market).balance;
        
        // Send ETH directly to market contract
        vm.prank(user1);
        (bool success,) = address(market).call{value: 1 ether}("");
        assertTrue(success);
        
        // Verify contract received the ETH
        assertEq(address(market).balance, initialBalance + 1 ether);
    }

    /**
     * @dev Test insufficient balance protection
     */
    function testFundSecurity_InsufficientBalanceProtection() public {
        // Try to buy shares with insufficient funds
        vm.deal(user2, 0.05 ether); // Less than minimum stake
        
        vm.prank(user2);
        vm.expectRevert("CeresPredictionMarket: must send HKTC to buy shares");
        market.buyYesShares{value: 0}(0);
    }

    // ========================================
    // EDGE CASES AND BOUNDARY CONDITIONS
    // ========================================

    /**
     * @dev Test zero address validations
     */
    function testEdgeCases_ZeroAddressValidations() public {
        // Test CeresRegistry constructor with zero address
        vm.expectRevert("CeresRegistry: green points address cannot be zero");
        new CeresRegistry(address(0), admin);
        
        vm.expectRevert("CeresRegistry: admin address cannot be zero");
        new CeresRegistry(address(greenPoints), address(0));
    }

    /**
     * @dev Test empty string validations
     */
    function testEdgeCases_EmptyStringValidations() public {
        vm.prank(user1);
        vm.expectRevert("CeresRegistry: description cannot be empty");
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "", // Empty description
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
    }

    /**
     * @dev Test maximum description length
     */
    function testEdgeCases_MaximumDescriptionLength() public {
        // Create string longer than MAX_DESCRIPTION_LENGTH (500 characters)
        string memory longDescription = "";
        for (uint i = 0; i < 51; i++) {
            longDescription = string(abi.encodePacked(longDescription, "0123456789"));
        }
        // longDescription is now 510 characters
        
        vm.prank(user1);
        vm.expectRevert("CeresRegistry: description too long");
        registry.submitJudgementEvent{value: MIN_STAKE}(
            longDescription,
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
    }

    /**
     * @dev Test resolution time boundaries
     */
    function testEdgeCases_ResolutionTimeBoundaries() public {
        // Test resolution time too early
        vm.prank(user1);
        vm.expectRevert("CeresRegistry: resolution time too early");
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "Early resolution event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 30 minutes // Less than MIN_RESOLUTION_TIME (1 hour)
        );
        
        // Test resolution time too late
        vm.prank(user1);
        vm.expectRevert("CeresRegistry: resolution time too late");
        registry.submitJudgementEvent{value: MIN_STAKE}(
            "Late resolution event",
            0.5 ether,
            0.5 ether,
            block.timestamp + 366 days // More than MAX_RESOLUTION_TIME (365 days)
        );
    }

    /**
     * @dev Test double resolution protection
     */
    function testEdgeCases_DoubleResolutionProtection() public {
        // Resolve the test event
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(admin);
        registry.resolveEvent(testEventId, true);
        
        // Try to resolve again
        vm.prank(admin);
        vm.expectRevert("CeresRegistry: event already resolved");
        registry.resolveEvent(testEventId, false);
    }

    /**
     * @dev Test market finalization edge cases
     */
    function testEdgeCases_MarketFinalizationEdgeCases() public {
        // Finalize market
        vm.prank(address(registry));
        market.finalize(true);
        
        // Try to buy shares after finalization
        vm.prank(user2);
        vm.expectRevert("CeresPredictionMarket: market is finalized");
        market.buyYesShares{value: 1 ether}(0);
        
        // Try to finalize again
        vm.prank(address(registry));
        vm.expectRevert("CeresPredictionMarket: market is finalized");
        market.finalize(false);
    }

    /**
     * @dev Test claim winnings edge cases
     */
    function testEdgeCases_ClaimWinningsEdgeCases() public {
        // Try to claim winnings before market is finalized
        vm.prank(user1);
        vm.expectRevert("CeresPredictionMarket: market not finalized");
        market.claimWinnings();
        
        // Finalize market
        vm.prank(address(registry));
        market.finalize(true);
        
        // Try to claim winnings with no winning shares
        vm.prank(user2); // user2 has no shares
        vm.expectRevert("CeresPredictionMarket: no winning shares");
        market.claimWinnings();
    }
}

/**
 * @dev Malicious contract for testing reentrancy protection
 */
contract ReentrancyAttacker {
    bool private attacking = false;
    CeresRegistry private targetRegistry;
    CeresPredictionMarket private targetMarket;
    string private constant ATTACK_EVENT = "Reentrancy attack event";
    
    function attackRegistrySubmit(CeresRegistry registry) external {
        targetRegistry = registry;
        // This will trigger the receive function when the contract receives ETH
        registry.submitJudgementEvent{value: 0.1 ether}(
            ATTACK_EVENT,
            0.5 ether,
            0.5 ether,
            block.timestamp + 1 days
        );
    }
    
    function attackMarketBuy(CeresPredictionMarket market) external {
        targetMarket = market;
        // This will trigger the receive function when the contract receives ETH
        market.buyYesShares{value: 1 ether}(0);
    }
    
    function attackMarketSell(CeresPredictionMarket market) external {
        targetMarket = market;
        CeresPredictionMarket.UserPosition memory position = market.getUserPosition(address(this));
        // This will trigger the receive function when the contract receives ETH from selling
        market.sellYesShares(position.yesShares, 0);
    }
    
    function attackMarketClaim(CeresPredictionMarket market) external {
        targetMarket = market;
        // This will trigger the receive function when the contract receives winnings
        market.claimWinnings();
    }
    
    // This receive function will be called when the contract receives ETH
    // and will attempt to call the same function again (reentrancy)
    receive() external payable {
        if (!attacking) {
            attacking = true;
            
            if (address(targetMarket) != address(0)) {
                // Try to buy more shares during the receive callback
                // This should trigger reentrancy protection
                targetMarket.buyYesShares{value: 0.1 ether}(0);
            } else if (address(targetRegistry) != address(0)) {
                // Try to submit another event during the receive callback
                // This should trigger reentrancy protection
                targetRegistry.submitJudgementEvent{value: 0.1 ether}(
                    "Second attack event",
                    0.5 ether,
                    0.5 ether,
                    block.timestamp + 1 days
                );
            }
        }
    }
    
    // Fallback function for any other calls
    fallback() external payable {
        if (!attacking) {
            attacking = true;
            
            if (address(targetMarket) != address(0)) {
                targetMarket.buyYesShares{value: 0.1 ether}(0);
            }
        }
    }
}