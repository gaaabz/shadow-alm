import { useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { SHADOW_ALM_ADDRESS } from '../config/wagmi'
import { ShadowALMCompatibleABI as SHADOW_ALM_ABI, ERC20_ABI } from '../config/ShadowALMCompatible.abi'

export default function PositionInfo() {
  const { address, isConnected } = useAccount()

  // Get token addresses
  const { data: token0Address } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: 'token0',
  })
  
  const { data: token1Address } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: 'token1',
  })

  // Get token decimals
  const { data: token0Decimals } = useReadContract({
    address: token0Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  
  const { data: token1Decimals } = useReadContract({
    address: token1Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  // Read position data from contract
  const { data: positionData, isLoading, error, refetch } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: 'getPosition',
  })

  // Read user balance
  const { data: userBalance } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Helper functions to format tokens with correct decimals
  const formatToken0Amount = (amount: bigint) => {
    if (!token0Decimals) return '0.0000'
    const divisor = BigInt(10 ** token0Decimals)
    return (Number(amount) / Number(divisor)).toFixed(4)
  }

  const formatToken1Amount = (amount: bigint) => {
    if (!token1Decimals) return '0.0000'
    const divisor = BigInt(10 ** token1Decimals)
    return (Number(amount) / Number(divisor)).toFixed(4)
  }

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        refetch()
      }, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [isConnected, refetch])

  // Listen for transaction success events and refresh data
  useEffect(() => {
    const handleTransactionSuccess = () => {
      refetch()
    }

    window.addEventListener('transactionSuccess', handleTransactionSuccess)
    
    return () => {
      window.removeEventListener('transactionSuccess', handleTransactionSuccess)
    }
  }, [refetch])

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
        Failed to load position: {error.message}
      </div>
    )
  }

  if (!positionData || !isConnected) {
    return (
      <p className="text-gray-300">
        {!isConnected ? 'Connect wallet to view position' : 'No active position'}
      </p>
    )
  }

  const [tickLower, tickUpper, liquidity, amount0, amount1] = positionData

  // Check if position is actually active (non-zero ticks)
  const hasActivePosition = Number(tickLower) !== 0 || Number(tickUpper) !== 0

  // Calculate price range from ticks
  const calculatePriceFromTick = (tick: number) => {
    return Math.pow(1.0001, tick)
  }

  const lowerPrice = hasActivePosition ? calculatePriceFromTick(Number(tickLower)) : 0
  const upperPrice = hasActivePosition ? calculatePriceFromTick(Number(tickUpper)) : 0
  const priceRange = hasActivePosition ? ((upperPrice - lowerPrice) / lowerPrice * 100).toFixed(2) : 0

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">
            Status:
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            hasActivePosition 
              ? 'bg-green-500/20 text-green-200 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
          }`}>
            {hasActivePosition ? 'Active' : 'No Position'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Lower Tick
          </p>
          <p className="text-lg font-semibold font-mono text-white">
            {Number(tickLower).toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Upper Tick
          </p>
          <p className="text-lg font-semibold font-mono text-white">
            {Number(tickUpper).toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Token0 Amount
          </p>
          <p className="text-base font-mono text-white">
            {formatToken0Amount(amount0)}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Token1 Amount
          </p>
          <p className="text-base font-mono text-white">
            {formatToken1Amount(amount1)}
          </p>
        </div>

        <div className="col-span-2 bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Liquidity
          </p>
          <p className="text-base font-mono text-white">
            {Number(liquidity).toExponential(2)}
          </p>
        </div>

        {hasActivePosition && (
          <>
            <div className="col-span-2 bg-white/5 border border-white/20 rounded-lg p-3">
              <p className="text-sm text-gray-300 mb-1">
                Price Range
              </p>
              <div className="space-y-1">
                <p className="text-sm text-white">
                  Lower: {lowerPrice.toFixed(6)}
                </p>
                <p className="text-sm text-white">
                  Upper: {upperPrice.toFixed(6)}
                </p>
                <p className="text-sm text-gray-400">
                  Range Width: {priceRange}%
                </p>
              </div>
            </div>
          </>
        )}

        {userBalance && (
          <div className="col-span-2 bg-white/5 border border-white/20 rounded-lg p-3">
            <p className="text-sm text-gray-300 mb-1">
              Your ALM Shares
            </p>
            <p className="text-base font-mono text-white">
              {(Number(userBalance) / 1e18).toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {!hasActivePosition && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-200 text-sm">
            ⚠️ No active Uniswap V3 position detected
          </p>
          <p className="text-yellow-200/80 text-xs mt-1">
            The executor needs to call rebalance() to create an initial position
          </p>
        </div>
      )}
    </div>
  )
}