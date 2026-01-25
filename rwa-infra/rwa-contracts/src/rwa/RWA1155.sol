// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice ERC-1155 asset container for the RWA demo.
/// @dev MVP choice: transfers between users are disabled; only mint/burn via Manager.
contract RWA1155 is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string public name;
    string public symbol;

    error TransfersDisabled();

    constructor(string memory _name, string memory _symbol, string memory _baseURI, address admin)
        ERC1155(_baseURI)
    {
        name = _name;
        symbol = _symbol;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function setURI(string calldata newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newURI);
    }

    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
    }

    function burn(address from, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, id, amount);
    }

    // --- Transfer disabling (MVP) ---
    // OZ v5 uses `_update` as the single hook for mint/burn/transfer.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        // Disallow user-to-user transfers. Allow mint (from=0) and burn (to=0).
        if (from != address(0) && to != address(0)) revert TransfersDisabled();
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

