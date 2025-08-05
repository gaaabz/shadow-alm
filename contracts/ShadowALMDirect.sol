// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRamsesV3PoolSimple.sol";

/**
 * @title ShadowALMDirect - Direct Pool Interaction
 * @dev Uses pool's mint/burn functions directly without NPM
 */
contract ShadowALMDirect is ERC20, ReentrancyGuard, AccessControl {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    IRamsesV3PoolSimple public immutable pool;
    address public immutable token0;
    address public immutable token1;
    int24 public immutable tickSpacing;
    
    uint256 public constant POSITION_INDEX = 1; // Use fixed index for simplicity
    int24 public currentTickLower;
    int24 public currentTickUpper;
    uint128 public currentLiquidity;
    
    event Rebalance(int24 tickLower, int24 tickUpper, uint128 liquidity);
    event Deposit(address indexed user, uint256 shares, uint256 amount0, uint256 amount1);
    event Withdraw(address indexed user, uint256 shares, uint256 amount0, uint256 amount1);
    
    constructor(
        address _pool,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        pool = IRamsesV3PoolSimple(_pool);
        token0 = pool.token0();
        token1 = pool.token1();
        tickSpacing = pool.tickSpacing();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }
    
    function deposit(
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external nonReentrant returns (uint256 shares) {
        require(amount0Desired > 0 || amount1Desired > 0, "Invalid amounts");
        
        // Transfer tokens
        if (amount0Desired > 0) {
            IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        }
        if (amount1Desired > 0) {
            IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);
        }
        
        // Calculate shares based on total supply
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) {
            shares = amount0Desired + amount1Desired; // Simple initial calculation
        } else {
            // More sophisticated calculation needed here
            shares = (amount0Desired + amount1Desired) * totalSupply / 
                    (IERC20(token0).balanceOf(address(this)) + IERC20(token1).balanceOf(address(this)));
        }
        
        _mint(msg.sender, shares);
        emit Deposit(msg.sender, shares, amount0Desired, amount1Desired);
    }
    
    function rebalance(int24 tickLower, int24 tickUpper) external onlyRole(EXECUTOR_ROLE) {
        require(tickLower < tickUpper, "Invalid tick range");
        require((tickLower % tickSpacing) == 0 && (tickUpper % tickSpacing) == 0, "Invalid tick spacing");
        
        // Remove current position if exists
        if (currentLiquidity > 0) {
            pool.burn(POSITION_INDEX, currentTickLower, currentTickUpper, currentLiquidity);
            pool.collect(
                address(this),
                POSITION_INDEX,
                currentTickLower,
                currentTickUpper,
                type(uint128).max,
                type(uint128).max
            );
        }
        
        // Create new position
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        
        if (balance0 > 0 || balance1 > 0) {
            // Approve tokens to pool
            IERC20(token0).approve(address(pool), balance0);
            IERC20(token1).approve(address(pool), balance1);
            
            // Calculate liquidity amount (simplified)
            uint128 liquidityAmount = uint128(balance0 + balance1); // This needs proper calculation
            
            try pool.mint(
                address(this),
                POSITION_INDEX,
                tickLower,
                tickUpper,
                liquidityAmount,
                ""
            ) returns (uint256 amount0, uint256 amount1) {
                currentTickLower = tickLower;
                currentTickUpper = tickUpper;
                currentLiquidity = liquidityAmount;
                
                emit Rebalance(tickLower, tickUpper, liquidityAmount);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Mint failed: ", reason)));
            }
        }
    }
    
    function getCurrentTick() external view returns (int24 tick) {
        (, tick, , , , , ) = pool.slot0();
    }
    
    function getPoolInfo() external view returns (
        address _token0,
        address _token1,
        int24 _tickSpacing,
        int24 _currentTick
    ) {
        _token0 = token0;
        _token1 = token1;
        _tickSpacing = tickSpacing;
        (, _currentTick, , , , , ) = pool.slot0();
    }
}