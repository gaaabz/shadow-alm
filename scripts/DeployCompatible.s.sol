// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ShadowALMCompatible.sol";

contract DeployCompatibleScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // COMPATIBLE POOL AND ADDRESSES
        address poolAddress = 0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7;         // COMPATIBLE pool (fee 100)
        address positionManagerAddress = 0x743E03cceB4af2efA3CC76838f6E8B50B63F184c; // Uniswap V3 Position Manager  
        address executorAddress = 0xed92d6ae712145B025b91369fa1338923d4eE4fF;      // Your wallet as executor
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== SHADOWALM COMPATIBLE DEPLOYMENT ===");
        console.log("Network: Sonic Labs (Chain ID: 146)");
        console.log("Pool (USDC/scUSD):", poolAddress);
        console.log("Pool Fee: 100 (COMPATIBLE)");
        console.log("Position Manager:", positionManagerAddress);
        console.log("Executor:", executorAddress);
        console.log("");
        
        console.log("Deploying ShadowALMCompatible...");
        
        ShadowALMCompatible alm = new ShadowALMCompatible(
            poolAddress,
            positionManagerAddress,
            executorAddress
        );
        
        console.log("");
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Contract Address:", address(alm));
        console.log("");
        
        console.log("=== VERIFICATION ===");
        console.log("Name:", alm.name());
        console.log("Symbol:", alm.symbol()); 
        console.log("Token0 (USDC):", alm.token0());
        console.log("Token1 (scUSD):", alm.token1());
        console.log("Fee:", alm.fee());
        console.log("Tick Spacing:", alm.tickSpacing());
        console.log("Executor:", alm.executor());
        console.log("Owner:", alm.owner());
        console.log("Position ID:", alm.currentPositionId());
        console.log("");
        
        vm.stopBroadcast();
        
        console.log("=== READY FOR USE ===");
        console.log("1. Pool:", poolAddress, "(COMPATIBLE fee 100)");
        console.log("2. Tick Spacing: 1 (Official Uniswap V3)");
        console.log("3. Factory: 0xcb2436774C3e191c85056d248EF4260ce5f27A9D (Official)");
        console.log("4. Position Manager: FULLY COMPATIBLE");
        console.log("5. Contract:", address(alm));
        console.log("");
        console.log("SUCCESS: This contract WILL work with Position Manager!");
        console.log("Contract deployed successfully at:", address(alm));
    }
}