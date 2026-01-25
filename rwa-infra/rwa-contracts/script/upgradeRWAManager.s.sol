// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Vm.sol";
import {console, Script} from "forge-std/Script.sol";

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";

import {RWAManager} from "../src/rwa/RWAManager.sol";

/// @notice Upgrade RWAManager implementation behind an existing TransparentUpgradeableProxy.
/// @dev Env vars:
/// - PRIVATE_KEY (uint)
/// - RWA_MANAGER_PROXY (address) required
contract upgradeRWAManagerScript is Script {
    address public RWA_MANAGER_PROXY = vm.envAddress("RWA_MANAGER_PROXY");

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("RWAManager Proxy:", RWA_MANAGER_PROXY);

        address proxyAdminAddress = _getProxyAdminAddress(RWA_MANAGER_PROXY);
        console.log("Calculated ProxyAdmin:", proxyAdminAddress);

        ProxyAdmin proxyAdmin = ProxyAdmin(proxyAdminAddress);

        vm.startBroadcast(deployerPrivateKey);

        RWAManager newImplementation = new RWAManager();
        console.log("New RWAManager implementation:", address(newImplementation));

        proxyAdmin.upgradeAndCall(ITransparentUpgradeableProxy(RWA_MANAGER_PROXY), address(newImplementation), "");

        console.log("Upgrade completed.");
        vm.stopBroadcast();
    }

    function _getProxyAdminAddress(address proxy) internal view returns (address) {
        address CHEATCODE_ADDRESS = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
        Vm vmCheat = Vm(CHEATCODE_ADDRESS);
        bytes32 adminSlot = vmCheat.load(proxy, ERC1967Utils.ADMIN_SLOT);
        return address(uint160(uint256(adminSlot)));
    }
}

