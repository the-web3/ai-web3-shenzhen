// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title ProxyHelper
 * @notice Helper contract for deploying ERC1967 proxies
 */
contract ProxyHelper is Script {
    /**
     * @notice Deploy an ERC1967 proxy pointing to an implementation
     * @param implementation Address of the implementation contract
     * @param initData Encoded initialization call data
     * @return proxy Address of the deployed proxy
     */
    function deployProxy(address implementation, bytes memory initData)
        internal
        returns (address proxy)
    {
        ERC1967Proxy proxyContract = new ERC1967Proxy(implementation, initData);
        return address(proxyContract);
    }
}
