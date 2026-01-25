// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./IPodFactory.sol";

/**
 * @title IPodDeployer
 * @notice Interface for the PodDeployer contract
 * @dev Deploys pod sets using CREATE2 for deterministic addresses
 */
interface IPodDeployer {
    // ============ Events ============

    /// @notice Emitted when a pod set is deployed
    event PodSetDeployed(
        uint256 indexed vendorId,
        address eventPod,
        address orderBookPod,
        address feeVaultPod,
        address fundingPod
    );

    /// @notice Emitted when an individual pod is deployed
    event PodDeployed(uint256 indexed vendorId, uint256 indexed podType, address pod);

    /// @notice Emitted when a pod implementation is set
    event PodImplementationSet(string indexed podType, address implementation);

    // ============ Errors ============

    error InvalidVendorId();
    error InvalidImplementation();
    error PodSetAlreadyDeployed();
    error DeploymentFailed();
    error InvalidPodType();

    // ============ Functions ============

    /**
     * @notice Deploy EventPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param eventManager EventManager address
     * @param orderBookManager OrderBookManager address
     * @return eventPod The deployed EventPod address
     */
    function deployEventPod(
        uint256 vendorId,
        address vendorAddress,
        address eventManager,
        address orderBookManager
    ) external returns (address eventPod);

    /**
     * @notice Deploy OrderBookPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param eventPod EventPod address
     * @param fundingPod FundingPod address
     * @param feeVaultPod FeeVaultPod address
     * @param orderBookManager OrderBookManager address
     * @return orderBookPod The deployed OrderBookPod address
     */
    function deployOrderBookPod(
        uint256 vendorId,
        address vendorAddress,
        address eventPod,
        address fundingPod,
        address feeVaultPod,
        address orderBookManager
    ) external returns (address orderBookPod);

    /**
     * @notice Deploy FundingPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param fundingManager FundingManager address
     * @param orderBookPod OrderBookPod address
     * @param eventPod EventPod address
     * @return fundingPod The deployed FundingPod address
     */
    function deployFundingPod(
        uint256 vendorId,
        address vendorAddress,
        address fundingManager,
        address orderBookPod,
        address eventPod
    ) external returns (address fundingPod);

    /**
     * @notice Deploy FeeVaultPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param feeVaultManager FeeVaultManager address
     * @param orderBookPod OrderBookPod address
     * @param feeRecipient Fee recipient address
     * @return feeVaultPod The deployed FeeVaultPod address
     */
    function deployFeeVaultPod(
        uint256 vendorId,
        address vendorAddress,
        address feeVaultManager,
        address orderBookPod,
        address feeRecipient
    ) external returns (address feeVaultPod);

    /**
     * @notice Deploy a complete pod set for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param feeRecipient Fee recipient address
     * @return podSet The deployed pod addresses
     */
    function deployPodSet(
        uint256 vendorId,
        address vendorAddress,
        address feeRecipient
    ) external returns (IPodFactory.VendorPodSet memory podSet);

    /**
     * @notice Calculate the deterministic address for a pod
     * @param vendorId Vendor ID
     * @param podType Pod type identifier (0=Event, 1=OrderBook, 2=FeeVault, 3=Funding)
     * @return predictedAddress The predicted pod address
     */
    function predictPodAddress(uint256 vendorId, uint256 podType) external view returns (address predictedAddress);

    /**
     * @notice Set the implementation contract for a pod type
     * @param podType Pod type identifier (0=Event, 1=OrderBook, 2=FeeVault, 3=Funding)
     * @param implementation Implementation contract address
     */
    function setPodImplementation(uint256 podType, address implementation) external;

    /**
     * @notice Get the implementation contract for a pod type
     * @param podType Pod type identifier
     * @return implementation Implementation contract address
     */
    function getPodImplementation(uint256 podType) external view returns (address implementation);

    /**
     * @notice Get EventPod implementation address
     * @return implementation EventPod implementation address
     */
    function eventPodImplementation() external view returns (address);

    /**
     * @notice Get OrderBookPod implementation address
     * @return implementation OrderBookPod implementation address
     */
    function orderBookPodImplementation() external view returns (address);

    /**
     * @notice Get FundingPod implementation address
     * @return implementation FundingPod implementation address
     */
    function fundingPodImplementation() external view returns (address);

    /**
     * @notice Get FeeVaultPod implementation address
     * @return implementation FeeVaultPod implementation address
     */
    function feeVaultPodImplementation() external view returns (address);
}
