// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IOraclePod} from "./IOraclePod.sol";

/// @notice Canonical interface for RWAManager: types + events/errors + external functions.
/// @dev Keep RWAManager.sol focused on storage + business logic by importing/implementing this.
interface IRWAManager {
    // --- Types ---
    struct TokenConfig {
        bool exists;
        string name;
        string unit; // "bottle"/"case"/"unit"
        IOraclePod oraclePod;
        uint256 maxAgeSeconds; // only for UI warning / freshness checks
    }

    struct RedeemRequest {
        address requester;
        uint256 tokenId;
        uint256 amount;
        bytes32 deliveryInfoHash;
        uint64 requestedAt;
        uint8 status; // 0=pending, 1=approved, 2=rejected
    }

    // --- Events (for audit timeline) ---
    event TokenConfigured(
        uint256 indexed tokenId,
        string name,
        string unit,
        address indexed oraclePod,
        uint256 maxAgeSeconds
    );
    event Issued(address indexed to, uint256 indexed tokenId, uint256 amount, bytes32 docHash);
    event AccountFrozen(address indexed account, bytes32 evidenceHash);
    event AccountUnfrozen(address indexed account, bytes32 evidenceHash);
    event BalanceFrozen(address indexed account, uint256 indexed tokenId, uint256 amount, bytes32 evidenceHash);
    event BalanceUnfrozen(address indexed account, uint256 indexed tokenId, uint256 amount, bytes32 evidenceHash);
    event RedeemRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 indexed tokenId,
        uint256 amount,
        bytes32 deliveryInfoHash
    );
    event RedeemApproved(uint256 indexed requestId, address indexed approver, bytes32 evidenceHash);
    event RedeemRejected(uint256 indexed requestId, address indexed approver, bytes32 evidenceHash);

    // --- Errors ---
    error ZeroAddress();
    error InvalidAmount();
    error TokenNotConfigured();
    error AccountIsFrozen();
    error InsufficientAvailableBalance();
    error RequestNotFound();
    error RequestNotPending();
    error Reentrancy();

    // --- External API ---
    function initialize(address admin, address issuer, address compliance, address rwa1155Address) external;

    function pause() external;
    function unpause() external;
    function setRWA1155(address rwa1155Address) external;

    function configureToken(
        uint256 tokenId,
        string calldata tokenName,
        string calldata unit,
        address oraclePod,
        uint256 maxAgeSeconds
    ) external;

    function getTokenConfig(uint256 tokenId) external view returns (TokenConfig memory);

    function issueMint(address to, uint256 tokenId, uint256 amount, bytes32 docHash) external;

    function freezeAccount(address account, bytes32 evidenceHash) external;
    function unfreezeAccount(address account, bytes32 evidenceHash) external;
    function freezeBalance(address account, uint256 tokenId, uint256 amount, bytes32 evidenceHash) external;
    function unfreezeBalance(address account, uint256 tokenId, uint256 amount, bytes32 evidenceHash) external;

    function requestRedeem(uint256 tokenId, uint256 amount, bytes32 deliveryInfoHash) external returns (uint256 requestId);
    function approveRedeem(uint256 requestId, bytes32 evidenceHash) external;
    function rejectRedeem(uint256 requestId, bytes32 evidenceHash) external;

    function availableBalance(address account, uint256 tokenId) external view returns (uint256);

    function getTokenPrice(uint256 tokenId) external view returns (uint256 price, uint8 decimals, uint256 updatedAt, bool fresh);
    function getTokenPriceString(uint256 tokenId) external view returns (string memory priceStr, uint256 updatedAt, bool fresh);
}

