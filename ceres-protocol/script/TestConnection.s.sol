// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "@forge-std/Script.sol";
import {console} from "@forge-std/console.sol";

/**
 * @title TestConnection
 * @dev Script to test connection to Hashkey Chain testnet
 */
contract TestConnection is Script {
    function run() external view {
        console.log("Testing Hashkey Chain Testnet Connection...");
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("Block Timestamp:", block.timestamp);
        console.log("Gas Limit:", block.gaslimit);
        
        if (block.chainid == 133) {
            console.log("Successfully connected to Hashkey Chain Testnet!");
        } else {
            console.log("Not connected to Hashkey Chain Testnet (Chain ID should be 133)");
        }
    }
}