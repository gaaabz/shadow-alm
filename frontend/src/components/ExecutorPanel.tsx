import React, { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useEstimateGas, useGasPrice } from 'wagmi'
import { SHADOW_ALM_ADDRESS } from '../config/wagmi'
import { ShadowALMCompatibleABI as SHADOW_ALM_ABI } from '../config/ShadowALMCompatible.abi'
import { formatEther } from 'viem'

export default function ExecutorPanel() {
  const { address, isConnected } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showGasDetails, setShowGasDetails] = useState(false)

  // Get executor address from contract
  const { data: executorAddress } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: 'executor',
  })

  // Get position data to check if rebalance is needed
  const { data: positionData } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: 'getPosition',
  })

  // Get current gas price
  const { data: gasPrice } = useGasPrice()

  // Estimate gas for rebalance
  const { data: gasEstimate } = useEstimateGas({
    to: SHADOW_ALM_ADDRESS,
    data: '0x7d7c2a1c', // rebalance() function selector
    account: address,
  })

  // Contract write hooks
  const { writeContract: writeRebalance, data: rebalanceHash, isPending: isRebalancePending } = useWriteContract()
  const { writeContract: writeCollectFees, data: collectFeesHash, isPending: isCollectFeesPending } = useWriteContract()

  // Wait for transaction confirmations
  const { isLoading: isRebalanceConfirming, isSuccess: isRebalanceSuccess } = useWaitForTransactionReceipt({
    hash: rebalanceHash,
  })
  const { isLoading: isCollectFeesConfirming, isSuccess: isCollectFeesSuccess } = useWaitForTransactionReceipt({
    hash: collectFeesHash,
  })

  const isLoading = isRebalancePending || isCollectFeesPending || isRebalanceConfirming || isCollectFeesConfirming

  // Check if current user is executor
  const isExecutor = address && executorAddress && address.toLowerCase() === executorAddress.toLowerCase()

  // Check if position exists
  const hasPosition = positionData && (Number(positionData[0]) !== 0 || Number(positionData[1]) !== 0)

  // Calculate estimated cost
  const estimatedCost = gasEstimate && gasPrice 
    ? formatEther(gasEstimate * gasPrice) 
    : '0'

  // Trigger refresh when transactions succeed
  React.useEffect(() => {
    if (isRebalanceSuccess || isCollectFeesSuccess) {
      window.dispatchEvent(new Event('transactionSuccess'))
      
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isRebalanceSuccess, isCollectFeesSuccess])

  const handleRebalance = async () => {
    setError(null)
    setSuccess(null)

    try {
      writeRebalance({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_ABI,
        functionName: 'rebalance',
      })
      
      setSuccess('Rebalance transaction submitted!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rebalance failed')
    }
  }

  const handleCollectFees = async () => {
    setError(null)
    setSuccess(null)

    try {
      writeCollectFees({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_ABI,
        functionName: 'collectFees',
      })
      
      setSuccess('Collect fees transaction submitted!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collect fees failed')
    }
  }

  if (!isConnected) {
    return null
  }

  if (!isExecutor) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        Executor Controls
      </h3>

      <p className="text-sm text-gray-300 mb-4">
        You are the authorized executor. Use these controls to manage the ALM position.
      </p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <button
            onClick={handleRebalance}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isLoading && rebalanceHash ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              'Rebalance Position'
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            {hasPosition ? 'Adjust position to current price' : 'Create initial position'}
          </p>
          {!hasPosition && (
            <button
              onClick={() => setShowGasDetails(!showGasDetails)}
              className="text-xs text-blue-300 hover:text-blue-200 underline mt-1"
            >
              {showGasDetails ? 'Hide' : 'Show'} gas details
            </button>
          )}
        </div>

        <div>
          <button
            onClick={handleCollectFees}
            disabled={isLoading || !hasPosition}
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isLoading && collectFeesHash ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              'Collect Fees'
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Collect accumulated trading fees
          </p>
        </div>
      </div>

      {showGasDetails && !hasPosition && (
        <div className="mt-4 bg-black/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Gas Analysis</h4>
          <div className="space-y-1 text-xs">
            <p className="text-gray-300">
              Estimated Gas: {gasEstimate?.toString() || 'Calculating...'}
            </p>
            <p className="text-gray-300">
              Gas Price: {gasPrice ? formatEther(gasPrice) : 'Calculating...'} ETH
            </p>
            <p className="text-yellow-300 font-medium">
              Estimated Cost: ${(parseFloat(estimatedCost) * 3500).toFixed(2)} USD
            </p>
            <div className="mt-2 text-gray-400">
              <p>High cost because first rebalance includes:</p>
              <ul className="list-disc list-inside ml-2">
                <li>NFT position creation</li>
                <li>Multiple Uniswap V3 calls</li>
                <li>Complex tick calculations</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!hasPosition && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-200 mb-2">⚠️ Alternative Options</h4>
          <div className="text-xs text-yellow-200/80 space-y-2">
            <p>Due to high gas costs for initial position creation:</p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Wait for lower gas prices (usually late night/early morning)</li>
              <li>Consider deploying an optimized contract version</li>
              <li>Accept the one-time cost (subsequent rebalances are cheaper)</li>
            </ol>
            <p className="mt-2">
              Note: This is a one-time cost. Future rebalances will be more efficient.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        Executor: {executorAddress?.slice(0, 6)}...{executorAddress?.slice(-4)}
      </div>
    </div>
  )
}