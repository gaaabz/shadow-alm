import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { parseAbiItem, formatEther } from 'viem'
import { SHADOW_ALM_ADDRESS } from '../config/wagmi'

interface Transaction {
  hash: string
  type: 'deposit' | 'withdraw' | 'rebalance' | 'collect'
  timestamp: number
  amount0?: string
  amount1?: string
  shares?: string
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber: bigint
  user?: string
}

export default function TransactionHistory() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [blockRange, setBlockRange] = useState<'recent' | 'all'>('recent')
  const [showAllUsers, setShowAllUsers] = useState(false)

  const fetchTransactions = React.useCallback(async () => {
    if (!publicClient || !isConnected) return
    
    setLoading(true)
    try {
      // Get block range based on selection
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = blockRange === 'all' ? 0n : currentBlock - 1000n
      
      // Fetch Deposit events
      const depositLogs = await publicClient.getLogs({
        address: SHADOW_ALM_ADDRESS,
        event: parseAbiItem('event Deposit(address indexed user, uint256 shares, uint256 amount0, uint256 amount1)'),
        fromBlock,
        toBlock: 'latest',
        args: (address && !showAllUsers) ? { user: address } : undefined, // Filter by user if not showing all
      })
      
      // Fetch Withdraw events
      const withdrawLogs = await publicClient.getLogs({
        address: SHADOW_ALM_ADDRESS,
        event: parseAbiItem('event Withdraw(address indexed user, uint256 shares, uint256 amount0, uint256 amount1)'),
        fromBlock,
        toBlock: 'latest',
        args: (address && !showAllUsers) ? { user: address } : undefined, // Filter by user if not showing all
      })

      // Fetch Rebalance events (no user filter, these are global)
      const rebalanceLogs = await publicClient.getLogs({
        address: SHADOW_ALM_ADDRESS,
        event: parseAbiItem('event Rebalance(int24 tickLower, int24 tickUpper, uint256 timestamp)'),
        fromBlock,
        toBlock: 'latest',
      })

      // Process deposit transactions
      const depositTxs: Transaction[] = await Promise.all(
        depositLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          return {
            hash: log.transactionHash!,
            type: 'deposit' as const,
            timestamp: Number(block.timestamp) * 1000,
            amount0: formatEther(log.args.amount0!),
            amount1: formatEther(log.args.amount1!),
            shares: formatEther(log.args.shares!),
            status: 'confirmed' as const,
            blockNumber: log.blockNumber!,
            user: log.args.user!,
          }
        })
      )

      // Process withdraw transactions
      const withdrawTxs: Transaction[] = await Promise.all(
        withdrawLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          return {
            hash: log.transactionHash!,
            type: 'withdraw' as const,
            timestamp: Number(block.timestamp) * 1000,
            amount0: formatEther(log.args.amount0!),
            amount1: formatEther(log.args.amount1!),
            shares: formatEther(log.args.shares!),
            status: 'confirmed' as const,
            blockNumber: log.blockNumber!,
            user: log.args.user!,
          }
        })
      )

      // Process rebalance transactions
      const rebalanceTxs: Transaction[] = await Promise.all(
        rebalanceLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          return {
            hash: log.transactionHash!,
            type: 'rebalance' as const,
            timestamp: Number(block.timestamp) * 1000,
            status: 'confirmed' as const,
            blockNumber: log.blockNumber!,
          }
        })
      )

      // Combine and sort by block number (most recent first)
      const allTxs = [...depositTxs, ...withdrawTxs, ...rebalanceTxs].sort((a, b) => 
        Number(b.blockNumber - a.blockNumber)
      )
      
      setTransactions(allTxs)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      // Fallback to empty array on error
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [publicClient, isConnected, blockRange, showAllUsers, address])

  useEffect(() => {
    if (isConnected && publicClient) {
      fetchTransactions()
    }
  }, [fetchTransactions, isConnected, publicClient])

  // Listen for transaction success events and refresh data
  useEffect(() => {
    const handleTransactionSuccess = () => {
      // Wait a bit for the transaction to be indexed
      setTimeout(() => {
        fetchTransactions()
      }, 2000)
    }

    window.addEventListener('transactionSuccess', handleTransactionSuccess)
    
    return () => {
      window.removeEventListener('transactionSuccess', handleTransactionSuccess)
    }
  }, [fetchTransactions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-200 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-200 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30'
      case 'withdraw':
        return 'bg-purple-500/20 text-purple-200 border-purple-500/30'
      case 'rebalance':
        return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30'
      case 'collect':
        return 'bg-green-500/20 text-green-200 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30'
    }
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <p className="text-gray-300">
        Connect your wallet to view transaction history
      </p>
    )
  }

  if (transactions.length === 0) {
    return (
      <p className="text-gray-300">
        No transactions found. Make a deposit or withdrawal to see your transaction history.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBlockRange('recent')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                blockRange === 'recent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Recent (1000 blocks)
            </button>
            <button
              onClick={() => setBlockRange('all')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                blockRange === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All History
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showAllUsers}
                onChange={(e) => setShowAllUsers(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-xs text-gray-300">Show all users</span>
            </label>
          </div>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Type
              </th>
              {showAllUsers && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {transactions.map((tx) => (
              <tr key={tx.hash} className="hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://sonicscan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 font-mono text-sm"
                  >
                    {formatHash(tx.hash)}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(tx.type)}`}>
                    {tx.type}
                  </span>
                </td>
                {showAllUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                    {tx.user ? `${tx.user.slice(0, 6)}...${tx.user.slice(-4)}` : '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatTime(tx.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {tx.type === 'deposit' && (
                    <span>
                      {tx.amount0} / {tx.amount1} → {tx.shares} shares
                    </span>
                  )}
                  {tx.type === 'withdraw' && (
                    <span>
                      {tx.shares} shares → {tx.amount0} / {tx.amount1}
                    </span>
                  )}
                  {tx.type === 'collect' && (
                    <span>
                      Fees: {tx.amount0} / {tx.amount1}
                    </span>
                  )}
                  {tx.type === 'rebalance' && (
                    <span>
                      Position rebalanced
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}