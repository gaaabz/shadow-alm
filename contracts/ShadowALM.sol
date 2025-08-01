// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IShadowPool.sol";
import "./interfaces/INonfungiblePositionManager.sol";

contract ShadowALM is ERC20, ReentrancyGuard, Ownable, Pausable {
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
    event Rebalance(int24 newTickLower, int24 newTickUpper, uint256 liquidity);
    event FeesCollected(uint256 amount0, uint256 amount1);
    event ExecutorUpdated(address indexed newExecutor);
    
    modifier onlyExecutor() {
        require(msg.sender == executor || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(
        address _pool,
        address _positionManager,
        address _executor
    ) ERC20("Shadow ALM Share", "sALM") {
        pool = IShadowPool(_pool);
        positionManager = INonfungiblePositionManager(_positionManager);
        
        token0 = pool.token0();
        token1 = pool.token1();
        tickSpacing = pool.tickSpacing();
        fee = pool.fee();
        
        executor = _executor;
        
        IERC20(token0).approve(_positionManager, type(uint256).max);
        IERC20(token1).approve(_positionManager, type(uint256).max);
    }
    
    function deposit(uint256 amount0, uint256 amount1) external nonReentrant whenNotPaused {
        require(amount0 > 0 || amount1 > 0, "Cannot deposit 0");
        
        uint256 shares;
        uint256 _totalSupply = totalSupply();
        
        if (_totalSupply == 0) {
            shares = _sqrt(amount0 * amount1);
        } else {
            uint256 share0 = (amount0 * _totalSupply) / totalToken0;
            uint256 share1 = (amount1 * _totalSupply) / totalToken1;
            shares = share0 < share1 ? share0 : share1;
        }
        
        require(shares > 0, "Shares must be greater than 0");
        
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
    
    function rebalance() external onlyExecutor {
        // Get current tick
        (, int24 currentTick, , , , , ) = pool.slot0();
        
        // Calculate new tick range (single tick spacing)
        int24 tickLower = (currentTick / tickSpacing) * tickSpacing;
        int24 tickUpper = tickLower + tickSpacing;
        
        // Skip if already in correct range
        if (tickLower == currentTickLower && tickUpper == currentTickUpper && currentPositionId != 0) {
            return;
        }
        
        // Remove liquidity from old position
        if (currentPositionId != 0) {
            _removeLiquidity();
        }
        
        // Add liquidity to new position
        _addLiquidity(tickLower, tickUpper);
        
        emit Rebalance(tickLower, tickUpper, 0);
    }
    
    function _removeLiquidity() internal {
        (,,,,,, int24 tickLower, int24 tickUpper, uint128 liquidity,,,,) = 
            positionManager.positions(currentPositionId);
        
        if (liquidity > 0) {
            // Decrease liquidity
            INonfungiblePositionManager.DecreaseLiquidityParams memory params = 
                INonfungiblePositionManager.DecreaseLiquidityParams({
                    tokenId: currentPositionId,
                    liquidity: liquidity,
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp
                });
            
            positionManager.decreaseLiquidity(params);
            
            // Collect all
            INonfungiblePositionManager.CollectParams memory collectParams = 
                INonfungiblePositionManager.CollectParams({
                    tokenId: currentPositionId,
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                });
            
            (uint256 collected0, uint256 collected1) = positionManager.collect(collectParams);
            totalToken0 = IERC20(token0).balanceOf(address(this));
            totalToken1 = IERC20(token1).balanceOf(address(this));
        }
        
        // Burn the position
        positionManager.burn(currentPositionId);
        currentPositionId = 0;
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
                deadline: block.timestamp
            });
        
        (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = 
            positionManager.mint(params);
        
        currentPositionId = tokenId;
        currentTickLower = tickLower;
        currentTickUpper = tickUpper;
        
        totalToken0 = IERC20(token0).balanceOf(address(this));
        totalToken1 = IERC20(token1).balanceOf(address(this));
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
        
        // Take performance fee
        uint256 fee0 = (amount0 * performanceFee) / 10000;
        uint256 fee1 = (amount1 * performanceFee) / 10000;
        
        if (fee0 > 0) {
            IERC20(token0).transfer(owner(), fee0);
            totalToken0 = totalToken0 + amount0 - fee0;
        } else {
            totalToken0 += amount0;
        }
        
        if (fee1 > 0) {
            IERC20(token1).transfer(owner(), fee1);
            totalToken1 = totalToken1 + amount1 - fee1;
        } else {
            totalToken1 += amount1;
        }
        
        emit FeesCollected(amount0, amount1);
    }
    
    function setExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Invalid executor");
        executor = _executor;
        emit ExecutorUpdated(_executor);
    }
    
    function setPerformanceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 2000, "Fee too high"); // Max 20%
        performanceFee = _fee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getPosition() external view returns (
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    ) {
        if (currentPositionId == 0) {
            return (0, 0, 0, totalToken0, totalToken1);
        }
        
        (,,,,,, tickLower, tickUpper, liquidity,,,,) = positionManager.positions(currentPositionId);
        
        return (tickLower, tickUpper, liquidity, totalToken0, totalToken1);
    }
    
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}