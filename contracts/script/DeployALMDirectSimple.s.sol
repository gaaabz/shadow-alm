// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../ShadowALMDirect.sol";

contract DeployALMDirectSimple is Script {
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
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Contract Address:", address(alm));
        console.log("Ready to interact directly with pool!");
        console.log("Pool Address:", POOL_ADDRESS);
    }
}