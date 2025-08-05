// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";

// Simple mock AccessHub for deployment
contract MockAccessHub {
    address public timelock;
    
    constructor(address _timelock) {
        timelock = _timelock;
    }
}

// Simple mock Voter
contract MockVoter {
    function gaugeForPool(address) external pure returns (address) {
        return address(0);
    }
}

// Simple mock descriptor
contract MockNonfungibleTokenPositionDescriptor {
    function tokenURI(address, uint256) external pure returns (string memory) {
        return "https://sonic.so/";
    }
}

contract DeploySimpleNPM is Script {
    // Pool information for Sonic DEX
    address constant POOL_ADDRESS = 0x2C13383855377faf5A562F1AeF47E4be7A0f12Ac;
    address constant FACTORY = 0xcD2d0637c94fe77C2896BbCBB174cefFb08DE6d7;
    address constant WETH9 = 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DEPLOYING SIMPLE MOCKS FOR TESTING ===");
        console.log("Deployer:", deployer);
        console.log("Factory:", FACTORY);
        console.log("WETH9:", WETH9);
        console.log("Target Pool:", POOL_ADDRESS);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mocks
        MockAccessHub mockAccessHub = new MockAccessHub(deployer);
        MockVoter mockVoter = new MockVoter();
        MockNonfungibleTokenPositionDescriptor mockDescriptor = new MockNonfungibleTokenPositionDescriptor();
        
        console.log("Mock AccessHub deployed at:", address(mockAccessHub));
        console.log("Mock Voter deployed at:", address(mockVoter));
        console.log("Mock Descriptor deployed at:", address(mockDescriptor));
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Use these addresses to deploy the actual NPM");
        console.log("Note: You need to deploy the actual RamsesV3 NPM separately");
    }
}