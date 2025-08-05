// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IShadowPool.sol";
import "./interfaces/INonfungiblePositionManager.sol";

/**
 * @title ShadowALMCompatible - FINAL VERSION with Compatible Pool
 * @dev Uses COMPATIBLE pool fee 100 with official Uniswap V3 Position Manager
 * @dev Pool: 0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7 (fee 100, spacing 1)
 * @dev Factory: 0xcb2436774C3e191c85056d248EF4260ce5f27A9D (Official Uniswap V3)
 */
contract ShadowALMCompatible is ERC20, ReentrancyGuard, Ownable, Pausable {
    IShadowPool public immutable pool;
    INonfungiblePositionManager public immutable positionManager;
    
    address public immutable token0;
    address public immutable token1;
    int24 public immutable tickSpacing;
    uint24 public immutable fee;
    
    address public executor;
    
    uint256 public currentPositionId;
    int24 public currentTickLower;
    int24 public currentTickUpper;
    
    uint256 public totalToken0;
    uint256 public totalToken1;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public performanceFee = 1000; // 10%
    
    event Deposit(address indexed user, uint256 shares, uint256 amount0, uint256 amount1);
    event Withdraw(address indexed user, uint256 shares, uint256 amount0, uint256 amount1);
    event Rebalance(int24 tickLower, int24 tickUpper, uint256 timestamp);
    event FeesCollected(uint256 amount0, uint256 amount1);
    event ExecutorUpdated(address indexed newExecutor);
    event PositionCreated(uint256 indexed tokenId, int24 tickLower, int24 tickUpper, uint256 amount0, uint256 amount1);
    event PositionRemoved(uint256 indexed tokenId, uint256 amount0, uint256 amount1);
    
    modifier onlyExecutor() {
        require(msg.sender == executor || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(
        address _pool,
        address _positionManager,
        address _executor
    ) ERC20("Shadow ALM Share", "sALM") Ownable(msg.sender) {
        pool = IShadowPool(_pool);
        positionManager = INonfungiblePositionManager(_positionManager);
        
        token0 = pool.token0();
        token1 = pool.token1();
        fee = pool.fee();
        tickSpacing = pool.tickSpacing();
        
        executor = _executor;
        
        // Approve tokens for position manager
        IERC20(token0).approve(_positionManager, type(uint256).max);
        IERC20(token1).approve(_positionManager, type(uint256).max);
    }
    
    function deposit(uint256 amount0, uint256 amount1) external nonReentrant whenNotPaused {
        require(amount0 > 0 || amount1 > 0, "Cannot deposit 0");
        
        uint256 shares;
        uint256 _totalSupply = totalSupply();
        
        if (_totalSupply == 0) {
            shares = PRECISION;
        } else {
            uint256 share0 = totalToken0 > 0 ? (amount0 * _totalSupply) / totalToken0 : 0;
            uint256 share1 = totalToken1 > 0 ? (amount1 * _totalSupply) / totalToken1 : 0;
            shares = share0 > 0 && share1 > 0 ? (share0 < share1 ? share0 : share1) : (share0 + share1);
        }
        
        require(shares > 0, "Cannot mint 0 shares");
        
        if (amount0 > 0) {
            IERC20(token0).transferFrom(msg.sender, address(this), amount0);
            totalToken0 += amount0;
        }
        
        if (amount1 > 0) {
            IERC20(token1).transferFrom(msg.sender, address(this), amount1);
            totalToken1 += amount1;
        }
        
        _mint(msg.sender, shares);
        
        emit Deposit(msg.sender, shares, amount0, amount1);
    }
    
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Cannot withdraw 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");
        
        uint256 _totalSupply = totalSupply();
        uint256 amount0 = (shares * totalToken0) / _totalSupply;
        uint256 amount1 = (shares * totalToken1) / _totalSupply;
        
        _burn(msg.sender, shares);
        
        totalToken0 -= amount0;
        totalToken1 -= amount1;
        
        if (amount0 > 0) {
            IERC20(token0).transfer(msg.sender, amount0);
        }
        
        if (amount1 > 0) {
            IERC20(token1).transfer(msg.sender, amount1);
        }
        
        emit Withdraw(msg.sender, shares, amount0, amount1);
    }
    
    /**
     * @notice Rebalance with COMPATIBLE pool (fee 100, tick spacing 1)
     * @dev Uses official Uniswap V3 factory - Position Manager will work!
     */
    function rebalance() external onlyExecutor {
        (, int24 currentTick, , , , , ) = pool.slot0();
        
        // SINGLE-TICK STRATEGY: Keep liquidity in exactly the active tick only
        // Use OFFICIAL tick spacing of 1 (fee 100 pool)
        int24 activeTick = (currentTick / tickSpacing) * tickSpacing;
        int24 tickLower = activeTick;
        int24 tickUpper = activeTick; // Single-tick: both ticks are the same
        
        if (tickLower == currentTickLower && tickUpper == currentTickUpper && currentPositionId != 0) {
            return;
        }
        
        if (currentPositionId != 0) {
            _removeLiquidity();
        }
        
        _addLiquidity(tickLower, tickUpper);
        
        emit Rebalance(tickLower, tickUpper, block.timestamp);
    }
    
    function _addLiquidity(int24 tickLower, int24 tickUpper) internal {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        
        if (balance0 == 0 && balance1 == 0) {
            return;
        }
        
        INonfungiblePositionManager.MintParams memory params = 
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: balance0,
                amount1Desired: balance1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp + 300
            });
        
        (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = 
            positionManager.mint(params);
        
        currentPositionId = tokenId;
        currentTickLower = tickLower;
        currentTickUpper = tickUpper;
        
        totalToken0 = IERC20(token0).balanceOf(address(this));
        totalToken1 = IERC20(token1).balanceOf(address(this));
        
        emit PositionCreated(tokenId, tickLower, tickUpper, amount0, amount1);
    }
    
    function _removeLiquidity() internal {
        if (currentPositionId == 0) return;
        
        (,,,,, int24 tickLower, int24 tickUpper, uint128 liquidity,,,,) = 
            positionManager.positions(currentPositionId);
        
        if (liquidity > 0) {
            INonfungiblePositionManager.DecreaseLiquidityParams memory decreaseParams = 
                INonfungiblePositionManager.DecreaseLiquidityParams({
                    tokenId: currentPositionId,
                    liquidity: liquidity,
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp + 300
                });
            
            positionManager.decreaseLiquidity(decreaseParams);
        }
        
        INonfungiblePositionManager.CollectParams memory collectParams = 
            INonfungiblePositionManager.CollectParams({
                tokenId: currentPositionId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });
        
        (uint256 amount0, uint256 amount1) = positionManager.collect(collectParams);
        
        positionManager.burn(currentPositionId);
        
        totalToken0 = IERC20(token0).balanceOf(address(this));
        totalToken1 = IERC20(token1).balanceOf(address(this));
        
        emit PositionRemoved(currentPositionId, amount0, amount1);
        
        currentPositionId = 0;
        currentTickLower = 0;
        currentTickUpper = 0;
    }
    
    function collectFees() external onlyExecutor {
        if (currentPositionId == 0) return;
        
        INonfungiblePositionManager.CollectParams memory params = 
            INonfungiblePositionManager.CollectParams({
                tokenId: currentPositionId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });
        
        (uint256 amount0, uint256 amount1) = positionManager.collect(params);
        
        totalToken0 = IERC20(token0).balanceOf(address(this));
        totalToken1 = IERC20(token1).balanceOf(address(this));
        
        emit FeesCollected(amount0, amount1);
    }
    
    function getPosition() external view returns (
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    ) {
        liquidity = 0;
        
        if (currentPositionId != 0) {
            (,,,,, tickLower, tickUpper, liquidity,,,,) = positionManager.positions(currentPositionId);
            tickLower = currentTickLower;
            tickUpper = currentTickUpper;
        } else {
            tickLower = currentTickLower;
            tickUpper = currentTickUpper;
        }
        
        amount0 = totalToken0;
        amount1 = totalToken1;
    }
    
    function updateExecutor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "Invalid executor");
        executor = newExecutor;
        emit ExecutorUpdated(newExecutor);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner {
        if (currentPositionId != 0) {
            _removeLiquidity();
        }
        
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        
        if (balance0 > 0) {
            IERC20(token0).transfer(owner(), balance0);
        }
        
        if (balance1 > 0) {
            IERC20(token1).transfer(owner(), balance1);
        }
        
        totalToken0 = 0;
        totalToken1 = 0;
    }
}