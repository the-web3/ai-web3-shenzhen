// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NativeStablecoin is ERC20, Ownable {
    address public bridgeAddress;
    
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    
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
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == bridgeAddress, "Not authorized");
        _mint(to, amount);
        emit Minted(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }
    
    function bridgeBurn(address from, uint256 amount) external {
        require(msg.sender == bridgeAddress, "Only bridge can burn");
        _burn(from, amount);
        emit Burned(from, amount);
    }
}