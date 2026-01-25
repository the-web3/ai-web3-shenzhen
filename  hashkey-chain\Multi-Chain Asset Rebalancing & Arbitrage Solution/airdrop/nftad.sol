// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract FishcakeNFT is ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    uint256 private _nextTokenId;
    address public signerAddress;
    mapping(address => bool) public hasClaimed;
    string private _baseTokenURI;
    
    event NFTClaimed(address indexed user, uint256 tokenId);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        address initialSigner
    ) 
        ERC721(name, symbol) 
        Ownable(initialOwner)
    {
        signerAddress = initialSigner;
        _nextTokenId = 1;
    }
    
    function claimNFT(bytes memory signature) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        require(
            ethSignedMessageHash.recover(signature) == signerAddress,
            "Invalid signature"
        );
        
        hasClaimed[msg.sender] = true;
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        emit NFTClaimed(msg.sender, tokenId);
    }
    
    function setSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid address");
        emit SignerUpdated(signerAddress, newSigner);
        signerAddress = newSigner;
    }
    
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}