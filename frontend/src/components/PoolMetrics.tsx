import { useState, useEffect } from 'react'

interface PoolInfo {
  currentTick: number
  sqrtPriceX96: string
  liquidity: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
}

export default function PoolMetrics() {
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPoolInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock data for demonstration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPoolInfo({
        currentTick: -276315,
        sqrtPriceX96: '1461446703485210103287273052203988822378723970342',
        liquidity: '12345678901234567890',
        token0: '0x1234...5678',
        token1: '0x8765...4321',
        fee: 3000,
        tickSpacing: 10,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoolInfo()
    const interval = setInterval(fetchPoolInfo, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  if (loading && !poolInfo) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error && !poolInfo) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
        Failed to load pool metrics: {error}
      </div>
    )
  }

  if (!poolInfo) {
    return (
      <p className="text-gray-300">
        No pool data available
      </p>
    )
  }

  // Calculate price from sqrtPriceX96
  const price = Math.pow(Number(poolInfo.sqrtPriceX96) / Math.pow(2, 96), 2)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">
          Current Tick
        </p>
        <p className="text-lg font-semibold font-mono text-white">
          {poolInfo.currentTick.toLocaleString()}
        </p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">
          Current Price
        </p>
        <p className="text-lg font-semibold font-mono text-white">
          {price.toExponential(3)}
        </p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">
          Pool Liquidity
        </p>
        <p className="text-lg font-semibold font-mono text-white">
          {parseFloat(poolInfo.liquidity).toExponential(2)}
        </p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">
          Fee Tier
        </p>
        <p className="text-lg font-semibold text-white">
          {poolInfo.fee / 10000}%
        </p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:col-span-2">
        <p className="text-sm text-gray-300 mb-2">
          Token Addresses
        </p>
        <p className="text-sm font-mono text-white mb-1">
          Token0: {poolInfo.token0}
        </p>
        <p className="text-sm font-mono text-white">
          Token1: {poolInfo.token1}
        </p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:col-span-2">
        <p className="text-sm text-gray-300 mb-2">
          Pool Configuration
        </p>
        <p className="text-sm text-white mb-1">
          Tick Spacing: {poolInfo.tickSpacing}
        </p>
        <p className="text-sm text-white">
          Pool Address: 0x2c13383855377faf5a562f1aef47e4be7a0f12ac
        </p>
      </div>

      {loading && (
        <div className="col-span-full flex justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}