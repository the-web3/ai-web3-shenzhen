// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {RWA1155} from "../src/rwa/RWA1155.sol";
import {RWAManager} from "../src/rwa/RWAManager.sol";
import {IOraclePod} from "../src/interfaces/IOraclePod.sol";
import {IRWAManager} from "../src/interfaces/IRWAManager.sol";

contract MockOraclePod is IOraclePod {
    uint256 private _price;
    uint8 private _decimals;
    uint256 private _ts;

    function set(uint256 price, uint8 decimals, uint256 ts) external {
        _price = price;
        _decimals = decimals;
        _ts = ts;
    }

    function getPriceWithDecimals() external view returns (uint256 price, uint8 decimals) {
        return (_price, _decimals);
    }

    function getSymbolPrice() external view returns (string memory) {
        // Minimal legacy helper for interface compatibility; tests primarily use numeric price.
        return _toString(_price);
    }

    function getUpdateTimestamp() external view returns (uint256) {
        return _ts;
    }

    function isDataFresh(uint256 maxAge) external view returns (bool) {
        if (_ts == 0) return false;
        if (block.timestamp < _ts) return false;
        return block.timestamp - _ts <= maxAge;
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

contract RWAManagerTest is Test {
    address admin;
    address issuer;
    address compliance;
    address user;
    address other;

    RWA1155 rwa;
    RWAManager mgr;
    MockOraclePod oracle;

    uint256 constant TOKEN_ID = 1;

    function setUp() public {
        // Foundry default timestamp can be very small; avoid underflow in mocks.
        vm.warp(1_000_000);

        // Make the test contract the admin so setup does not depend on prank availability/version.
        admin = address(this);
        issuer = address(0x1550E);
        compliance = address(0xC0FFEE);
        user = address(0xB0B);
        other = address(0x0BAD);

        oracle = new MockOraclePod();
        oracle.set(123_456_789, 8, block.timestamp - 10);

        rwa = new RWA1155("RWA Baijiu", "RWAJ", "ipfs://base/", admin);

        mgr = new RWAManager();
        mgr.initialize(admin, issuer, compliance, address(rwa));

        rwa.grantRole(rwa.MINTER_ROLE(), address(mgr));

        mgr.configureToken(TOKEN_ID, "Feitian_2023Batch", "bottle", address(oracle), 3600);
    }

    function test_issueMint_increasesBalance() public {
        vm.prank(issuer);
        mgr.issueMint(user, TOKEN_ID, 10, keccak256("doc"));

        assertEq(rwa.balanceOf(user, TOKEN_ID), 10);
        assertEq(mgr.availableBalance(user, TOKEN_ID), 10);
    }

    function test_transferDisabled_reverts() public {
        vm.prank(issuer);
        mgr.issueMint(user, TOKEN_ID, 1, keccak256("doc"));

        vm.prank(user);
        vm.expectRevert(RWA1155.TransfersDisabled.selector);
        rwa.safeTransferFrom(user, other, TOKEN_ID, 1, "");
    }

    function test_freezeBalance_reducesAvailable_and_blocksRedeemBeyondAvailable() public {
        vm.prank(issuer);
        mgr.issueMint(user, TOKEN_ID, 10, keccak256("doc"));

        vm.prank(compliance);
        mgr.freezeBalance(user, TOKEN_ID, 4, keccak256("court"));

        assertEq(rwa.balanceOf(user, TOKEN_ID), 10);
        assertEq(mgr.availableBalance(user, TOKEN_ID), 6);

        vm.prank(user);
        vm.expectRevert(IRWAManager.InsufficientAvailableBalance.selector);
        mgr.requestRedeem(TOKEN_ID, 7, keccak256("delivery"));

        uint256 rid2;
        vm.prank(user);
        rid2 = mgr.requestRedeem(TOKEN_ID, 6, keccak256("delivery2"));

        vm.prank(compliance);
        mgr.approveRedeem(rid2, keccak256("approve2"));

        // balance reduced, frozen stays, available should be 0
        assertEq(rwa.balanceOf(user, TOKEN_ID), 4);
        assertEq(mgr.availableBalance(user, TOKEN_ID), 0);
    }

    function test_freezeAccount_blocksRequest() public {
        vm.prank(issuer);
        mgr.issueMint(user, TOKEN_ID, 1, keccak256("doc"));

        vm.prank(compliance);
        mgr.freezeAccount(user, keccak256("court"));

        vm.prank(user);
        vm.expectRevert(IRWAManager.AccountIsFrozen.selector);
        mgr.requestRedeem(TOKEN_ID, 1, keccak256("delivery"));
    }

    function test_pause_blocksIssueAndRedeem() public {
        mgr.pause();

        vm.prank(issuer);
        vm.expectRevert(); // PausableUpgradeable.EnforcedPause()
        mgr.issueMint(user, TOKEN_ID, 1, keccak256("doc"));

        vm.prank(user);
        vm.expectRevert();
        mgr.requestRedeem(TOKEN_ID, 1, keccak256("delivery"));
    }

    function test_getTokenPrice_readsOracle() public view {
        (uint256 price, uint8 decimals, uint256 updatedAt, bool fresh) = mgr.getTokenPrice(TOKEN_ID);
        assertEq(price, 123_456_789);
        assertEq(decimals, 8);
        assertTrue(updatedAt != 0);
        assertTrue(fresh);
    }
}

