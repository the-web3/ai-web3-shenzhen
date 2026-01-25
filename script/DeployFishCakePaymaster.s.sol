// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {FishCakePaymaster} from "../src/FishCakePaymaster.sol";

contract DeployFishCakePaymaster is Script {
    function run() external {
        // 1. 开启广播（Foundry 会自动关联你 --account 传入的地址）
        vm.startBroadcast();

        // 2. 部署 FishCakePaymaster
        // 因为你的 constructor() 是空的，所以这里不需要传任何参数
        FishCakePaymaster paymaster = new FishCakePaymaster();

        // 3. 打印合约地址，方便你在浏览器查看
        console.log("-----------------------------------------");
        console.log("FishCakePaymaster deployed to:", address(paymaster));
        console.log("Owner is:", msg.sender);
        console.log("EntryPoint is:", paymaster.ENTRY_POINT());
        console.log("-----------------------------------------");

        vm.stopBroadcast();
    }
}
