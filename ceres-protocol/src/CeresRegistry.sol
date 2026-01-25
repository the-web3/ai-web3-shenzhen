// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {CeresGreenPoints} from "./CeresGreenPoints.sol";

/**
 * @dev Interface for CeresMarketFactory
 */
interface ICeresMarketFactory {
    function createMarketForEvent(bytes32 eventId) external returns (address marketAddress);
}

/**
 * @dev Interface for CeresPredictionMarket
 */
interface ICeresPredictionMarket {
    function finalize(bool outcome) external;
}

/**
 * @title CeresRegistry
 * @dev Core registry contract for Ceres Protocol judgment events
 * 
 * This contract manages the creation, registration, and resolution of judgment events.
 * Information providers stake HKTC tokens and provide initial liquidity for prediction markets.
 * 
 * Key features:
 * - Judgment event registration with stake validation
 * - Initial liquidity calculation and allocation
 * - Event resolution with reward distribution
 * - Integration with green points reward system
 * - Upgradeable interfaces for future enhancements
 */
contract CeresRegistry is AccessControl, Pausable, ReentrancyGuard {
    /// @dev Role identifier for accounts that can resolve events
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    
    /// @dev Role identifier for accounts that can pause/unpause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Economic model constants
    uint256 public constant MIN_STAKE = 0.1 ether; // 0.1 HKTC minimum stake
    uint256 public constant TRADING_FEE_BPS = 200; // 2% trading fee
    uint256 public constant CREATOR_REWARD_BPS = 2000; // 20% of trading fees to creator
    uint256 public constant GREEN_POINTS_REWARD = 100 * 10**18; // 100 green points reward
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500; // Maximum event description length
    uint256 public constant MIN_RESOLUTION_TIME = 1 hours; // Minimum time until resolution
    uint256 public constant MAX_RESOLUTION_TIME = 365 days; // Maximum time until resolution

    /**
     * @dev Structure representing a judgment event
     */
    struct JudgementEvent {
        address creator;                // Address of the information provider who created the event
        string description;             // Human-readable description of the judgment event
        uint256 stakeAmount;           // Amount of HKTC staked by the creator
        uint256 initialYesShares;      // Initial YES shares allocated to creator
        uint256 initialNoShares;       // Initial NO shares allocated to creator
        uint256 createdAt;             // Timestamp when event was created
        uint256 resolutionTime;        // Expected resolution timestamp
        bool isResolved;               // Whether the event has been resolved
        bool outcome;                  // Final outcome (true = YES, false = NO)
        address marketAddress;         // Address of the associated prediction market contract
        bytes32 marketType;            // Market type identifier (e.g., "amm", "orderbook")
        bytes metadata;                // Additional metadata for market configuration
    }

    /// @dev Mapping from event ID to judgment event data
    mapping(bytes32 => JudgementEvent) public judgementEvents;
    
    /// @dev Array of all event IDs for enumeration
    bytes32[] public eventIds;
    
    /// @dev Mapping to track creator's total staked amount
    mapping(address => uint256) public creatorTotalStake;
    
    /// @dev Mapping to track creator's correct predictions count
    mapping(address => uint256) public creatorCorrectPredictions;
    
    /// @dev Mapping to track creator's total predictions count
    mapping(address => uint256) public creatorTotalPredictions;

    /// @dev Reference to the green points contract
    CeresGreenPoints public immutable greenPoints;
    
    /// @dev Reference to the market factory contract
    address public marketFactory;
    
    /// @dev Oracle adapter for future upgrades (initially zero address)
    address public oracleAdapter;

    // Events
    event JudgementEventCreated(
        bytes32 indexed eventId,
        address indexed creator,
        string description,
        uint256 stakeAmount,
        uint256 initialYesShares,
        uint256 initialNoShares,
        uint256 resolutionTime
    );
    
    event JudgementEventResolved(
        bytes32 indexed eventId,
        bool outcome,
        address indexed creator,
        uint256 greenPointsAwarded
    );
    
    event CreatorRewardCalculated(
        bytes32 indexed eventId,
        address indexed creator,
        uint256 rewardAmount
    );
    
    event OracleAdapterSet(address indexed oldAdapter, address indexed newAdapter);
    
    event MarketFactorySet(address indexed oldFactory, address indexed newFactory);

    /**
     * @dev Constructor sets up the registry with required contracts and roles
     * @param _greenPoints Address of the CeresGreenPoints contract
     * @param admin Address that will have admin role and initial roles
     */
    constructor(address _greenPoints, address admin) {
        require(_greenPoints != address(0), "CeresRegistry: green points address cannot be zero");
        require(admin != address(0), "CeresRegistry: admin address cannot be zero");
        
        greenPoints = CeresGreenPoints(_greenPoints);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RESOLVER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Submits a new judgment event with stake and initial liquidity allocation
     * @param description Human-readable description of the judgment event
     * @param yesPrice Initial price for YES outcome (in wei, must sum to 1 ether with noPrice)
     * @param noPrice Initial price for NO outcome (in wei, must sum to 1 ether with yesPrice)
     * @param resolutionTime Expected timestamp for event resolution
     * @return eventId Unique identifier for the created event
     * 
     * Requirements:
     * - Contract must not be paused
     * - Stake amount must be at least MIN_STAKE
     * - Description must not be empty and within length limits
     * - Prices must sum to exactly 1 ether
     * - Resolution time must be within valid range
     */
    function submitJudgementEvent(
        string calldata description,
        uint256 yesPrice,
        uint256 noPrice,
        uint256 resolutionTime
    ) external payable whenNotPaused nonReentrant returns (bytes32 eventId) {
        return _submitJudgementEvent(
            description,
            yesPrice,
            noPrice,
            resolutionTime,
            "amm", // Default to AMM market type
            "" // Empty metadata
        );
    }

    /**
     * @dev Submits a new judgment event with market type specification (for AI agents)
     * @param description Human-readable description of the judgment event
     * @param yesPrice Initial price for YES outcome (in wei, must sum to 1 ether with noPrice)
     * @param noPrice Initial price for NO outcome (in wei, must sum to 1 ether with yesPrice)
     * @param resolutionTime Expected timestamp for event resolution
     * @param marketType Market type identifier ("amm" or "orderbook")
     * @param metadata Additional metadata for market configuration (encoded bytes)
     * @return eventId Unique identifier for the created event
     * 
     * Requirements:
     * - Same as submitJudgementEvent plus valid market type
     */
    function submitJudgementEventWithType(
        string calldata description,
        uint256 yesPrice,
        uint256 noPrice,
        uint256 resolutionTime,
        string calldata marketType,
        bytes calldata metadata
    ) external payable whenNotPaused nonReentrant returns (bytes32 eventId) {
        bytes32 marketTypeHash = keccak256(bytes(marketType));
        require(
            marketTypeHash == keccak256("amm") || marketTypeHash == keccak256("orderbook"),
            "CeresRegistry: invalid market type"
        );
        
        return _submitJudgementEvent(
            description,
            yesPrice,
            noPrice,
            resolutionTime,
            marketType,
            metadata
        );
    }

    /**
     * @dev Internal function to submit judgment event with all parameters
     */
    function _submitJudgementEvent(
        string calldata description,
        uint256 yesPrice,
        uint256 noPrice,
        uint256 resolutionTime,
        string memory marketType,
        bytes memory metadata
    ) internal returns (bytes32 eventId) {
        // Validate input parameters
        require(msg.value >= MIN_STAKE, "CeresRegistry: insufficient stake amount");
        require(bytes(description).length > 0, "CeresRegistry: description cannot be empty");
        require(bytes(description).length <= MAX_DESCRIPTION_LENGTH, "CeresRegistry: description too long");
        require(yesPrice + noPrice == 1 ether, "CeresRegistry: prices must sum to 1 ether");
        require(yesPrice > 0 && noPrice > 0, "CeresRegistry: prices must be positive");
        require(
            resolutionTime >= block.timestamp + MIN_RESOLUTION_TIME,
            "CeresRegistry: resolution time too early"
        );
        require(
            resolutionTime <= block.timestamp + MAX_RESOLUTION_TIME,
            "CeresRegistry: resolution time too late"
        );

        // Generate unique event ID
        eventId = keccak256(abi.encodePacked(
            msg.sender,
            description,
            block.timestamp,
            block.number,
            msg.value
        ));
        
        // Ensure event ID is unique
        require(judgementEvents[eventId].creator == address(0), "CeresRegistry: event ID collision");

        // Calculate initial share allocation based on prices
        (uint256 initialYesShares, uint256 initialNoShares) = _calculateInitialShares(
            msg.value,
            yesPrice,
            noPrice
        );

        // Create and store the judgment event
        judgementEvents[eventId] = JudgementEvent({
            creator: msg.sender,
            description: description,
            stakeAmount: msg.value,
            initialYesShares: initialYesShares,
            initialNoShares: initialNoShares,
            createdAt: block.timestamp,
            resolutionTime: resolutionTime,
            isResolved: false,
            outcome: false, // Default value, will be set upon resolution
            marketAddress: address(0), // Will be set by market factory
            marketType: keccak256(bytes(marketType)),
            metadata: metadata
        });

        // Add to event IDs array for enumeration
        eventIds.push(eventId);
        
        // Update creator statistics
        creatorTotalStake[msg.sender] += msg.value;
        creatorTotalPredictions[msg.sender] += 1;

        emit JudgementEventCreated(
            eventId,
            msg.sender,
            description,
            msg.value,
            initialYesShares,
            initialNoShares,
            resolutionTime
        );

        // Automatically deploy market if factory is set
        if (marketFactory != address(0)) {
            try ICeresMarketFactory(marketFactory).createMarketForEvent(eventId) {
                // Market deployed successfully
            } catch {
                // Market deployment failed, but event creation should still succeed
                // The market can be deployed manually later
            }
        }

        return eventId;
    }

    /**
     * @dev Resolves a judgment event and distributes rewards
     * @param eventId Unique identifier of the event to resolve
     * @param outcome Final outcome of the event (true = YES, false = NO)
     * 
     * Requirements:
     * - Caller must have RESOLVER_ROLE
     * - Event must exist and not be already resolved
     * - Current time must be past resolution time
     */
    function resolveEvent(bytes32 eventId, bool outcome) external onlyRole(RESOLVER_ROLE) whenNotPaused {
        JudgementEvent storage event_ = judgementEvents[eventId];
        
        require(event_.creator != address(0), "CeresRegistry: event does not exist");
        require(!event_.isResolved, "CeresRegistry: event already resolved");
        require(block.timestamp >= event_.resolutionTime, "CeresRegistry: resolution time not reached");

        // Mark event as resolved
        event_.isResolved = true;
        event_.outcome = outcome;
        
        // Determine if creator's initial judgment was correct
        // Creator is considered correct if their initial bias matched the outcome
        bool creatorWasCorrect = _wasCreatorCorrect(event_, outcome);
        
        if (creatorWasCorrect) {
            creatorCorrectPredictions[event_.creator] += 1;
        }

        // Award green points to the creator for participating
        greenPoints.mint(event_.creator, GREEN_POINTS_REWARD);

        emit JudgementEventResolved(eventId, outcome, event_.creator, GREEN_POINTS_REWARD);

        // Finalize the associated prediction market if it exists
        if (event_.marketAddress != address(0)) {
            try ICeresPredictionMarket(event_.marketAddress).finalize(outcome) {
                // Market finalized successfully
            } catch {
                // Market finalization failed, but event is still resolved
                // This could happen if market is already finalized or has other issues
            }
        }
    }

    /**
     * @dev Sets the market address for a judgment event (called by market factory)
     * @param eventId Unique identifier of the event
     * @param marketAddress Address of the deployed prediction market
     */
    function setMarketAddress(bytes32 eventId, address marketAddress) external {
        require(marketAddress != address(0), "CeresRegistry: market address cannot be zero");
        
        JudgementEvent storage event_ = judgementEvents[eventId];
        require(event_.creator != address(0), "CeresRegistry: event does not exist");
        require(event_.marketAddress == address(0), "CeresRegistry: market address already set");
        
        event_.marketAddress = marketAddress;
    }

    /**
     * @dev Gets judgment event data by ID
     * @param eventId Unique identifier of the event
     * @return JudgementEvent struct containing all event data
     */
    function getJudgementEvent(bytes32 eventId) external view returns (JudgementEvent memory) {
        require(judgementEvents[eventId].creator != address(0), "CeresRegistry: event does not exist");
        return judgementEvents[eventId];
    }

    /**
     * @dev Checks if an event is resolved
     * @param eventId Unique identifier of the event
     * @return True if event is resolved
     */
    function isEventResolved(bytes32 eventId) external view returns (bool) {
        return judgementEvents[eventId].isResolved;
    }

    /**
     * @dev Gets the total number of events
     * @return Total count of judgment events
     */
    function getEventCount() external view returns (uint256) {
        return eventIds.length;
    }

    /**
     * @dev Gets event ID by index
     * @param index Index in the events array
     * @return Event ID at the specified index
     */
    function getEventIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < eventIds.length, "CeresRegistry: index out of bounds");
        return eventIds[index];
    }

    /**
     * @dev Gets creator statistics
     * @param creator Address of the creator
     * @return totalStake Total amount staked by creator
     * @return totalPredictions Total number of predictions made
     * @return correctPredictions Number of correct predictions
     * @return accuracyRate Accuracy rate as a percentage (0-100)
     */
    function getCreatorStats(address creator) external view returns (
        uint256 totalStake,
        uint256 totalPredictions,
        uint256 correctPredictions,
        uint256 accuracyRate
    ) {
        totalStake = creatorTotalStake[creator];
        totalPredictions = creatorTotalPredictions[creator];
        correctPredictions = creatorCorrectPredictions[creator];
        
        if (totalPredictions > 0) {
            accuracyRate = (correctPredictions * 100) / totalPredictions;
        } else {
            accuracyRate = 0;
        }
    }

    /**
     * @dev Pauses all contract operations
     * Requirements:
     * - Caller must have PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all contract operations
     * Requirements:
     * - Caller must have PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Sets the market factory contract address
     * @param _marketFactory Address of the market factory contract
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     */
    function setMarketFactory(address _marketFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldFactory = marketFactory;
        marketFactory = _marketFactory;
        
        emit MarketFactorySet(oldFactory, _marketFactory);
    }

    // UPGRADE: Oracle integration functions
    /**
     * @dev Sets the oracle adapter for automated event resolution
     * @param _oracleAdapter Address of the oracle adapter contract
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     * 
     * Note: This is a future upgrade feature
     */
    function setOracleAdapter(address _oracleAdapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldAdapter = oracleAdapter;
        oracleAdapter = _oracleAdapter;
        
        emit OracleAdapterSet(oldAdapter, _oracleAdapter);
    }

    /**
     * @dev Requests oracle resolution for an event (future upgrade)
     * @param eventId Event to request resolution for
     * @param oracleData Additional data for oracle processing
     * 
     * Note: This is a placeholder for future oracle integration
     */
    function requestOracleResolution(bytes32 eventId, bytes calldata oracleData) external {
        require(oracleAdapter != address(0), "CeresRegistry: oracle adapter not set");
        require(judgementEvents[eventId].creator != address(0), "CeresRegistry: event does not exist");
        require(!judgementEvents[eventId].isResolved, "CeresRegistry: event already resolved");
        
        // UPGRADE: Implement oracle request logic
        // This will integrate with Chainlink Functions or other oracle services
    }

    /**
     * @dev Oracle callback function for automated resolution (future upgrade)
     * @param eventId Event being resolved
     * @param outcome Resolution outcome
     * @param proof Cryptographic proof of resolution validity
     * 
     * Note: This is a placeholder for future oracle integration
     */
    function oracleCallback(bytes32 eventId, bool outcome, bytes calldata proof) external {
        require(msg.sender == oracleAdapter, "CeresRegistry: unauthorized oracle callback");
        
        // UPGRADE: Implement oracle callback logic
        // This will verify proof and automatically resolve events
    }

    // UPGRADE: Dynamic stake calculation
    /**
     * @dev Calculates dynamic stake amount based on event complexity and creator history
     * @param description Event description for complexity analysis
     * @param creator Address of the event creator
     * @return requiredStake Calculated minimum stake amount
     * 
     * Note: This is a placeholder for future dynamic staking
     */
    function calculateDynamicStake(
        string calldata description,
        address creator
    ) external view returns (uint256 requiredStake) {
        // UPGRADE: Implement dynamic stake calculation
        // Factors to consider:
        // - Event description complexity (word count, technical terms)
        // - Creator's historical accuracy rate
        // - Market volatility
        // - Community importance voting
        
        // For now, return minimum stake
        return MIN_STAKE;
    }

    // UPGRADE: Refutation mechanism
    /**
     * @dev Submits a refutation event challenging an original judgment
     * @param originalEventId ID of the event being refuted
     * @param refutationReason Reason for the refutation
     * @return refutationId Unique ID for the refutation event
     * 
     * Note: This is a placeholder for future refutation mechanism
     */
    function submitRefutationEvent(
        bytes32 originalEventId,
        string calldata refutationReason
    ) external payable returns (bytes32 refutationId) {
        require(judgementEvents[originalEventId].creator != address(0), "CeresRegistry: original event does not exist");
        require(!judgementEvents[originalEventId].isResolved, "CeresRegistry: cannot refute resolved event");
        require(msg.value >= MIN_STAKE, "CeresRegistry: insufficient refutation stake");
        
        // UPGRADE: Implement refutation logic
        // This will create a competing judgment event with dispute resolution
        
        return bytes32(0); // Placeholder
    }

    /**
     * @dev Internal function to calculate initial share allocation
     * @param stakeAmount Total amount staked
     * @param yesPrice Price for YES outcome
     * @param noPrice Price for NO outcome
     * @return yesShares Number of YES shares allocated
     * @return noShares Number of NO shares allocated
     */
    function _calculateInitialShares(
        uint256 stakeAmount,
        uint256 yesPrice,
        uint256 noPrice
    ) internal pure returns (uint256 yesShares, uint256 noShares) {
        // Split stake based on prices - lower price means more shares
        // This reflects the creator's confidence in each outcome
        uint256 yesAllocation = (stakeAmount * noPrice) / 1 ether; // More allocation when YES price is low
        uint256 noAllocation = (stakeAmount * yesPrice) / 1 ether; // More allocation when NO price is low
        
        // Shares are simply the allocation amounts (1:1 ratio for simplicity)
        yesShares = yesAllocation;
        noShares = noAllocation;
    }

    /**
     * @dev Internal function to determine if creator's initial judgment was correct
     * @param event_ The judgment event
     * @param outcome The actual outcome
     * @return True if creator's bias matched the outcome
     */
    function _wasCreatorCorrect(
        JudgementEvent memory event_,
        bool outcome
    ) internal pure returns (bool) {
        // Creator is considered correct if they allocated more shares to the winning outcome
        if (outcome) {
            // YES outcome - creator was correct if they had more YES shares
            return event_.initialYesShares > event_.initialNoShares;
        } else {
            // NO outcome - creator was correct if they had more NO shares
            return event_.initialNoShares > event_.initialYesShares;
        }
    }

    /**
     * @dev Emergency withdrawal function (only in extreme circumstances)
     * @param to Address to send funds to
     * @param amount Amount to withdraw
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     * - Contract must be paused
     */
    function emergencyWithdraw(address payable to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        require(to != address(0), "CeresRegistry: cannot withdraw to zero address");
        require(amount <= address(this).balance, "CeresRegistry: insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "CeresRegistry: transfer failed");
    }

    /**
     * @dev Receive function to accept HKTC deposits
     */
    receive() external payable {
        // Allow contract to receive HKTC for staking
    }
}