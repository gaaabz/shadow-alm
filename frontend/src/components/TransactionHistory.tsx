import { useState, useEffect } from 'react'

interface Transaction {
  hash: string
  type: 'deposit' | 'withdraw' | 'rebalance' | 'collect'
  timestamp: number
  amount0?: string
  amount1?: string
  shares?: string
  status: 'pending' | 'confirmed' | 'failed'
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'deposit',
          timestamp: Date.now() - 3600000,
          amount0: '100.0',
          amount1: '50.0',
          shares: '75.0',
          status: 'confirmed',
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef12',
          type: 'rebalance',
          timestamp: Date.now() - 1800000,
          status: 'confirmed',
        },
        {
          hash: '0x567890abcdef1234567890abcdef1234567890ab',
          type: 'collect',
          timestamp: Date.now() - 900000,
          amount0: '1.5',
          amount1: '0.8',
          status: 'confirmed',
        },
      ]
      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

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

  if (transactions.length === 0) {
    return (
      <p className="text-gray-300">
        No transactions yet
      </p>
    )
  }

  return (
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
  )
}