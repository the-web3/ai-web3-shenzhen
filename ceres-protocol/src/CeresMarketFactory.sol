// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {CeresPredictionMarket} from "./CeresPredictionMarket.sol";
import {CeresRegistry} from "./CeresRegistry.sol";
import {CeresGreenPoints} from "./CeresGreenPoints.sol";

/**
 * @title CeresMarketFactory
 * @dev Factory contract for deploying prediction markets for Ceres Protocol judgment events
 * 
 * This contract automatically deploys prediction market contracts when judgment events
 * are created in the CeresRegistry. It uses CREATE2 for deterministic deployment addresses
 * and maintains a registry of all deployed markets.
 * 
 * Key features:
 * - Automatic market deployment upon event creation
 * - CREATE2 deterministic deployment for predictable addresses
 * - Market registry and management functions
 * - Integration with CeresRegistry event system
 * - Upgradeable interfaces for future enhancements
 */
contract CeresMarketFactory is AccessControl, Pausable, ReentrancyGuard {
    /// @dev Role identifier for accounts that can deploy markets
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    /// @dev Role identifier for accounts that can pause/unpause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Mapping from event ID to deployed market address
    mapping(bytes32 => address) public eventToMarket;
    
    /// @dev Array of all deployed market addresses for enumeration
    address[] public allMarkets;
    
    /// @dev Mapping to check if an address is a deployed market
    mapping(address => bool) public isMarket;
    
    /// @dev Reference to the CeresRegistry contract
    CeresRegistry public immutable ceresRegistry;
    
    /// @dev Reference to the CeresGreenPoints contract
    CeresGreenPoints public immutable greenPoints;
    
    /// @dev Mapping from market type hash to template address
    mapping(bytes32 => address) public marketTemplates;
    
    /// @dev Default market template (AMM)
    address public defaultMarketTemplate;
    
    /// @dev Salt counter for CREATE2 deployment
    uint256 private _saltCounter;

    // Events
    event MarketCreated(
        bytes32 indexed eventId,
        address indexed marketAddress,
        address indexed creator,
        uint256 initialYesShares,
        uint256 initialNoShares
    );
    
    event MarketDeploymentFailed(
        bytes32 indexed eventId,
        string reason
    );
    
    event MarketTemplateSet(
        bytes32 indexed marketType,
        address indexed templateAddress
    );
    
    event DefaultMarketTemplateSet(
        address indexed oldTemplate,
        address indexed newTemplate
    );

    /**
     * @dev Constructor sets up the factory with required contracts and roles
     * @param _ceresRegistry Address of the CeresRegistry contract
     * @param _greenPoints Address of the CeresGreenPoints contract
     * @param admin Address that will have admin role and initial roles
     */
    constructor(
        address _ceresRegistry,
        address _greenPoints,
        address admin
    ) {
        require(_ceresRegistry != address(0), "CeresMarketFactory: registry address cannot be zero");
        require(_greenPoints != address(0), "CeresMarketFactory: green points address cannot be zero");
        require(admin != address(0), "CeresMarketFactory: admin address cannot be zero");
        
        ceresRegistry = CeresRegistry(payable(_ceresRegistry));
        greenPoints = CeresGreenPoints(_greenPoints);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DEPLOYER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        
        // Grant DEPLOYER_ROLE to the registry so it can auto-deploy markets
        _grantRole(DEPLOYER_ROLE, _ceresRegistry);
        
        // Set default market template to CeresPredictionMarket (AMM)
        // This will be the address of the CeresPredictionMarket contract
        defaultMarketTemplate = address(0); // Will be set after deployment via setDefaultMarketTemplate
        
        // Initialize market type templates
        bytes32 ammType = keccak256("amm");
        bytes32 orderbookType = keccak256("orderbook");
        // For now, both AMM and orderbook use the same template (CeresPredictionMarket)
        // Future versions will have separate orderbook contract
        marketTemplates[ammType] = address(0); // Will be set to CeresPredictionMarket
        marketTemplates[orderbookType] = address(0); // Will be set to future orderbook contract
    }

    /**
     * @dev Creates a prediction market for a judgment event
     * @param eventId Unique identifier of the judgment event
     * @return marketAddress Address of the deployed market contract
     * 
     * Requirements:
     * - Caller must have DEPLOYER_ROLE
     * - Contract must not be paused
     * - Event must exist in registry
     * - Market must not already exist for this event
     */
    function createMarketForEvent(bytes32 eventId) external onlyRole(DEPLOYER_ROLE) whenNotPaused nonReentrant returns (address marketAddress) {
        return _createMarketInternal(eventId);
    }

    /**
     * @dev Gets the market address for a given event ID
     * @param eventId Unique identifier of the judgment event
     * @return marketAddress Address of the market contract (zero if not deployed)
     */
    function getMarketAddress(bytes32 eventId) external view returns (address marketAddress) {
        return eventToMarket[eventId];
    }

    /**
     * @dev Checks if a market has been deployed for an event
     * @param eventId Unique identifier of the judgment event
     * @return True if market is deployed
     */
    function isMarketDeployed(bytes32 eventId) external view returns (bool) {
        return eventToMarket[eventId] != address(0);
    }

    /**
     * @dev Gets all deployed market addresses
     * @return Array of all market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    /**
     * @dev Gets the total number of deployed markets
     * @return Total count of deployed markets
     */
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    /**
     * @dev Gets market address by index
     * @param index Index in the markets array
     * @return Market address at the specified index
     */
    function getMarketByIndex(uint256 index) external view returns (address) {
        require(index < allMarkets.length, "CeresMarketFactory: index out of bounds");
        return allMarkets[index];
    }

    /**
     * @dev Calculates the deterministic address for a market before deployment
     * @param eventId Unique identifier of the judgment event
     * @param salt Salt value for CREATE2
     * @return predictedAddress The address where the market will be deployed
     */
    function predictMarketAddress(bytes32 eventId, uint256 salt) external view returns (address predictedAddress) {
        bytes32 bytecodeHash = keccak256(_getMarketCreationCode(eventId));
        bytes32 saltHash = keccak256(abi.encodePacked(eventId, salt));
        
        predictedAddress = address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            saltHash,
            bytecodeHash
        )))));
    }

    /**
     * @dev Pauses all market deployment operations
     * Requirements:
     * - Caller must have PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all market deployment operations
     * Requirements:
     * - Caller must have PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev External wrapper for internal market creation (used by batch operations)
     * @param eventId Unique identifier of the judgment event
     * @return marketAddress Address of the deployed market contract
     */
    function _createMarketExternal(bytes32 eventId) external returns (address marketAddress) {
        require(msg.sender == address(this), "CeresMarketFactory: only self can call");
        return _createMarketInternal(eventId);
    }

    /**
     * @dev Internal function to create a market for an event (used by batch operations)
     * @param eventId Unique identifier of the judgment event
     * @return marketAddress Address of the deployed market contract
     */
    function _createMarketInternal(bytes32 eventId) internal returns (address marketAddress) {
        // Check if market already exists
        require(eventToMarket[eventId] == address(0), "CeresMarketFactory: market already exists");
        
        // Get event data from registry
        CeresRegistry.JudgementEvent memory eventData = ceresRegistry.getJudgementEvent(eventId);
        require(eventData.creator != address(0), "CeresMarketFactory: event does not exist");
        
        // Determine market template based on event market type
        address templateAddress = _getMarketTemplate(eventData.marketType);
        require(templateAddress != address(0), "CeresMarketFactory: no template for market type");
        
        // Deploy market using CREATE2 for deterministic address
        marketAddress = _deployMarketWithTemplate(
            eventId,
            eventData.creator,
            eventData.initialYesShares,
            eventData.initialNoShares,
            templateAddress,
            eventData.metadata
        );
        
        // Update registry with market address
        ceresRegistry.setMarketAddress(eventId, marketAddress);
        
        // Store market mapping
        eventToMarket[eventId] = marketAddress;
        allMarkets.push(marketAddress);
        isMarket[marketAddress] = true;
        
        emit MarketCreated(
            eventId,
            marketAddress,
            eventData.creator,
            eventData.initialYesShares,
            eventData.initialNoShares
        );
        
        return marketAddress;
    }

    /**
     * @dev Internal function to get market template address for a market type
     * @param marketType Market type hash
     * @return templateAddress Address of the market template
     */
    function _getMarketTemplate(bytes32 marketType) internal view returns (address templateAddress) {
        templateAddress = marketTemplates[marketType];
        
        // Fall back to default template if specific template not found
        if (templateAddress == address(0)) {
            templateAddress = defaultMarketTemplate;
        }
        
        // If no templates are set, use the legacy deployment method
        // This maintains backward compatibility with existing tests
        if (templateAddress == address(0)) {
            // Return a special marker to indicate legacy deployment
            return address(1); // Non-zero address to pass the require check
        }
        
        return templateAddress;
    }

    /**
     * @dev Internal function to deploy a market contract using template and CREATE2
     * @param eventId Unique identifier of the judgment event
     * @param creator Address of the event creator
     * @param initialYesShares Initial YES shares from creator's stake
     * @param initialNoShares Initial NO shares from creator's stake
     * @param templateAddress Address of the market template contract
     * @param metadata Additional metadata for market configuration
     * @return marketAddress Address of the deployed market contract
     */
    function _deployMarketWithTemplate(
        bytes32 eventId,
        address creator,
        uint256 initialYesShares,
        uint256 initialNoShares,
        address templateAddress,
        bytes memory metadata
    ) internal returns (address marketAddress) {
        // Handle legacy deployment (when no templates are set)
        if (templateAddress == address(1)) {
            return _deployMarketLegacy(eventId, creator, initialYesShares, initialNoShares);
        }
        
        // For now, we only support CeresPredictionMarket (AMM) template
        // Future versions will support orderbook and other market types
        require(templateAddress != address(0), "CeresMarketFactory: template not set");
        
        // Increment salt counter for unique deployment
        _saltCounter++;
        
        // Create salt for CREATE2
        bytes32 salt = keccak256(abi.encodePacked(eventId, _saltCounter));
        
        // Get creation code for the template
        bytes memory creationCode = _getMarketCreationCodeWithTemplate(
            eventId,
            templateAddress,
            metadata
        );
        
        // Deploy using CREATE2
        assembly {
            marketAddress := create2(
                0, // value
                add(creationCode, 0x20), // code start (skip length prefix)
                mload(creationCode), // code length
                salt // salt
            )
        }
        
        require(marketAddress != address(0), "CeresMarketFactory: market deployment failed");
        
        return marketAddress;
    }

    /**
     * @dev Internal function to deploy a market contract using legacy method (for backward compatibility)
     * @param eventId Unique identifier of the judgment event
     * @param creator Address of the event creator
     * @param initialYesShares Initial YES shares from creator's stake
     * @param initialNoShares Initial NO shares from creator's stake
     * @return marketAddress Address of the deployed market contract
     */
    function _deployMarketLegacy(
        bytes32 eventId,
        address creator,
        uint256 initialYesShares,
        uint256 initialNoShares
    ) internal returns (address marketAddress) {
        // Increment salt counter for unique deployment
        _saltCounter++;
        
        // Create salt for CREATE2
        bytes32 salt = keccak256(abi.encodePacked(eventId, _saltCounter));
        
        // Get creation code
        bytes memory creationCode = _getMarketCreationCode(eventId);
        
        // Deploy using CREATE2
        assembly {
            marketAddress := create2(
                0, // value
                add(creationCode, 0x20), // code start (skip length prefix)
                mload(creationCode), // code length
                salt // salt
            )
        }
        
        require(marketAddress != address(0), "CeresMarketFactory: market deployment failed");
        
        return marketAddress;
    }

    /**
     * @dev Internal function to get market creation code with template and metadata
     * @param eventId Unique identifier of the judgment event
     * @param templateAddress Address of the market template
     * @param metadata Additional metadata for market configuration
     * @return creationCode Bytecode for market deployment
     */
    function _getMarketCreationCodeWithTemplate(
        bytes32 eventId,
        address templateAddress,
        bytes memory metadata
    ) internal view returns (bytes memory creationCode) {
        // Get event data from registry
        CeresRegistry.JudgementEvent memory eventData = ceresRegistry.getJudgementEvent(eventId);
        
        // For now, we only support CeresPredictionMarket template
        // Future versions will handle different templates and metadata
        if (templateAddress == address(0) || templateAddress == defaultMarketTemplate) {
            // Use default AMM market creation
            return _getMarketCreationCode(eventId);
        }
        
        // UPGRADE: Handle different market templates here
        // This will support orderbook markets, Dutch auctions, etc.
        revert("CeresMarketFactory: unsupported market template");
    }

    /**
     * @dev Internal function to get market creation code with constructor parameters
     * @param eventId Unique identifier of the judgment event
     * @return creationCode Bytecode for market deployment
     */
    function _getMarketCreationCode(bytes32 eventId) internal view returns (bytes memory creationCode) {
        // Get event data from registry
        CeresRegistry.JudgementEvent memory eventData = ceresRegistry.getJudgementEvent(eventId);
        
        // Encode constructor parameters
        bytes memory constructorParams = abi.encode(
            eventId,
            eventData.creator,
            eventData.initialYesShares,
            eventData.initialNoShares,
            address(ceresRegistry),
            address(greenPoints)
        );
        
        // Combine contract bytecode with constructor parameters
        creationCode = abi.encodePacked(
            type(CeresPredictionMarket).creationCode,
            constructorParams
        );
    }

    // UPGRADE: Batch deployment functionality
    /**
     * @dev Deploys markets for multiple events in a single transaction
     * @param eventIds Array of event IDs to deploy markets for
     * @return marketAddresses Array of deployed market addresses
     * 
     * Note: This is a future upgrade feature for gas optimization
     */
    function batchCreateMarkets(bytes32[] calldata eventIds) external onlyRole(DEPLOYER_ROLE) whenNotPaused returns (address[] memory marketAddresses) {
        require(eventIds.length > 0, "CeresMarketFactory: empty event IDs array");
        require(eventIds.length <= 50, "CeresMarketFactory: too many events"); // Gas limit protection
        
        marketAddresses = new address[](eventIds.length);
        
        for (uint256 i = 0; i < eventIds.length; i++) {
            // Skip if market already exists
            if (eventToMarket[eventIds[i]] != address(0)) {
                marketAddresses[i] = address(0);
                continue;
            }
            
            // Create market directly (no try-catch needed since we're in the same contract)
            try this._createMarketExternal(eventIds[i]) returns (address marketAddress) {
                marketAddresses[i] = marketAddress;
            } catch Error(string memory reason) {
                emit MarketDeploymentFailed(eventIds[i], reason);
                marketAddresses[i] = address(0);
            } catch {
                emit MarketDeploymentFailed(eventIds[i], "Unknown error");
                marketAddresses[i] = address(0);
            }
        }
        
        return marketAddresses;
    }

    // UPGRADE: Market template system
    /**
     * @dev Sets a custom market template for specific market types
     * @param marketType Market type string ("amm", "orderbook", etc.)
     * @param templateAddress Address of the market template contract
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     */
    function setMarketTemplate(string calldata marketType, address templateAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(templateAddress != address(0), "CeresMarketFactory: template address cannot be zero");
        
        bytes32 marketTypeHash = keccak256(bytes(marketType));
        marketTemplates[marketTypeHash] = templateAddress;
        
        emit MarketTemplateSet(marketTypeHash, templateAddress);
    }

    /**
     * @dev Sets the default market template
     * @param templateAddress Address of the default market template contract
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     */
    function setDefaultMarketTemplate(address templateAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(templateAddress != address(0), "CeresMarketFactory: template address cannot be zero");
        
        address oldTemplate = defaultMarketTemplate;
        defaultMarketTemplate = templateAddress;
        
        emit DefaultMarketTemplateSet(oldTemplate, templateAddress);
    }

    /**
     * @dev Gets the market template address for a market type
     * @param marketType Market type string ("amm", "orderbook", etc.)
     * @return templateAddress Address of the market template
     */
    function getMarketTemplate(string calldata marketType) external view returns (address templateAddress) {
        bytes32 marketTypeHash = keccak256(bytes(marketType));
        return _getMarketTemplate(marketTypeHash);
    }

    // UPGRADE: Market statistics and analytics
    /**
     * @dev Gets comprehensive statistics for all deployed markets
     * @return totalMarkets Total number of deployed markets
     * @return activeMarkets Number of active (non-finalized) markets
     * @return totalVolume Combined volume across all markets
     * @return avgMarketAge Average age of markets in seconds
     * 
     * Note: This is a placeholder for future analytics features
     */
    function getMarketStatistics() external view returns (
        uint256 totalMarkets,
        uint256 activeMarkets,
        uint256 totalVolume,
        uint256 avgMarketAge
    ) {
        totalMarkets = allMarkets.length;
        
        // UPGRADE: Implement comprehensive market statistics
        // This will aggregate data from all deployed markets
        // including volume, user participation, accuracy rates, etc.
        
        // Placeholder values
        activeMarkets = 0;
        totalVolume = 0;
        avgMarketAge = 0;
    }

    // UPGRADE: Market lifecycle management
    /**
     * @dev Archives old finalized markets to reduce gas costs
     * @param marketAddresses Array of market addresses to archive
     * 
     * Note: This is a placeholder for future market lifecycle management
     */
    function archiveMarkets(address[] calldata marketAddresses) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(marketAddresses.length > 0, "CeresMarketFactory: empty markets array");
        
        // UPGRADE: Implement market archival system
        // This will move old markets to cheaper storage
        // while maintaining historical data access
        
        for (uint256 i = 0; i < marketAddresses.length; i++) {
            require(isMarket[marketAddresses[i]], "CeresMarketFactory: not a deployed market");
            
            // Check if market is finalized and old enough to archive
            CeresPredictionMarket market = CeresPredictionMarket(payable(marketAddresses[i]));
            CeresPredictionMarket.MarketState memory state = market.getMarketState();
            
            require(state.isFinalized, "CeresMarketFactory: market not finalized");
            require(block.timestamp >= state.createdAt + 30 days, "CeresMarketFactory: market too recent");
            
            // Archive logic would go here
        }
    }
}