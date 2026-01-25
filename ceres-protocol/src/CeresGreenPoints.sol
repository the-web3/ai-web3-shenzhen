// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CeresGreenPoints
 * @dev ERC20 token for Ceres Protocol green points reward system
 * 
 * Green Points are awarded to correct judgment providers and serve as:
 * - Reputation indicators
 * - Governance tokens (future upgrade)
 * - Platform utility tokens
 * 
 * Key features:
 * - Role-based minting (only authorized contracts can mint)
 * - Pausable for emergency situations
 * - Upgradeable interfaces for future governance features
 */
contract CeresGreenPoints is ERC20, AccessControl, Pausable {
    /// @dev Role identifier for accounts that can mint tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    /// @dev Role identifier for accounts that can burn tokens
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    /// @dev Role identifier for accounts that can pause/unpause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Mapping to track voting power delegation
    mapping(address => address) private _delegates;
    
    /// @dev Mapping to track if an account is soul-bound (future upgrade)
    mapping(address => bool) private _soulBound;

    // Events
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event SoulBound(address indexed account);
    
    /**
     * @dev Constructor sets up the token with initial roles
     * @param admin Address that will have admin role and initial roles
     */
    constructor(address admin) ERC20("Ceres Green Points", "CGP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Mints tokens to a specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * 
     * Requirements:
     * - Caller must have MINTER_ROLE
     * - Contract must not be paused
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens from a specified address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * 
     * Requirements:
     * - Caller must have BURNER_ROLE
     * - Contract must not be paused
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
        _burn(from, amount);
    }

    /**
     * @dev Gets the voting power of an account (current balance)
     * @param account Address to check voting power for
     * @return Voting power (token balance)
     */
    function getVotingPower(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @dev Delegates voting power to another address
     * @param delegatee Address to delegate voting power to
     * 
     * Note: This is a basic implementation. Future upgrades will include
     * more sophisticated delegation mechanics with historical tracking.
     */
    function delegate(address delegatee) external {
        address currentDelegate = _delegates[msg.sender];
        _delegates[msg.sender] = delegatee;
        
        emit DelegateChanged(msg.sender, currentDelegate, delegatee);
    }

    /**
     * @dev Gets the current delegate for an account
     * @param account Address to check delegate for
     * @return Address of the current delegate (or zero address if none)
     */
    function getDelegate(address account) external view returns (address) {
        return _delegates[account];
    }

    /**
     * @dev Pauses all token transfers and minting/burning
     * 
     * Requirements:
     * - Caller must have PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers and minting/burning
     * 
     * Requirements:
     * - Caller must have PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // UPGRADE: Soul-bound token functionality
    /**
     * @dev Marks an account as soul-bound (tokens cannot be transferred)
     * @param account Address to soul-bind
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     * 
     * Note: This is a future upgrade feature
     */
    function soulBind(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _soulBound[account] = true;
        emit SoulBound(account);
    }

    /**
     * @dev Checks if an account is soul-bound
     * @param account Address to check
     * @return True if account is soul-bound
     */
    function isSoulBound(address account) external view returns (bool) {
        return _soulBound[account];
    }

    // UPGRADE: Governance functionality
    /**
     * @dev Creates a governance proposal (future upgrade)
     * @param description Proposal description
     * @param callData Call data for proposal execution
     * @return proposalId Unique identifier for the proposal
     * 
     * Note: This is a placeholder for future governance functionality
     */
    function propose(
        string calldata description, 
        bytes calldata callData
    ) external returns (uint256 proposalId) {
        // UPGRADE: Implement full governance proposal logic
        // For now, just return a placeholder
        proposalId = uint256(keccak256(abi.encodePacked(description, callData, block.timestamp)));
        
        // Future implementation will include:
        // - Proposal creation with voting period
        // - Minimum token threshold requirements
        // - Proposal state management
        // - Execution logic
    }

    /**
     * @dev Votes on a governance proposal (future upgrade)
     * @param proposalId Proposal to vote on
     * @param support True for yes, false for no
     * 
     * Note: This is a placeholder for future governance functionality
     */
    function vote(uint256 proposalId, bool support) external {
        // UPGRADE: Implement full governance voting logic
        // For now, just emit an event
        
        // Future implementation will include:
        // - Vote weight calculation based on token balance
        // - Delegation support
        // - Vote tracking and tallying
        // - Proposal state updates
    }

    /**
     * @dev Override transfer to respect soul-bound restrictions and pause state
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        // UPGRADE: Check soul-bound restrictions
        if (from != address(0) && _soulBound[from]) {
            revert("CeresGreenPoints: soul-bound tokens cannot be transferred");
        }
        
        super._update(from, to, value);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}