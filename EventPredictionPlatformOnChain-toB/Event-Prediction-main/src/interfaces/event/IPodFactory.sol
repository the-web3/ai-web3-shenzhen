// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title IPodFactory
 * @notice Interface for the PodFactory contract
 * @dev Manages vendor registration and pod set queries
 */
interface IPodFactory {
    // ============ Structs ============

    /**
     * @notice Complete pod set for a vendor
     * @param eventPod Address of the EventPod
     * @param orderBookPod Address of the OrderBookPod
     * @param feeVaultPod Address of the FeeVaultPod
     * @param fundingPod Address of the FundingPod
     */
    struct VendorPodSet {
        address eventPod;
        address orderBookPod;
        address feeVaultPod;
        address fundingPod;
    }

    /**
     * @notice Vendor information
     * @param vendorId Unique vendor identifier
     * @param vendorAddress Vendor's address
     * @param feeRecipient Address to receive fees
     * @param isActive Whether vendor is active
     * @param podSet Pod addresses for this vendor
     */
    struct VendorInfo {
        uint256 vendorId;
        address vendorAddress;
        address feeRecipient;
        bool isActive;
        VendorPodSet podSet;
    }

    // ============ Events ============

    /// @notice Emitted when a vendor is registered
    event VendorRegistered(
        uint256 indexed vendorId,
        address indexed vendorAddress,
        address feeRecipient,
        VendorPodSet podSet
    );

    /// @notice Emitted when a vendor is activated
    event VendorActivated(uint256 indexed vendorId);

    /// @notice Emitted when a vendor is deactivated
    event VendorDeactivated(uint256 indexed vendorId);

    /// @notice Emitted when PodDeployer is set
    event PodDeployerSet(address indexed podDeployer);

    // ============ Errors ============

    error InvalidVendorAddress();
    error InvalidFeeRecipient();
    error VendorAlreadyRegistered();
    error VendorNotFound();
    error VendorNotActive();
    error InvalidPodDeployer();
    error PodDeployerAlreadySet();

    // ============ Functions ============

    /**
     * @notice Register a new vendor and deploy their pod set
     * @param vendorAddress Address of the vendor
     * @param feeRecipient Address to receive fees
     * @return vendorId The assigned vendor ID
     */
    function registerVendor(address vendorAddress, address feeRecipient) external returns (uint256 vendorId);

    /**
     * @notice Get vendor's pod set
     * @param vendorId Vendor ID
     * @return podSet The vendor's pod addresses
     */
    function getVendorPodSet(uint256 vendorId) external view returns (VendorPodSet memory podSet);

    /**
     * @notice Get complete vendor information
     * @param vendorId Vendor ID
     * @return vendorInfo Complete vendor information
     */
    function getVendorInfo(uint256 vendorId) external view returns (VendorInfo memory vendorInfo);

    /**
     * @notice Check if vendor exists and is active
     * @param vendorId Vendor ID
     * @return isActive Whether vendor is active
     */
    function isVendorActive(uint256 vendorId) external view returns (bool isActive);

    /**
     * @notice Activate a vendor
     * @param vendorId Vendor ID
     */
    function activateVendor(uint256 vendorId) external;

    /**
     * @notice Deactivate a vendor
     * @param vendorId Vendor ID
     */
    function deactivateVendor(uint256 vendorId) external;

    /**
     * @notice Set the PodDeployer contract address
     * @param podDeployer Address of PodDeployer contract
     */
    function setPodDeployer(address podDeployer) external;

    /**
     * @notice Get the next vendor ID
     * @return nextId Next vendor ID
     */
    function getNextVendorId() external view returns (uint256 nextId);
}
