// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./PodDeployerStorage.sol";
import "../pod/EventPod.sol";
import "../pod/OrderBookPod.sol";
import "../pod/FeeVaultPod.sol";
import "../pod/FundingPod.sol";

/**
 * @title PodDeployer
 * @notice Deploys pod sets using CREATE2 for deterministic addresses
 * @dev Uses minimal proxy pattern (EIP-1167) for gas-efficient deployment
 */
contract PodDeployer is Initializable, OwnableUpgradeable, PodDeployerStorage {
    // ============ Constructor & Initializer ============

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize contract
     * @param _initialOwner Initial owner address
     * @param _eventManager EventManager address
     * @param _orderBookManager OrderBookManager address
     * @param _feeVaultManager FeeVaultManager address
     * @param _fundingManager FundingManager address
     */
    function initialize(
        address _initialOwner,
        address _eventManager,
        address _orderBookManager,
        address _feeVaultManager,
        address _fundingManager
    ) external initializer {
        __Ownable_init(_initialOwner);

        require(_eventManager != address(0), "PodDeployer: invalid eventManager");
        require(_orderBookManager != address(0), "PodDeployer: invalid orderBookManager");
        require(_feeVaultManager != address(0), "PodDeployer: invalid feeVaultManager");
        require(_fundingManager != address(0), "PodDeployer: invalid fundingManager");

        eventManager = _eventManager;
        orderBookManager = _orderBookManager;
        feeVaultManager = _feeVaultManager;
        fundingManager = _fundingManager;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the implementation contract for a pod type
     * @param podType Pod type identifier (0=Event, 1=OrderBook, 2=FeeVault, 3=Funding)
     * @param implementation Implementation contract address
     */
    function setPodImplementation(uint256 podType, address implementation) external onlyOwner {
        if (implementation == address(0)) revert InvalidImplementation();
        if (podType > POD_TYPE_FUNDING) revert InvalidPodType();

        podImplementations[podType] = implementation;
        emit PodImplementationSet(_getPodTypeName(podType), implementation);
    }

    // ============ Deployment Functions ============

    /**
     * @notice Deploy EventPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param _eventManager EventManager address
     * @param _orderBookManager OrderBookManager address
     * @return eventPod The deployed EventPod address
     */
    function deployEventPod(
        uint256 vendorId,
        address vendorAddress,
        address _eventManager,
        address _orderBookManager
    ) external onlyOwner returns (address eventPod) {
        if (vendorId == 0) revert InvalidVendorId();
        require(podImplementations[POD_TYPE_EVENT] != address(0), "PodDeployer: EventPod implementation not set");

        // Deploy using CREATE2
        bytes32 salt = _generateSalt(vendorId, POD_TYPE_EVENT);
        eventPod = Clones.cloneDeterministic(podImplementations[POD_TYPE_EVENT], salt);

        // Initialize
        EventPod(payable(eventPod)).initialize(vendorAddress, vendorId, _eventManager, _orderBookManager);

        emit PodDeployed(vendorId, POD_TYPE_EVENT, eventPod);
        return eventPod;
    }

    /**
     * @notice Deploy OrderBookPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param eventPod EventPod address
     * @param fundingPod FundingPod address
     * @param feeVaultPod FeeVaultPod address
     * @param _orderBookManager OrderBookManager address
     * @return orderBookPod The deployed OrderBookPod address
     */
    function deployOrderBookPod(
        uint256 vendorId,
        address vendorAddress,
        address eventPod,
        address fundingPod,
        address feeVaultPod,
        address _orderBookManager
    ) external onlyOwner returns (address orderBookPod) {
        if (vendorId == 0) revert InvalidVendorId();
        require(
            podImplementations[POD_TYPE_ORDERBOOK] != address(0),
            "PodDeployer: OrderBookPod implementation not set"
        );

        // Deploy using CREATE2
        bytes32 salt = _generateSalt(vendorId, POD_TYPE_ORDERBOOK);
        orderBookPod = Clones.cloneDeterministic(podImplementations[POD_TYPE_ORDERBOOK], salt);

        // Initialize
        OrderBookPod(payable(orderBookPod)).initialize(
            vendorAddress,
            eventPod,
            fundingPod,
            feeVaultPod,
            _orderBookManager
        );

        emit PodDeployed(vendorId, POD_TYPE_ORDERBOOK, orderBookPod);
        return orderBookPod;
    }

    /**
     * @notice Deploy FundingPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param _fundingManager FundingManager address
     * @param orderBookPod OrderBookPod address
     * @param eventPod EventPod address
     * @return fundingPod The deployed FundingPod address
     */
    function deployFundingPod(
        uint256 vendorId,
        address vendorAddress,
        address _fundingManager,
        address orderBookPod,
        address eventPod
    ) external onlyOwner returns (address fundingPod) {
        if (vendorId == 0) revert InvalidVendorId();
        require(podImplementations[POD_TYPE_FUNDING] != address(0), "PodDeployer: FundingPod implementation not set");

        // Deploy using CREATE2
        bytes32 salt = _generateSalt(vendorId, POD_TYPE_FUNDING);
        fundingPod = Clones.cloneDeterministic(podImplementations[POD_TYPE_FUNDING], salt);

        // Initialize
        FundingPod(payable(fundingPod)).initialize(vendorAddress, _fundingManager, orderBookPod, eventPod);

        emit PodDeployed(vendorId, POD_TYPE_FUNDING, fundingPod);
        return fundingPod;
    }

    /**
     * @notice Deploy FeeVaultPod for a vendor using CREATE2
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param _feeVaultManager FeeVaultManager address
     * @param orderBookPod OrderBookPod address
     * @param feeRecipient Fee recipient address
     * @return feeVaultPod The deployed FeeVaultPod address
     */
    function deployFeeVaultPod(
        uint256 vendorId,
        address vendorAddress,
        address _feeVaultManager,
        address orderBookPod,
        address feeRecipient
    ) external onlyOwner returns (address feeVaultPod) {
        if (vendorId == 0) revert InvalidVendorId();
        require(podImplementations[POD_TYPE_FEEVAULT] != address(0), "PodDeployer: FeeVaultPod implementation not set");

        // Deploy using CREATE2
        bytes32 salt = _generateSalt(vendorId, POD_TYPE_FEEVAULT);
        feeVaultPod = Clones.cloneDeterministic(podImplementations[POD_TYPE_FEEVAULT], salt);

        // Initialize
        FeeVaultPod(payable(feeVaultPod)).initialize(vendorAddress, _feeVaultManager, orderBookPod, feeRecipient);

        emit PodDeployed(vendorId, POD_TYPE_FEEVAULT, feeVaultPod);
        return feeVaultPod;
    }

    /**
     * @notice Deploy a complete pod set for a vendor using CREATE2 (legacy/convenience function)
     * @param vendorId Vendor ID
     * @param vendorAddress Vendor's address
     * @param feeRecipient Fee recipient address
     * @return podSet The deployed pod addresses
     */
    function deployPodSet(
        uint256 vendorId,
        address vendorAddress,
        address feeRecipient
    ) external onlyOwner returns (IPodFactory.VendorPodSet memory podSet) {
        if (vendorId == 0) revert InvalidVendorId();
        if (vendorPodSetDeployed[vendorId]) revert PodSetAlreadyDeployed();

        // Validate implementations are set
        require(podImplementations[POD_TYPE_EVENT] != address(0), "PodDeployer: EventPod implementation not set");
        require(
            podImplementations[POD_TYPE_ORDERBOOK] != address(0),
            "PodDeployer: OrderBookPod implementation not set"
        );
        require(podImplementations[POD_TYPE_FEEVAULT] != address(0), "PodDeployer: FeeVaultPod implementation not set");
        require(podImplementations[POD_TYPE_FUNDING] != address(0), "PodDeployer: FundingPod implementation not set");

        // Deploy EventPod
        bytes32 eventSalt = _generateSalt(vendorId, POD_TYPE_EVENT);
        address payable eventPod = payable(Clones.cloneDeterministic(podImplementations[POD_TYPE_EVENT], eventSalt));
        EventPod(eventPod).initialize(vendorAddress, vendorId, eventManager, orderBookManager);

        // Deploy OrderBookPod
        bytes32 orderBookSalt = _generateSalt(vendorId, POD_TYPE_ORDERBOOK);
        address payable orderBookPod = payable(
            Clones.cloneDeterministic(podImplementations[POD_TYPE_ORDERBOOK], orderBookSalt)
        );
        // Note: OrderBookPod needs eventPod, fundingPod, feeVaultPod - we'll set them after all are deployed

        // Deploy FeeVaultPod
        bytes32 feeVaultSalt = _generateSalt(vendorId, POD_TYPE_FEEVAULT);
        address payable feeVaultPod = payable(
            Clones.cloneDeterministic(podImplementations[POD_TYPE_FEEVAULT], feeVaultSalt)
        );
        FeeVaultPod(feeVaultPod).initialize(vendorAddress, feeVaultManager, orderBookPod, feeRecipient);

        // Deploy FundingPod
        bytes32 fundingSalt = _generateSalt(vendorId, POD_TYPE_FUNDING);
        address payable fundingPod = payable(
            Clones.cloneDeterministic(podImplementations[POD_TYPE_FUNDING], fundingSalt)
        );
        FundingPod(fundingPod).initialize(vendorAddress, fundingManager, orderBookPod, eventPod);

        // Now initialize OrderBookPod with all dependencies
        OrderBookPod(orderBookPod).initialize(vendorAddress, eventPod, fundingPod, feeVaultPod, orderBookManager);

        // Mark as deployed
        vendorPodSetDeployed[vendorId] = true;

        // Construct pod set
        podSet = IPodFactory.VendorPodSet({
            eventPod: eventPod,
            orderBookPod: orderBookPod,
            feeVaultPod: feeVaultPod,
            fundingPod: fundingPod
        });

        emit PodSetDeployed(vendorId, eventPod, orderBookPod, feeVaultPod, fundingPod);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate the deterministic address for a pod
     * @param vendorId Vendor ID
     * @param podType Pod type identifier (0=Event, 1=OrderBook, 2=FeeVault, 3=Funding)
     * @return predictedAddress The predicted pod address
     */
    function predictPodAddress(uint256 vendorId, uint256 podType) external view returns (address predictedAddress) {
        if (podType > POD_TYPE_FUNDING) revert InvalidPodType();

        address implementation = podImplementations[podType];
        if (implementation == address(0)) revert InvalidImplementation();

        bytes32 salt = _generateSalt(vendorId, podType);
        return Clones.predictDeterministicAddress(implementation, salt);
    }

    /**
     * @notice Get the implementation contract for a pod type
     * @param podType Pod type identifier
     * @return implementation Implementation contract address
     */
    function getPodImplementation(uint256 podType) external view returns (address implementation) {
        if (podType > POD_TYPE_FUNDING) revert InvalidPodType();
        return podImplementations[podType];
    }

    /**
     * @notice Get EventPod implementation address
     * @return implementation EventPod implementation address
     */
    function eventPodImplementation() external view returns (address) {
        return podImplementations[POD_TYPE_EVENT];
    }

    /**
     * @notice Get OrderBookPod implementation address
     * @return implementation OrderBookPod implementation address
     */
    function orderBookPodImplementation() external view returns (address) {
        return podImplementations[POD_TYPE_ORDERBOOK];
    }

    /**
     * @notice Get FundingPod implementation address
     * @return implementation FundingPod implementation address
     */
    function fundingPodImplementation() external view returns (address) {
        return podImplementations[POD_TYPE_FUNDING];
    }

    /**
     * @notice Get FeeVaultPod implementation address
     * @return implementation FeeVaultPod implementation address
     */
    function feeVaultPodImplementation() external view returns (address) {
        return podImplementations[POD_TYPE_FEEVAULT];
    }

    // ============ Internal Functions ============

    /**
     * @notice Generate salt for CREATE2 deployment
     * @param vendorId Vendor ID
     * @param podType Pod type identifier
     * @return salt The generated salt
     */
    function _generateSalt(uint256 vendorId, uint256 podType) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(vendorId, podType));
    }

    /**
     * @notice Get pod type name for events
     * @param podType Pod type identifier
     * @return name Pod type name
     */
    function _getPodTypeName(uint256 podType) internal pure returns (string memory) {
        if (podType == POD_TYPE_EVENT) return "EventPod";
        if (podType == POD_TYPE_ORDERBOOK) return "OrderBookPod";
        if (podType == POD_TYPE_FEEVAULT) return "FeeVaultPod";
        if (podType == POD_TYPE_FUNDING) return "FundingPod";
        revert InvalidPodType();
    }
}
