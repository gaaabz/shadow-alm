// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ShadowALM.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolAddress = vm.envOr("SHADOW_POOL_ADDRESS", address(0x2c13383855377faf5a562f1aef47e4be7a0f12ac));
        address positionManager = vm.envOr("POSITION_MANAGER_ADDRESS", address(0xC36442b4a4522E871399CD717aBDD847Ab11FE88)); // Uniswap V3 NonfungiblePositionManager
        
        vm.startBroadcast(deployerPrivateKey);
        
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying ShadowALM...");
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        ShadowALM shadowALM = new ShadowALM(
            poolAddress,
            positionManager,
            deployer // Initial executor
        );
        
        console.log("ShadowALM deployed to:", address(shadowALM));
        console.log("Pool address:", poolAddress);
        console.log("Executor:", deployer);
        
        vm.stopBroadcast();
    }
}