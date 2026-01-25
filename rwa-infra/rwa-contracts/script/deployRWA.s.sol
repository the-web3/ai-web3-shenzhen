// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Vm.sol";
import {console, Script} from "forge-std/Script.sol";

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";

import {EmptyContract} from "../src/utils/EmptyContract.sol";
import {RWA1155} from "../src/rwa/RWA1155.sol";
import {RWAManager} from "../src/rwa/RWAManager.sol";

/// @notice Deploy RWA demo contracts using the same TransparentUpgradeableProxy pattern as oracle scripts.
/// @dev Env vars:
/// - PRIVATE_KEY (uint)
/// - ADMIN (address) optional; default = deployer
/// - ISSUER (address) optional; default = deployer
/// - COMPLIANCE (address) optional; default = deployer
/// - BASE_URI (string) optional; default = "ipfs://base/"
/// - TOKEN_NAME (string) optional; default = "RWA Baijiu"
/// - TOKEN_SYMBOL (string) optional; default = "RWAJ"
/// - ORACLE_POD (address) required (oracle project's deployed OraclePod)
/// - TOKEN_ID_1 (uint) optional; default = 1
/// - TOKEN_ID_2 (uint) optional; default = 2
/// - TOKEN1_DISPLAY_NAME (string) optional
/// - TOKEN2_DISPLAY_NAME (string) optional
/// - UNIT (string) optional; default = "bottle"
/// - MAX_AGE (uint) optional; default = 3600
contract deployRWAScript is Script {
    EmptyContract public emptyContract;

    ProxyAdmin public managerProxyAdmin;
    RWAManager public manager; // proxy-cast
    RWAManager public managerImplementation;

    RWA1155 public rwa1155;

    struct Config {
        uint256 deployerPrivateKey;
        address deployer;
        address admin;
        address issuer;
        address compliance;
        address oraclePod;
        string baseURI;
        string tokenName;
        string tokenSymbol;
        uint256 tokenId1;
        uint256 tokenId2;
        string token1Name;
        string token2Name;
        string unit;
        uint256 maxAge;
    }

    function run() public {
        Config memory cfg = _loadConfig();
        _deploy(cfg);
    }

    function _loadConfig() internal view returns (Config memory cfg) {
        cfg.deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        cfg.deployer = vm.addr(cfg.deployerPrivateKey);

        cfg.admin = _envAddressOr("ADMIN", cfg.deployer);
        cfg.issuer = _envAddressOr("ISSUER", cfg.deployer);
        cfg.compliance = _envAddressOr("COMPLIANCE", cfg.deployer);

        cfg.oraclePod = vm.envAddress("ORACLE_POD");

        cfg.baseURI = _envStringOr("BASE_URI", "ipfs://base/");
        cfg.tokenName = _envStringOr("TOKEN_NAME", "RWA Baijiu");
        cfg.tokenSymbol = _envStringOr("TOKEN_SYMBOL", "RWAJ");

        cfg.tokenId1 = _envUintOr("TOKEN_ID_1", 1);
        cfg.tokenId2 = _envUintOr("TOKEN_ID_2", 2);

        cfg.token1Name = _envStringOr("TOKEN1_DISPLAY_NAME", "Feitian_2023Batch");
        cfg.token2Name = _envStringOr("TOKEN2_DISPLAY_NAME", "Feitian_2024Batch");
        cfg.unit = _envStringOr("UNIT", "bottle");
        cfg.maxAge = _envUintOr("MAX_AGE", 3600);
    }

    function _deploy(Config memory cfg) internal {
        vm.startBroadcast(cfg.deployerPrivateKey);

        // 1) Deploy token (non-upgradeable)
        rwa1155 = new RWA1155(cfg.tokenName, cfg.tokenSymbol, cfg.baseURI, cfg.admin);

        // 2) Deploy placeholder + proxy + implementation, then upgradeAndCall(initialize)
        emptyContract = new EmptyContract();
        TransparentUpgradeableProxy proxyManager = new TransparentUpgradeableProxy(address(emptyContract), cfg.deployer, "");
        manager = RWAManager(address(proxyManager));
        managerImplementation = new RWAManager();

        managerProxyAdmin = ProxyAdmin(_getProxyAdminAddress(address(proxyManager)));

        managerProxyAdmin.upgradeAndCall(
            ITransparentUpgradeableProxy(address(proxyManager)),
            address(managerImplementation),
            abi.encodeWithSelector(RWAManager.initialize.selector, cfg.admin, cfg.issuer, cfg.compliance, address(rwa1155))
        );

        // 3) Grant MINTER_ROLE to manager (proxy address)
        rwa1155.grantRole(rwa1155.MINTER_ROLE(), address(proxyManager));

        // 4) Configure demo tokenIds
        manager.configureToken(cfg.tokenId1, cfg.token1Name, cfg.unit, cfg.oraclePod, cfg.maxAge);
        manager.configureToken(cfg.tokenId2, cfg.token2Name, cfg.unit, cfg.oraclePod, cfg.maxAge);

        console.log("deploy RWA1155:", address(rwa1155));
        console.log("deploy RWAManager proxy:", address(proxyManager));
        console.log("deploy RWAManager impl:", address(managerImplementation));
        console.log("deploy RWAManager proxyAdmin:", address(managerProxyAdmin));

        _writeAddresses(cfg, address(proxyManager));

        vm.stopBroadcast();
    }

    function _writeAddresses(Config memory cfg, address managerProxy) internal {
        string memory path = "deployed_addresses.json";
        string memory data = string(
            abi.encodePacked(
                "{",
                '"rwa1155":"', vm.toString(address(rwa1155)), '",',
                '"rwaManagerProxy":"', vm.toString(managerProxy), '",',
                '"rwaManagerImplementation":"', vm.toString(address(managerImplementation)), '",',
                '"rwaManagerProxyAdmin":"', vm.toString(address(managerProxyAdmin)), '",',
                '"oraclePod":"', vm.toString(cfg.oraclePod), '",',
                '"tokenId1":', vm.toString(cfg.tokenId1), ",",
                '"tokenId2":', vm.toString(cfg.tokenId2),
                "}"
            )
        );
        vm.writeJson(data, path);
    }

    function _getProxyAdminAddress(address proxy) internal view returns (address) {
        address CHEATCODE_ADDRESS = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
        Vm vmCheat = Vm(CHEATCODE_ADDRESS);
        bytes32 adminSlot = vmCheat.load(proxy, ERC1967Utils.ADMIN_SLOT);
        return address(uint160(uint256(adminSlot)));
    }

    function _envAddressOr(string memory key, address fallbackValue) internal view returns (address) {
        try vm.envAddress(key) returns (address v) {
            return v;
        } catch {
            return fallbackValue;
        }
    }

    function _envUintOr(string memory key, uint256 fallbackValue) internal view returns (uint256) {
        try vm.envUint(key) returns (uint256 v) {
            return v;
        } catch {
            return fallbackValue;
        }
    }

    function _envStringOr(string memory key, string memory fallbackValue) internal view returns (string memory) {
        try vm.envString(key) returns (string memory v) {
            return v;
        } catch {
            return fallbackValue;
        }
    }
}

