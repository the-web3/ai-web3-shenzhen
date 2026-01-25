// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./PodFactoryStorage.sol";
import "../../interfaces/event/IPodDeployer.sol";
import "../../interfaces/event/IEventManager.sol";
import "../../interfaces/event/IOrderBookManager.sol";
import "../../interfaces/event/IFundingManager.sol";
import "../../interfaces/event/IFeeVaultManager.sol";

/**
 * @title PodFactory
 * @notice Central vendor registry and pod management
 * @dev Manages vendor lifecycle and coordinates pod deployment
 */
contract PodFactory is Initializable, OwnableUpgradeable, PausableUpgradeable, PodFactoryStorage {
    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize contract
     * @param _initialOwner Initial owner address
     */
    function initialize(address _initialOwner) external initializer {
        __Ownable_init(_initialOwner);
        __Pausable_init();

        // Start vendorId from 1 (0 reserved for "no vendor")
        nextVendorId = 1;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the PodDeployer contract address
     * @param _podDeployer Address of PodDeployer contract
     */
    function setPodDeployer(address _podDeployer) external onlyOwner {
        if (_podDeployer == address(0)) revert InvalidPodDeployer();
        if (podDeployer != address(0)) revert PodDeployerAlreadySet();

        podDeployer = _podDeployer;
        emit PodDeployerSet(_podDeployer);
    }

    // ============ Vendor Management ============

    /**
     * @notice Register a new vendor and deploy their pod set
     * @param vendorAddress Address of the vendor
     * @param feeRecipient Address to receive fees
     * @return vendorId The assigned vendor ID
     */
    function registerVendor(
        address vendorAddress,
        address feeRecipient
    ) external onlyOwner whenNotPaused returns (uint256 vendorId) {
        if (vendorAddress == address(0)) revert InvalidVendorAddress();
        if (feeRecipient == address(0)) revert InvalidFeeRecipient();
        if (vendorAddressToId[vendorAddress] != 0) revert VendorAlreadyRegistered();
        if (podDeployer == address(0)) revert InvalidPodDeployer();

        // Validate managers are set
        require(eventManager != address(0), "PodFactory: eventManager not set");
        require(orderBookManager != address(0), "PodFactory: orderBookManager not set");
        require(fundingManager != address(0), "PodFactory: fundingManager not set");
        require(feeVaultManager != address(0), "PodFactory: feeVaultManager not set");

        // Assign vendor ID
        vendorId = nextVendorId++;

        // Calculate deterministic pod addresses using CREATE2 (solves circular dependency)
        // All addresses are known before any deployment
        address preCalcEventPod = _calculatePodAddress(vendorId, 0); // POD_TYPE_EVENT = 0
        address preCalcOrderBookPod = _calculatePodAddress(vendorId, 1); // POD_TYPE_ORDERBOOK = 1
        address preCalcFundingPod = _calculatePodAddress(vendorId, 3); // POD_TYPE_FUNDING = 3
        address preCalcFeeVaultPod = _calculatePodAddress(vendorId, 2); // POD_TYPE_FEEVAULT = 2

        // ============ Pre-Creation Validation ============
        // Verify this vendorId has no existing data (defensive check)
        require(vendors[vendorId].vendorId == 0, "PodFactory: vendorId already exists");

        // Deploy pods via their respective managers (order doesn't matter since addresses are pre-calculated)
        address eventPod = IEventManager(eventManager).deployEventPod(vendorId, vendorAddress);

        address orderBookPod = IOrderBookManager(orderBookManager).deployOrderBookPod(
            vendorId,
            vendorAddress,
            preCalcEventPod,
            preCalcFundingPod,
            preCalcFeeVaultPod
        );

        address fundingPod = IFundingManager(fundingManager).deployFundingPod(vendorId, vendorAddress, preCalcOrderBookPod, preCalcEventPod);

        address feeVaultPod = IFeeVaultManager(feeVaultManager).deployFeeVaultPod(vendorId, vendorAddress, feeRecipient, preCalcOrderBookPod);

        // ============ Post-Creation Verification ============
        // Verify all pods deployed successfully (non-zero addresses)
        require(eventPod != address(0), "PodFactory: eventPod deployment failed");
        require(orderBookPod != address(0), "PodFactory: orderBookPod deployment failed");
        require(fundingPod != address(0), "PodFactory: fundingPod deployment failed");
        require(feeVaultPod != address(0), "PodFactory: feeVaultPod deployment failed");

        // Verify returned addresses match pre-calculated CREATE2 addresses
        require(eventPod == preCalcEventPod, "PodFactory: eventPod address mismatch");
        require(orderBookPod == preCalcOrderBookPod, "PodFactory: orderBookPod address mismatch");
        require(fundingPod == preCalcFundingPod, "PodFactory: fundingPod address mismatch");
        require(feeVaultPod == preCalcFeeVaultPod, "PodFactory: feeVaultPod address mismatch");

        // Verify all pod addresses are unique (no duplicates)
        require(eventPod != orderBookPod && eventPod != fundingPod && eventPod != feeVaultPod,
                "PodFactory: duplicate pod addresses");
        require(orderBookPod != fundingPod && orderBookPod != feeVaultPod,
                "PodFactory: duplicate pod addresses");
        require(fundingPod != feeVaultPod, "PodFactory: duplicate pod addresses");

        // Construct pod set
        VendorPodSet memory podSet = VendorPodSet({
            eventPod: eventPod,
            orderBookPod: orderBookPod,
            feeVaultPod: feeVaultPod,
            fundingPod: fundingPod
        });

        // Store vendor info
        vendors[vendorId] = VendorInfo({
            vendorId: vendorId,
            vendorAddress: vendorAddress,
            feeRecipient: feeRecipient,
            isActive: true,
            podSet: podSet
        });

        // Map vendor address to ID
        vendorAddressToId[vendorAddress] = vendorId;

        emit VendorRegistered(vendorId, vendorAddress, feeRecipient, podSet);
    }

    /**
     * @notice Activate a vendor
     * @param vendorId Vendor ID
     */
    function activateVendor(uint256 vendorId) external onlyOwner {
        VendorInfo storage vendor = vendors[vendorId];
        if (vendor.vendorId == 0) revert VendorNotFound();

        vendor.isActive = true;
        emit VendorActivated(vendorId);
    }

    /**
     * @notice Deactivate a vendor
     * @param vendorId Vendor ID
     */
    function deactivateVendor(uint256 vendorId) external onlyOwner {
        VendorInfo storage vendor = vendors[vendorId];
        if (vendor.vendorId == 0) revert VendorNotFound();

        vendor.isActive = false;
        emit VendorDeactivated(vendorId);
    }

    // ============ View Functions ============

    /**
     * @notice Get vendor's pod set
     * @param vendorId Vendor ID
     * @return podSet The vendor's pod addresses
     */
    function getVendorPodSet(uint256 vendorId) external view returns (VendorPodSet memory podSet) {
        VendorInfo memory vendor = vendors[vendorId];
        if (vendor.vendorId == 0) revert VendorNotFound();
        if (!vendor.isActive) revert VendorNotActive();

        return vendor.podSet;
    }

    /**
     * @notice Get complete vendor information
     * @param vendorId Vendor ID
     * @return vendorInfo Complete vendor information
     */
    function getVendorInfo(uint256 vendorId) external view returns (VendorInfo memory vendorInfo) {
        vendorInfo = vendors[vendorId];
        if (vendorInfo.vendorId == 0) revert VendorNotFound();
    }

    /**
     * @notice Check if vendor exists and is active
     * @param vendorId Vendor ID
     * @return isActive Whether vendor is active
     */
    function isVendorActive(uint256 vendorId) external view returns (bool) {
        return vendors[vendorId].isActive;
    }

    /**
     * @notice Get the next vendor ID
     * @return nextId Next vendor ID
     */
    function getNextVendorId() external view returns (uint256) {
        return nextVendorId;
    }

    // ============ Admin Functions - Manager Configuration ============

    /**
     * @notice Set EventManager address
     * @param _eventManager EventManager contract address
     */
    function setEventManager(address _eventManager) external onlyOwner {
        require(_eventManager != address(0), "PodFactory: invalid eventManager");
        eventManager = _eventManager;
    }

    /**
     * @notice Set OrderBookManager address
     * @param _orderBookManager OrderBookManager contract address
     */
    function setOrderBookManager(address _orderBookManager) external onlyOwner {
        require(_orderBookManager != address(0), "PodFactory: invalid orderBookManager");
        orderBookManager = _orderBookManager;
    }

    /**
     * @notice Set FundingManager address
     * @param _fundingManager FundingManager contract address
     */
    function setFundingManager(address _fundingManager) external onlyOwner {
        require(_fundingManager != address(0), "PodFactory: invalid fundingManager");
        fundingManager = _fundingManager;
    }

    /**
     * @notice Set FeeVaultManager address
     * @param _feeVaultManager FeeVaultManager contract address
     */
    function setFeeVaultManager(address _feeVaultManager) external onlyOwner {
        require(_feeVaultManager != address(0), "PodFactory: invalid feeVaultManager");
        feeVaultManager = _feeVaultManager;
    }

    // ============ Internal Helper Functions ============

    /**
     * @notice Calculate deterministic pod address using CREATE2
     * @param vendorId Vendor ID
     * @param podType Pod type identifier (0=Event, 1=OrderBook, 2=FeeVault, 3=Funding)
     * @return predictedAddress The deterministic address
     */
    function _calculatePodAddress(uint256 vendorId, uint256 podType) internal view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(vendorId, podType));
        address implementation = _getPodImplementation(podType);

        // Use Clones.predictDeterministicAddress with PodDeployer as the deployer
        return Clones.predictDeterministicAddress(implementation, salt, podDeployer);
    }

    /**
     * @notice Get pod implementation address by type
     * @param podType Pod type identifier (0=Event, 1=OrderBook, 2=FeeVault, 3=Funding)
     * @return implementation Implementation address
     */
    function _getPodImplementation(uint256 podType) internal view returns (address) {
        // Query PodDeployer for implementation addresses
        return IPodDeployer(podDeployer).getPodImplementation(podType);
    }

    // ============ Emergency Control ============

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
