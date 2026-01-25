// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title PodBase
 * @notice Minimal initializer + ownership + pausing for non-upgradeable pods
 * @dev Keeps initializer pattern for clone deployments without upgradeable bases
 */
abstract contract PodBase {
    address private _owner;
    bool private _paused;
    bool private _initialized;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    modifier initializer() {
        require(!_initialized, "Initializable: contract is already initialized");
        _initialized = true;
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    function _initializeOwner(address initialOwner) internal {
        require(_owner == address(0), "Ownable: owner already set");
        require(initialOwner != address(0), "Ownable: new owner is the zero address");
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function _initializePausable() internal {
        _paused = false;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function paused() public view returns (bool) {
        return _paused;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function renounceOwnership() external onlyOwner {
        address oldOwner = _owner;
        _owner = address(0);
        emit OwnershipTransferred(oldOwner, address(0));
    }

    function _pause() internal whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    function _unpause() internal whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    function _disableInitializers() internal {
        _initialized = true;
    }
}
