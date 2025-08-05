// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ShadowALMV2.sol";

contract DeployV2 is Script {
    // Known addresses on Sonic
    address constant SHADOW_POOL = 0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7;
    address constant POSITION_MANAGER = 0x2cbBb21f4Ae3E0942a01De3d2FBeD7E7dB87F87d;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying ShadowALMV2 with deployer:", deployer);
        console.log("Pool address:", SHADOW_POOL);
        console.log("Position Manager:", POSITION_MANAGER);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the new contract
        ShadowALMV2 alm = new ShadowALMV2(
            SHADOW_POOL,
            POSITION_MANAGER,
            deployer  // deployer gets admin role initially
        );
        
        console.log("ShadowALMV2 deployed at:", address(alm));
        console.log("Deployer has DEFAULT_ADMIN_ROLE and EXECUTOR_ROLE");
        
        // Optional: Grant executor role to additional addresses
        address executorAddress = vm.envOr("EXECUTOR_ADDRESS", address(0));
        if (executorAddress != address(0)) {
            alm.grantRole(alm.EXECUTOR_ROLE(), executorAddress);
            console.log("Granted EXECUTOR_ROLE to:", executorAddress);
        }
        
        vm.stopBroadcast();
        
        console.log("\nDeployment complete!");
        console.log("Remember to:");
        console.log("1. Update ALM_CONTRACT_ADDRESS in your .env file");
        console.log("2. Grant EXECUTOR_ROLE to your cron job executor address");
        console.log("3. Transfer some tokens to the contract for initial liquidity");
    }
}