// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "@forge-std/Test.sol";
import {CeresGreenPoints} from "../src/CeresGreenPoints.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title CeresGreenPointsTest
 * @dev Comprehensive test suite for CeresGreenPoints contract
 */
contract CeresGreenPointsTest is Test {
    CeresGreenPoints public greenPoints;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public burner = address(0x3);
    address public pauser = address(0x4);
    address public user1 = address(0x5);
    address public user2 = address(0x6);
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event SoulBound(address indexed account);

    function setUp() public {
        vm.prank(admin);
        greenPoints = new CeresGreenPoints(admin);
        
        // Grant roles to test accounts
        vm.startPrank(admin);
        greenPoints.grantRole(MINTER_ROLE, minter);
        greenPoints.grantRole(BURNER_ROLE, burner);
        greenPoints.grantRole(PAUSER_ROLE, pauser);
        vm.stopPrank();
    }

    // Basic ERC20 functionality tests
    function testInitialState() public {
        assertEq(greenPoints.name(), "Ceres Green Points");
        assertEq(greenPoints.symbol(), "CGP");
        assertEq(greenPoints.totalSupply(), 0);
        assertEq(greenPoints.balanceOf(admin), 0);
    }

    function testMinting() public {
        uint256 amount = 100 * 10**18;
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), user1, amount);
        
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        assertEq(greenPoints.balanceOf(user1), amount);
        assertEq(greenPoints.totalSupply(), amount);
    }

    function testMintingRequiresRole() public {
        uint256 amount = 100 * 10**18;
        
        vm.expectRevert();
        vm.prank(user1);
        greenPoints.mint(user1, amount);
    }

    function testBurning() public {
        uint256 amount = 100 * 10**18;
        
        // First mint tokens
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        // Then burn them
        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, address(0), amount);
        
        vm.prank(burner);
        greenPoints.burn(user1, amount);
        
        assertEq(greenPoints.balanceOf(user1), 0);
        assertEq(greenPoints.totalSupply(), 0);
    }

    function testBurningRequiresRole() public {
        uint256 amount = 100 * 10**18;
        
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        vm.expectRevert();
        vm.prank(user1);
        greenPoints.burn(user1, amount);
    }

    // Voting power tests
    function testVotingPower() public {
        uint256 amount = 100 * 10**18;
        
        assertEq(greenPoints.getVotingPower(user1), 0);
        
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        assertEq(greenPoints.getVotingPower(user1), amount);
    }

    // Delegation tests
    function testDelegation() public {
        vm.expectEmit(true, true, true, false);
        emit DelegateChanged(user1, address(0), user2);
        
        vm.prank(user1);
        greenPoints.delegate(user2);
        
        assertEq(greenPoints.getDelegate(user1), user2);
    }

    function testDelegationChange() public {
        address user3 = address(0x7);
        
        // Initial delegation
        vm.prank(user1);
        greenPoints.delegate(user2);
        
        // Change delegation
        vm.expectEmit(true, true, true, false);
        emit DelegateChanged(user1, user2, user3);
        
        vm.prank(user1);
        greenPoints.delegate(user3);
        
        assertEq(greenPoints.getDelegate(user1), user3);
    }

    // Pause functionality tests
    function testPause() public {
        vm.prank(pauser);
        greenPoints.pause();
        
        assertTrue(greenPoints.paused());
    }

    function testPauseRequiresRole() public {
        vm.expectRevert();
        vm.prank(user1);
        greenPoints.pause();
    }

    function testMintingWhenPaused() public {
        vm.prank(pauser);
        greenPoints.pause();
        
        vm.expectRevert();
        vm.prank(minter);
        greenPoints.mint(user1, 100 * 10**18);
    }

    function testTransferWhenPaused() public {
        uint256 amount = 100 * 10**18;
        
        // Mint tokens first
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        // Pause contract
        vm.prank(pauser);
        greenPoints.pause();
        
        // Try to transfer - should fail
        vm.expectRevert();
        vm.prank(user1);
        greenPoints.transfer(user2, amount);
    }

    function testUnpause() public {
        uint256 amount = 100 * 10**18;
        
        // Mint tokens
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        // Pause
        vm.prank(pauser);
        greenPoints.pause();
        
        // Unpause
        vm.prank(pauser);
        greenPoints.unpause();
        
        assertFalse(greenPoints.paused());
        
        // Should be able to transfer now
        vm.prank(user1);
        greenPoints.transfer(user2, amount);
        
        assertEq(greenPoints.balanceOf(user2), amount);
    }

    // Soul-bound functionality tests (future upgrade)
    function testSoulBind() public {
        vm.expectEmit(true, false, false, false);
        emit SoulBound(user1);
        
        vm.prank(admin);
        greenPoints.soulBind(user1);
        
        assertTrue(greenPoints.isSoulBound(user1));
    }

    function testSoulBindRequiresAdminRole() public {
        vm.expectRevert();
        vm.prank(user1);
        greenPoints.soulBind(user2);
    }

    function testSoulBoundTransferRestriction() public {
        uint256 amount = 100 * 10**18;
        
        // Mint tokens to user1
        vm.prank(minter);
        greenPoints.mint(user1, amount);
        
        // Soul-bind user1
        vm.prank(admin);
        greenPoints.soulBind(user1);
        
        // Try to transfer - should fail
        vm.expectRevert("CeresGreenPoints: soul-bound tokens cannot be transferred");
        vm.prank(user1);
        greenPoints.transfer(user2, amount);
    }

    // Governance placeholder tests
    function testPropose() public {
        string memory description = "Test proposal";
        bytes memory callData = abi.encodeWithSignature("testFunction()");
        
        uint256 proposalId = greenPoints.propose(description, callData);
        
        // Should return a deterministic proposal ID
        uint256 expectedId = uint256(keccak256(abi.encodePacked(description, callData, block.timestamp)));
        assertEq(proposalId, expectedId);
    }

    function testVote() public {
        // This is a placeholder test since vote() doesn't have implementation yet
        // Should not revert
        greenPoints.vote(1, true);
    }

    // Fuzz tests
    function testFuzzMinting(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount <= type(uint128).max); // Avoid overflow
        
        vm.prank(minter);
        greenPoints.mint(to, amount);
        
        assertEq(greenPoints.balanceOf(to), amount);
        assertEq(greenPoints.totalSupply(), amount);
    }

    function testFuzzVotingPower(address user, uint256 amount) public {
        vm.assume(user != address(0));
        vm.assume(amount <= type(uint128).max);
        
        vm.prank(minter);
        greenPoints.mint(user, amount);
        
        assertEq(greenPoints.getVotingPower(user), amount);
    }

    function testFuzzDelegation(address delegator, address delegatee) public {
        vm.assume(delegator != address(0));
        
        vm.prank(delegator);
        greenPoints.delegate(delegatee);
        
        assertEq(greenPoints.getDelegate(delegator), delegatee);
    }

    // Access control tests
    function testSupportsInterface() public {
        // Test AccessControl interface
        assertTrue(greenPoints.supportsInterface(type(IAccessControl).interfaceId));
    }

    function testRoleManagement() public {
        address newMinter = address(0x8);
        
        // Admin can grant roles
        vm.prank(admin);
        greenPoints.grantRole(MINTER_ROLE, newMinter);
        
        assertTrue(greenPoints.hasRole(MINTER_ROLE, newMinter));
        
        // New minter can mint
        vm.prank(newMinter);
        greenPoints.mint(user1, 100 * 10**18);
        
        assertEq(greenPoints.balanceOf(user1), 100 * 10**18);
    }
}