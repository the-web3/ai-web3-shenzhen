// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./P256Account.sol";

/**
 * @title P256AccountFactory
 * @notice Factory contract for deploying P256Account using CREATE2
 * @dev Enables deterministic wallet addresses based on P-256 public key
 * 
 * This allows users to:
 * 1. Compute their wallet address BEFORE deployment (using public key only)
 * 2. Receive funds at the address even before wallet is deployed
 * 3. Deploy wallet on first transaction (lazy deployment)
 */
contract P256AccountFactory {
    // ==================== State Variables ====================
    
    /// @notice Implementation contract for all P256Accounts
    P256Account public immutable accountImplementation;
    
    /// @notice ERC-4337 EntryPoint address
    IEntryPoint public immutable entryPoint;
    
    // ==================== Events ====================
    
    event P256AccountCreated(
        address indexed account,
        uint256 indexed publicKeyX,
        uint256 indexed publicKeyY,
        uint256 salt
    );
    
    // ==================== Constructor ====================
    
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = new P256Account(_entryPoint);
    }
    
    // ==================== Factory Functions ====================
    
    /**
     * @notice Create a new P256Account (or return existing)
     * @dev Uses CREATE2 for deterministic addresses
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param salt Salt value for CREATE2 (allows multiple wallets per key)
     * @return ret The deployed P256Account address
     */
    function createAccount(
        uint256 publicKeyX,
        uint256 publicKeyY,
        uint256 salt
    ) public returns (P256Account ret) {
        address addr = getAddress(publicKeyX, publicKeyY, salt);
        uint256 codeSize = addr.code.length;
        
        // If already deployed, return existing address
        if (codeSize > 0) {
            return P256Account(payable(addr));
        }
        
        // Deploy new account using ERC1967Proxy
        ret = P256Account(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(P256Account.initialize, (publicKeyX, publicKeyY))
                )
            )
        );
        
        emit P256AccountCreated(address(ret), publicKeyX, publicKeyY, salt);
    }
    
    /**
     * @notice Compute the counterfactual address of a P256Account
     * @dev This address is deterministic and can be computed before deployment
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param salt Salt value for CREATE2
     * @return address The computed address
     */
    function getAddress(
        uint256 publicKeyX,
        uint256 publicKeyY,
        uint256 salt
    ) public view returns (address) {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(
                abi.encodePacked(
                    type(ERC1967Proxy).creationCode,
                    abi.encode(
                        address(accountImplementation),
                        abi.encodeCall(P256Account.initialize, (publicKeyX, publicKeyY))
                    )
                )
            )
        );
    }
    
    /**
     * @notice Add deposit to a P256Account in the EntryPoint
     * @dev Useful for pre-funding an account before deployment
     * @param account The account address to fund
     */
    function addStake(address account) public payable {
        entryPoint.depositTo{value: msg.value}(account);
    }
}
