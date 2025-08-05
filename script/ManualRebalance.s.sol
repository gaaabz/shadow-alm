// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IShadowALMV2 {
    function rebalance() external;
    function currentPositionId() external view returns (uint256);
    function getPosition() external view returns (
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );
    function totalToken0() external view returns (uint256);
    function totalToken1() external view returns (uint256);
}

contract ManualRebalance is Script {
    address constant ALM_CONTRACT = 0xe7cb31770E000cfF84fBe656f168bA0040eAdF40;
    
    function run() external {
        uint256 executorPrivateKey = vm.envUint("PRIVATE_KEY");
        address executor = vm.addr(executorPrivateKey);
        
        IShadowALMV2 alm = IShadowALMV2(ALM_CONTRACT);
        
        console.log("=== PRE-REBALANCE STATUS ===");
        console.log("Executor address:", executor);
        console.log("ALM Contract:", ALM_CONTRACT);
        
        // Check current status
        uint256 currentPositionId = alm.currentPositionId();
        uint256 totalToken0 = alm.totalToken0();
        uint256 totalToken1 = alm.totalToken1();
        
        console.log("Current Position ID:", currentPositionId);
        console.log("Total Token0:", totalToken0);
        console.log("Total Token1:", totalToken1);
        
        if (currentPositionId == 0) {
            console.log("No active position - will create new one");
        } else {
            console.log("Active position exists - will rebalance if needed");
        }
        
        // Execute rebalance
        vm.startBroadcast(executorPrivateKey);
        
        console.log("Executing rebalance...");
        alm.rebalance();
        
        vm.stopBroadcast();
        
        // Check post-rebalance status
        console.log("\n=== POST-REBALANCE STATUS ===");
        uint256 newPositionId = alm.currentPositionId();
        console.log("New Position ID:", newPositionId);
        
        (int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 amount0, uint256 amount1) = alm.getPosition();
        console.log("Position Details:");
        console.log("  Tick Lower:", vm.toString(tickLower));
        console.log("  Tick Upper:", vm.toString(tickUpper));
        console.log("  Liquidity:", liquidity);
        console.log("  Amount0:", amount0);
        console.log("  Amount1:", amount1);
        
        if (newPositionId > 0) {
            console.log("SUCCESS: Position created/updated successfully!");
            console.log("You can now stake this position for emissions");
        } else {
            console.log("WARNING: No position was created");
        }
    }
}