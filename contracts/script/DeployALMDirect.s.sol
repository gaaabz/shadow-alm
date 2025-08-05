// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../ShadowALMDirect.sol";

contract DeployALMDirect is Script {
    address constant POOL_ADDRESS = 0x2C13383855377faf5A562F1AeF47E4be7A0f12Ac;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DEPLOYING SHADOW ALM DIRECT ===");
        console.log("Deployer:", deployer);
        console.log("Pool Address:", POOL_ADDRESS);
        
        vm.startBroadcast(deployerPrivateKey);
        
        ShadowALMDirect alm = new ShadowALMDirect(
            POOL_ADDRESS,
            "Shadow ALM Direct",
            "sALM-D"
        );
        
        console.log("ShadowALMDirect deployed at:", address(alm));
        
        // Get pool info
        (address token0, address token1, int24 tickSpacing, int24 currentTick) = alm.getPoolInfo();
        console.log("Token0:", token0);
        console.log("Token1:", token1);
        console.log("Tick Spacing:", vm.toString(int256(tickSpacing)));
        console.log("Current Tick:", vm.toString(int256(currentTick)));
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Contract Address:", address(alm));
        console.log("Ready to test direct pool interaction!");
    }
}