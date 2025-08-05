// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IShadowALMV2 {
    function rebalance() external;
}

interface IPositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    
    function mint(MintParams calldata params) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract QuickFix is Script {
    address constant ALM_CONTRACT = 0xe7cb31770E000cfF84fBe656f168bA0040eAdF40;
    address constant POSITION_MANAGER = 0x2cbBb21f4Ae3E0942a01De3d2FBeD7E7dB87F87d;
    address constant TOKEN0 = 0x29219dd400f2Bf60E5a23d13Be72B486D4038894;
    address constant TOKEN1 = 0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE;
    
    function run() external {
        uint256 executorPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(executorPrivateKey);
        
        // Try creating position directly with proper tick range
        IERC20 token0 = IERC20(TOKEN0);
        IERC20 token1 = IERC20(TOKEN1);
        
        uint256 balance0 = token0.balanceOf(ALM_CONTRACT);
        uint256 balance1 = token1.balanceOf(ALM_CONTRACT);
        
        console.log("Token0 balance:", balance0);
        console.log("Token1 balance:", balance1);
        
        // Use a small range instead of single tick
        int24 currentTick = 18; // From the previous logs
        int24 tickLower = currentTick - 1; // 17
        int24 tickUpper = currentTick + 1; // 19
        
        console.log("Using tick range:", vm.toString(tickLower), "to", vm.toString(tickUpper));
        
        // First approve tokens (the ALM contract should have done this, but let's be sure)
        // Note: This won't work because we're not the ALM contract
        // This is just for demonstration - the real fix needs to be in the contract
        
        vm.stopBroadcast();
        
        console.log("ERROR: Single tick range (18,18) is not valid for Uniswap V3");
        console.log("The contract needs to be modified to use a proper tick range");
        console.log("Suggested fix: tickLower = activeTick - 1, tickUpper = activeTick + 1");
    }
}