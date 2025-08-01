import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

interface Position {
  tickLower: number
  tickUpper: number
  liquidity: string
  amount0: string
  amount1: string
}

export default function PositionInfo() {
  const { address, isConnected } = useAccount()
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPosition = useCallback(async () => {
    if (!address || !isConnected) return

    setLoading(true)
    setError(null)

    try {
      // Mock data for demonstration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPosition({
        tickLower: -276320,
        tickUpper: -276310,
        liquidity: '1000000000000000000',
        amount0: '100000000000000000000',
        amount1: '50000000000000000000',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchPosition()
    const interval = setInterval(fetchPosition, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchPosition])

  if (loading && !position) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error && !position) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
        Failed to load position: {error}
      </div>
    )
  }

  if (!position) {
    return (
      <p className="text-gray-300">
        No active position
      </p>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">
            Status:
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-200 border border-green-500/30">
            Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Lower Tick
          </p>
          <p className="text-lg font-semibold font-mono text-white">
            {position.tickLower.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Upper Tick
          </p>
          <p className="text-lg font-semibold font-mono text-white">
            {position.tickUpper.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Token0 Amount
          </p>
          <p className="text-base font-mono text-white">
            {(parseFloat(position.amount0) / 1e18).toFixed(4)}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Token1 Amount
          </p>
          <p className="text-base font-mono text-white">
            {(parseFloat(position.amount1) / 1e18).toFixed(4)}
          </p>
        </div>

        <div className="col-span-2 bg-white/5 border border-white/20 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-1">
            Liquidity
          </p>
          <p className="text-base font-mono text-white">
            {parseFloat(position.liquidity).toExponential(2)}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}