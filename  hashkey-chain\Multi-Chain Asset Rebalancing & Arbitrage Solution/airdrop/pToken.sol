// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PToken is ERC20, Ownable {
    address public bridgeAddress;
    
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event Minted(address indexed to, uint256 amount, uint64 targetChainId);
    event Burned(address indexed from, uint256 amount, uint64 sourceChainId);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) 
        ERC20(name, symbol) 
        Ownable(initialOwner)
    {}
    
    function setBridgeAddress(address _bridgeAddress) external onlyOwner {
        require(_bridgeAddress != address(0), "Invalid bridge address");
        emit BridgeUpdated(bridgeAddress, _bridgeAddress);
        bridgeAddress = _bridgeAddress;
    }
    
    function bridgeMint(address to, uint256 amount, uint64 targetChainId) external {
        require(msg.sender == bridgeAddress, "Only bridge can mint");
        _mint(to, amount);
        emit Minted(to, amount, targetChainId);
    }
    
    function bridgeBurn(address from, uint256 amount, uint64 sourceChainId) external {
        require(msg.sender == bridgeAddress, "Only bridge can burn");
        _burn(from, amount);
        emit Burned(from, amount, sourceChainId);
    }
}