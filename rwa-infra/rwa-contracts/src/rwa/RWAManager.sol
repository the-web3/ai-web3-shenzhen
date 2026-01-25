// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {IOraclePod} from "../interfaces/IOraclePod.sol";
import {IRWAManager} from "../interfaces/IRWAManager.sol";

interface IRWA1155Minter {
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external;
    function burn(address from, uint256 id, uint256 amount) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/// @notice Compliance/issuance/redeem manager for the RWA demo.
/// @dev Designed to be deployed behind a TransparentUpgradeableProxy (no constructor; use initialize).
contract RWAManager is Initializable, AccessControlUpgradeable, PausableUpgradeable, IRWAManager {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    IRWA1155Minter public rwa1155;

    mapping(uint256 tokenId => IRWAManager.TokenConfig) private _tokenConfig;

    mapping(address account => bool) public isAccountFrozen;
    mapping(address account => mapping(uint256 tokenId => uint256 amount)) public frozenBalance;

    uint256 public nextRequestId;
    mapping(uint256 requestId => IRWAManager.RedeemRequest) public redeemRequests;

    // Simple upgradeable reentrancy guard (since OZ ReentrancyGuardUpgradeable is not available in this vendored version)
    uint256 private _reentrancyLock;

    modifier nonReentrant() {
        if (_reentrancyLock == 1) revert Reentrancy();
        _reentrancyLock = 1;
        _;
        _reentrancyLock = 0;
    }

    /// @notice Initialize for proxy deployment.
    /// @param admin default admin role holder
    /// @param issuer initial issuer role holder
    /// @param compliance initial compliance role holder
    /// @param rwa1155Address deployed RWA1155 token (should grant MINTER_ROLE to this Manager proxy address)
    function initialize(address admin, address issuer, address compliance, address rwa1155Address) external initializer {
        if (admin == address(0) || issuer == address(0) || compliance == address(0) || rwa1155Address == address(0)) {
            revert ZeroAddress();
        }

        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, issuer);
        _grantRole(COMPLIANCE_ROLE, compliance);

        rwa1155 = IRWA1155Minter(rwa1155Address);
        nextRequestId = 1;
        _reentrancyLock = 0;
    }

    // --- Admin / Config ---
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setRWA1155(address rwa1155Address) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (rwa1155Address == address(0)) revert ZeroAddress();
        rwa1155 = IRWA1155Minter(rwa1155Address);
    }

    function configureToken(
        uint256 tokenId,
        string calldata tokenName,
        string calldata unit,
        address oraclePod,
        uint256 maxAgeSeconds
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (oraclePod == address(0)) revert ZeroAddress();
        _tokenConfig[tokenId] = IRWAManager.TokenConfig({
            exists: true,
            name: tokenName,
            unit: unit,
            oraclePod: IOraclePod(oraclePod),
            maxAgeSeconds: maxAgeSeconds
        });
        emit TokenConfigured(tokenId, tokenName, unit, oraclePod, maxAgeSeconds);
    }

    function getTokenConfig(uint256 tokenId) external view returns (IRWAManager.TokenConfig memory) {
        return _tokenConfig[tokenId];
    }

    // --- Issuance ---
    function issueMint(address to, uint256 tokenId, uint256 amount, bytes32 docHash)
        external
        whenNotPaused
        onlyRole(ISSUER_ROLE)
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (!_tokenConfig[tokenId].exists) revert TokenNotConfigured();

        rwa1155.mint(to, tokenId, amount, "");
        emit Issued(to, tokenId, amount, docHash);
    }

    // --- Freeze / Unfreeze ---
    function freezeAccount(address account, bytes32 evidenceHash) external whenNotPaused onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        isAccountFrozen[account] = true;
        emit AccountFrozen(account, evidenceHash);
    }

    function unfreezeAccount(address account, bytes32 evidenceHash) external whenNotPaused onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        isAccountFrozen[account] = false;
        emit AccountUnfrozen(account, evidenceHash);
    }

    function freezeBalance(address account, uint256 tokenId, uint256 amount, bytes32 evidenceHash)
        external
        whenNotPaused
        onlyRole(COMPLIANCE_ROLE)
    {
        if (account == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (!_tokenConfig[tokenId].exists) revert TokenNotConfigured();

        uint256 bal = rwa1155.balanceOf(account, tokenId);
        uint256 curFrozen = frozenBalance[account][tokenId];
        // Ensure frozen <= balance invariant (since transfers are disabled, only mint/burn can change balances).
        if (curFrozen + amount > bal) revert InsufficientAvailableBalance();

        frozenBalance[account][tokenId] = curFrozen + amount;
        emit BalanceFrozen(account, tokenId, amount, evidenceHash);
    }

    function unfreezeBalance(address account, uint256 tokenId, uint256 amount, bytes32 evidenceHash)
        external
        whenNotPaused
        onlyRole(COMPLIANCE_ROLE)
    {
        if (account == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        uint256 cur = frozenBalance[account][tokenId];
        if (amount > cur) revert InsufficientAvailableBalance();
        frozenBalance[account][tokenId] = cur - amount;
        emit BalanceUnfrozen(account, tokenId, amount, evidenceHash);
    }

    // --- Redeem ---
    function requestRedeem(uint256 tokenId, uint256 amount, bytes32 deliveryInfoHash)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 requestId)
    {
        if (amount == 0) revert InvalidAmount();
        if (!_tokenConfig[tokenId].exists) revert TokenNotConfigured();
        if (isAccountFrozen[msg.sender]) revert AccountIsFrozen();

        // Enforce available balance at request time (better UX + prevents spam requests).
        // available = balance - frozen
        uint256 bal = rwa1155.balanceOf(msg.sender, tokenId);
        uint256 frozenAmt = frozenBalance[msg.sender][tokenId];
        if (bal < frozenAmt + amount) revert InsufficientAvailableBalance();

        requestId = nextRequestId++;
        redeemRequests[requestId] = IRWAManager.RedeemRequest({
            requester: msg.sender,
            tokenId: tokenId,
            amount: amount,
            deliveryInfoHash: deliveryInfoHash,
            requestedAt: uint64(block.timestamp),
            status: 0
        });

        emit RedeemRequested(requestId, msg.sender, tokenId, amount, deliveryInfoHash);
    }

    function approveRedeem(uint256 requestId, bytes32 evidenceHash)
        external
        whenNotPaused
        nonReentrant
        onlyRole(COMPLIANCE_ROLE)
    {
        IRWAManager.RedeemRequest storage r = redeemRequests[requestId];
        if (r.requester == address(0)) revert RequestNotFound();
        if (r.status != 0) revert RequestNotPending();

        if (isAccountFrozen[r.requester]) revert AccountIsFrozen();

        // Enforce available balance: available = balance - frozen.
        uint256 bal = rwa1155.balanceOf(r.requester, r.tokenId);
        uint256 frozenAmt = frozenBalance[r.requester][r.tokenId];
        // Require: bal - frozenAmt >= amount  <=>  bal >= frozenAmt + amount
        if (bal < frozenAmt + r.amount) revert InsufficientAvailableBalance();

        r.status = 1;
        rwa1155.burn(r.requester, r.tokenId, r.amount);
        emit RedeemApproved(requestId, msg.sender, evidenceHash);
    }

    function availableBalance(address account, uint256 tokenId) external view returns (uint256) {
        uint256 bal = rwa1155.balanceOf(account, tokenId);
        uint256 frozenAmt = frozenBalance[account][tokenId];
        if (frozenAmt >= bal) return 0;
        return bal - frozenAmt;
    }

    function rejectRedeem(uint256 requestId, bytes32 evidenceHash)
        external
        whenNotPaused
        onlyRole(COMPLIANCE_ROLE)
    {
        IRWAManager.RedeemRequest storage r = redeemRequests[requestId];
        if (r.requester == address(0)) revert RequestNotFound();
        if (r.status != 0) revert RequestNotPending();

        r.status = 2;
        emit RedeemRejected(requestId, msg.sender, evidenceHash);
    }

    // --- Oracle read helpers (for frontend) ---
    function getTokenPrice(uint256 tokenId)
        external
        view
        returns (uint256 price, uint8 decimals, uint256 updatedAt, bool fresh)
    {
        IRWAManager.TokenConfig storage cfg = _tokenConfig[tokenId];
        if (!cfg.exists) revert TokenNotConfigured();
        (price, decimals) = cfg.oraclePod.getPriceWithDecimals();
        updatedAt = cfg.oraclePod.getUpdateTimestamp();
        fresh = (cfg.maxAgeSeconds == 0) ? true : cfg.oraclePod.isDataFresh(cfg.maxAgeSeconds);
    }

    /// @notice Demo-friendly legacy price reader. Returns the oracle pod's string price directly.
    /// @dev This works even if the oracle system only updates `marketPrice` (string) via `fillSymbolPrice*`.
    function getTokenPriceString(uint256 tokenId)
        external
        view
        returns (string memory priceStr, uint256 updatedAt, bool fresh)
    {
        IRWAManager.TokenConfig storage cfg = _tokenConfig[tokenId];
        if (!cfg.exists) revert TokenNotConfigured();
        priceStr = cfg.oraclePod.getSymbolPrice();
        updatedAt = cfg.oraclePod.getUpdateTimestamp();
        fresh = (cfg.maxAgeSeconds == 0) ? true : cfg.oraclePod.isDataFresh(cfg.maxAgeSeconds);
    }
}

